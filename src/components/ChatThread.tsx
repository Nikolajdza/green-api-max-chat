import { useEffect, useRef } from 'react'
import { useChat } from '../chat/context'
import { avatarColor, formatDay, formatPhone, formatTime, initials } from '../format'
import type { ChatMessage } from '../types'
import { MaxMark } from './MaxMark'
import { MessageComposer } from './MessageComposer'
import { IconBack } from './icons'

export function ChatThread({ onNew }: { onNew: () => void }) {
  const { chats, activeChatId, selectChat, sendText, retryMessage } = useChat()
  const chat = chats.find((item) => item.chatId === activeChatId) ?? null
  const scrollerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const scroller = scrollerRef.current
    if (!scroller) return
    scroller.scrollTop = scroller.scrollHeight
  }, [chat?.chatId, chat?.messages.length])

  if (!chat) {
    return (
      <section className="conversation is-empty">
        <MaxMark size={64} />
        <h2>Выберите чат</h2>
        <p>Или начните новый по номеру телефона.</p>
        <button type="button" className="primary" onClick={onNew}>
          Новый чат
        </button>
      </section>
    )
  }

  const phoneLabel = formatPhone(chat.phone)
  const groups: { day: string; messages: ChatMessage[] }[] = []
  for (const message of chat.messages) {
    const day = formatDay(message.timestamp)
    const last = groups.at(-1)
    if (!last || last.day !== day) groups.push({ day, messages: [message] })
    else last.messages.push(message)
  }

  return (
    <section className="conversation">
      <header className="thread-header">
        <button type="button" className="back" onClick={() => selectChat(null)} aria-label="К списку чатов">
          <IconBack />
        </button>
        <span className="avatar" style={{ background: avatarColor(chat.chatId) }}>
          {initials(chat.title, chat.phone)}
        </span>
        <div className="thread-title">
          <strong>{chat.title}</strong>
          <span>{chat.title === phoneLabel ? 'личный чат' : phoneLabel}</span>
        </div>
      </header>

      <div className="messages" ref={scrollerRef}>
        {chat.messages.length === 0 ? (
          <p className="thread-hint">Напишите первое сообщение</p>
        ) : (
          groups.map((group) => (
            <div className="day-group" key={group.day}>
              <span className="day-chip">{group.day}</span>
              {group.messages.map((message) => (
                <div key={message.id} className={message.direction === 'out' ? 'row is-out' : 'row is-in'}>
                  <div className="bubble-wrap">
                    <div
                      className={[
                        'bubble',
                        message.direction === 'out' ? 'is-out' : 'is-in',
                        message.status === 'sending' ? 'is-sending' : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                    >
                      <p>{message.text}</p>
                      <time dateTime={new Date(message.timestamp).toISOString()}>{formatTime(message.timestamp)}</time>
                    </div>
                    {message.status === 'failed' ? (
                      <p className="retry-row">
                        <span>{message.error ?? 'Не отправлено'}</span>
                        <button type="button" className="retry" onClick={() => retryMessage(message.id)}>
                          Повторить
                        </button>
                      </p>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          ))
        )}
      </div>

      <MessageComposer onSend={sendText} />
    </section>
  )
}
