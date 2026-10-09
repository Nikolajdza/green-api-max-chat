import type { IncomingNotification } from '../api/greenApi'
import { formatPhone, isPhoneTitle } from '../format'
import type { Chat, ChatMessage } from '../types'

function toMillis(timestamp?: number): number {
  if (!timestamp) return Date.now()
  return timestamp < 1_000_000_000_000 ? timestamp * 1000 : timestamp
}

function phoneOf(value: number | string | undefined): string {
  if (value == null || value === '' || value === 0 || value === '0') return ''
  return String(value)
}

function senderName(notification: IncomingNotification, phone: string): string {
  const sender = notification.body.senderData
  const name = sender?.senderContactName || sender?.senderName || sender?.chatName
  if (name?.trim()) return name.trim()
  return formatPhone(phone)
}

export function applyIncoming(
  chats: Chat[],
  notification: IncomingNotification,
  activeChatId: string | null,
): Chat[] {
  const body = notification.body
  if (body.typeWebhook !== 'incomingMessageReceived') return chats
  if (body.messageData?.typeMessage !== 'textMessage') return chats

  const text = body.messageData.textMessageData?.textMessage?.trim()
  if (!text) return chats

  const id = body.idMessage || `receipt-${notification.receiptId}`
  if (chats.some((chat) => chat.messages.some((message) => message.id === id))) return chats

  const sender = body.senderData
  const chatId = sender?.chatId == null ? '' : String(sender.chatId).trim()
  const phone = phoneOf(sender?.senderPhoneNumber)
  const message: ChatMessage = {
    id,
    text,
    direction: 'in',
    timestamp: toMillis(body.timestamp),
    status: 'sent',
  }

  const byId = chatId ? chats.findIndex((chat) => chat.chatId === chatId) : -1
  const index = byId >= 0 ? byId : phone ? chats.findIndex((chat) => chat.phone === phone) : -1

  if (index === -1) {
    if (!chatId) return chats
    if (sender?.chatType && sender.chatType !== 'user') return chats
    const created: Chat = {
      chatId,
      phone,
      title: senderName(notification, phone),
      messages: [message],
      unread: activeChatId === chatId ? 0 : 1,
    }
    return [created, ...chats]
  }

  const current = chats[index]
  const name = sender?.senderContactName || sender?.senderName || sender?.chatName
  const title = name?.trim() && isPhoneTitle(current.title, current.phone) ? name.trim() : current.title
  const updated: Chat = {
    ...current,
    phone: current.phone || phone,
    title,
    unread: current.chatId === activeChatId ? 0 : current.unread + 1,
    messages: [...current.messages, message],
  }
  return [updated, ...chats.filter((_, chatIndex) => chatIndex !== index)]
}
