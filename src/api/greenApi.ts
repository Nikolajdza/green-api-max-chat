import type { Credentials } from '../types'

const API_ROOT = 'https://api.green-api.com'

export class GreenApiError extends Error {
  readonly status?: number

  constructor(message: string, status?: number) {
    super(message)
    this.name = 'GreenApiError'
    this.status = status
  }
}

export type AccountCheck = {
  exist: boolean
  chatId: string
}

export type NotificationBody = {
  typeWebhook?: string
  timestamp?: number
  idMessage?: string
  senderData?: {
    chatId?: string | number
    chatName?: string
    chatType?: string
    senderName?: string
    senderContactName?: string
    senderPhoneNumber?: number | string
  }
  messageData?: {
    typeMessage?: string
    textMessageData?: {
      textMessage?: string
    }
  }
}

export type IncomingNotification = {
  receiptId: number
  body: NotificationBody
}

export function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError'
}

export function describeInstanceState(state: string): string {
  switch (state.toLowerCase()) {
    case 'notauthorized':
      return 'Инстанс не авторизован. Привяжите аккаунт MAX в консоли GREEN-API.'
    case 'blocked':
      return 'Инстанс заблокирован.'
    case 'yellowcard':
      return 'На инстанс наложены временные ограничения на отправку.'
    case 'starting':
      return 'Инстанс ещё запускается. Подождите минуту и войдите снова.'
    case 'sleepmode':
      return 'Инстанс в спящем режиме. Откройте консоль GREEN-API и разбудите его.'
    default:
      return `Инстанс в состоянии «${state}». Войти можно только после авторизации.`
  }
}

function translateApiMessage(message: string): string {
  const lower = message.toLowerCase()
  if (lower.includes('webhook')) {
    return 'Получение сообщений недоступно: в консоли GREEN-API очистите webhookUrl и подождите около минуты.'
  }
  if (lower.includes('not authorized') || lower.includes('notauthorized')) {
    return 'Инстанс не авторизован в MAX.'
  }
  if (lower.includes('suspend') || lower.includes('yellow')) {
    return 'На аккаунте временные ограничения на отправку.'
  }
  if (lower.includes('limit')) {
    return 'Слишком много запросов. Подождите и попробуйте снова.'
  }
  if (lower.includes('4000')) {
    return 'Текст сообщения должен быть не длиннее 4000 символов.'
  }
  return message
}

function messageFromBody(body: unknown, fallback: string): string {
  if (typeof body === 'string' && body.trim()) return translateApiMessage(body.trim())
  if (!body || typeof body !== 'object') return fallback
  const record = body as Record<string, unknown>
  const raw = [record.reason, record.message, record.descr, record.error].find(
    (value) => typeof value === 'string' && value.trim(),
  )
  return typeof raw === 'string' ? translateApiMessage(raw) : fallback
}

function fallbackForStatus(status: number): string {
  if (status === 401 || status === 403) return 'Неверный idInstance или apiTokenInstance.'
  return `GREEN-API вернул ошибку ${status}.`
}

function endpoint(credentials: Credentials, method: string, suffix = ''): string {
  const id = encodeURIComponent(credentials.idInstance.trim())
  const token = encodeURIComponent(credentials.apiTokenInstance.trim())
  return `${API_ROOT}/waInstance${id}/${method}/${token}${suffix}`
}

async function readBody(response: Response): Promise<unknown> {
  const text = await response.text()
  if (!text || text === 'null') return null
  try {
    return JSON.parse(text) as unknown
  } catch {
    return text
  }
}

async function callApi(url: string, init: RequestInit): Promise<unknown> {
  let response: Response
  try {
    response = await fetch(url, {
      ...init,
      cache: 'no-store',
      referrerPolicy: 'no-referrer',
    })
  } catch (error) {
    if (isAbortError(error)) throw error
    throw new GreenApiError(
      'Не удалось связаться с GREEN-API. Проверьте интернет и доступ к api.green-api.com.',
    )
  }

  const body = await readBody(response)
  if (!response.ok) {
    throw new GreenApiError(messageFromBody(body, fallbackForStatus(response.status)), response.status)
  }
  return body
}

export async function getStateInstance(
  credentials: Credentials,
  signal?: AbortSignal,
): Promise<string> {
  const body = await callApi(endpoint(credentials, 'getStateInstance'), { method: 'GET', signal })
  if (!body || typeof body !== 'object' || typeof (body as { stateInstance?: unknown }).stateInstance !== 'string') {
    throw new GreenApiError('Не удалось прочитать состояние инстанса.')
  }
  return (body as { stateInstance: string }).stateInstance
}

export async function checkAccount(
  credentials: Credentials,
  phoneNumber: number,
  signal?: AbortSignal,
): Promise<AccountCheck> {
  const body = await callApi(endpoint(credentials, 'checkAccount'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phoneNumber }),
    signal,
  })
  if (!body || typeof body !== 'object') throw new GreenApiError('Не удалось проверить номер.')

  const record = body as { exist?: unknown; chatId?: unknown; status?: unknown; reason?: unknown }
  if (record.status === false) {
    const reason = typeof record.reason === 'string' && record.reason.trim()
      ? record.reason
      : 'Не удалось проверить номер.'
    throw new GreenApiError(translateApiMessage(reason))
  }

  return {
    exist: record.exist === true,
    chatId: record.chatId == null ? '' : String(record.chatId),
  }
}

export async function sendMessage(
  credentials: Credentials,
  chatId: string,
  message: string,
  signal?: AbortSignal,
): Promise<string> {
  const body = await callApi(endpoint(credentials, 'sendMessage'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chatId, message }),
    signal,
  })
  const idMessage = body && typeof body === 'object' ? (body as { idMessage?: unknown }).idMessage : undefined
  if (typeof idMessage !== 'string' || !idMessage) {
    throw new GreenApiError('GREEN-API не вернул идентификатор сообщения.')
  }
  return idMessage
}

export async function receiveNotification(
  credentials: Credentials,
  receiveTimeout = 20,
  signal?: AbortSignal,
): Promise<IncomingNotification | null> {
  const url = `${endpoint(credentials, 'receiveNotification')}?receiveTimeout=${receiveTimeout}`
  const body = await callApi(url, { method: 'GET', signal })
  if (body == null) return null
  if (typeof body !== 'object') {
    const message = messageFromBody(body, '')
    if (message) throw new GreenApiError(message)
    return null
  }

  const record = body as { receiptId?: unknown; body?: unknown }
  const receiptId =
    typeof record.receiptId === 'number'
      ? record.receiptId
      : typeof record.receiptId === 'string' && record.receiptId.trim()
        ? Number(record.receiptId)
        : Number.NaN
  if (!Number.isFinite(receiptId)) {
    const message = messageFromBody(body, '')
    if (message) throw new GreenApiError(message)
    return null
  }

  const payload = record.body && typeof record.body === 'object' ? (record.body as NotificationBody) : {}
  return { receiptId, body: payload }
}

export async function deleteNotification(
  credentials: Credentials,
  receiptId: number,
  signal?: AbortSignal,
): Promise<void> {
  await callApi(endpoint(credentials, 'deleteNotification', `/${receiptId}`), {
    method: 'DELETE',
    signal,
  })
}
