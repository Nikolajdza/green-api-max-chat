import type { Chat, ChatMessage, Credentials, MessageStatus } from '../types'

const CREDENTIALS_KEY = 'max-chat.credentials'

function chatsKey(idInstance: string): string {
  return `max-chat.chats.${idInstance}`
}

function activeKey(idInstance: string): string {
  return `max-chat.active.${idInstance}`
}

function isStatus(value: unknown): value is MessageStatus {
  return value === 'sending' || value === 'sent' || value === 'failed'
}

function readMessage(value: unknown): ChatMessage | null {
  if (!value || typeof value !== 'object') return null
  const message = value as Partial<ChatMessage>
  if (typeof message.id !== 'string' || typeof message.text !== 'string') return null
  if (message.direction !== 'in' && message.direction !== 'out') return null
  if (typeof message.timestamp !== 'number' || !isStatus(message.status)) return null
  const next: ChatMessage = {
    id: message.id,
    text: message.text,
    direction: message.direction,
    timestamp: message.timestamp,
    status: message.status === 'sending' ? 'failed' : message.status,
  }
  if (message.status === 'sending') next.error = 'Отправка прервана.'
  else if (typeof message.error === 'string' && message.error) next.error = message.error
  return next
}

function readChat(value: unknown): Chat | null {
  if (!value || typeof value !== 'object') return null
  const chat = value as Partial<Chat>
  if (typeof chat.chatId !== 'string' || typeof chat.phone !== 'string' || typeof chat.title !== 'string') {
    return null
  }
  if (!Array.isArray(chat.messages)) return null
  return {
    chatId: chat.chatId,
    phone: chat.phone,
    title: chat.title,
    unread: typeof chat.unread === 'number' ? chat.unread : 0,
    messages: chat.messages.map(readMessage).filter((message): message is ChatMessage => message !== null),
  }
}

function lastTimestamp(chat: Chat): number {
  return chat.messages.at(-1)?.timestamp ?? 0
}

export function loadCredentials(): Credentials | null {
  try {
    const raw = sessionStorage.getItem(CREDENTIALS_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<Credentials>
    if (typeof parsed.idInstance !== 'string' || typeof parsed.apiTokenInstance !== 'string') return null
    if (!parsed.idInstance || !parsed.apiTokenInstance) return null
    return { idInstance: parsed.idInstance, apiTokenInstance: parsed.apiTokenInstance }
  } catch {
    return null
  }
}

export function saveCredentials(credentials: Credentials | null): void {
  if (!credentials) {
    sessionStorage.removeItem(CREDENTIALS_KEY)
    return
  }
  sessionStorage.setItem(CREDENTIALS_KEY, JSON.stringify(credentials))
}

export function loadChats(idInstance: string): Chat[] {
  try {
    const raw = localStorage.getItem(chatsKey(idInstance))
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed
      .map(readChat)
      .filter((chat): chat is Chat => chat !== null)
      .sort((a, b) => lastTimestamp(b) - lastTimestamp(a))
  } catch {
    return []
  }
}

export function saveChats(idInstance: string, chats: Chat[]): void {
  try {
    localStorage.setItem(chatsKey(idInstance), JSON.stringify(chats))
  } catch {
    // The open tab still works if storage is full.
  }
}

export function loadActiveChat(idInstance: string): string | null {
  return sessionStorage.getItem(activeKey(idInstance))
}

export function saveActiveChat(idInstance: string, chatId: string | null): void {
  const key = activeKey(idInstance)
  if (!chatId) sessionStorage.removeItem(key)
  else sessionStorage.setItem(key, chatId)
}
