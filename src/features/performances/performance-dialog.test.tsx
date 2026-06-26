import React from 'react'
import '@testing-library/jest-dom/vitest'
import { useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import {
  PerformanceDialog,
  type PerformanceDialogForm,
} from '../../features/performances/performance-dialog'

function TestDialog({ initialForm }: { initialForm: PerformanceDialogForm }) {
  const [form, setForm] = useState(initialForm)

  return (
    <PerformanceDialog
      form={form}
      isOpen
      isSaving={false}
      onChange={setForm}
      onClose={() => {}}
      onSave={() => {}}
      saveDisabled={false}
    />
  )
}

function createForm(overrides: Partial<PerformanceDialogForm> = {}): PerformanceDialogForm {
  return {
    distance: '100',
    hundredths: '',
    minutes: '',
    performedAt: '2026-06-23',
    poolLength: '25',
    poolLengthUnit: 'meters',
    seconds: '',
    splitCount: '4',
    splits: [],
    splitsEnabled: false,
    sourceType: 'competition',
    stroke: 'medley',
    ...overrides,
  }
}

describe('PerformanceDialog', () => {
  it('limits medley split count to 4', async () => {
    const user = userEvent.setup()

    render(<TestDialog initialForm={createForm()} />)

    await user.click(screen.getByRole('button', { name: 'Add splits' }))

    const splitCountSelect = screen.getByRole('combobox', { name: 'Number of splits' })
    const options = Array.from(splitCountSelect.querySelectorAll('option')).map(
      (option) => option.textContent,
    )

    expect(options).toEqual(['4'])
  })

  it('does not render split row labels', async () => {
    const user = userEvent.setup()

    render(<TestDialog initialForm={createForm()} />)

    await user.click(screen.getByRole('button', { name: 'Add splits' }))

    expect(screen.queryByText('Split 1')).not.toBeInTheDocument()
  })
})
