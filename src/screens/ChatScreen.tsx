import { useState } from 'react'
import { useChat } from '../chat/context'
import { ChatList } from '../components/ChatList'
import { ChatThread } from '../components/ChatThread'
import { NewChatDialog } from '../components/NewChatDialog'
import { Rail } from '../components/Rail'

export function ChatScreen() {
  const { activeChatId } = useChat()
  const [dialogOpen, setDialogOpen] = useState(false)

  return (
    <div className="shell" data-pane={activeChatId ? 'chat' : 'list'}>
      <Rail />
      <ChatList onNew={() => setDialogOpen(true)} />
      <ChatThread onNew={() => setDialogOpen(true)} />
      {dialogOpen ? <NewChatDialog onClose={() => setDialogOpen(false)} /> : null}
    </div>
  )
}
