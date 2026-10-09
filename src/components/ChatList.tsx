import { useMemo, useState } from 'react'
import { useChat } from '../chat/context'
import { avatarColor, formatListTime, initials } from '../format'
import { MaxMark } from './MaxMark'
import { IconLogout, IconPlus, IconSearch } from './icons'

export function ChatList({ onNew }: { onNew: () => void }) {
  const { chats, activeChatId, selectChat, pollError, credentials, logout } = useChat()
  const [query, setQuery] = useState('')

  const visible = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return chats
    const digits = normalized.replace(/\D/g, '')
    return chats.filter((chat) => {
      const title = chat.title.toLowerCase()
      return title.includes(normalized) || (digits.length > 0 && chat.phone.includes(digits))
    })
  }, [chats, query])

  return (
    <section className="sidebar">
      <div className="sidebar-tools">
        <div className="sidebar-brand">
          <MaxMark size={32} />
          <strong>MAX</strong>
        </div>
        <button type="button" className="icon-button" onClick={logout} aria-label="Выйти">
          <IconLogout size={20} />
        </button>
      </div>

      <header className="sidebar-header">
        <h2>Чаты</h2>
        <button type="button" className="icon-button accent" onClick={onNew} aria-label="Новый чат">
          <IconPlus size={20} />
        </button>
      </header>

      <label className="search">
        <IconSearch size={18} />
        <input
          type="search"
          placeholder="Поиск"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          aria-label="Поиск по чатам"
        />
      </label>

      {pollError ? (
        <p className="banner" role="status">
          {pollError}
        </p>
      ) : null}

      {visible.length === 0 ? (
        <div className="sidebar-empty">
          <p>{chats.length === 0 ? 'Чатов пока нет' : 'Ничего не найдено'}</p>
          {chats.length === 0 ? (
            <button type="button" className="primary" onClick={onNew}>
              Новый чат
            </button>
          ) : null}
        </div>
      ) : (
        <ul className="chat-list">
          {visible.map((chat) => {
            const last = chat.messages.at(-1)
            const preview = last
              ? `${last.direction === 'out' ? 'Вы: ' : ''}${last.text.replace(/\s+/g, ' ')}`
              : 'Нет сообщений'
            const active = chat.chatId === activeChatId
            return (
              <li key={chat.chatId}>
                <button
                  type="button"
                  className={active ? 'chat-item is-active' : 'chat-item'}
                  aria-current={active ? 'true' : undefined}
                  onClick={() => selectChat(chat.chatId)}
                >
                  <span className="avatar" style={{ background: avatarColor(chat.chatId) }}>
                    {initials(chat.title, chat.phone)}
                  </span>
                  <span className="chat-item-copy">
                    <span className="chat-item-title">{chat.title}</span>
                    <span className="chat-item-preview">{preview}</span>
                  </span>
                  <span className="chat-item-meta">
                    {last ? <time dateTime={new Date(last.timestamp).toISOString()}>{formatListTime(last.timestamp)}</time> : <span />}
                    {chat.unread > 0 ? (
                      <span className="badge">{chat.unread > 99 ? '99+' : chat.unread}</span>
                    ) : null}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}

      {credentials ? <p className="sidebar-foot">Инстанс {credentials.idInstance}</p> : null}
    </section>
  )
}
