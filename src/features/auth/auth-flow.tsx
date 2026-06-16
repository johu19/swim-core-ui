import { useEffect } from 'react'
import { useAuth } from 'react-oidc-context'

import {
  buildCognitoLogoutUrl,
  isCognitoConfigured,
  missingCognitoEnv,
} from '@/auth/cognito'
import { apiClient } from '@/lib/api/api-client'
import { Button } from '@/components/ui/button'
import { AuthCardLayout } from '@/features/auth/components/auth-card-layout'
import { AuthenticatedHome } from '@/features/auth/components/authenticated-home'
import { ConfigErrorScreen } from '@/features/auth/components/config-error-screen'
import { SignInScreen } from '@/features/auth/components/sign-in-screen'
import { StatusScreen } from '@/features/auth/components/status-screen'

export function AuthFlow() {
  if (!isCognitoConfigured) {
    return <ConfigErrorScreen missingEnv={missingCognitoEnv} />
  }

  return <AuthenticatedAuthFlow />
}

function AuthenticatedAuthFlow() {
  const auth = useAuth()

  useEffect(() => {
    apiClient.setIdToken(auth.user?.id_token ?? null)
  }, [auth.user?.id_token])

  const signIn = () => {
    void auth.signinRedirect()
  }

  const signOut = async () => {
    const logoutUrl = buildCognitoLogoutUrl()

    apiClient.setIdToken(null)
    await auth.removeUser()

    if (!logoutUrl) {
      return
    }

    window.location.replace(logoutUrl)
  }

  if (auth.activeNavigator === 'signinRedirect') {
    return (
      <StatusScreen
        title="Redirecting"
        message="Taking you to the Cognito sign-in page."
      />
    )
  }

  if (auth.activeNavigator === 'signinSilent') {
    return (
      <StatusScreen
        title="Refreshing session"
        message="Please wait a moment."
      />
    )
  }

  if (auth.activeNavigator === 'signoutRedirect') {
    return (
      <StatusScreen
        title="Signing out"
        message="Closing your session securely."
      />
    )
  }

  if (auth.isLoading) {
    return (
      <StatusScreen
        title="Loading"
        message="Checking your Swim Core session."
      />
    )
  }

  if (auth.error) {
    return (
      <AuthCardLayout
        cardClassName="border-red-200 bg-white/90 shadow-[0_24px_60px_-32px_rgba(239,68,68,0.35)]"
        footer={
          <Button onClick={signIn} size="lg">
            Try again
          </Button>
        }
        headerAlignment="center"
        title="Sign-in problem"
        titleClassName="text-red-600"
        description={auth.error.message}
      />
    )
  }

  if (!auth.isAuthenticated) {
    return <SignInScreen onSignIn={signIn} />
  }

  return <AuthenticatedHome onSignOut={() => void signOut()} />
}
