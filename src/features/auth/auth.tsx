import { useEffect, useLayoutEffect, useState, type ReactNode } from 'react'
import { BarChart3, GitCompareArrows, LogIn, LogOut, Timer } from 'lucide-react'
import { useAuth } from 'react-oidc-context'
import { toast } from 'sonner'

import { buildCognitoLogoutUrl, isCognitoConfigured, missingCognitoEnv } from '@/auth/cognito'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { Charts } from '@/features/charts/charts'
import { Performances } from '@/features/performances/performances'
import {
  type CreatePerformanceInput,
  type CreatePerformanceResponse,
  performancesApi,
  type Performance,
  type UpdatePerformanceInput,
} from '@/features/performances/performances-api'
import { Profile } from '@/features/profile/profile'
import {
  profileApi,
  type Profile as ProfileRecord,
  type UpdateProfileInput,
} from '@/features/profile/profile-api'
import { apiClient } from '@/lib/api/api-client'
import { cn } from '@/lib/utils'

type HomeTab = 'charts' | 'profile' | 'performances'

export function Auth() {
  if (!isCognitoConfigured) {
    return <ConfigErrorScreen missingEnv={missingCognitoEnv} />
  }

  return <AuthenticatedAuth />
}

function AuthenticatedAuth() {
  const auth = useAuth()
  const idToken = auth.user?.id_token ?? null

  useLayoutEffect(() => {
    apiClient.setIdToken(idToken)
  }, [idToken])

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

  if (auth.error) {
    return (
      <AuthCardLayout
        cardClassName="border-red-200 bg-white/90 shadow-error"
        description={auth.error.message}
        footer={
          <Button onClick={signIn} size="lg">
            Try again
          </Button>
        }
        headerAlignment="center"
        title="Sign-in problem"
        titleClassName="text-red-600"
      />
    )
  }

  const authStatusMessage =
    auth.activeNavigator === 'signinRedirect'
      ? 'Taking you to the sign-in page...'
      : auth.activeNavigator === 'signinSilent'
        ? 'Refreshing your session...'
        : auth.activeNavigator === 'signoutRedirect'
          ? 'Signing you out...'
          : auth.isLoading
            ? 'Checking your Swim Core session...'
            : auth.isAuthenticated && !idToken
              ? 'Finishing sign-in...'
              : null

  if (authStatusMessage) {
    return <SignInScreen isBusy message={authStatusMessage} onSignIn={signIn} />
  }

  if (!auth.isAuthenticated) {
    return <SignInScreen onSignIn={signIn} />
  }

  return <AuthenticatedHome onSignOut={() => void signOut()} />
}

function AuthenticatedHome({ onSignOut }: { onSignOut: () => void }) {
  const [activeTab, setActiveTab] = useState<HomeTab>('performances')
  const [profileForm, setProfileForm] = useState<UpdateProfileInput>(emptyProfileForm)
  const [savedProfileForm, setSavedProfileForm] = useState<UpdateProfileInput>(emptyProfileForm)
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [performances, setPerformances] = useState<Performance[]>([])
  const [isLoadingPerformances, setIsLoadingPerformances] = useState(true)
  const [selectedStrokeFilter, setSelectedStrokeFilter] = useState<
    '' | 'back' | 'breast' | 'fly' | 'free' | 'medley' | null
  >(null)
  const [selectedDistanceFilter, setSelectedDistanceFilter] = useState<
    '' | '25' | '50' | '100' | '200' | '400' | '800' | '1500'
  >('')
  const [selectedUnitFilter, setSelectedUnitFilter] = useState<'meters' | 'yards'>('meters')
  const [chartStrokeFilter, setChartStrokeFilter] = useState<
    'back' | 'breast' | 'fly' | 'free' | 'medley' | null
  >(null)
  const [chartDistanceFilter, setChartDistanceFilter] = useState<
    '25' | '50' | '100' | '200' | '400' | '800' | '1500'
  >('50')
  const [selectedChartPerformanceId, setSelectedChartPerformanceId] = useState<string | null>(null)
  const [chartUnitFilter, setChartUnitFilter] = useState<'meters' | 'yards'>('meters')
  const effectiveSelectedStrokeFilter =
    selectedStrokeFilter ?? getDefaultStrokeFilter(profileForm.favStroke)
  const selectedAvailableDistances = getAvailableDistanceFiltersForStroke(
    effectiveSelectedStrokeFilter,
  )
  const effectiveSelectedDistanceFilter =
    !selectedDistanceFilter || selectedAvailableDistances.includes(selectedDistanceFilter)
      ? selectedDistanceFilter
      : ''
  const effectiveChartStrokeFilter =
    chartStrokeFilter && getAvailableChartStrokeFilters(performances).includes(chartStrokeFilter)
      ? chartStrokeFilter
      : getDefaultChartStrokeFilter(profileForm.favStroke, performances)
  const chartAvailableDistances = getAvailableDistanceFiltersForStroke(effectiveChartStrokeFilter)
  const effectiveChartDistanceFilter = chartAvailableDistances.includes(chartDistanceFilter)
    ? chartDistanceFilter
    : chartAvailableDistances[0]

  useEffect(() => {
    let ignore = false

    async function loadProfile() {
      try {
        setIsLoadingProfile(true)

        const response = await profileApi.getMeProfile()
        const nextProfileForm = mapProfileToForm(response.profile)
        const nextDefaultStrokeFilter = getDefaultStrokeFilter(nextProfileForm.favStroke)
        const nextChartStrokeFilter = normalizeChartStrokeFilter(nextProfileForm.favStroke)

        if (!ignore) {
          setProfileForm(nextProfileForm)
          setSavedProfileForm(nextProfileForm)
          setSelectedStrokeFilter((current) => current ?? nextDefaultStrokeFilter)
          setChartStrokeFilter((current) => current ?? nextChartStrokeFilter ?? current)
        }
      } catch (error) {
        if (!ignore) {
          console.error('GET /me/profile failed', error)

          toast.error('Unable to load profile.')
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

  useEffect(() => {
    let ignore = false

    async function loadPerformances() {
      try {
        setIsLoadingPerformances(true)

        const response = await performancesApi.getPerformances()

        if (!ignore) {
          setPerformances(response.performances)
        }
      } catch (error) {
        if (!ignore) {
          console.error('GET /performances failed', error)

          toast.error('Unable to load performances.')
        }
      } finally {
        if (!ignore) {
          setIsLoadingPerformances(false)
        }
      }
    }

    void loadPerformances()

    return () => {
      ignore = true
    }
  }, [])

  return (
    <main className="flex h-svh flex-col px-4 py-4 sm:px-6 sm:py-5">
      <div className="mx-auto flex min-h-0 w-full max-w-4xl flex-1 flex-col gap-4">
        <header className="flex items-center justify-between gap-4">
          <div>
            <h1 className="font-brand text-3xl tracking-brand text-primary sm:text-4xl">
              SWIM CORE
            </h1>
          </div>

          <Button
            aria-label="Sign out"
            className="h-10 w-10 px-0"
            onClick={onSignOut}
            variant="secondary"
          >
            <LogOut className="size-4" />
          </Button>
        </header>

        <section className="flex min-h-0 flex-1 flex-col gap-3">
          <div className="rounded-[1.5rem] border border-primary/10 bg-white/70 px-3 py-2 shadow-card-subtle backdrop-blur">
            <div className="flex justify-center gap-2">
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
              <TabButton
                isActive={activeTab === 'charts'}
                label="Charts"
                onClick={() => setActiveTab('charts')}
              />
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto rounded-[1.75rem] border border-primary/10 bg-white/80 p-3 shadow-card backdrop-blur">
            <div className="pt-1">
              {activeTab === 'charts' ? (
                <Charts
                  distanceFilter={effectiveChartDistanceFilter}
                  onDistanceFilterChange={setChartDistanceFilter}
                  onSelectedPerformanceChange={setSelectedChartPerformanceId}
                  onStrokeFilterChange={(value) => {
                    setChartStrokeFilter(value)
                    const availableDistances = getAvailableDistanceFiltersForStroke(value)
                    setChartDistanceFilter((current) =>
                      availableDistances.includes(current) ? current : availableDistances[0],
                    )
                  }}
                  onUnitFilterChange={setChartUnitFilter}
                  performances={performances}
                  selectedPerformanceId={selectedChartPerformanceId}
                  strokeFilter={effectiveChartStrokeFilter}
                  unitFilter={chartUnitFilter}
                />
              ) : activeTab === 'profile' ? (
                <Profile
                  form={profileForm}
                  isDirty={!isSameProfileForm(profileForm, savedProfileForm)}
                  isEditing={isEditingProfile}
                  isLoading={isLoadingProfile}
                  isSaving={isSavingProfile}
                  onCancel={() => {
                    setProfileForm(savedProfileForm)
                    setIsEditingProfile(false)
                  }}
                  onChange={setProfileForm}
                  onEdit={() => {
                    setIsEditingProfile(true)
                  }}
                  onSave={async () => {
                    try {
                      setIsSavingProfile(true)

                      const updatedProfile = await profileApi.updateMeProfile(profileForm)

                      if (updatedProfile) {
                        const nextProfileForm = mapProfileToForm(updatedProfile.profile)
                        setProfileForm(nextProfileForm)
                        setSavedProfileForm(nextProfileForm)
                      } else {
                        setSavedProfileForm(profileForm)
                      }

                      setIsEditingProfile(false)
                      toast.success('Profile saved')
                    } catch (error) {
                      console.error('PATCH /me/profile failed', error)

                      toast.error('Unable to save profile.')
                    } finally {
                      setIsSavingProfile(false)
                    }
                  }}
                />
              ) : (
                <Performances
                  isLoading={isLoadingPerformances}
                  onCreate={async (input) => {
                    try {
                      const createdPerformance = await performancesApi.createPerformance(input)
                      const nextPerformance = normalizeCreatedPerformance(createdPerformance, input)

                      setPerformances((current) => [nextPerformance, ...current])
                      toast.success('Performance created')
                    } catch (error) {
                      toast.error('Unable to create performance.')

                      throw error
                    }
                  }}
                  onUpdate={async (performanceId, input) => {
                    try {
                      const updatedPerformance = await performancesApi.updatePerformance(
                        performanceId,
                        input,
                      )
                      setPerformances((current) =>
                        current.map((performance) => {
                          if (getPerformanceId(performance) !== performanceId) {
                            return performance
                          }

                          return normalizeUpdatedPerformance(
                            updatedPerformance,
                            performance,
                            performanceId,
                            input,
                          )
                        }),
                      )
                      toast.success('Performance updated')
                    } catch (error) {
                      toast.error('Unable to update performance.')

                      throw error
                    }
                  }}
                  onDelete={async (performanceId) => {
                    try {
                      await performancesApi.deletePerformance(performanceId)
                      setPerformances((current) =>
                        current.filter(
                          (performance) => getPerformanceId(performance) !== performanceId,
                        ),
                      )
                    } catch (error) {
                      toast.error('Unable to delete performance.')

                      throw error
                    }
                  }}
                  distanceFilter={effectiveSelectedDistanceFilter}
                  onDistanceFilterChange={setSelectedDistanceFilter}
                  onStrokeFilterChange={(value) => {
                    setSelectedStrokeFilter(value)
                    const availableDistances = getAvailableDistanceFiltersForStroke(value)
                    setSelectedDistanceFilter((current) =>
                      !current || availableDistances.includes(current) ? current : '',
                    )
                  }}
                  onUnitFilterChange={setSelectedUnitFilter}
                  performances={performances}
                  strokeFilter={effectiveSelectedStrokeFilter}
                  unitFilter={selectedUnitFilter}
                />
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}

function SignInScreen({
  isBusy = false,
  message,
  onSignIn,
}: {
  isBusy?: boolean
  message?: string
  onSignIn: () => void
}) {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center px-5 py-10 sm:px-8">
      <WaveDecoration />

      <h1 className="mt-6 font-brand text-4xl tracking-brand text-primary sm:text-5xl">
        SWIM CORE
      </h1>

      <p className="mt-3 max-w-xs text-center text-base leading-7 text-muted-foreground sm:text-lg">
        Track your times, compare performances, and watch your progress.
      </p>

      <div className="mt-8 flex flex-col gap-3">
        <div className="flex items-center gap-3 rounded-xl bg-primary/5 px-4 py-2.5">
          <Timer className="size-4 shrink-0 text-primary" />
          <span className="text-sm font-medium text-primary">Log times and splits</span>
        </div>
        <div className="flex items-center gap-3 rounded-xl bg-primary/5 px-4 py-2.5">
          <BarChart3 className="size-4 shrink-0 text-primary" />
          <span className="text-sm font-medium text-primary">Track your progress</span>
        </div>
        <div className="flex items-center gap-3 rounded-xl bg-primary/5 px-4 py-2.5">
          <GitCompareArrows className="size-4 shrink-0 text-primary" />
          <span className="text-sm font-medium text-primary">Compare performances</span>
        </div>
      </div>

      {isBusy ? (
        <div className="mt-10 flex flex-col items-center gap-3">
          <Spinner className="text-primary" label="Loading authentication state" />
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>
      ) : (
        <Button className="mt-10" onClick={onSignIn} size="lg">
          <LogIn className="size-4" />
          Sign in
        </Button>
      )}
    </main>
  )
}

function WaveDecoration() {
  return (
    <svg
      aria-hidden="true"
      className="w-40 text-primary sm:w-48"
      viewBox="0 0 200 80"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="100" cy="28" r="26" fill="currentColor" opacity="0.08" />
      <path
        d="M20 50 C32 38, 48 62, 60 50 C72 38, 88 62, 100 50 C112 38, 128 62, 140 50 C152 38, 168 62, 180 50"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="3"
      />
      <path
        d="M20 62 C32 50, 48 74, 60 62 C72 50, 88 74, 100 62 C112 50, 128 74, 140 62 C152 50, 168 74, 180 62"
        fill="none"
        opacity="0.4"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
      />
    </svg>
  )
}

function ConfigErrorScreen({ missingEnv }: { missingEnv: string[] }) {
  return (
    <AuthCardLayout
      cardClassName="max-w-lg"
      description="Add the missing Vite environment variables before testing login."
      headerAlignment="left"
      title="Cognito setup incomplete"
      titleClassName="text-2xl sm:text-2xl"
    >
      <ul className="space-y-2 rounded-xl bg-primary/5 p-4 text-sm text-muted-foreground">
        {missingEnv.map((envKey) => (
          <li key={envKey} className="font-mono">
            {envKey}
          </li>
        ))}
      </ul>
    </AuthCardLayout>
  )
}

function TabButton({
  isActive,
  label,
  onClick,
}: {
  isActive: boolean
  label: string
  onClick: () => void
}) {
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

function AuthCardLayout({
  cardClassName,
  children,
  description,
  footer,
  headerAlignment = 'center',
  title,
  titleClassName,
}: {
  cardClassName?: string
  children?: ReactNode
  description?: string
  footer?: ReactNode
  headerAlignment?: 'left' | 'center'
  title: string
  titleClassName?: string
}) {
  const isCentered = headerAlignment === 'center'

  return (
    <main className="flex min-h-svh items-center justify-center px-5 py-10 sm:px-8">
      <Card
        className={cn(
          'w-full max-w-md border-primary/15 bg-white/88 shadow-card-strong backdrop-blur',
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

const emptyProfileForm: UpdateProfileInput = {
  birthDate: '',
  email: '',
  favStroke: '',
  firstName: '',
  gender: '',
  lastName: '',
  teamName: '',
}

function mapProfileToForm(profile: ProfileRecord): UpdateProfileInput {
  return {
    birthDate: asString(profile.birthDate),
    email: asString(profile.email),
    favStroke: normalizeFavStroke(profile.favStroke),
    firstName: asString(profile.firstName),
    gender: asString(profile.gender).toLowerCase(),
    lastName: asString(profile.lastName),
    teamName: asString(profile.teamName),
  }
}

function asString(value: unknown) {
  return typeof value === 'string' ? value : ''
}

function isSameProfileForm(current: UpdateProfileInput, saved: UpdateProfileInput) {
  return (
    current.birthDate === saved.birthDate &&
    current.email === saved.email &&
    current.favStroke === saved.favStroke &&
    current.firstName === saved.firstName &&
    current.gender === saved.gender &&
    current.lastName === saved.lastName &&
    current.teamName === saved.teamName
  )
}

function normalizeFavStroke(value: unknown): UpdateProfileInput['favStroke'] {
  const normalized = asString(value).toLowerCase()

  if (
    normalized === 'freestyle' ||
    normalized === 'butterfly' ||
    normalized === 'breastroke' ||
    normalized === 'backstroke' ||
    normalized === 'medley'
  ) {
    return normalized
  }

  return ''
}

function getDefaultStrokeFilter(
  favStroke: UpdateProfileInput['favStroke'],
): '' | 'back' | 'breast' | 'fly' | 'free' | 'medley' {
  if (favStroke === 'backstroke') {
    return 'back'
  }

  if (favStroke === 'breastroke') {
    return 'breast'
  }

  if (favStroke === 'butterfly') {
    return 'fly'
  }

  if (favStroke === 'medley') {
    return 'medley'
  }

  return 'free'
}

function getAvailableChartStrokeFilters(performances: Performance[]) {
  const uniqueStrokes = new Set<'back' | 'breast' | 'fly' | 'free' | 'medley'>()

  for (const performance of performances) {
    uniqueStrokes.add(getChartStrokeFilterValue(performance.stroke))
  }

  return [...uniqueStrokes]
}

function getDefaultChartStrokeFilter(
  favStroke: UpdateProfileInput['favStroke'],
  performances: Performance[],
) {
  const normalizedFavStroke = normalizeChartStrokeFilter(favStroke)

  if (normalizedFavStroke) {
    return normalizedFavStroke
  }

  const availableStrokes = getAvailableChartStrokeFilters(performances)

  if (availableStrokes.length) {
    return availableStrokes[0]
  }

  return 'free'
}

function normalizeChartStrokeFilter(
  value: UpdateProfileInput['favStroke'],
): 'back' | 'breast' | 'fly' | 'free' | 'medley' | null {
  if (value === 'freestyle') {
    return 'free'
  }

  if (value === 'butterfly') {
    return 'fly'
  }

  if (value === 'backstroke') {
    return 'back'
  }

  if (value === 'breastroke') {
    return 'breast'
  }

  if (value === 'medley') {
    return 'medley'
  }

  return null
}

function getChartStrokeFilterValue(value: unknown): 'back' | 'breast' | 'fly' | 'free' | 'medley' {
  const normalized = String(value).trim().toLowerCase()

  if (normalized === 'freestyle' || normalized === 'free') {
    return 'free'
  }

  if (normalized === 'butterfly' || normalized === 'fly') {
    return 'fly'
  }

  if (normalized === 'backstroke' || normalized === 'back') {
    return 'back'
  }

  if (normalized === 'medley') {
    return 'medley'
  }

  if (normalized === 'breaststroke' || normalized === 'breastroke' || normalized === 'breast') {
    return 'breast'
  }

  return 'free'
}

function getAvailableDistanceFiltersForStroke(
  stroke: '' | 'back' | 'breast' | 'fly' | 'free' | 'medley',
) {
  if (stroke === 'medley') {
    return ['100', '200', '400'] as Array<'25' | '50' | '100' | '200' | '400' | '800' | '1500'>
  }

  if (stroke === 'fly' || stroke === 'back' || stroke === 'breast') {
    return ['25', '50', '100', '200'] as Array<'25' | '50' | '100' | '200' | '400' | '800' | '1500'>
  }

  return ['25', '50', '100', '200', '400', '800', '1500'] as Array<
    '25' | '50' | '100' | '200' | '400' | '800' | '1500'
  >
}

function getPerformanceId(performance: Performance) {
  return performance.performanceId ?? performance.id ?? null
}

function createLocalPerformanceFromInput(input: CreatePerformanceInput): Performance {
  return {
    ...input,
    id: `temp-${Date.now()}`,
  }
}

function normalizeCreatedPerformance(
  response: CreatePerformanceResponse | void,
  input: CreatePerformanceInput | UpdatePerformanceInput,
): Performance {
  if (!response) {
    return createLocalPerformanceFromInput(input)
  }

  if ('performance' in response && isPerformanceObject(response.performance)) {
    return response.performance
  }

  if (isPerformanceObject(response)) {
    return response
  }

  return createLocalPerformanceFromInput(input)
}

function normalizeUpdatedPerformance(
  response: CreatePerformanceResponse | void,
  current: Performance,
  performanceId: string | number,
  input: CreatePerformanceInput | UpdatePerformanceInput,
): Performance {
  if (!response) {
    return {
      ...current,
      ...input,
    }
  }

  if ('performance' in response && isPerformanceObject(response.performance)) {
    return {
      ...current,
      ...response.performance,
      performanceId:
        response.performance.performanceId ?? response.performance.id ?? current.performanceId,
      id: response.performance.id ?? current.id ?? performanceId,
    }
  }

  if (isPerformanceObject(response)) {
    return {
      ...current,
      ...response,
      performanceId: response.performanceId ?? response.id ?? current.performanceId,
      id: response.id ?? current.id ?? performanceId,
    }
  }

  return {
    ...current,
    ...input,
  }
}

function isPerformanceObject(value: unknown): value is Performance {
  if (!value || typeof value !== 'object') {
    return false
  }

  return (
    'distance' in value ||
    'stroke' in value ||
    'timeMs' in value ||
    'performedAt' in value ||
    'poolLength' in value
  )
}
