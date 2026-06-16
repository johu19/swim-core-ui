import { AuthCardLayout } from '@/features/auth/components/auth-card-layout'

type StatusScreenProps = {
  message: string
  title: string
}

export function StatusScreen({ message, title }: StatusScreenProps) {
  return <AuthCardLayout title={title} description={message} />
}
