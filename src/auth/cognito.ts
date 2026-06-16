import { WebStorageStateStore } from 'oidc-client-ts'
import type { AuthProviderProps } from 'react-oidc-context'

function normalizeUrl(rawUrl?: string) {
  if (!rawUrl) {
    return undefined
  }

  return new URL(rawUrl.trim()).toString()
}

const env = {
  authority: normalizeUrl(import.meta.env.VITE_COGNITO_AUTHORITY),
  clientId: import.meta.env.VITE_COGNITO_CLIENT_ID?.trim(),
  domain: normalizeUrl(import.meta.env.VITE_COGNITO_DOMAIN),
  logoutUri: normalizeUrl(import.meta.env.VITE_COGNITO_LOGOUT_URI),
  redirectUri: normalizeUrl(import.meta.env.VITE_COGNITO_REDIRECT_URI),
  scope: import.meta.env.VITE_COGNITO_SCOPE?.trim() || 'openid email profile',
}

export const missingCognitoEnv = [
  ['VITE_COGNITO_AUTHORITY', env.authority],
  ['VITE_COGNITO_CLIENT_ID', env.clientId],
  ['VITE_COGNITO_DOMAIN', env.domain],
  ['VITE_COGNITO_REDIRECT_URI', env.redirectUri],
  ['VITE_COGNITO_LOGOUT_URI', env.logoutUri],
]
  .filter(([, value]) => !value)
  .map(([key]) => key)

export const isCognitoConfigured = missingCognitoEnv.length === 0

function getOrigin(rawUrl: string) {
  return new URL(rawUrl).origin
}

export const cognitoAuthConfig: AuthProviderProps = {
  authority: env.authority ?? '',
  client_id: env.clientId ?? '',
  redirect_uri: env.redirectUri ?? '',
  response_type: 'code',
  scope: env.scope,
  metadata:
    env.authority && env.domain
      ? {
          issuer: env.authority,
          authorization_endpoint: `${getOrigin(env.domain)}/oauth2/authorize`,
          token_endpoint: `${getOrigin(env.domain)}/oauth2/token`,
          userinfo_endpoint: `${getOrigin(env.domain)}/oauth2/userInfo`,
          revocation_endpoint: `${getOrigin(env.domain)}/oauth2/revoke`,
          jwks_uri: `${env.authority}/.well-known/jwks.json`,
        }
      : undefined,
  userStore: new WebStorageStateStore({ store: window.localStorage }),
  onSigninCallback: () => {
    window.history.replaceState({}, document.title, '/')
  },
}

export function buildCognitoLogoutUrl() {
  if (!env.domain || !env.clientId || !env.logoutUri) {
    return null
  }

  const url = new URL('/logout', getOrigin(env.domain))
  url.searchParams.set('client_id', env.clientId)
  url.searchParams.set('logout_uri', env.logoutUri)

  return url.toString()
}
