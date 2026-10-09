import { useEffect, useRef, useState } from 'react'
import { GreenApiError } from '../api/greenApi'
import { IconSend } from './icons'

const LIMIT = 4000

export function MessageComposer({ onSend }: { onSend: (text: string) => Promise<void> }) {
  const [text, setText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const fieldRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const field = fieldRef.current
    if (!field) return
    field.style.height = 'auto'
    const full = field.scrollHeight
    field.style.height = `${Math.min(full, 140)}px`
    field.style.overflowY = full > 140 ? 'auto' : 'hidden'
  }, [text])

  async function submit() {
    if (!text.trim()) return
    setError(null)
    try {
      await onSend(text)
      setText('')
    } catch (cause) {
      setError(cause instanceof GreenApiError ? cause.message : 'Не удалось отправить.')
    }
  }

  const trimmed = text.trim()

  return (
    <form
      className="composer"
      onSubmit={(event) => {
        event.preventDefault()
        void submit()
      }}
    >
      <textarea
        ref={fieldRef}
        rows={1}
        maxLength={LIMIT}
        placeholder="Сообщение"
        value={text}
        aria-label="Текст сообщения"
        onChange={(event) => {
          setText(event.target.value)
          setError(null)
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault()
            void submit()
          }
        }}
      />
      <button className="send" type="submit" disabled={!trimmed} aria-label="Отправить">
        <IconSend size={20} />
      </button>
      {text.length > 3600 || error ? (
        <p className={error ? 'composer-note is-error' : 'composer-note'}>
          {error ?? `${text.length}/${LIMIT}`}
        </p>
      ) : null}
    </form>
  )
}
