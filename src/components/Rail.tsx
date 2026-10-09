import { useChat } from '../chat/context'
import { MaxMark } from './MaxMark'
import { IconChat, IconLogout, IconPhone, IconSettings } from './icons'

export function Rail() {
  const { logout, credentials } = useChat()

  return (
    <nav className="rail" aria-label="Разделы">
      <div className="rail-logo" title={credentials ? `Инстанс ${credentials.idInstance}` : 'MAX'}>
        <MaxMark size={36} />
      </div>
      <div className="rail-slot is-active" title="Чаты">
        <IconChat />
      </div>
      <div className="rail-slot is-muted" title="Звонки" aria-hidden="true">
        <IconPhone />
      </div>
      <div className="rail-slot is-muted" title="Настройки" aria-hidden="true">
        <IconSettings />
      </div>
      <button type="button" className="rail-logout" onClick={logout} aria-label="Выйти" title="Выйти">
        <IconLogout />
      </button>
    </nav>
  )
}
