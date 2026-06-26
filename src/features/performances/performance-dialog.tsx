import { X } from 'lucide-react'
import { createPortal } from 'react-dom'

import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'

type PerformanceSplitForm = {
  hundredths: string
  minutes: string
  seconds: string
}

export type PerformanceDialogForm = {
  distance: string
  hundredths: string
  minutes: string
  performedAt: string
  poolLength: string
  poolLengthUnit: 'meters' | 'yards'
  seconds: string
  splitCount: string
  splits: PerformanceSplitForm[]
  splitsEnabled: boolean
  sourceType: 'competition' | 'training'
  stroke: 'freestyle' | 'backstroke' | 'butterfly' | 'breaststroke' | 'medley'
}

type PerformanceDialogProps = {
  form: PerformanceDialogForm
  isOpen: boolean
  isSaving: boolean
  onChange: (value: PerformanceDialogForm) => void
  onClose: () => void
  onSave: () => void
  saveDisabled: boolean
}

export function PerformanceDialog({
  form,
  isOpen,
  isSaving,
  onChange,
  onClose,
  onSave,
  saveDisabled,
}: PerformanceDialogProps) {
  const maxSplitCount = getMaxSplitCount(form.distance, form.poolLength)
  const availableSplitCounts = getAvailableSplitCountOptions(maxSplitCount, form.stroke)
  const canConfigureSplits = availableSplitCounts.length > 0
  const splitTotalMilliseconds = getSplitTotalTimeMs(form.splits)
  const availableDistances = getAvailableDistanceOptions(form.stroke, form.poolLength)

  const handleDistanceChange = (value: string) => {
    onChange(syncPerformanceSplits({ ...form, distance: value }))
  }

  const handlePoolLengthChange = (value: string) => {
    const nextPoolLength = value
    const nextDistances = getAvailableDistanceOptions(form.stroke, nextPoolLength)
    const nextDistance = nextDistances.includes(form.distance)
      ? form.distance
      : (nextDistances[0] ?? '')

    onChange(
      syncPerformanceSplits({ ...form, distance: nextDistance, poolLength: nextPoolLength }),
    )
  }

  const handleStrokeChange = (value: string) => {
    const nextStroke = value as PerformanceDialogForm['stroke']
    const nextDistances = getAvailableDistanceOptions(nextStroke, form.poolLength)
    const nextDistance = nextDistances.includes(form.distance)
      ? form.distance
      : (nextDistances[0] ?? '')

    onChange(syncPerformanceSplits({ ...form, distance: nextDistance, stroke: nextStroke }))
  }

  const handleToggleSplits = () => {
    if (form.splitsEnabled) {
      onChange({ ...form, splitsEnabled: false })
      return
    }

    onChange(syncPerformanceSplits({ ...form, splitsEnabled: true }))
  }

  const handleSplitCountChange = (value: string) => {
    onChange(syncPerformanceSplits({ ...form, splitCount: value }))
  }

  if (!isOpen) {
    return null
  }

  const dialogContent = (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-white/10 px-3 pb-4 pt-8 backdrop-blur-sm sm:px-4 sm:pb-6 sm:pt-10">
      <div className="flex max-h-[calc(100svh-3rem)] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-primary/10 bg-white p-4 shadow-[0_24px_60px_-32px_rgba(15,23,42,0.22)] sm:max-h-[calc(100svh-5rem)] sm:p-5">
        <div className="flex items-start justify-between gap-4">
          <div />
          <button
            type="button"
            aria-label="Close"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-primary/10 bg-white text-foreground transition-colors hover:bg-primary/5"
            onClick={onClose}
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="mt-4 grid flex-1 gap-3 overflow-y-auto pr-1">
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <FormInput
              label="Performed at"
              type="date"
              value={form.performedAt}
              onChange={(value) => onChange({ ...form, performedAt: value })}
            />
            <FormSelect
              label="Stroke"
              value={form.stroke}
              onChange={handleStrokeChange}
            >
              <option value="freestyle">freestyle</option>
              <option value="backstroke">backstroke</option>
              <option value="butterfly">butterfly</option>
              <option value="breaststroke">breaststroke</option>
              <option value="medley">medley</option>
            </FormSelect>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <FormSelect
              label="Distance"
              value={form.distance}
              onChange={handleDistanceChange}
            >
              {availableDistances.map((distance) => (
                <option key={distance} value={distance}>
                  {distance}
                </option>
              ))}
            </FormSelect>
            <FormSelect
              label="Pool length"
              value={form.poolLength}
              onChange={handlePoolLengthChange}
            >
              <option value="25">25</option>
              <option value="50">50</option>
            </FormSelect>
            <FormSelect
              label="Pool length unit"
              value={form.poolLengthUnit}
              onChange={(value) =>
                onChange({
                  ...form,
                  poolLengthUnit: value as PerformanceDialogForm['poolLengthUnit'],
                })
              }
            >
              <option value="meters">meters</option>
              <option value="yards">yards</option>
            </FormSelect>
          </div>

          <TimeField
            hundredths={form.hundredths}
            minutes={form.minutes}
            onChange={(value) => onChange({ ...form, ...value })}
            seconds={form.seconds}
          />

          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <FormSelect
              label="Source type"
              value={form.sourceType}
              onChange={(value) =>
                onChange({ ...form, sourceType: value as PerformanceDialogForm['sourceType'] })
              }
            >
              <option value="competition">competition</option>
              <option value="training">training</option>
            </FormSelect>
          </div>

          {canConfigureSplits ? (
            <div className="rounded-2xl border border-primary/10 bg-primary/5 px-3 py-3 sm:px-4">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-medium text-foreground">Splits</div>
                <div className="flex items-center gap-2">
                  {form.splitsEnabled ? (
                    <select
                      aria-label="Number of splits"
                      className="h-9 min-w-0 rounded-full border border-primary/15 bg-white px-3 text-center text-sm text-foreground outline-none transition-colors focus:border-primary"
                      onChange={(event) => handleSplitCountChange(event.target.value)}
                      value={form.splitCount}
                    >
                      {availableSplitCounts.map((count) => (
                        <option key={count} value={count}>
                          {count}
                        </option>
                      ))}
                    </select>
                  ) : null}
                  <button
                    type="button"
                    aria-label={form.splitsEnabled ? 'Remove splits' : 'Add splits'}
                    className="flex size-9 items-center justify-center rounded-full border border-primary/15 bg-white text-xl leading-none text-primary shadow-sm transition-colors hover:bg-primary/5"
                    onClick={handleToggleSplits}
                  >
                    {form.splitsEnabled ? '−' : '+'}
                  </button>
                </div>
              </div>
              {form.splitsEnabled ? (
                <>
                  <div className="mt-3 text-sm font-medium text-foreground">
                    <span className="text-muted-foreground">Total: </span>
                    <span>
                      {splitTotalMilliseconds === null ? '' : formatTimeMs(splitTotalMilliseconds)}
                    </span>
                  </div>

                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {form.splits.map((split, index) => (
                      <TimeField
                        key={index}
                        hundredths={split.hundredths}
                        minutes={split.minutes}
                        onChange={(value) =>
                          onChange({
                            ...form,
                            splits: form.splits.map((currentSplit, currentIndex) =>
                              currentIndex === index ? value : currentSplit,
                            ),
                          })
                        }
                        seconds={split.seconds}
                      />
                    ))}
                  </div>
                </>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="mt-4 flex justify-end">
          <Button disabled={isSaving || saveDisabled} onClick={onSave}>
            {isSaving ? (
              <>
                <Spinner label="Saving performance" />
                Saving...
              </>
            ) : (
              'Save'
            )}
          </Button>
        </div>
      </div>
    </div>
  )

  if (typeof document === 'undefined') {
    return dialogContent
  }

  return createPortal(dialogContent, document.body)
}

function FormInput({
  label,
  onChange,
  type = 'text',
  value,
}: {
  label: string
  onChange: (value: string) => void
  type?: 'date' | 'number' | 'text'
  value: string
}) {
  return (
    <label className="grid min-w-0 gap-2">
      <span className="text-[13px] font-medium text-foreground sm:text-sm">{label}</span>
      <input
        className="h-9 w-full min-w-0 rounded-xl border border-primary/15 bg-white px-2 text-[15px] text-foreground outline-none transition-colors focus:border-primary sm:h-10 sm:px-3 sm:text-sm"
        onChange={(event) => onChange(event.target.value)}
        type={type}
        value={value}
      />
    </label>
  )
}

function FormSelect({
  children,
  label,
  onChange,
  value,
}: {
  children: React.ReactNode
  label: string
  onChange: (value: string) => void
  value: string
}) {
  return (
    <label className="grid min-w-0 gap-2">
      <span className="text-[13px] font-medium text-foreground sm:text-sm">{label}</span>
      <select
        className="h-9 w-full min-w-0 appearance-none rounded-xl border border-primary/15 bg-white px-2 text-[15px] text-foreground outline-none transition-colors focus:border-primary sm:h-10 sm:px-3 sm:text-sm"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {children}
      </select>
    </label>
  )
}

function TimeField({
  label,
  hundredths,
  minutes,
  onChange,
  seconds,
}: {
  label?: string
  hundredths: string
  minutes: string
  onChange: (value: PerformanceSplitForm) => void
  seconds: string
}) {
  return (
    <div className="grid min-w-0 gap-2">
      {label ? (
        <span className="text-[13px] font-medium text-foreground sm:text-sm">{label}</span>
      ) : null}
      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-1 rounded-xl border border-primary/15 bg-white px-2 py-1.5 sm:gap-2 sm:px-3">
        <TimeSegment
          maxLength={2}
          onChange={(value) => onChange({ hundredths, minutes: value, seconds })}
          placeholder="00"
          value={minutes}
        />
        <span className="text-sm font-semibold text-primary/60">:</span>
        <TimeSegment
          maxLength={2}
          onChange={(value) => onChange({ hundredths, minutes, seconds: value })}
          placeholder="00"
          value={seconds}
        />
        <span className="text-sm font-semibold text-primary/60">.</span>
        <TimeSegment
          maxLength={2}
          onChange={(value) => onChange({ hundredths: value, minutes, seconds })}
          placeholder="00"
          value={hundredths}
        />
      </div>
    </div>
  )
}

function TimeSegment({
  maxLength,
  onChange,
  placeholder,
  value,
}: {
  maxLength: number
  onChange: (value: string) => void
  placeholder: string
  value: string
}) {
  return (
    <label className="block min-w-0">
      <input
        className="h-8 w-full min-w-0 rounded-lg border border-primary/10 bg-primary/5 px-1 text-center text-[15px] text-foreground outline-none transition-colors focus:border-primary sm:h-9 sm:px-2 sm:text-sm"
        inputMode="numeric"
        maxLength={maxLength}
        onChange={(event) => onChange(event.target.value.replace(/\D/g, '').slice(0, maxLength))}
        placeholder={placeholder}
        value={value}
      />
    </label>
  )
}

function syncPerformanceSplits(form: PerformanceDialogForm): PerformanceDialogForm {
  if (!form.splitsEnabled) {
    return form
  }

  const maxSplitCount = getMaxSplitCount(form.distance, form.poolLength)
  const availableSplitCounts = getAvailableSplitCountOptions(maxSplitCount, form.stroke)

  if (!availableSplitCounts.length) {
    return {
      ...form,
      splitCount: '',
      splits: [],
    }
  }

  const nextSplitCount = availableSplitCounts.includes(form.splitCount)
    ? form.splitCount
    : availableSplitCounts[0]

  return {
    ...form,
    splitCount: nextSplitCount,
    splits: resizeSplitForms(form.splits, Number(nextSplitCount)),
  }
}

function resizeSplitForms(splits: PerformanceSplitForm[], expectedSplitCount: number) {
  const nextSplits = splits.slice(0, expectedSplitCount)

  while (nextSplits.length < expectedSplitCount) {
    nextSplits.push(createEmptySplitForm())
  }

  return nextSplits
}

function createEmptySplitForm(): PerformanceSplitForm {
  return {
    hundredths: '',
    minutes: '',
    seconds: '',
  }
}

function getAvailableSplitCountOptions(
  maxSplitCount: number | null,
  stroke: PerformanceDialogForm['stroke'],
) {
  if (maxSplitCount === null || maxSplitCount < 2) {
    return []
  }

  if (stroke === 'medley') {
    return maxSplitCount >= 4 ? ['4'] : []
  }

  const options = new Set<number>([2])
  let nextPower = 4

  while (nextPower < maxSplitCount) {
    options.add(nextPower)
    nextPower *= 2
  }

  options.add(maxSplitCount)

  return [...options].sort((left, right) => left - right).map(String)
}

function getAvailableDistanceOptions(
  stroke: PerformanceDialogForm['stroke'],
  poolLength: string,
) {
  const includesSprint25 = poolLength === '25'

  if (stroke === 'medley') {
    return includesSprint25 ? ['100', '200', '400'] : ['200', '400']
  }

  if (stroke === 'freestyle') {
    return includesSprint25
      ? ['25', '50', '100', '200', '400', '800', '1500']
      : ['50', '100', '200', '400', '800', '1500']
  }

  return includesSprint25
    ? ['25', '50', '100', '200']
    : ['50', '100', '200']
}

function getMaxSplitCount(distance: string, poolLength: string) {
  const parsedDistance = Number(distance)
  const parsedPoolLength = Number(poolLength)

  if (!Number.isFinite(parsedDistance) || !Number.isFinite(parsedPoolLength)) {
    return null
  }

  if (parsedDistance <= 0 || parsedPoolLength <= 0) {
    return null
  }

  if (parsedDistance % parsedPoolLength !== 0) {
    return null
  }

  return parsedDistance / parsedPoolLength
}

function getSplitTotalTimeMs(splits: PerformanceSplitForm[]) {
  let total = 0

  for (const split of splits) {
    const nextValue = parseSplitTimeMsValue(split)

    if (nextValue === null) {
      return null
    }

    total += nextValue
  }

  return total
}

function parseSplitTimeMsValue(split: PerformanceSplitForm) {
  const minutes = parseNumericPart(split.minutes)
  const seconds = parseNumericPart(split.seconds)
  const hundredths = parseHundredthsPart(split.hundredths)

  if (minutes === null || seconds === null || hundredths === null) {
    return null
  }

  if (seconds > 59 || hundredths > 99) {
    return null
  }

  return minutes * 60 * 1000 + seconds * 1000 + hundredths * 10
}

function parseNumericPart(value: string) {
  const trimmed = value.trim()

  if (!trimmed) {
    return null
  }

  const parsed = Number(trimmed)

  if (!Number.isFinite(parsed)) {
    return null
  }

  return parsed
}

function parseHundredthsPart(value: string) {
  const parsed = parseNumericPart(value)

  if (parsed === null) {
    return null
  }

  if (value.trim().length === 1) {
    return parsed * 10
  }

  return parsed
}

function formatTimeMs(value: number) {
  const totalSeconds = Math.floor(value / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  const hundredths = Math.floor((value % 1000) / 10)

  return `${minutes}:${String(seconds).padStart(2, '0')}.${String(hundredths).padStart(2, '0')}`
}
