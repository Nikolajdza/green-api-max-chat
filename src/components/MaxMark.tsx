import { useId } from 'react'

export function MaxMark({ size = 40 }: { size?: number }) {
  const rawId = useId().replace(/:/g, '')
  const gradientId = `max-mark-${rawId}`

  return (
    <svg className="max-mark" width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <rect width="48" height="48" rx="14" fill={`url(#${gradientId})`} />
      <path
        fill="#fff"
        d="M15 15.2h16.4c2.5 0 4.6 2 4.6 4.6v6.6c0 2.5-2.1 4.6-4.6 4.6H22.2l-4.8 3.8v-3.8H15c-2.5 0-4.6-2.1-4.6-4.6v-6.6c0-2.6 2.1-4.6 4.6-4.6z"
      />
      <defs>
        <linearGradient id={gradientId} x1="6" y1="4" x2="44" y2="46" gradientUnits="userSpaceOnUse">
          <stop stopColor="#9b72ff" />
          <stop offset="1" stopColor="#5b32ee" />
        </linearGradient>
      </defs>
    </svg>
  )
}
