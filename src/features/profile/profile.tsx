import { type Dispatch, type ReactNode, type SetStateAction } from 'react'
import { Pencil } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { type UpdateProfileInput } from '@/features/profile/profile-api'
import { cn } from '@/lib/utils'

const STROKE_LABELS: Record<UpdateProfileInput['favStroke'], string> = {
  '': '',
  freestyle: 'Freestyle',
  butterfly: 'Butterfly',
  breastroke: 'Breaststroke',
  backstroke: 'Backstroke',
  medley: 'Medley',
}

export function Profile({
  form,
  isDirty,
  isEditing,
  isLoading,
  isSaving,
  onCancel,
  onChange,
  onEdit,
  onSave,
}: {
  form: UpdateProfileInput
  isDirty: boolean
  isEditing: boolean
  isLoading: boolean
  isSaving: boolean
  onCancel: () => void
  onChange: Dispatch<SetStateAction<UpdateProfileInput>>
  onEdit: () => void
  onSave: () => void
}) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
        <Spinner className="text-primary" label="Loading profile" />
        <span>Loading profile...</span>
      </div>
    )
  }

  const fullName = [form.firstName, form.lastName].filter(Boolean).join(' ')
  const strokeLabel = STROKE_LABELS[form.favStroke]

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col items-center gap-3 text-center">
        <ProfileAvatar firstName={form.firstName} lastName={form.lastName} gender={form.gender} />

        <div className="min-w-0">
          <h2 className="truncate text-xl font-semibold text-foreground sm:text-2xl">
            {fullName || 'Your profile'}
          </h2>

          <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
            {form.teamName ? (
              <Pill className="bg-primary/8 text-primary">{form.teamName}</Pill>
            ) : null}
            {strokeLabel ? (
              <Pill className="bg-accent/15 text-accent-foreground">{strokeLabel}</Pill>
            ) : null}
          </div>
        </div>
      </header>

      {isEditing ? (
        <EditFields form={form} onChange={onChange} />
      ) : (
        <ViewFields form={form} strokeLabel={strokeLabel} />
      )}

      <div className="flex justify-end gap-2">
        {isEditing ? (
          <>
            <Button
              className="border border-primary/10 bg-white text-foreground hover:bg-primary/5"
              onClick={onCancel}
              variant="secondary"
            >
              Cancel
            </Button>
            <Button aria-label="Save" disabled={!isDirty || isSaving} onClick={onSave}>
              {isSaving ? (
                <>
                  <Spinner label="Saving profile" />
                  Saving
                </>
              ) : (
                'Save'
              )}
            </Button>
          </>
        ) : (
          <Button onClick={onEdit} variant="secondary">
            <Pencil className="size-4" />
            Edit profile
          </Button>
        )}
      </div>
    </div>
  )
}

function ViewFields({ form, strokeLabel }: { form: UpdateProfileInput; strokeLabel: string }) {
  const age = formatAge(form.birthDate)

  return (
    <dl className="divide-y divide-primary/10 overflow-hidden rounded-2xl border border-primary/10 bg-white/60">
      <ViewRow label="Email" value={form.email} />
      <ViewRow label="Birth date" value={formatBirthDate(form.birthDate)} />
      {age ? <ViewRow label="Age" value={age} /> : null}
      <ViewRow label="Gender" value={capitalize(form.gender)} />
      {form.teamName ? <ViewRow label="Team" value={form.teamName} /> : null}
      {strokeLabel ? <ViewRow label="Favorite stroke" value={strokeLabel} /> : null}
    </dl>
  )
}

function ViewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd
        className={cn(
          'min-w-0 truncate text-right text-sm font-medium',
          value ? 'text-foreground' : 'italic text-muted-foreground/70',
        )}
      >
        {value || 'Not set'}
      </dd>
    </div>
  )
}

function EditFields({
  form,
  onChange,
}: {
  form: UpdateProfileInput
  onChange: Dispatch<SetStateAction<UpdateProfileInput>>
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Field className="sm:col-span-2" label="Email">
        <input
          aria-label="Email"
          className={inputClass}
          readOnly
          tabIndex={-1}
          type="email"
          value={form.email}
        />
      </Field>
      <Field label="First name">
        <input
          aria-label="First name"
          className={inputClass}
          onChange={(event) =>
            onChange((current) => ({ ...current, firstName: event.target.value }))
          }
          placeholder="Jane"
          value={form.firstName}
        />
      </Field>
      <Field label="Last name">
        <input
          aria-label="Last name"
          className={inputClass}
          onChange={(event) =>
            onChange((current) => ({ ...current, lastName: event.target.value }))
          }
          placeholder="Doe"
          value={form.lastName}
        />
      </Field>
      <Field label="Birth date">
        <input
          aria-label="Birth date"
          className={inputClass}
          onChange={(event) =>
            onChange((current) => ({ ...current, birthDate: event.target.value }))
          }
          type="date"
          value={form.birthDate}
        />
      </Field>
      <Field label="Gender">
        <input
          aria-label="Gender"
          className={inputClass}
          readOnly
          tabIndex={-1}
          value={capitalize(form.gender)}
        />
      </Field>
      <Field label="Team name">
        <input
          aria-label="Team name"
          className={inputClass}
          onChange={(event) =>
            onChange((current) => ({ ...current, teamName: event.target.value }))
          }
          placeholder="Sharks"
          value={form.teamName}
        />
      </Field>
      <Field label="Favorite stroke">
        <select
          aria-label="Favorite stroke"
          className={selectClass}
          onChange={(event) =>
            onChange((current) => ({
              ...current,
              favStroke: event.target.value as UpdateProfileInput['favStroke'],
            }))
          }
          value={form.favStroke}
        >
          <option value="">No favorite stroke</option>
          <option value="freestyle">Freestyle</option>
          <option value="butterfly">Butterfly</option>
          <option value="breastroke">Breaststroke</option>
          <option value="backstroke">Backstroke</option>
          <option value="medley">Medley</option>
        </select>
      </Field>
    </div>
  )
}

const inputClass =
  'h-11 w-full min-w-0 appearance-none rounded-xl border border-primary/15 bg-white px-3 text-sm text-foreground placeholder:text-sm placeholder:italic placeholder:text-muted-foreground/80 outline-none transition-colors focus:border-primary read-only:pointer-events-none read-only:bg-primary/5 read-only:text-foreground/80'

// A <select> always matches the CSS :read-only pseudo-class (it can't take a
// `readonly` attribute), so it must NOT reuse `inputClass` — the read-only:*
// modifiers there would grey it out and set pointer-events:none unconditionally.
const selectClass =
  'h-11 w-full min-w-0 appearance-none rounded-xl border border-primary/15 bg-white px-3 text-sm text-foreground outline-none transition-colors focus:border-primary'

function Field({
  children,
  className,
  label,
}: {
  children: ReactNode
  className?: string
  label: string
}) {
  return (
    <label className={cn('grid min-w-0 gap-1.5', className)}>
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  )
}

function Pill({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-3 py-1 text-xs font-medium',
        className,
      )}
    >
      {children}
    </span>
  )
}

function ProfileAvatar({
  firstName,
  gender,
  lastName,
}: {
  firstName: string
  gender: string
  lastName: string
}) {
  const initials = [firstName, lastName]
    .filter(Boolean)
    .map((part) => part.trim().charAt(0).toUpperCase())
    .join('')
    .slice(0, 2)

  if (initials) {
    return (
      <div
        aria-label="Profile avatar"
        className="flex size-20 items-center justify-center rounded-full bg-gradient-to-br from-[#2456F5] to-[#0D2F8D] text-2xl font-semibold text-white shadow-card-subtle"
        role="img"
      >
        {initials}
      </div>
    )
  }

  const isFemale = gender === 'female'

  return (
    <div
      aria-label={isFemale ? 'Default female avatar' : 'Default male avatar'}
      className="flex size-20 items-center justify-center rounded-full border border-primary/10 bg-gradient-to-b from-sky-100 via-cyan-50 to-white shadow-card-subtle"
      role="img"
    >
      <svg
        aria-hidden="true"
        className="h-12 w-12 text-sky-500"
        viewBox="0 0 64 64"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle className="fill-sky-300" cx="32" cy="22" r="12" />
        <path
          className="fill-sky-300"
          d={
            isFemale
              ? 'M32 36c-11.598 0-21 7.387-21 16.5V56h42v-3.5C53 43.387 43.598 36 32 36Z'
              : 'M20 56v-4.5C20 43.492 25.373 38 32 38s12 5.492 12 13.5V56H20Z'
          }
        />
        {isFemale ? (
          <path
            className="fill-sky-300"
            d="M19 21c1.33-8.496 7.366-14 13-14 5.635 0 11.67 5.504 13 14-2.987-2.285-7.32-3.428-13-3.428-5.68 0-10.013 1.143-13 3.428Z"
          />
        ) : null}
      </svg>
    </div>
  )
}

function capitalize(value: string) {
  if (!value) {
    return ''
  }

  return value.charAt(0).toUpperCase() + value.slice(1)
}

function formatBirthDate(value: string) {
  if (!value) {
    return ''
  }

  const date = new Date(`${value}T00:00:00`)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function formatAge(value: string) {
  if (!value) {
    return ''
  }

  const birth = new Date(`${value}T00:00:00`)

  if (Number.isNaN(birth.getTime())) {
    return ''
  }

  const now = new Date()
  let age = now.getFullYear() - birth.getFullYear()
  const hasHadBirthdayThisYear =
    now.getMonth() > birth.getMonth() ||
    (now.getMonth() === birth.getMonth() && now.getDate() >= birth.getDate())

  if (!hasHadBirthdayThisYear) {
    age -= 1
  }

  if (age < 0) {
    return ''
  }

  return `${age} years old`
}
