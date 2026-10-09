import { useEffect, useId, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { GreenApiError } from '../api/greenApi'
import { useChat } from '../chat/context'

export function NewChatDialog({ onClose }: { onClose: () => void }) {
  const { createChat } = useChat()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const fieldId = useId()
  const [phone, setPhone] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog || dialog.open) return
    dialog.showModal()
  }, [])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending) return
    setPending(true)
    setError(null)
    try {
      await createChat(phone)
      onClose()
    } catch (cause) {
      setError(cause instanceof GreenApiError ? cause.message : 'Не удалось создать чат.')
      setPending(false)
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="modal"
      aria-labelledby={`${fieldId}-title`}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <form className="modal-card" onSubmit={handleSubmit}>
        <h2 id={`${fieldId}-title`}>Новый чат</h2>
        <p className="modal-copy">Россия: 79991234567. Беларусь: 375291234567.</p>
        <label className="field" htmlFor={fieldId}>
          <span>Номер телефона</span>
          <input
            id={fieldId}
            inputMode="tel"
            autoComplete="tel"
            autoFocus
            placeholder="79991234567"
            value={phone}
            disabled={pending}
            onChange={(event) => {
              setPhone(event.target.value)
              setError(null)
            }}
          />
        </label>
        {error ? (
          <p className="form-error" role="alert">
            {error}
          </p>
        ) : null}
        <div className="modal-actions">
          <button type="button" className="ghost" onClick={onClose} disabled={pending}>
            Отмена
          </button>
          <button type="submit" className="primary" disabled={pending || !phone.trim()}>
            {pending ? 'Проверяем…' : 'Создать чат'}
          </button>
        </div>
      </form>
    </dialog>
  )
}
