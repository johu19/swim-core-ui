import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AuthProvider } from 'react-oidc-context'

import { cognitoAuthConfig, isCognitoConfigured } from '@/auth/cognito'

import './index.css'
import App from './App.tsx'

const app = (
  <StrictMode>
    <App />
  </StrictMode>
)

createRoot(document.getElementById('root')!).render(
  isCognitoConfigured ? (
    <AuthProvider {...cognitoAuthConfig}>{app}</AuthProvider>
  ) : (
    app
  ),
)
