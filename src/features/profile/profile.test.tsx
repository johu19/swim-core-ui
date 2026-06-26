import React from 'react'
import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { Profile } from '../../features/profile/profile'
import type { UpdateProfileInput } from '../../features/profile/profile-api'

const baseForm: UpdateProfileInput = {
  birthDate: '2000-01-01',
  email: 'swimmer@example.com',
  favStroke: 'freestyle',
  firstName: 'Jane',
  gender: 'female',
  lastName: 'Doe',
  teamName: 'Sharks',
}

describe('Profile', () => {
  it('shows loading state', () => {
    render(
      <Profile
        form={baseForm}
        isDirty={false}
        isEditing={false}
        isLoading
        isSaving={false}
        onCancel={() => {}}
        onChange={() => {}}
        onEdit={() => {}}
        onSave={() => {}}
      />,
    )

    expect(screen.getByText('Loading profile...')).toBeInTheDocument()
  })

  it('renders save action only when editing and dirty', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()

    render(
      <Profile
        form={baseForm}
        isDirty
        isEditing
        isLoading={false}
        isSaving={false}
        onCancel={() => {}}
        onChange={() => {}}
        onEdit={() => {}}
        onSave={onSave}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(onSave).toHaveBeenCalledTimes(1)
  })
})
