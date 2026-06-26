import { type Dispatch, type SetStateAction } from 'react'
import { Check, Pencil, X } from 'lucide-react'

import { Spinner } from '@/components/ui/spinner'
import { type UpdateProfileInput } from '@/features/profile/profile-api'
import { Button } from '@/components/ui/button'

export function Profile(props: ProfileContentProps) {
  return <ProfileContent {...props} />
}

type ProfileContentProps = {
  form: UpdateProfileInput
  isDirty: boolean
  isEditing: boolean
  isLoading: boolean
  isSaving: boolean
  onCancel: () => void
  onChange: Dispatch<SetStateAction<UpdateProfileInput>>
  onEdit: () => void
  onSave: () => void
}

function ProfileContent({
  form,
  isDirty,
  isEditing,
  isLoading,
  isSaving,
  onCancel,
  onChange,
  onEdit,
  onSave,
}: ProfileContentProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
        <Spinner className="text-primary" label="Loading profile" />
        <span>Loading profile...</span>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="col-span-2 flex justify-center">
        <ProfileAvatar gender={form.gender} />
      </div>

      <div className="col-span-2">
        <ProfileField
        allowEditing={false}
        isEditing={isEditing}
        label="Email"
        placeholder="email"
        type="email"
        value={form.email}
        onChange={(value) => onChange((current) => ({ ...current, email: value }))}
        />
      </div>
      <ProfileField
        isEditing={isEditing}
        label="First name"
        placeholder="first name"
        value={form.firstName}
        onChange={(value) => onChange((current) => ({ ...current, firstName: value }))}
      />
      <ProfileField
        isEditing={isEditing}
        label="Last name"
        placeholder="last name"
        value={form.lastName}
        onChange={(value) => onChange((current) => ({ ...current, lastName: value }))}
      />
      <ProfileField
        isEditing={isEditing}
        label="Birth date"
        placeholder="birth date"
        type="date"
        value={form.birthDate}
        onChange={(value) => onChange((current) => ({ ...current, birthDate: value }))}
      />
      <ProfileSelectField
        isEditing={isEditing}
        label="Gender"
        value={form.gender}
        onChange={(value) => onChange((current) => ({ ...current, gender: value }))}
        options={[
          { label: 'Male', value: 'male' },
          { label: 'Female', value: 'female' },
        ]}
        placeholder="Select gender"
      />
      <ProfileField
        isEditing={isEditing}
        label="Team name"
        placeholder="team"
        value={form.teamName}
        onChange={(value) => onChange((current) => ({ ...current, teamName: value }))}
      />
      <ProfileSelectField
        isEditing={isEditing}
        label="Favorite stroke"
        value={form.favStroke}
        onChange={(value) =>
          onChange((current) => ({
            ...current,
            favStroke: value as UpdateProfileInput['favStroke'],
          }))
        }
        options={[
          { label: 'Freestyle', value: 'freestyle' },
          { label: 'Butterfly', value: 'butterfly' },
          { label: 'Breastroke', value: 'breastroke' },
          { label: 'Backstroke', value: 'backstroke' },
          { label: 'Medley', value: 'medley' },
        ]}
        placeholder="No favorite stroke"
      />

      <div className="col-span-2 flex items-center justify-between">
        <div className="flex min-h-10 items-center">
          {isEditing && isDirty ? (
            <Button
              aria-label={isSaving ? 'Saving' : 'Save'}
              className="h-10 w-10 px-0"
              disabled={isSaving}
              onClick={onSave}
            >
              {isSaving ? <Spinner label="Saving profile" /> : <Check className="size-4" />}
            </Button>
          ) : null}
        </div>
        <div className="flex min-h-10 items-center">
          {isEditing ? (
            <Button
              aria-label="Cancel"
              className="h-10 w-10 border border-primary/10 bg-white px-0 text-foreground hover:bg-primary/5"
              onClick={onCancel}
              variant="secondary"
            >
              <X className="size-4" />
            </Button>
          ) : (
            <Button
              aria-label="Edit"
              className="h-10 w-10 px-0"
              onClick={onEdit}
              variant="secondary"
            >
              <Pencil className="size-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

function ProfileAvatar({ gender }: { gender: string }) {
  const isFemale = gender === 'female'
  const backgroundClass = isFemale
    ? 'from-rose-100 via-fuchsia-50 to-white'
    : 'from-sky-100 via-cyan-50 to-white'
  const accentClass = isFemale ? 'text-rose-400' : 'text-sky-500'
  const fillClass = isFemale ? 'fill-rose-300' : 'fill-sky-300'

  return (
    <div
      aria-label={isFemale ? 'Default female avatar' : 'Default male avatar'}
      className={`flex h-12 w-12 items-center justify-center rounded-full border border-primary/10 bg-gradient-to-b ${backgroundClass} shadow-sm`}
      role="img"
    >
      <svg
        aria-hidden="true"
        className={`h-8 w-8 ${accentClass}`}
        viewBox="0 0 64 64"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle className={fillClass} cx="32" cy="22" r="12" />
        <path
          className={fillClass}
          d={
            isFemale
              ? 'M32 36c-11.598 0-21 7.387-21 16.5V56h42v-3.5C53 43.387 43.598 36 32 36Z'
              : 'M20 56v-4.5C20 43.492 25.373 38 32 38s12 5.492 12 13.5V56H20Z'
          }
        />
        {isFemale ? (
          <path
            className={fillClass}
            d="M19 21c1.33-8.496 7.366-14 13-14 5.635 0 11.67 5.504 13 14-2.987-2.285-7.32-3.428-13-3.428-5.68 0-10.013 1.143-13 3.428Z"
          />
        ) : null}
      </svg>
    </div>
  )
}

type ProfileFieldProps = {
  allowEditing?: boolean
  isEditing: boolean
  label: string
  onChange: (value: string) => void
  placeholder?: string
  type?: 'email' | 'text' | 'date'
  value: string
}

function ProfileField({
  allowEditing = true,
  isEditing,
  label,
  onChange,
  placeholder,
  type = 'text',
  value,
}: ProfileFieldProps) {
  const isReadOnly = !isEditing || !allowEditing
  const displayValue = isReadOnly ? value : value
  const fieldPlaceholder = placeholder ?? label
  const showEmptyReadOnlyPlaceholder = isReadOnly && !value

  return (
    <label className="grid min-w-0 gap-2">
      <input
        aria-label={label}
        className="h-11 w-full min-w-0 rounded-xl border border-primary/15 bg-white px-3 text-sm text-foreground placeholder:text-sm placeholder:italic placeholder:text-muted-foreground/80 outline-none transition-colors focus:border-primary read-only:pointer-events-none read-only:bg-primary/5 read-only:text-foreground/80"
        onChange={(event) => onChange(event.target.value)}
        placeholder={showEmptyReadOnlyPlaceholder || !value ? fieldPlaceholder : undefined}
        readOnly={isReadOnly}
        tabIndex={isReadOnly ? -1 : undefined}
        type={type}
        value={displayValue}
      />
    </label>
  )
}

function ProfileSelectField({
  isEditing,
  label,
  onChange,
  options,
  placeholder,
  value,
}: {
  isEditing: boolean
  label: string
  onChange: (value: string) => void
  options: Array<{ label: string; value: string }>
  placeholder: string
  value: string
}) {
  return (
    <label className="grid min-w-0 gap-2">
      <select
        aria-label={label}
        className="h-11 w-full min-w-0 appearance-none rounded-xl border border-primary/15 bg-white px-3 text-sm text-foreground outline-none transition-colors focus:border-primary disabled:pointer-events-none disabled:cursor-default disabled:bg-primary/5 disabled:text-foreground/80 disabled:opacity-100"
        disabled={!isEditing}
        onChange={(event) => onChange(event.target.value)}
        tabIndex={!isEditing ? -1 : undefined}
        value={value}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}
