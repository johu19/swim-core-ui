import { LoaderCircle } from 'lucide-react'

import { cn } from '@/lib/utils'

export function Spinner({
  className,
  label,
}: {
  className?: string
  label?: string
}) {
  return (
    <span
      aria-label={label ?? 'Loading'}
      aria-live="polite"
      className={cn('inline-flex items-center justify-center', className)}
      role="status"
    >
      <LoaderCircle className="size-4 animate-spin" />
    </span>
  )
}
