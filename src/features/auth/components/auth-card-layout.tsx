import type { ReactNode } from 'react'

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { cn } from '@/lib/utils'

type AuthCardLayoutProps = {
  cardClassName?: string
  children?: ReactNode
  description?: string
  footer?: ReactNode
  headerAlignment?: 'left' | 'center'
  title: string
  titleClassName?: string
}

export function AuthCardLayout({
  cardClassName,
  children,
  description,
  footer,
  headerAlignment = 'center',
  title,
  titleClassName,
}: AuthCardLayoutProps) {
  const isCentered = headerAlignment === 'center'

  return (
    <main className="flex min-h-svh items-center justify-center px-5 py-10 sm:px-8">
      <Card
        className={cn(
          'w-full max-w-md border-primary/15 bg-white/88 shadow-[0_24px_60px_-32px_rgba(37,99,235,0.45)] backdrop-blur',
          cardClassName,
        )}
      >
        <CardHeader className={cn('space-y-4', isCentered && 'text-center')}>
          <CardTitle
            className={cn(
              'text-3xl font-semibold tracking-tight text-primary sm:text-4xl',
              titleClassName,
            )}
          >
            {title}
          </CardTitle>
          {description ? (
            <CardDescription className="text-base leading-7 text-muted-foreground sm:text-lg">
              {description}
            </CardDescription>
          ) : null}
        </CardHeader>

        {children ? <CardContent>{children}</CardContent> : null}
        {footer ? <CardFooter className="justify-center">{footer}</CardFooter> : null}
      </Card>
    </main>
  )
}
