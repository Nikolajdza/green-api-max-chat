import { useState } from 'react'
import { useChat } from '../chat/context'
import { ChatList } from '../components/ChatList'
import { ChatThread } from '../components/ChatThread'
import { NewChatDialog } from '../components/NewChatDialog'
import { Rail } from '../components/Rail'
import { mockMode } from '../mockMode'

export function ChatScreen() {
  const { activeChatId } = useChat()
  const [dialogOpen, setDialogOpen] = useState(false)

  return (
    <div className="app-frame">
      {mockMode ? (
        <p className="mock-banner">Демо-режим. Это не MAX: через пару секунд после сообщения придёт ответ.</p>
      ) : null}
      <div className="shell" data-pane={activeChatId ? 'chat' : 'list'}>
        <Rail />
        <ChatList onNew={() => setDialogOpen(true)} />
        <ChatThread onNew={() => setDialogOpen(true)} />
        {dialogOpen ? <NewChatDialog onClose={() => setDialogOpen(false)} /> : null}
      </div>
    </div>
  )
}
