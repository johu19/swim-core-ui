import React from 'react'
import '@testing-library/jest-dom/vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { Performances } from '../../features/performances/performances'
import type { Performance } from '../../features/performances/performances-api'

const performances: Performance[] = [
  {
    distance: 50,
    performanceId: 'one',
    performedAt: '2026-06-10',
    poolLength: 50,
    poolLengthUnit: 'meters',
    sourceType: 'competition',
    stroke: 'freestyle',
    timeMs: 33870,
  },
  {
    distance: 100,
    performanceId: 'two',
    performedAt: '2026-06-11',
    poolLength: 50,
    poolLengthUnit: 'meters',
    sourceType: 'competition',
    stroke: 'backstroke',
    timeMs: 71240,
  },
]

describe('Performances', () => {
  it('filters rows by distance', async () => {
    const user = userEvent.setup()

    render(
      <Performances
        distanceFilter="50"
        isLoading={false}
        onDistanceFilterChange={() => {}}
        onStrokeFilterChange={() => {}}
        onUnitFilterChange={() => {}}
        performances={performances}
        strokeFilter=""
        unitFilter="meters"
      />,
    )

    expect(screen.getByText('50M Free')).toBeInTheDocument()
    expect(screen.queryByText('100M Back')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Add performance' }))
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument()
  })

  it('shows mandatory unit filter without a clear button', () => {
    render(
      <Performances
        distanceFilter=""
        isLoading={false}
        onDistanceFilterChange={() => {}}
        onStrokeFilterChange={() => {}}
        onUnitFilterChange={() => {}}
        performances={performances}
        strokeFilter=""
        unitFilter="meters"
      />,
    )

    const unitFilter = screen.getByRole('combobox', { name: 'Filter performances by unit' })
    const filterContainer = unitFilter.parentElement

    expect(filterContainer).not.toBeNull()
    expect(
      within(filterContainer as HTMLElement).queryByRole('button', { name: /clear/i }),
    ).not.toBeInTheDocument()
  })

  it('keeps save disabled until a time is explicitly entered', async () => {
    const user = userEvent.setup()

    render(
      <Performances
        distanceFilter=""
        isLoading={false}
        onDistanceFilterChange={() => {}}
        onStrokeFilterChange={() => {}}
        onUnitFilterChange={() => {}}
        performances={performances}
        strokeFilter=""
        unitFilter="meters"
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Add performance' }))

    const saveButton = screen.getByRole('button', { name: 'Save' })
    const timeInputs = screen.getAllByPlaceholderText('00')

    expect(saveButton).toBeDisabled()

    await user.type(timeInputs[1] as HTMLInputElement, '33')

    expect(saveButton).toBeEnabled()
  })
})
