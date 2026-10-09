import type { ReactNode } from 'react'

type IconProps = { size?: number }

function Stroke({ size = 22, children }: IconProps & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

export function IconChat({ size }: IconProps) {
  return (
    <Stroke size={size}>
      <path d="M6 16.5 4.2 19.6c-.3.5.1 1.1.7 1.1H16a4 4 0 0 0 4-4V8a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v8.5z" />
    </Stroke>
  )
}

export function IconPhone({ size }: IconProps) {
  return (
    <Stroke size={size}>
      <path d="M8.2 4.8h2.1l1.2 3-1.5 1a12 12 0 0 0 5.2 5.2l1-1.5 3 1.2v2.1c0 .8-.6 1.5-1.4 1.6A14.5 14.5 0 0 1 6.6 6.2c.1-.8.8-1.4 1.6-1.4z" />
    </Stroke>
  )
}

export function IconSettings({ size }: IconProps) {
  return (
    <Stroke size={size}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3.5v2.2M12 18.3v2.2M4.8 6.6l1.8 1.2M17.4 16.2l1.8 1.2M3.5 12h2.2M18.3 12h2.2M4.8 17.4l1.8-1.2M17.4 7.8l1.8-1.2" />
    </Stroke>
  )
}

export function IconLogout({ size }: IconProps) {
  return (
    <Stroke size={size}>
      <path d="M10 7V5.8A1.8 1.8 0 0 1 11.8 4h6.4A1.8 1.8 0 0 1 20 5.8v12.4a1.8 1.8 0 0 1-1.8 1.8h-6.4A1.8 1.8 0 0 1 10 18.2V17" />
      <path d="M4 12h10M11 9l3 3-3 3" />
    </Stroke>
  )
}

export function IconPlus({ size }: IconProps) {
  return (
    <Stroke size={size}>
      <path d="M12 5v14M5 12h14" />
    </Stroke>
  )
}

export function IconSearch({ size }: IconProps) {
  return (
    <Stroke size={size}>
      <circle cx="11" cy="11" r="6" />
      <path d="m16 16 3.5 3.5" />
    </Stroke>
  )
}

export function IconBack({ size }: IconProps) {
  return (
    <Stroke size={size}>
      <path d="M15 6 9 12l6 6" />
    </Stroke>
  )
}

export function IconSend({ size }: IconProps) {
  return (
    <Stroke size={size}>
      <path d="M5 12h12" />
      <path d="m13 6 6 6-6 6" />
    </Stroke>
  )
}
