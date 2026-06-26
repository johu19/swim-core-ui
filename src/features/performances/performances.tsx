import { ChevronLeft, ChevronRight, Pencil, Trash2, X } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Spinner } from '@/components/ui/spinner'
import type {
  CreatePerformanceInput,
  Performance,
  UpdatePerformanceInput,
} from '@/features/performances/performances-api'
import {
  PerformanceDialog,
  type PerformanceDialogForm,
} from '@/features/performances/performance-dialog'

type PerformancesProps = {
  distanceFilter: DistanceFilter
  isLoading: boolean
  onCreate?: (input: CreatePerformanceInput) => Promise<void>
  onDistanceFilterChange: (value: DistanceFilter) => void
  onDelete?: (performanceId: string | number) => Promise<void>
  onStrokeFilterChange: (value: StrokeFilter) => void
  onUpdate?: (performanceId: string | number, input: UpdatePerformanceInput) => Promise<void>
  onUnitFilterChange: (value: UnitFilter) => void
  performances: Performance[]
  strokeFilter: StrokeFilter
  unitFilter: UnitFilter
}

type SortKey = 'date' | 'event' | 'time'
type SortDirection = 'asc' | 'desc'
type DistanceFilter = '' | '25' | '50' | '100' | '200' | '400' | '800' | '1500'
type StrokeFilter = '' | 'back' | 'breast' | 'fly' | 'free' | 'medley'
type UnitFilter = 'meters' | 'yards'
const PERFORMANCES_PER_PAGE = 10

export function Performances({
  distanceFilter,
  isLoading,
  onCreate,
  onDistanceFilterChange,
  onDelete,
  onStrokeFilterChange,
  onUpdate,
  onUnitFilterChange,
  performances,
  strokeFilter,
  unitFilter,
}: PerformancesProps) {
  const [sortKey, setSortKey] = useState<SortKey>('date')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({})
  const [deletingRowId, setDeletingRowId] = useState<string | number | null>(null)

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [createPerformedAt, setCreatePerformedAt] = useState(getTodayDateValue())
  const [createForm, setCreateForm] = useState<PerformanceDialogForm>(
    createDefaultPerformanceForm(),
  )

  const [editingPerformanceId, setEditingPerformanceId] = useState<string | number | null>(null)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [editForm, setEditForm] = useState<PerformanceDialogForm>(createDefaultPerformanceForm())
  const availableDistanceFilters = getAvailableDistanceFilters(strokeFilter)

  const filteredPerformances = performances.filter((performance) => {
    if (strokeFilter && getStrokeFilterValue(performance.stroke) !== strokeFilter) {
      return false
    }

    if (distanceFilter && String(asNumber(performance.distance) ?? '') !== distanceFilter) {
      return false
    }

    if (normalizeUnit(performance.poolLengthUnit) !== unitFilter) {
      return false
    }

    return true
  })

  const sortedPerformances = [...filteredPerformances].sort((left, right) => {
    const leftValue = getSortValue(left, sortKey)
    const rightValue = getSortValue(right, sortKey)
    const direction = sortDirection === 'asc' ? 1 : -1

    if (leftValue < rightValue) {
      return -1 * direction
    }

    if (leftValue > rightValue) {
      return 1 * direction
    }

    return 0
  })

  const totalPages = Math.max(1, Math.ceil(sortedPerformances.length / PERFORMANCES_PER_PAGE))
  const paginatedPerformances = sortedPerformances.slice(
    (currentPage - 1) * PERFORMANCES_PER_PAGE,
    currentPage * PERFORMANCES_PER_PAGE,
  )

  useEffect(() => {
    setCurrentPage(1)
  }, [distanceFilter, sortDirection, sortKey, strokeFilter, unitFilter])

  useEffect(() => {
    setCurrentPage((current) => Math.min(current, totalPages))
  }, [totalPages])

  const toggleSort = (nextSortKey: SortKey) => {
    if (sortKey === nextSortKey) {
      setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'))
      return
    }

    setSortKey(nextSortKey)
    setSortDirection(nextSortKey === 'date' ? 'desc' : 'asc')
  }

  const toggleExpanded = (rowKey: string) => {
    setExpandedRows((current) => ({
      ...current,
      [rowKey]: !current[rowKey],
    }))
  }

  const openCreateDialog = () => {
    setCreateForm(createDefaultPerformanceForm(createPerformedAt))
    setIsCreateOpen(true)
  }

  const closeCreateDialog = () => {
    if (isCreating) {
      return
    }

    setCreatePerformedAt(createForm.performedAt)
    setIsCreateOpen(false)
  }

  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <CompactFilter
            ariaLabel="Filter performances by stroke"
            label={getStrokeFilterLabel(strokeFilter)}
            onChange={(value) => onStrokeFilterChange(value as StrokeFilter)}
            onClear={() => onStrokeFilterChange('')}
            value={strokeFilter}
          >
            <option value="">Stroke</option>
            <option value="free">Free</option>
            <option value="fly">Fly</option>
            <option value="back">Back</option>
            <option value="breast">Breast</option>
            <option value="medley">Medley</option>
          </CompactFilter>
          <CompactFilter
            ariaLabel="Filter performances by distance"
            label={getDistanceFilterLabel(distanceFilter)}
            onChange={(value) => onDistanceFilterChange(value as DistanceFilter)}
            onClear={() => onDistanceFilterChange('')}
            value={distanceFilter}
          >
            <option value="">Distance</option>
            {availableDistanceFilters.map((distance) => (
              <option key={distance} value={distance}>
                {distance}
              </option>
            ))}
          </CompactFilter>
          <CompactFilter
            ariaLabel="Filter performances by unit"
            label={getUnitFilterLabel(unitFilter)}
            onChange={(value) => onUnitFilterChange(value as UnitFilter)}
            value={unitFilter}
          >
            <option value="meters">M</option>
            <option value="yards">Y</option>
          </CompactFilter>
        </div>
        <button
          type="button"
          aria-label="Add performance"
          className="flex size-11 shrink-0 items-center justify-center rounded-full border border-primary/15 bg-white text-2xl leading-none text-primary shadow-sm transition-colors hover:bg-primary/5"
          onClick={openCreateDialog}
        >
          +
        </button>
      </div>

      <PerformanceDialog
        form={createForm}
        isOpen={isCreateOpen}
        isSaving={isCreating}
        onChange={setCreateForm}
        onClose={closeCreateDialog}
        onSave={async () => {
          if (typeof onCreate !== 'function') {
            return
          }

          try {
            setIsCreating(true)
            await onCreate(buildPerformanceInput(createForm))
            setCreatePerformedAt(createForm.performedAt)
            setIsCreateOpen(false)
            setCreateForm(createDefaultPerformanceForm(createForm.performedAt))
          } finally {
            setIsCreating(false)
          }
        }}
        saveDisabled={!isPerformanceDialogComplete(createForm)}
      />

      <PerformanceDialog
        form={editForm}
        isOpen={isEditOpen}
        isSaving={isUpdating}
        onChange={setEditForm}
        onClose={() => {
          if (isUpdating) {
            return
          }

          setIsEditOpen(false)
          setEditingPerformanceId(null)
        }}
        onSave={async () => {
          if (editingPerformanceId === null || typeof onUpdate !== 'function') {
            return
          }

          try {
            setIsUpdating(true)
            await onUpdate(editingPerformanceId, buildPerformanceInput(editForm))
            setIsEditOpen(false)
            setEditingPerformanceId(null)
          } finally {
            setIsUpdating(false)
          }
        }}
        saveDisabled={!isPerformanceDialogComplete(editForm)}
      />

      <div className="overflow-hidden rounded-2xl border border-primary/10 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-left text-xs">
            <thead className="bg-primary/5 text-foreground">
              <tr>
                <SortableHeader
                  activeSortKey={sortKey}
                  direction={sortDirection}
                  label="Event"
                  onClick={() => toggleSort('event')}
                  sortKey="event"
                />
                <SortableHeader
                  activeSortKey={sortKey}
                  direction={sortDirection}
                  label="Time"
                  onClick={() => toggleSort('time')}
                  sortKey="time"
                />
                <SortableHeader
                  activeSortKey={sortKey}
                  direction={sortDirection}
                  label="Date"
                  onClick={() => toggleSort('date')}
                  sortKey="date"
                />
              </tr>
            </thead>
            <tbody>
              {paginatedPerformances.map((performance, index) => {
                const pageIndex = (currentPage - 1) * PERFORMANCES_PER_PAGE + index
                const rowKey = getPerformanceKey(performance, pageIndex)

                return (
                  <PerformanceRow
                    key={rowKey}
                    deletingRowId={deletingRowId}
                    isExpanded={expandedRows[rowKey] ?? false}
                    onDelete={onDelete}
                    onEdit={() => {
                      const performanceId = getPerformanceId(performance)

                      if (performanceId === null) {
                        return
                      }

                      setEditingPerformanceId(performanceId)
                      setEditForm(mapPerformanceToDialogForm(performance))
                      setIsEditOpen(true)
                    }}
                    onToggleExpanded={() => toggleExpanded(rowKey)}
                    performance={performance}
                    rowKey={rowKey}
                    setDeletingRowId={setDeletingRowId}
                  />
                )
              })}
            </tbody>
          </table>
        </div>

        {isLoading ? (
          <div className="flex items-center gap-2 border-t border-primary/10 px-3 py-3 text-sm text-muted-foreground sm:px-4 sm:py-4">
            <Spinner className="text-primary" label="Loading performances" />
            <span>Loading performances...</span>
          </div>
        ) : null}
        {!isLoading && !filteredPerformances.length ? (
          <div className="border-t border-primary/10 px-3 py-3 text-sm text-muted-foreground sm:px-4 sm:py-4">
            {performances.length
              ? 'No performances match the selected filters.'
              : 'No performances available.'}
          </div>
        ) : null}
        {!isLoading && filteredPerformances.length ? (
          <div className="flex items-center justify-between border-t border-primary/10 px-3 py-2.5 text-sm text-muted-foreground sm:px-4 sm:py-3">
            <span>{`${currentPage} of ${totalPages}`}</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Previous page"
                className="rounded-full border border-primary/10 bg-white px-3 py-1 text-foreground transition-colors hover:bg-primary/5 disabled:opacity-50"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((current) => Math.max(1, current - 1))}
              >
                <ChevronLeft className="size-4" />
              </button>
              <button
                type="button"
                aria-label="Next page"
                className="rounded-full border border-primary/10 bg-white px-3 py-1 text-foreground transition-colors hover:bg-primary/5 disabled:opacity-50"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((current) => Math.min(totalPages, current + 1))}
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}

function CompactFilter({
  ariaLabel,
  children,
  label,
  onChange,
  onClear,
  value,
}: {
  ariaLabel: string
  children: React.ReactNode
  label: string
  onChange: (value: string) => void
  onClear?: () => void
  value: string
}) {
  return (
    <div className="flex w-fit items-center rounded-full border border-primary/10 bg-white px-3 py-2">
      <select
        aria-label={ariaLabel}
        className="w-auto appearance-none bg-transparent text-center text-sm text-foreground outline-none"
        onChange={(event) => onChange(event.target.value)}
        value={value}
        style={{ width: `${label.length + 1}ch` }}
      >
        {children}
      </select>
      {value && onClear ? (
        <button
          type="button"
          aria-label={`Clear ${ariaLabel.toLowerCase()}`}
          className="ml-1 text-muted-foreground transition-colors hover:text-primary"
          onClick={onClear}
        >
          <X className="size-4" />
        </button>
      ) : null}
    </div>
  )
}

function PerformanceRow({
  deletingRowId,
  isExpanded,
  onDelete,
  onEdit,
  onToggleExpanded,
  performance,
  rowKey,
  setDeletingRowId,
}: {
  deletingRowId: string | number | null
  isExpanded: boolean
  onDelete?: (performanceId: string | number) => Promise<void>
  onEdit: () => void
  onToggleExpanded: () => void
  performance: Performance
  rowKey: string
  setDeletingRowId: (value: string | number | null) => void
}) {
  const performanceId = getPerformanceId(performance)
  const isDeleting = deletingRowId === performanceId
  const splits = hasSplits(performance.splits) ? performance.splits : []

  return (
    <>
      <tr
        className="border-t border-primary/10"
        onClick={onToggleExpanded}
        role="button"
        tabIndex={0}
      >
        <td className="px-3 py-3 sm:px-4">
          <span className="inline-flex items-center gap-2 font-medium text-primary">
            <span className="text-xs text-muted-foreground">{isExpanded ? '−' : '+'}</span>
            <span>
              {formatEventLabel(
                performance.distance,
                performance.poolLengthUnit,
                performance.stroke,
              )}
            </span>
          </span>
        </td>
        <td className="px-3 py-3 sm:px-4">{formatTime(performance.timeMs)}</td>
        <td className="px-3 py-3 sm:px-4">{formatPerformedAt(performance.performedAt)}</td>
      </tr>
      {isExpanded ? (
        <tr key={`${rowKey}-details`} className="border-t border-primary/5 bg-primary/5">
          <td colSpan={3} className="px-3 py-3 sm:px-4 sm:py-4">
            <div className="grid gap-4">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/10 bg-white px-3 py-3 sm:px-4">
                <div className="text-sm font-medium text-foreground">
                  {formatPoolEventSummary(
                    performance.poolLength,
                    performance.poolLengthUnit,
                    performance.sourceType,
                  )}
                </div>
                <div className="flex items-center justify-center gap-4">
                  <button
                    type="button"
                    aria-label="Edit performance"
                    className="rounded-full p-2 text-primary transition-colors hover:bg-primary/5"
                    onClick={onEdit}
                  >
                    <Pencil className="size-4" />
                  </button>
                  <button
                    type="button"
                    aria-label="Delete performance"
                    className="rounded-full p-2 text-red-600 transition-colors hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
                    disabled={performanceId === null || isDeleting || !onDelete}
                    onClick={() =>
                      void handleDeletePerformance({
                        onDelete,
                        performanceId,
                        setDeletingRowId,
                      })
                    }
                  >
                    {isDeleting ? (
                      <Spinner label="Deleting performance" />
                    ) : (
                      <Trash2 className="size-4" />
                    )}
                  </button>
                </div>
              </div>
              {splits.length ? (
                <div className="rounded-xl border border-primary/10 bg-white px-3 py-3 sm:px-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.14em] text-primary/55">
                    Splits
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {splits.map((split, index) => {
                      const splitTone = getSplitTone(split, splits)

                      return (
                        <div
                          key={`${rowKey}-split-${index}`}
                          className={getSplitBadgeClassName(splitTone)}
                        >
                          {formatTime(split)}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ) : null}
            </div>
          </td>
        </tr>
      ) : null}
    </>
  )
}

function SortableHeader({
  activeSortKey,
  className,
  direction,
  label,
  onClick,
  sortKey,
}: {
  activeSortKey: SortKey
  className?: string
  direction: SortDirection
  label: string
  onClick: () => void
  sortKey: SortKey
}) {
  const isActive = activeSortKey === sortKey
  const indicator = isActive ? (direction === 'asc' ? '↑' : '↓') : ''

  return (
    <th className={`px-3 py-3 font-medium sm:px-4 ${className ?? ''}`}>
      <button type="button" onClick={onClick} className="inline-flex items-center gap-1 text-left">
        <span>{label}</span>
        <span className="text-xs text-muted-foreground">{indicator}</span>
      </button>
    </th>
  )
}

function createDefaultPerformanceForm(performedAt = getTodayDateValue()): PerformanceDialogForm {
  return {
    distance: '25',
    hundredths: '',
    minutes: '',
    performedAt,
    poolLength: '25',
    poolLengthUnit: 'meters',
    seconds: '',
    splitCount: '',
    splits: [],
    splitsEnabled: false,
    sourceType: 'competition',
    stroke: 'freestyle',
  }
}

function isPerformanceDialogComplete(form: PerformanceDialogForm) {
  return Boolean(
    form.performedAt.trim() &&
    form.stroke.trim() &&
    form.distance.trim() &&
    form.poolLength.trim() &&
    form.poolLengthUnit.trim() &&
    form.sourceType.trim() &&
    hasExplicitTimeParts(form) &&
    hasCompleteSplitTimes(form),
  )
}

function hasExplicitTimeParts(form: { hundredths: string; minutes: string; seconds: string }) {
  return Boolean(form.minutes.trim() || form.seconds.trim() || form.hundredths.trim())
}

function hasCompleteSplitTimes(form: PerformanceDialogForm) {
  if (!form.splitsEnabled) {
    return true
  }

  if (!form.splits.length) {
    return false
  }

  return form.splits.every((split) => hasExplicitTimeParts(split))
}

function getPerformanceKey(performance: Performance, index: number) {
  const performanceId = getPerformanceId(performance)

  if (performanceId !== null) {
    return String(performanceId)
  }

  const performedAt = formatText(performance.performedAt)
  const stroke = formatText(performance.stroke)
  const distance = formatText(performance.distance)

  return `${performedAt}-${stroke}-${distance}-${index}`
}

function getPerformanceId(performance: Performance) {
  return performance.performanceId ?? performance.id ?? null
}

function formatPerformedAt(value: string | null | undefined) {
  if (!value) {
    return '-'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  const day = String(date.getUTCDate()).padStart(2, '0')
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const year = date.getUTCFullYear()

  return `${day}-${month}-${year}`
}

function formatDistance(
  distance: number | string | null | undefined,
  poolLengthUnit: string | null | undefined,
) {
  const distanceValue = formatText(distance)
  const unit = normalizeUnit(poolLengthUnit)

  if (distanceValue === '-') {
    return '-'
  }

  if (unit === 'meters') {
    return `${distanceValue}M`
  }

  if (unit === 'yards') {
    return `${distanceValue}Y`
  }

  return distanceValue
}

function formatEventLabel(
  distance: number | string | null | undefined,
  poolLengthUnit: string | null | undefined,
  stroke: unknown,
) {
  const distanceLabel = formatDistance(distance, poolLengthUnit)
  const strokeLabel = formatStroke(stroke)

  if (distanceLabel === '-' && strokeLabel === '-') {
    return '-'
  }

  if (distanceLabel === '-') {
    return strokeLabel
  }

  if (strokeLabel === '-') {
    return distanceLabel
  }

  return `${distanceLabel} ${strokeLabel}`
}

function formatTime(value: number | string | null | undefined) {
  const millis = asNumber(value)

  if (millis === null) {
    return '-'
  }

  const totalSeconds = Math.floor(millis / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  const hundredths = Math.floor((millis % 1000) / 10)

  return `${minutes}:${String(seconds).padStart(2, '0')}.${String(hundredths).padStart(2, '0')}`
}

function formatPoolLength(
  poolLength: number | string | null | undefined,
  poolLengthUnit: string | null | undefined,
) {
  const length = asNumber(poolLength)
  const unit = normalizeUnit(poolLengthUnit)

  if (length === null) {
    return '-'
  }

  if (length === 50 && unit === 'meters') {
    return 'LCM'
  }

  if (length === 25 && unit === 'meters') {
    return 'SCM'
  }

  if (length === 50 && unit === 'yards') {
    return 'LCY'
  }

  if (length === 25 && unit === 'yards') {
    return 'SCY'
  }

  return unit ? `${length} ${unit}` : String(length)
}

function normalizeUnit(value: string | null | undefined) {
  if (!value) {
    return ''
  }

  const normalized = value.trim().toLowerCase()

  if (normalized === 'meter' || normalized === 'meters' || normalized === 'm') {
    return 'meters'
  }

  if (normalized === 'yard' || normalized === 'yards' || normalized === 'y') {
    return 'yards'
  }

  return normalized
}

function asNumber(value: number | string | null | undefined) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string') {
    const parsed = Number(value)

    if (Number.isFinite(parsed)) {
      return parsed
    }
  }

  return null
}

function formatText(value: unknown) {
  if (typeof value === 'string') {
    return value || '-'
  }

  if (typeof value === 'number') {
    return String(value)
  }

  return '-'
}

function formatStroke(value: unknown) {
  const stroke = formatText(value)

  if (stroke === '-') {
    return stroke
  }

  const normalized = stroke.trim().toLowerCase()

  if (normalized === 'freestyle') {
    return 'Free'
  }

  if (normalized === 'backstroke') {
    return 'Back'
  }

  if (normalized === 'breastroke' || normalized === 'breaststroke') {
    return 'Breast'
  }

  if (normalized === 'butterfly') {
    return 'Fly'
  }

  if (normalized === 'medley') {
    return 'Medley'
  }

  return stroke
}

function getStrokeFilterValue(value: unknown): StrokeFilter {
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

  return ''
}

function getStrokeFilterLabel(value: StrokeFilter) {
  if (value === 'free') {
    return 'Free'
  }

  if (value === 'fly') {
    return 'Fly'
  }

  if (value === 'back') {
    return 'Back'
  }

  if (value === 'breast') {
    return 'Breast'
  }

  if (value === 'medley') {
    return 'Medley'
  }

  return 'Stroke'
}

function getDistanceFilterLabel(value: DistanceFilter) {
  return value || 'Distance'
}

function getUnitFilterLabel(value: UnitFilter) {
  return value === 'yards' ? 'Y' : 'M'
}

function getAvailableDistanceFilters(stroke: StrokeFilter) {
  if (stroke === 'medley') {
    return ['100', '200', '400'] as Exclude<DistanceFilter, ''>[]
  }

  if (stroke === 'fly' || stroke === 'back' || stroke === 'breast') {
    return ['25', '50', '100', '200'] as Exclude<DistanceFilter, ''>[]
  }

  return ['25', '50', '100', '200', '400', '800', '1500'] as Exclude<DistanceFilter, ''>[]
}

function formatEvent(value: unknown) {
  const sourceType = formatText(value)

  if (sourceType === '-') {
    return sourceType
  }

  const normalized = sourceType.trim().toLowerCase()

  if (normalized === 'competition') {
    return 'Competition'
  }

  return `${normalized.charAt(0).toUpperCase()}${normalized.slice(1)}`
}

function formatPoolEventSummary(
  poolLength: number | string | null | undefined,
  poolLengthUnit: string | null | undefined,
  sourceType: unknown,
) {
  const pool = formatPoolLength(poolLength, poolLengthUnit)
  const event = formatEvent(sourceType)

  if (pool === '-' && event === '-') {
    return '-'
  }

  if (pool === '-') {
    return event
  }

  if (event === '-') {
    return pool
  }

  return `${pool} - ${event}`
}

function getSortValue(performance: Performance, sortKey: SortKey) {
  if (sortKey === 'date') {
    return getDateSortValue(performance.performedAt)
  }

  if (sortKey === 'time') {
    return asNumber(performance.timeMs) ?? -1
  }

  return formatEventLabel(performance.distance, performance.poolLengthUnit, performance.stroke)
}

function getDateSortValue(value: string | null | undefined) {
  if (!value) {
    return ''
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toISOString()
}

function buildPerformanceInput(form: PerformanceDialogForm): CreatePerformanceInput {
  const distance = parseRequiredNumber(form.distance, 'Distance')
  const poolLength = parseRequiredNumber(form.poolLength, 'Pool length')

  if (!hasExplicitTimeParts(form)) {
    throw new Error('Time is required.')
  }

  const timeMs = parseTimePartsToMilliseconds({
    hundredths: form.hundredths,
    minutes: form.minutes,
    seconds: form.seconds,
  })

  if (!form.performedAt) {
    throw new Error('Performed at is required.')
  }

  const splits = parseSplits(form, distance, poolLength, timeMs)

  return {
    distance,
    performedAt: form.performedAt,
    poolLength,
    poolLengthUnit: form.poolLengthUnit,
    ...(splits ? { splits } : {}),
    sourceType: form.sourceType,
    stroke: form.stroke,
    timeMs,
  }
}

function parseRequiredNumber(value: string, label: string) {
  const parsed = Number(value)

  if (!Number.isFinite(parsed)) {
    throw new Error(`${label} is required.`)
  }

  return parsed
}

function parseTimePartsToMilliseconds(form: {
  hundredths: string
  minutes: string
  seconds: string
}) {
  const minutes = parseTimePart(form.minutes, 'Minutes')
  const seconds = parseTimePart(form.seconds, 'Seconds')
  const hundredths = parseHundredthsPart(form.hundredths, 'Hundredths')

  if (seconds > 59) {
    throw new Error('Seconds must be between 0 and 59.')
  }

  if (hundredths > 99) {
    throw new Error('Hundredths must be between 0 and 99.')
  }

  return minutes * 60 * 1000 + seconds * 1000 + hundredths * 10
}

function parseSplits(
  form: PerformanceDialogForm,
  distance: number,
  poolLength: number,
  timeMs: number,
) {
  if (!form.splitsEnabled) {
    return undefined
  }

  const expectedSplitCount = Number(form.splitCount)

  if (!Number.isFinite(expectedSplitCount) || expectedSplitCount < 2) {
    throw new Error('Splits require a valid split count.')
  }

  if (form.splits.length !== expectedSplitCount) {
    throw new Error(
      `Splits must contain exactly ${expectedSplitCount} entries for distance ${distance} and pool length ${poolLength}.`,
    )
  }

  const splits = form.splits.map((split, index) => parseSplitToMilliseconds(split, index + 1))
  const totalSplitTime = splits.reduce((sum, split) => sum + split, 0)

  if (totalSplitTime !== timeMs) {
    throw new Error(`Splits must sum exactly to ${formatTime(timeMs)}.`)
  }

  return splits
}

function parseSplitToMilliseconds(
  split: { hundredths: string; minutes: string; seconds: string },
  index: number,
) {
  if (!hasExplicitTimeParts(split)) {
    throw new Error(`Split ${index} time is required.`)
  }

  const minutes = parseTimePart(split.minutes, `Split ${index} minutes`)
  const seconds = parseTimePart(split.seconds, `Split ${index} seconds`)
  const hundredths = parseHundredthsPart(split.hundredths, `Split ${index} hundredths`)

  if (seconds > 59) {
    throw new Error(`Split ${index} seconds must be between 0 and 59.`)
  }

  if (hundredths > 99) {
    throw new Error(`Split ${index} hundredths must be between 0 and 99.`)
  }

  return minutes * 60 * 1000 + seconds * 1000 + hundredths * 10
}

function parseTimePart(value: string, label: string) {
  const trimmed = value.trim()

  if (!trimmed) {
    return 0
  }

  const parsed = Number(trimmed)

  if (!Number.isFinite(parsed)) {
    throw new Error(`${label} must be a valid number.`)
  }

  return parsed
}

function parseHundredthsPart(value: string, label: string) {
  const parsed = parseTimePart(value, label)

  if (value.trim().length === 1) {
    return parsed * 10
  }

  return parsed
}

async function handleDeletePerformance({
  onDelete,
  performanceId,
  setDeletingRowId,
}: {
  onDelete?: (performanceId: string | number) => Promise<void>
  performanceId: string | number | null
  setDeletingRowId: (value: string | number | null) => void
}) {
  if (performanceId === null) {
    return
  }

  if (typeof onDelete !== 'function') {
    return
  }

  try {
    setDeletingRowId(performanceId)
    await onDelete(performanceId)
  } finally {
    setDeletingRowId(null)
  }
}

function getTodayDateValue() {
  return new Date().toISOString().slice(0, 10)
}

function mapPerformanceToDialogForm(performance: Performance): PerformanceDialogForm {
  const totalMilliseconds = asNumber(performance.timeMs) ?? 0
  const minutes = Math.floor(totalMilliseconds / 60000)
  const seconds = Math.floor((totalMilliseconds % 60000) / 1000)
  const hundredths = Math.floor((totalMilliseconds % 1000) / 10)
  const splits = normalizeSplits(performance.splits)

  return {
    distance: asString(performance.distance),
    hundredths: String(hundredths).padStart(2, '0'),
    minutes: String(minutes),
    performedAt: asString(performance.performedAt),
    poolLength: asString(performance.poolLength),
    poolLengthUnit: normalizePoolLengthUnit(performance.poolLengthUnit),
    seconds: String(seconds).padStart(2, '0'),
    splitCount: String(splits.length || ''),
    splits: splits.map(mapSplitMillisecondsToForm),
    splitsEnabled: splits.length > 0,
    sourceType: normalizeSourceType(performance.sourceType),
    stroke: normalizeStroke(performance.stroke),
  }
}

function asString(value: unknown) {
  return typeof value === 'string' || typeof value === 'number' ? String(value) : ''
}

function normalizePoolLengthUnit(value: unknown): 'meters' | 'yards' {
  return String(value).toLowerCase() === 'yards' ? 'yards' : 'meters'
}

function normalizeSourceType(value: unknown): 'competition' | 'training' {
  return String(value).toLowerCase() === 'training' ? 'training' : 'competition'
}

function normalizeStroke(
  value: unknown,
): 'freestyle' | 'backstroke' | 'butterfly' | 'breaststroke' | 'medley' {
  const stroke = String(value).toLowerCase()

  if (stroke === 'backstroke') {
    return 'backstroke'
  }

  if (stroke === 'butterfly') {
    return 'butterfly'
  }

  if (stroke === 'breaststroke' || stroke === 'breastroke') {
    return 'breaststroke'
  }

  if (stroke === 'medley') {
    return 'medley'
  }

  return 'freestyle'
}

function normalizeSplits(value: unknown) {
  if (!Array.isArray(value)) {
    return []
  }

  return value.filter((split): split is number => typeof split === 'number' && split > 0)
}

function mapSplitMillisecondsToForm(split: number) {
  const minutes = Math.floor(split / 60000)
  const seconds = Math.floor((split % 60000) / 1000)
  const hundredths = Math.floor((split % 1000) / 10)

  return {
    hundredths: String(hundredths).padStart(2, '0'),
    minutes: String(minutes),
    seconds: String(seconds).padStart(2, '0'),
  }
}

function hasSplits(splits: number[] | null | undefined): splits is number[] {
  return Array.isArray(splits) && splits.length > 0
}

function getSplitTone(split: number, splits: number[]) {
  const fastestSplit = Math.min(...splits)
  const slowestSplit = Math.max(...splits)

  if (fastestSplit !== slowestSplit && split === fastestSplit) {
    return 'fastest'
  }

  if (fastestSplit !== slowestSplit && split === slowestSplit) {
    return 'slowest'
  }

  return 'default'
}

function getSplitBadgeClassName(tone: 'default' | 'fastest' | 'slowest') {
  if (tone === 'fastest') {
    return 'rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm text-emerald-800'
  }

  if (tone === 'slowest') {
    return 'rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-sm text-rose-800'
  }

  return 'rounded-full border border-primary/10 bg-primary/5 px-3 py-1 text-sm text-foreground'
}
