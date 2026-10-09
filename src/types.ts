export type Credentials = {
  idInstance: string
  apiTokenInstance: string
}

export type MessageStatus = 'sending' | 'sent' | 'failed'

export type ChatMessage = {
  id: string
  text: string
  direction: 'in' | 'out'
  timestamp: number
  status: MessageStatus
  error?: string
}

export type Chat = {
  chatId: string
  phone: string
  title: string
  messages: ChatMessage[]
  unread: number
}
