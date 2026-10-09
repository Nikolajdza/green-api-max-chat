import { ChatProvider } from './chat/ChatProvider'
import { useChat } from './chat/context'
import { AuthScreen } from './screens/AuthScreen'
import { ChatScreen } from './screens/ChatScreen'

function Root() {
  const { credentials } = useChat()
  return credentials ? <ChatScreen /> : <AuthScreen />
}

export default function App() {
  return (
    <ChatProvider>
      <Root />
    </ChatProvider>
  )
}
