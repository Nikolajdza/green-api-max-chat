const AVATAR_COLORS = ['#6e49f2', '#3d7eff', '#12997a', '#d4537e', '#e07a2f', '#4c6ef5']

export function normalizePhone(input: string): string | null {
  let digits = input.replace(/\D/g, '')
  if (digits.length === 11 && digits.startsWith('8')) {
    digits = `7${digits.slice(1)}`
  }
  if (digits.length === 10) {
    digits = `7${digits}`
  }
  if (digits.startsWith('7') && digits.length === 11) return digits
  if (digits.startsWith('375') && digits.length === 12) return digits
  return null
}

export function formatPhone(phone: string): string {
  if (phone.startsWith('375') && phone.length === 12) {
    return `+375 ${phone.slice(3, 5)} ${phone.slice(5, 8)}-${phone.slice(8, 10)}-${phone.slice(10)}`
  }
  if (phone.startsWith('7') && phone.length === 11) {
    return `+7 ${phone.slice(1, 4)} ${phone.slice(4, 7)}-${phone.slice(7, 9)}-${phone.slice(9)}`
  }
  return phone ? `+${phone}` : 'Неизвестный номер'
}

export function formatTime(timestamp: number): string {
  return new Intl.DateTimeFormat('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(timestamp)
}

export function formatDay(timestamp: number): string {
  const date = new Date(timestamp)
  const today = new Date()
  const startToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()
  const startDate = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
  const diff = Math.round((startToday - startDate) / 86_400_000)
  if (diff === 0) return 'Сегодня'
  if (diff === 1) return 'Вчера'
  return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' }).format(date)
}

export function formatListTime(timestamp: number): string {
  const date = new Date(timestamp)
  if (date.toDateString() === new Date().toDateString()) return formatTime(timestamp)
  return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short' }).format(date)
}

export function avatarColor(seed: string): string {
  let hash = 0
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]
}

export function initials(title: string, phone: string): string {
  const words = title
    .trim()
    .split(/\s+/)
    .filter((word) => /[A-Za-zА-Яа-яЁё]/.test(word))
  if (words.length >= 2) return `${words[0][0]}${words[1][0]}`.toUpperCase()
  if (words.length === 1) return words[0].slice(0, 1).toUpperCase()
  return phone.slice(-2) || '?'
}

export function isPhoneTitle(title: string, phone: string): boolean {
  if (!title) return true
  if (phone && (title === phone || title === formatPhone(phone))) return true
  return title.startsWith('+')
}
