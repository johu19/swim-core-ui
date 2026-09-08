import { useId } from 'react'

import { cn } from '@/lib/utils'

/**
 * The Swim Core droplet mark: a white teardrop with a single wave on the
 * blue-gradient rounded square. Kept in sync with `public/icon.svg` (favicon /
 * PWA icon). Inlined as SVG so it scales crisply and can be tinted via CSS.
 */
export function SwimCoreMark({ className }: { className?: string }) {
  const gradientId = useId()

  return (
    <svg
      aria-hidden="true"
      className={cn('size-10', className)}
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="512" height="512" rx="120" fill={`url(#${gradientId})`} />
      <path
        d="M256 104C256 104 152 226 152 316A104 104 0 1 0 360 316C360 226 256 104 256 104Z"
        fill="#ffffff"
      />
      <path
        d="M190 332C210 316 230 316 250 332C270 348 290 348 310 332"
        stroke="#2456F5"
        strokeWidth="26"
        strokeLinecap="round"
        fill="none"
      />
      <defs>
        <linearGradient
          id={gradientId}
          x1="64"
          y1="48"
          x2="448"
          y2="464"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#2456F5" />
          <stop offset="1" stopColor="#0D2F8D" />
        </linearGradient>
      </defs>
    </svg>
  )
}
