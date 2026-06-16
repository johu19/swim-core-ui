import { LogIn } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { AuthCardLayout } from '@/features/auth/components/auth-card-layout'

type SignInScreenProps = {
  onSignIn: () => void
}

export function SignInScreen({ onSignIn }: SignInScreenProps) {
  return (
    <AuthCardLayout
      title="Swim-Core"
      description="Sign in with Cognito to access the authenticated preview."
      footer={
        <Button onClick={onSignIn} size="lg">
          <LogIn className="size-4" />
          Sign in
        </Button>
      }
    />
  )
}
