import { useEffect, useState } from 'react'
import { LogOut } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { profileApi, type Profile } from '@/features/profile/profile-api'
import { ApiError } from '@/lib/api/api-client'
import { cn } from '@/lib/utils'

type AuthenticatedHomeProps = {
  onSignOut: () => void
}

type HomeTab = 'profile' | 'performances'

export function AuthenticatedHome({ onSignOut }: AuthenticatedHomeProps) {
  const [activeTab, setActiveTab] = useState<HomeTab>('profile')
  const [profile, setProfile] = useState<Profile | null>(null)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)

  useEffect(() => {
    let ignore = false

    async function loadProfile() {
      try {
        setIsLoadingProfile(true)
        setProfileError(null)

        const profile = await profileApi.getMeProfile()

        if (!ignore) {
          console.log('GET /me/profile', profile)
          setProfile(profile)
        }
      } catch (error) {
        if (!ignore) {
          console.error('GET /me/profile failed', error)

          if (error instanceof ApiError) {
            setProfileError(error.message || `Request failed with status ${error.status}.`)
          } else if (error instanceof Error) {
            setProfileError(error.message)
          } else {
            setProfileError('Unable to load profile.')
          }
        }
      } finally {
        if (!ignore) {
          setIsLoadingProfile(false)
        }
      }
    }

    void loadProfile()

    return () => {
      ignore = true
    }
  }, [])

  const profileEntries = Object.entries(profile ?? {}).filter(
    ([key]) => key !== 'profileId',
  )

  return (
    <main className="min-h-svh px-5 py-6 sm:px-8">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
        <header className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-primary sm:text-4xl">
              Swim-Core-UI
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Authenticated home
            </p>
          </div>

          <Button onClick={onSignOut} variant="secondary">
            <LogOut className="size-4" />
            Sign out
          </Button>
        </header>

        <section className="rounded-[1.75rem] border border-primary/10 bg-white/80 p-3 shadow-[0_24px_60px_-32px_rgba(37,99,235,0.28)] backdrop-blur">
          <div className="flex gap-2 border-b border-primary/10 pb-3">
            <TabButton
              isActive={activeTab === 'profile'}
              label="Profile"
              onClick={() => setActiveTab('profile')}
            />
            <TabButton
              isActive={activeTab === 'performances'}
              label="Performances"
              onClick={() => setActiveTab('performances')}
            />
          </div>

          <div className="pt-6">
            {activeTab === 'profile' ? (
              <ProfileTab
                entries={profileEntries}
                error={profileError}
                isLoading={isLoadingProfile}
              />
            ) : (
              <PerformancesTab />
            )}
          </div>
        </section>
      </div>
    </main>
  )
}

type ProfileTabProps = {
  entries: [string, unknown][]
  error: string | null
  isLoading: boolean
}

function ProfileTab({ entries, error, isLoading }: ProfileTabProps) {
  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading profile...</p>
  }

  if (error) {
    return <p className="text-sm text-red-600">{error}</p>
  }

  if (!entries.length) {
    return <p className="text-sm text-muted-foreground">No profile data available.</p>
  }

  return (
    <div className="grid gap-4">
      {entries.map(([key, value]) => (
        <div
          key={key}
          className="rounded-2xl border border-primary/10 bg-primary/5 px-4 py-3"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/70">
            {formatLabel(key)}
          </p>
          <p className="mt-2 break-words text-sm text-foreground">
            {formatValue(value)}
          </p>
        </div>
      ))}
    </div>
  )
}

function PerformancesTab() {
  return <p className="text-sm text-muted-foreground">Under development</p>
}

type TabButtonProps = {
  isActive: boolean
  label: string
  onClick: () => void
}

function TabButton({ isActive, label, onClick }: TabButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-full px-4 py-2 text-sm font-medium transition-colors',
        isActive
          ? 'bg-primary text-primary-foreground'
          : 'text-muted-foreground hover:bg-primary/8 hover:text-primary',
      )}
    >
      {label}
    </button>
  )
}

function formatLabel(value: string) {
  return value.replace(/([A-Z])/g, ' $1').replace(/[_-]/g, ' ').trim()
}

function formatValue(value: unknown) {
  if (typeof value === 'string' || typeof value === 'number') {
    return String(value)
  }

  if (typeof value === 'boolean') {
    return value ? 'true' : 'false'
  }

  return JSON.stringify(value)
}
