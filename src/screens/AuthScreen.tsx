import { useId, useState } from 'react'
import type { FormEvent } from 'react'
import { GreenApiError } from '../api/greenApi'
import { useChat } from '../chat/context'
import { MaxMark } from '../components/MaxMark'
import { mockMode } from '../mockMode'

export function AuthScreen() {
  const { login } = useChat()
  const idField = useId()
  const tokenField = useId()
  const [idInstance, setIdInstance] = useState(mockMode ? '1101000001' : '')
  const [apiTokenInstance, setApiTokenInstance] = useState(mockMode ? 'demo' : '')
  const [showToken, setShowToken] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending) return
    setPending(true)
    setError(null)
    try {
      await login(idInstance, apiTokenInstance)
    } catch (cause) {
      setError(cause instanceof GreenApiError ? cause.message : 'Не удалось войти.')
      setPending(false)
    }
  }

  const canSubmit = idInstance.trim().length > 0 && apiTokenInstance.trim().length > 0 && !pending

  return (
    <main className="auth">
      <form className="auth-card" onSubmit={handleSubmit}>
        <div className="brand">
          <MaxMark size={56} />
          <div>
            <h1>MAX</h1>
            <p>Текстовые сообщения через GREEN-API</p>
            {mockMode ? <p className="mock-note">Демо: любые цифры и токен. Ответ придёт сам.</p> : null}
          </div>
        </div>

        <label className="field" htmlFor={idField}>
          <span>idInstance</span>
          <input
            id={idField}
            name="idInstance"
            inputMode="numeric"
            autoComplete="off"
            spellCheck={false}
            placeholder="1101234567"
            value={idInstance}
            disabled={pending}
            onChange={(event) => {
              setIdInstance(event.target.value)
              setError(null)
            }}
          />
        </label>

        <label className="field" htmlFor={tokenField}>
          <span>apiTokenInstance</span>
          <span className="token-row">
            <input
              id={tokenField}
              name="apiTokenInstance"
              type={showToken ? 'text' : 'password'}
              autoComplete="off"
              spellCheck={false}
              placeholder="Токен инстанса"
              value={apiTokenInstance}
              disabled={pending}
              onChange={(event) => {
                setApiTokenInstance(event.target.value)
                setError(null)
              }}
            />
            <button
              type="button"
              className="ghost"
              onClick={() => setShowToken((current) => !current)}
              aria-label={showToken ? 'Скрыть токен' : 'Показать токен'}
            >
              {showToken ? 'Скрыть' : 'Показать'}
            </button>
          </span>
        </label>

        {error ? (
          <p className="form-error" role="alert">
            {error}
          </p>
        ) : null}

        <button className="primary" type="submit" disabled={!canSubmit}>
          {pending ? 'Проверяем инстанс…' : 'Войти'}
        </button>

        <p className="fine-print">
          Токен остаётся в этой вкладке браузера и уходит только в GREEN-API.{' '}
          <a href="https://console.green-api.com/" target="_blank" rel="noreferrer">
            Консоль GREEN-API
          </a>
        </p>
      </form>
    </main>
  )
}
