import type { AccountCheck, IncomingNotification } from './greenApi'
import type { Credentials } from '../types'

const REPLY_DELAY_MS = 1500

type Waiter = {
  resolve: (notification: IncomingNotification | null) => void
  reject: (error: Error) => void
  signal?: AbortSignal
}

const queue: IncomingNotification[] = []
const waiters: Waiter[] = []
const chatPhones = new Map<string, string>()
let nextReceiptId = 1
let nextChatNumber = 10000000

function abortError(): Error {
  const error = new Error('The operation was aborted.')
  error.name = 'AbortError'
  return error
}

function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(abortError())
      return
    }
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort)
      resolve()
    }, ms)
    const onAbort = () => {
      clearTimeout(timer)
      reject(abortError())
    }
    signal?.addEventListener('abort', onAbort, { once: true })
  })
}

function deliver(notification: IncomingNotification) {
  const waiter = waiters.shift()
  if (waiter) {
    waiter.resolve(notification)
    return
  }
  queue.push(notification)
}

function chatIdFor(phone: string): string {
  for (const [chatId, stored] of chatPhones) {
    if (stored === phone) return chatId
  }
  nextChatNumber += 1
  const chatId = String(nextChatNumber)
  chatPhones.set(chatId, phone)
  return chatId
}

export async function mockGetStateInstance(_credentials: Credentials, signal?: AbortSignal): Promise<string> {
  await delay(400, signal)
  return 'authorized'
}

export async function mockCheckAccount(
  _credentials: Credentials,
  phoneNumber: number,
  signal?: AbortSignal,
): Promise<AccountCheck> {
  await delay(400, signal)
  return { exist: true, chatId: chatIdFor(String(phoneNumber)) }
}

export async function mockSendMessage(
  _credentials: Credentials,
  chatId: string,
  message: string,
  signal?: AbortSignal,
): Promise<string> {
  await delay(250, signal)
  const idMessage = `out-${Date.now()}`
  const phone = chatPhones.get(chatId) ?? ''
  window.setTimeout(() => {
    deliver({
      receiptId: nextReceiptId,
      body: {
        typeWebhook: 'incomingMessageReceived',
        timestamp: Math.floor(Date.now() / 1000),
        idMessage: `in-${nextReceiptId}`,
        senderData: {
          chatId,
          chatType: 'user',
          chatName: 'Алексей',
          senderName: 'Алексей',
          senderContactName: 'Алексей',
          senderPhoneNumber: phone ? Number(phone) : 0,
        },
        messageData: {
          typeMessage: 'textMessage',
          textMessageData: {
            textMessage: `Ответ из MAX: ${message}`,
          },
        },
      },
    })
    nextReceiptId += 1
  }, REPLY_DELAY_MS)
  return idMessage
}

export function mockReceiveNotification(
  _credentials: Credentials,
  receiveTimeout = 20,
  signal?: AbortSignal,
): Promise<IncomingNotification | null> {
  const pending = queue.shift()
  if (pending) return Promise.resolve(pending)
  if (signal?.aborted) return Promise.reject(abortError())

  return new Promise((resolve, reject) => {
    let settled = false
    const waiter: Waiter = {
      resolve: (notification) => finish(notification),
      reject: (error) => finish(null, error),
      signal,
    }
    const timer = setTimeout(() => finish(null), receiveTimeout * 1000)
    const onAbort = () => finish(null, abortError())

    function finish(notification: IncomingNotification | null, error?: Error) {
      if (settled) return
      settled = true
      clearTimeout(timer)
      signal?.removeEventListener('abort', onAbort)
      const index = waiters.indexOf(waiter)
      if (index >= 0) waiters.splice(index, 1)
      if (error) reject(error)
      else resolve(notification)
    }

    signal?.addEventListener('abort', onAbort, { once: true })
    waiters.push(waiter)
  })
}

export async function mockDeleteNotification(
  _credentials: Credentials,
  _receiptId: number,
  signal?: AbortSignal,
): Promise<void> {
  if (signal?.aborted) throw abortError()
}
