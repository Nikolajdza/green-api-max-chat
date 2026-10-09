import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import {
  GreenApiError,
  checkAccount,
  deleteNotification,
  describeInstanceState,
  getStateInstance,
  isAbortError,
  receiveNotification,
  sendMessage,
} from '../api/greenApi'
import type { IncomingNotification } from '../api/greenApi'
import { formatPhone, normalizePhone } from '../format'
import type { Chat, ChatMessage, Credentials } from '../types'
import { applyIncoming } from './incoming'
import { loadActiveChat, loadChats, loadCredentials, saveActiveChat, saveChats, saveCredentials } from './storage'
import { ChatContext } from './context'

const RECEIVE_TIMEOUT_SECONDS = 20

function readSession(): { credentials: Credentials | null; chats: Chat[]; activeChatId: string | null } {
  const credentials = loadCredentials()
  if (!credentials) return { credentials: null, chats: [], activeChatId: null }
  const chats = loadChats(credentials.idInstance)
  const storedActive = loadActiveChat(credentials.idInstance)
  const activeChatId = storedActive && chats.some((chat) => chat.chatId === storedActive) ? storedActive : null
  return {
    credentials,
    activeChatId,
    chats: activeChatId
      ? chats.map((chat) => (chat.chatId === activeChatId ? { ...chat, unread: 0 } : chat))
      : chats,
  }
}

function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    if (signal.aborted) {
      resolve()
      return
    }
    const timer = window.setTimeout(resolve, ms)
    signal.addEventListener(
      'abort',
      () => {
        window.clearTimeout(timer)
        resolve()
      },
      { once: true },
    )
  })
}

function patchMessage(
  chats: Chat[],
  chatId: string,
  messageId: string,
  patch: Partial<ChatMessage>,
): Chat[] {
  return chats.map((chat) => {
    if (chat.chatId !== chatId) return chat
    return {
      ...chat,
      messages: chat.messages.map((message) => {
        if (message.id !== messageId) return message
        const next = { ...message, ...patch }
        if (!patch.error) delete next.error
        return next
      }),
    }
  })
}

function errorText(error: unknown): string {
  return error instanceof GreenApiError ? error.message : 'Не удалось выполнить запрос.'
}

export function ChatProvider({ children }: { children: ReactNode }) {
  const [boot] = useState(readSession)
  const [credentials, setCredentials] = useState<Credentials | null>(boot.credentials)
  const [chats, setChats] = useState<Chat[]>(boot.chats)
  const [activeChatId, setActiveChatId] = useState<string | null>(boot.activeChatId)
  const [pollError, setPollError] = useState<string | null>(null)

  const credentialsRef = useRef(credentials)
  const activeChatIdRef = useRef(activeChatId)
  const chatsRef = useRef(chats)

  useEffect(() => {
    credentialsRef.current = credentials
    activeChatIdRef.current = activeChatId
    chatsRef.current = chats
  }, [credentials, activeChatId, chats])

  useEffect(() => {
    if (!credentials) return
    saveChats(credentials.idInstance, chats)
  }, [credentials, chats])

  useEffect(() => {
    if (!credentials) return
    saveActiveChat(credentials.idInstance, activeChatId)
  }, [credentials, activeChatId])

  useEffect(() => {
    if (!credentials) return
    const controller = new AbortController()
    const creds = credentials

    async function acknowledge(notification: IncomingNotification) {
      for (let attempt = 0; attempt < 3; attempt += 1) {
        if (controller.signal.aborted) return
        try {
          await deleteNotification(creds, notification.receiptId, controller.signal)
          return
        } catch (error) {
          if (controller.signal.aborted || isAbortError(error)) return
          if (attempt === 2) setPollError(errorText(error))
          await sleep(1000 * (attempt + 1), controller.signal)
        }
      }
    }

    async function poll() {
      while (!controller.signal.aborted) {
        const started = Date.now()
        try {
          const notification = await receiveNotification(creds, RECEIVE_TIMEOUT_SECONDS, controller.signal)
          if (controller.signal.aborted) return
          setPollError((current) => (current ? null : current))
          if (!notification) {
            if (Date.now() - started < 1000) await sleep(1500, controller.signal)
            continue
          }
          // Ignored webhook types are still removed. Otherwise the queue stays on the same item.
          setChats((current) => applyIncoming(current, notification, activeChatIdRef.current))
          await acknowledge(notification)
        } catch (error) {
          if (controller.signal.aborted || isAbortError(error)) return
          setPollError(errorText(error))
          await sleep(3000, controller.signal)
        }
      }
    }

    void poll()
    return () => controller.abort()
  }, [credentials])

  const login = useCallback(async (idInstance: string, apiTokenInstance: string) => {
    const next: Credentials = {
      idInstance: idInstance.trim(),
      apiTokenInstance: apiTokenInstance.trim(),
    }
    if (!/^\d+$/.test(next.idInstance)) {
      throw new GreenApiError('idInstance должен состоять из цифр.')
    }
    if (!next.apiTokenInstance) throw new GreenApiError('Введите apiTokenInstance.')

    const state = await getStateInstance(next)
    if (state.toLowerCase() !== 'authorized') throw new GreenApiError(describeInstanceState(state))

    const restored = loadChats(next.idInstance)
    const storedActive = loadActiveChat(next.idInstance)
    const active = storedActive && restored.some((chat) => chat.chatId === storedActive) ? storedActive : null
    saveCredentials(next)
    setChats(
      active ? restored.map((chat) => (chat.chatId === active ? { ...chat, unread: 0 } : chat)) : restored,
    )
    setActiveChatId(active)
    setPollError(null)
    setCredentials(next)
  }, [])

  const logout = useCallback(() => {
    saveCredentials(null)
    setCredentials(null)
    setChats([])
    setActiveChatId(null)
    setPollError(null)
  }, [])

  const selectChat = useCallback((chatId: string | null) => {
    setActiveChatId(chatId)
    if (!chatId) return
    setChats((current) =>
      current.map((chat) => (chat.chatId === chatId ? { ...chat, unread: 0 } : chat)),
    )
  }, [])

  const createChat = useCallback(async (phoneInput: string) => {
    const creds = credentialsRef.current
    if (!creds) throw new GreenApiError('Сначала войдите.')

    const phone = normalizePhone(phoneInput)
    if (!phone) {
      throw new GreenApiError('Номер должен быть российским (7, 11 цифр) или белорусским (375, 12 цифр).')
    }

    const existing = chatsRef.current.find((chat) => chat.phone === phone)
    if (existing) {
      setActiveChatId(existing.chatId)
      setChats((current) => current.map((chat) => (chat.chatId === existing.chatId ? { ...chat, unread: 0 } : chat)))
      return
    }

    const account = await checkAccount(creds, Number(phone))
    if (!account.exist || !account.chatId) {
      throw new GreenApiError('На этом номере нет аккаунта MAX.')
    }

    const sameId = chatsRef.current.find((chat) => chat.chatId === account.chatId)
    if (sameId) {
      setActiveChatId(sameId.chatId)
      setChats((current) =>
        current.map((chat) =>
          chat.chatId === sameId.chatId ? { ...chat, phone: chat.phone || phone, unread: 0 } : chat,
        ),
      )
      return
    }

    const chat: Chat = {
      chatId: account.chatId,
      phone,
      title: formatPhone(phone),
      messages: [],
      unread: 0,
    }
    setChats((current) => [chat, ...current])
    setActiveChatId(account.chatId)
  }, [])

  const deliver = useCallback(async (chatId: string, messageId: string, text: string) => {
    const creds = credentialsRef.current
    if (!creds) {
      setChats((current) =>
        patchMessage(current, chatId, messageId, { status: 'failed', error: 'Сначала войдите.' }),
      )
      return
    }

    setChats((current) => patchMessage(current, chatId, messageId, { status: 'sending' }))
    try {
      const idMessage = await sendMessage(creds, chatId, text)
      setChats((current) => patchMessage(current, chatId, messageId, { id: idMessage, status: 'sent' }))
    } catch (error) {
      if (isAbortError(error)) return
      setChats((current) =>
        patchMessage(current, chatId, messageId, { status: 'failed', error: errorText(error) }),
      )
    }
  }, [])

  const sendText = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed) throw new GreenApiError('Введите текст сообщения.')
      if (trimmed.length > 4000) throw new GreenApiError('Текст длиннее 4000 символов.')

      const chatId = activeChatIdRef.current
      if (!chatId) throw new GreenApiError('Выберите чат.')

      const localId = crypto.randomUUID()
      const message: ChatMessage = {
        id: localId,
        text: trimmed,
        direction: 'out',
        timestamp: Date.now(),
        status: 'sending',
      }
      setChats((current) => {
        const index = current.findIndex((chat) => chat.chatId === chatId)
        if (index < 0) return current
        const updated = { ...current[index], messages: [...current[index].messages, message] }
        return [updated, ...current.filter((_, chatIndex) => chatIndex !== index)]
      })
      void deliver(chatId, localId, trimmed)
    },
    [deliver],
  )

  const retryMessage = useCallback(
    (messageId: string) => {
      const chatId = activeChatIdRef.current
      if (!chatId) return
      const message = chatsRef.current
        .find((chat) => chat.chatId === chatId)
        ?.messages.find((item) => item.id === messageId)
      if (!message || message.status !== 'failed') return
      void deliver(chatId, messageId, message.text)
    },
    [deliver],
  )

  const value = useMemo(
    () => ({
      credentials,
      chats,
      activeChatId,
      pollError,
      login,
      logout,
      selectChat,
      createChat,
      sendText,
      retryMessage,
    }),
    [credentials, chats, activeChatId, pollError, login, logout, selectChat, createChat, sendText, retryMessage],
  )

  return <ChatContext value={value}>{children}</ChatContext>
}
