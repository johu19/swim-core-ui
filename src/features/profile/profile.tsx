import { type Dispatch, type SetStateAction } from 'react'

import { type UpdateProfileInput } from '@/features/profile/profile-api'
import { Button } from '@/components/ui/button'

export function Profile(props: ProfileContentProps) {
  return <ProfileContent {...props} />
}

type ProfileContentProps = {
  error: string | null
  form: UpdateProfileInput
  isDirty: boolean
  isEditing: boolean
  isLoading: boolean
  isSaving: boolean
  onCancel: () => void
  onChange: Dispatch<SetStateAction<UpdateProfileInput>>
  onEdit: () => void
  onSave: () => void
  saveMessage: string | null
}

function ProfileContent({
  error,
  form,
  isDirty,
  isEditing,
  isLoading,
  isSaving,
  onCancel,
  onChange,
  onEdit,
  onSave,
  saveMessage,
}: ProfileContentProps) {
  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading profile...</p>
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2 flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          Review and update your profile information.
        </p>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <Button onClick={onCancel} variant="secondary">
              Cancel
            </Button>
          ) : (
            <Button onClick={onEdit} variant="secondary">
              Edit
            </Button>
          )}
        </div>
      </div>

      <ProfileField
        allowEditing={false}
        isEditing={isEditing}
        label="Email"
        type="email"
        value={form.email}
        onChange={(value) => onChange((current) => ({ ...current, email: value }))}
      />
      <ProfileField
        isEditing={isEditing}
        label="First name"
        value={form.firstName}
        onChange={(value) => onChange((current) => ({ ...current, firstName: value }))}
      />
      <ProfileField
        isEditing={isEditing}
        label="Last name"
        value={form.lastName}
        onChange={(value) => onChange((current) => ({ ...current, lastName: value }))}
      />
      <ProfileField
        isEditing={isEditing}
        label="Team name"
        value={form.teamName}
        onChange={(value) => onChange((current) => ({ ...current, teamName: value }))}
      />
      <ProfileField
        isEditing={isEditing}
        label="Birth date"
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

      <div className="sm:col-span-2">
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {saveMessage ? <p className="text-sm text-primary">{saveMessage}</p> : null}
      </div>

      {isEditing && isDirty ? (
        <div className="sm:col-span-2 flex justify-end">
          <Button onClick={onSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      ) : null}
    </div>
  )
}

type ProfileFieldProps = {
  allowEditing?: boolean
  isEditing: boolean
  label: string
  onChange: (value: string) => void
  type?: 'email' | 'text' | 'date'
  value: string
}

function ProfileField({
  allowEditing = true,
  isEditing,
  label,
  onChange,
  type = 'text',
  value,
}: ProfileFieldProps) {
  const isReadOnly = !isEditing || !allowEditing

  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <input
        className="h-11 rounded-xl border border-primary/15 bg-white px-3 text-sm text-foreground outline-none transition-colors focus:border-primary read-only:pointer-events-none read-only:bg-primary/5 read-only:text-foreground/80"
        onChange={(event) => onChange(event.target.value)}
        readOnly={isReadOnly}
        tabIndex={isReadOnly ? -1 : undefined}
        type={type}
        value={isReadOnly ? value || '-' : value}
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
    <label className="grid gap-2">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <select
        className="h-11 rounded-xl border border-primary/15 bg-white px-3 text-sm text-foreground outline-none transition-colors focus:border-primary disabled:pointer-events-none disabled:cursor-default disabled:bg-primary/5 disabled:text-foreground/80 disabled:opacity-100"
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
