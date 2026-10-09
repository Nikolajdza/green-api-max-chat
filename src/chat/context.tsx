import { createContext, use } from 'react'
import type { Chat, Credentials } from '../types'

export type ChatContextValue = {
  credentials: Credentials | null
  chats: Chat[]
  activeChatId: string | null
  pollError: string | null
  login: (idInstance: string, apiTokenInstance: string) => Promise<void>
  logout: () => void
  selectChat: (chatId: string | null) => void
  createChat: (phoneInput: string) => Promise<void>
  sendText: (text: string) => Promise<void>
  retryMessage: (messageId: string) => void
}

export const ChatContext = createContext<ChatContextValue | null>(null)

export function useChat(): ChatContextValue {
  const context = use(ChatContext)
  if (!context) throw new Error('useChat must be used within ChatProvider')
  return context
}
