import { useMemo, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, GitCompareArrows, Rocket, X } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card, CardContent } from "@/components/ui/card";
import { type Performance } from "@/features/performances/performances-api";

type ChartsProps = {
  distanceFilter: DistanceFilter;
  onDistanceFilterChange: (value: DistanceFilter) => void;
  onSelectedPerformanceChange: (value: string | null) => void;
  onStrokeFilterChange: (value: StrokeFilter) => void;
  onUnitFilterChange: (value: UnitFilter) => void;
  performances: Performance[];
  selectedPerformanceId: string | null;
  strokeFilter: StrokeFilter;
  unitFilter: UnitFilter;
};

type StrokeFilter = "back" | "breast" | "fly" | "free" | "medley";
type DistanceFilter = "25" | "50" | "100" | "200" | "400" | "800" | "1500";
type UnitFilter = "meters" | "yards";

type ChartDatum = {
  date: string;
  eventLabel: string;
  fullDateLabel: string;
  poolLabel: string;
  performanceId: string;
  sourceTypeLabel: string;
  splits: number[];
  timeMs: number;
};

type SplitChartDatum = {
  label: string;
  splitSet: number[];
  timeMs: number;
};

type ComparisonSplitChartDatum = {
  label: string;
  primaryTimeMs: number;
  comparisonTimeMs: number;
};

export function Charts({
  distanceFilter,
  onDistanceFilterChange,
  onSelectedPerformanceChange,
  onStrokeFilterChange,
  onUnitFilterChange,
  performances,
  selectedPerformanceId,
  strokeFilter,
  unitFilter,
}: ChartsProps) {
  const [comparisonPerformanceId, setComparisonPerformanceId] = useState<
    string | null
  >(null);
  const [isCompareSelectionActive, setIsCompareSelectionActive] =
    useState(false);
  const availableDistanceFilters = getAvailableDistanceFilters(strokeFilter);

  const filteredPerformances = useMemo(() => {
    return performances.filter((performance) => {
      if (getStrokeFilterValue(performance.stroke) !== strokeFilter) {
        return false;
      }

      if (String(asNumber(performance.distance) ?? "") !== distanceFilter) {
        return false;
      }

      if (normalizeUnit(performance.poolLengthUnit) !== unitFilter) {
        return false;
      }

      return (
        asNumber(performance.timeMs) !== null &&
        getDateValue(performance.performedAt) !== null
      );
    });
  }, [distanceFilter, performances, strokeFilter, unitFilter]);

  const chartData = useMemo<ChartDatum[]>(() => {
    return filteredPerformances
      .map((performance, index) => {
        const date = getDateValue(performance.performedAt);
        const timeMs = asNumber(performance.timeMs);

        if (!date || timeMs === null) {
          return null;
        }

        const performanceId = String(
          performance.performanceId ?? performance.id ?? index,
        );

        return {
          date,
          eventLabel: formatChartEventLabel(
            performance.distance,
            performance.poolLengthUnit,
            performance.stroke,
            performance.poolLength,
          ),
          fullDateLabel: formatChartDate(date),
          poolLabel: formatPoolLength(
            performance.poolLength,
            performance.poolLengthUnit,
          ),
          performanceId,
          sourceTypeLabel: formatSourceType(performance.sourceType),
          splits: normalizeSplits(performance.splits),
          timeMs,
        };
      })
      .filter((value): value is ChartDatum => value !== null)
      .sort((left, right) => {
        if (left.date === right.date) {
          return left.performanceId.localeCompare(right.performanceId);
        }

        return left.date.localeCompare(right.date);
      });
  }, [filteredPerformances]);

  const yAxisDomain = useMemo<[number, number] | undefined>(() => {
    if (!chartData.length) {
      return undefined;
    }

    const times = chartData.map((datum) => datum.timeMs);
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);

    return [Math.max(0, minTime - 5000), maxTime + 5000];
  }, [chartData]);

  const bestTime = useMemo(() => {
    if (!chartData.length) {
      return null;
    }

    return Math.min(...chartData.map((datum) => datum.timeMs));
  }, [chartData]);

  const bestDatum = useMemo(() => {
    if (bestTime === null) {
      return null;
    }

    return chartData.find((datum) => datum.timeMs === bestTime) ?? null;
  }, [bestTime, chartData]);

  const effectiveSelectedPerformanceId = chartData.some(
    (datum) => datum.performanceId === selectedPerformanceId,
  )
    ? selectedPerformanceId
    : (bestDatum?.performanceId ?? null);

  const selectedDatum =
    chartData.find(
      (datum) => datum.performanceId === effectiveSelectedPerformanceId,
    ) ?? null;

  const selectedSplitData = useMemo<SplitChartDatum[]>(() => {
    if (!selectedDatum?.splits.length) {
      return [];
    }

    return selectedDatum.splits.map((split, index) => ({
      label: getSplitLabel(strokeFilter, index, selectedDatum.splits.length),
      splitSet: selectedDatum.splits,
      timeMs: split,
    }));
  }, [selectedDatum, strokeFilter]);
  const showSelectedSplitLabels = selectedSplitData.length <= 4;

  const compareEligiblePerformanceIds = useMemo(() => {
    if (!selectedDatum) {
      return new Set<string>();
    }

    return new Set(
      chartData
        .filter((datum) =>
          hasMatchingSplitStructure(selectedDatum.splits, datum.splits),
        )
        .map((datum) => datum.performanceId),
    );
  }, [chartData, selectedDatum]);

  const effectiveComparisonPerformanceId =
    comparisonPerformanceId &&
    compareEligiblePerformanceIds.has(comparisonPerformanceId)
      ? comparisonPerformanceId
      : null;

  const comparisonDatum =
    chartData.find(
      (datum) => datum.performanceId === effectiveComparisonPerformanceId,
    ) ?? null;

  const comparisonSplitData = useMemo<ComparisonSplitChartDatum[]>(() => {
    if (!selectedDatum || !comparisonDatum) {
      return [];
    }

    const comparableSplitCount = getComparableSplitCount(
      selectedDatum.splits,
      comparisonDatum.splits,
    );

    if (comparableSplitCount === null) {
      return [];
    }

    const normalizedPrimarySplits = normalizeSplitsForComparison(
      selectedDatum.splits,
      comparableSplitCount,
    );
    const normalizedComparisonSplits = normalizeSplitsForComparison(
      comparisonDatum.splits,
      comparableSplitCount,
    );

    return normalizedPrimarySplits.map((split, index) => ({
      label: getSplitLabel(strokeFilter, index, comparableSplitCount),
      primaryTimeMs: split,
      comparisonTimeMs: normalizedComparisonSplits[index] ?? 0,
    }));
  }, [comparisonDatum, selectedDatum, strokeFilter]);

  const showComparisonSplitLabels = comparisonSplitData.length <= 2;
  const isComparisonNavigationActive =
    isCompareSelectionActive || effectiveComparisonPerformanceId !== null;

  const handlePrimarySelectionStep = (direction: -1 | 1) => {
    const nextPerformanceId = getNextPrimaryPerformanceId(
      chartData,
      effectiveSelectedPerformanceId,
      direction,
    );

    if (!nextPerformanceId) {
      return;
    }

    onSelectedPerformanceChange(nextPerformanceId);

    if (nextPerformanceId === effectiveComparisonPerformanceId) {
      setComparisonPerformanceId(null);
    }
  };

  const handleComparisonSelectionStep = (direction: -1 | 1) => {
    const nextPerformanceId = getNextComparisonPerformanceId({
      chartData,
      compareEligiblePerformanceIds,
      currentComparisonPerformanceId: effectiveComparisonPerformanceId,
      direction,
      selectedPerformanceId: effectiveSelectedPerformanceId,
    });

    if (!nextPerformanceId) {
      return;
    }

    setComparisonPerformanceId(nextPerformanceId);
    setIsCompareSelectionActive(false);
  };

  const canNavigatePrimarySelection = chartData.length > 1;
  const canNavigateComparisonSelection = chartData.some(
    (datum) =>
      datum.performanceId !== effectiveSelectedPerformanceId &&
      compareEligiblePerformanceIds.has(datum.performanceId),
  );

  return (
    <div className="grid gap-2">
      <div className="flex justify-center gap-2">
        <CompactFilter
          ariaLabel="Filter chart by distance"
          label={`${distanceFilter}`}
          onChange={(value) =>
            onDistanceFilterChange(value as DistanceFilter)
          }
          value={distanceFilter}
        >
          {availableDistanceFilters.map((distance) => (
            <option key={distance} value={distance}>
              {distance}
            </option>
          ))}
        </CompactFilter>
        <CompactFilter
          ariaLabel="Filter chart by unit"
          label={getUnitFilterLabel(unitFilter)}
          onChange={(value) => onUnitFilterChange(value as UnitFilter)}
          value={unitFilter}
        >
          <option value="meters">M</option>
          <option value="yards">Y</option>
        </CompactFilter>
      </div>

      <div className="overflow-hidden rounded-2xl border border-primary/10 bg-white/75">
        <div className="flex w-full">
          {(["free", "fly", "back", "breast", "medley"] as StrokeFilter[]).map(
            (stroke, index) => {
              const isActive = strokeFilter === stroke;

              return (
                <button
                  key={stroke}
                  type="button"
                  className={[
                    "flex min-w-0 flex-1 items-center justify-center px-2 py-2 text-center transition-colors sm:px-3 sm:py-3",
                    index > 0 ? "border-l border-primary/10" : "",
                    isActive
                      ? "bg-primary/8"
                      : "bg-transparent hover:bg-primary/5",
                  ].join(" ")}
                  onClick={() => onStrokeFilterChange(stroke)}
                >
                  <span className="text-xs font-semibold text-foreground sm:text-sm md:text-base">
                    {getStrokeFilterLabel(stroke)}
                  </span>
                </button>
              );
            },
          )}
        </div>
      </div>

      <Card className="overflow-hidden border-primary/10 bg-white/90 shadow-[0_24px_60px_-32px_rgba(37,99,235,0.22)]">
        <CardContent className="pt-3">
        {chartData.length ? (
          <div className="relative">
            <button
              type="button"
              aria-label={
                effectiveComparisonPerformanceId
                  ? "Clear comparison"
                  : "Compare performance"
              }
              className={[
                "absolute right-3 top-3 z-10 flex size-10 items-center justify-center rounded-full border shadow-sm backdrop-blur transition-colors",
                effectiveComparisonPerformanceId
                  ? "border-slate-300 bg-white/95 text-slate-600 hover:bg-slate-50"
                  : isCompareSelectionActive
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-primary/15 bg-white/95 text-primary hover:bg-primary/5",
              ].join(" ")}
              onClick={() => {
                if (effectiveComparisonPerformanceId) {
                  setComparisonPerformanceId(null);
                  setIsCompareSelectionActive(false);
                  return;
                }

                setIsCompareSelectionActive((current) => !current);
              }}
            >
              {effectiveComparisonPerformanceId ? (
                <X className="size-4" />
              ) : (
                <GitCompareArrows className="size-4" />
              )}
            </button>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart
                data={chartData}
                margin={{ top: 0, right: 20, left: 20, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="rgba(37,99,235,0.12)"
                />
                <XAxis dataKey="date" hide padding={{ left: 18, right: 18 }} />
                <YAxis domain={yAxisDomain} hide width={12} />
                <Line
                  dataKey="timeMs"
                  activeDot={false}
                  dot={(props) => {
                    const { cx, cy, payload } = props;

                    if (
                      typeof cx !== "number" ||
                      typeof cy !== "number" ||
                      !payload
                    ) {
                      return <g key="chart-dot-empty" />;
                    }

                    const isSelected =
                      payload.performanceId === effectiveSelectedPerformanceId;
                    const isComparison =
                      payload.performanceId ===
                      effectiveComparisonPerformanceId;
                    const isCompareEligible = compareEligiblePerformanceIds.has(
                      payload.performanceId,
                    );
                    const showCompareCandidates =
                      isCompareSelectionActive ||
                      effectiveComparisonPerformanceId !== null;
                    const isDimmedForCompare =
                      showCompareCandidates &&
                      isCompareEligible &&
                      !isSelected &&
                      !isComparison;

                    return (
                      <circle
                        cx={cx}
                        cy={cy}
                        className="transition-all duration-200 ease-out"
                        key={`chart-dot-${payload.performanceId}`}
                        fill={
                          isSelected
                            ? "rgba(250,204,21,0.95)"
                            : isDimmedForCompare
                              ? "rgba(148,163,184,0.9)"
                              : "rgba(37,99,235,0.9)"
                        }
                        r={isSelected ? 6.5 : isComparison ? 5 : isDimmedForCompare ? 4.5 : 3.5}
                        stroke={
                          isSelected
                            ? "rgba(202,138,4,1)"
                            : isComparison
                              ? "rgba(29,78,216,1)"
                              : isDimmedForCompare
                                ? "rgba(100,116,139,0.95)"
                                : "rgba(255,255,255,0.95)"
                        }
                        strokeWidth={isSelected ? 3 : isComparison ? 2.5 : 1.5}
                        style={{ cursor: "default" }}
                      />
                    );
                  }}
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  stroke="rgba(37,99,235,0.88)"
                  strokeWidth={3}
                  type="monotone"
                />
              </LineChart>
            </ResponsiveContainer>
            <div className="mt-2 flex items-center justify-center gap-2">
              <button
                type="button"
                aria-label={
                  isComparisonNavigationActive
                    ? "Previous comparison performance"
                    : "Previous performance"
                }
                className="flex size-8 items-center justify-center rounded-full border border-primary/10 bg-white/80 text-primary/70 shadow-sm transition-colors hover:bg-primary/5 hover:text-primary disabled:opacity-30"
                disabled={
                  isComparisonNavigationActive
                    ? !canNavigateComparisonSelection
                    : !canNavigatePrimarySelection
                }
                onClick={() =>
                  isComparisonNavigationActive
                    ? handleComparisonSelectionStep(-1)
                    : handlePrimarySelectionStep(-1)
                }
              >
                <ChevronLeft className="size-3.5" />
              </button>
              <button
                type="button"
                aria-label={
                  isComparisonNavigationActive
                    ? "Next comparison performance"
                    : "Next performance"
                }
                className="flex size-8 items-center justify-center rounded-full border border-primary/10 bg-white/80 text-primary/70 shadow-sm transition-colors hover:bg-primary/5 hover:text-primary disabled:opacity-30"
                disabled={
                  isComparisonNavigationActive
                    ? !canNavigateComparisonSelection
                    : !canNavigatePrimarySelection
                }
                onClick={() =>
                  isComparisonNavigationActive
                    ? handleComparisonSelectionStep(1)
                    : handlePrimarySelectionStep(1)
                }
              >
                <ChevronRight className="size-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-primary/15 bg-primary/5 px-6 py-12 text-center text-sm text-muted-foreground">
            No performances match the selected chart filters.
          </div>
        )}

        {bestTime !== null ? (
          <div className="mt-4 flex items-center gap-2 px-1 text-sm font-medium text-foreground">
            <Rocket className="size-4 text-primary" />
            <span>
              {"Your best: "}
              <span className="text-emerald-600">{formatTime(bestTime)}</span>
            </span>
          </div>
        ) : null}

        {selectedDatum && comparisonDatum ? (
          <div className="mt-2 rounded-xl border border-primary/10 bg-primary/5 px-3 py-2.5 text-sm text-foreground shadow-[0_16px_40px_-28px_rgba(15,23,42,0.2)]">
            <div className="mb-2 text-center text-sm font-medium">
              <span className="text-amber-500">
                {formatTime(selectedDatum.timeMs)}
              </span>
              <span className="px-2 text-muted-foreground">vs</span>
              <span className="text-sky-500">
                {formatTime(comparisonDatum.timeMs)}
              </span>
            </div>
            {comparisonSplitData.length ? (
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={comparisonSplitData}
                    margin={{ top: 20, right: 8, left: 8, bottom: 0 }}
                  >
                    <CartesianGrid
                      stroke="rgba(37,99,235,0.1)"
                      strokeDasharray="3 3"
                      vertical={false}
                    />
                    <XAxis
                      axisLine={false}
                      dataKey="label"
                      tick={{ fill: "rgba(100,116,139,0.9)", fontSize: 11 }}
                      tickLine={false}
                    />
                    <YAxis hide />
                    {!showComparisonSplitLabels ? (
                      <Tooltip
                        cursor={{ fill: "rgba(37,99,235,0.06)" }}
                        content={<ComparisonSplitsTooltip />}
                      />
                    ) : null}
                    <Bar
                      dataKey="primaryTimeMs"
                      fill="rgba(251,191,36,0.72)"
                      radius={4}
                    >
                      {showComparisonSplitLabels ? (
                        <LabelList
                          dataKey="primaryTimeMs"
                          position="top"
                          formatter={(value: number) => formatTime(value)}
                          style={{
                            fill: "rgba(100,116,139,0.95)",
                            fontSize: 11,
                            fontWeight: 600,
                          }}
                        />
                      ) : null}
                    </Bar>
                    <Bar
                      dataKey="comparisonTimeMs"
                      fill="rgba(96,165,250,0.72)"
                      radius={4}
                    >
                      {showComparisonSplitLabels ? (
                        <LabelList
                          dataKey="comparisonTimeMs"
                          position="top"
                          formatter={(value: number) => formatTime(value)}
                          style={{
                            fill: "rgba(100,116,139,0.95)",
                            fontSize: 11,
                            fontWeight: 600,
                          }}
                        />
                      ) : null}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : null}
          </div>
        ) : selectedDatum ? (
          <div className="mt-2 rounded-xl border border-primary/10 bg-primary/5 px-3 py-2 text-center text-sm text-foreground shadow-[0_16px_40px_-28px_rgba(15,23,42,0.2)]">
            {bestTime !== null ? (
              selectedDatum.timeMs === bestTime ? (
                <div className="text-emerald-600">This is your best</div>
              ) : (
                <div className="text-red-600">
                  {formatBestTimeDifference(selectedDatum.timeMs, bestTime)}
                </div>
              )
            ) : null}
            <div>
              <span className="font-semibold">
                {formatTime(selectedDatum.timeMs)}
              </span>
              <span className="text-muted-foreground">
                {` - ${selectedDatum.poolLabel} - ${selectedDatum.sourceTypeLabel}`}
              </span>
            </div>
            <div className="text-muted-foreground">
              {selectedDatum.fullDateLabel}
            </div>
            {selectedDatum.splits.length > 1 ? (
              <div className="mt-2 h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={selectedSplitData}
                    margin={{ top: 20, right: 0, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid
                      stroke="rgba(37,99,235,0.1)"
                      strokeDasharray="3 3"
                      vertical={false}
                    />
                    <XAxis
                      axisLine={false}
                      dataKey="label"
                      tick={{ fill: "rgba(100,116,139,0.9)", fontSize: 11 }}
                      tickLine={false}
                    />
                    <YAxis hide />
                    {!showSelectedSplitLabels ? (
                      <Tooltip
                        cursor={{ fill: "rgba(37,99,235,0.06)" }}
                        content={<SelectedSplitsTooltip />}
                      />
                    ) : null}
                    <Bar dataKey="timeMs" radius={[6, 6, 0, 0]}>
                      {selectedSplitData.map((split) => (
                        <Cell
                          key={`${selectedDatum.performanceId}-split-bar-${split.label}`}
                          fill={getSplitBarFill(split.timeMs, split.splitSet)}
                        />
                      ))}
                      {showSelectedSplitLabels ? (
                        <LabelList
                          dataKey="timeMs"
                          position="top"
                          content={(props) => {
                            const { x, y, width, value } = props;

                            if (
                              typeof x !== "number" ||
                              typeof y !== "number" ||
                              typeof width !== "number" ||
                              typeof value !== "number"
                            ) {
                              return <g />;
                            }

                            return (
                              <text
                                x={x + width / 2}
                                y={y - 8}
                                fill="rgba(100,116,139,0.95)"
                                fontSize="11"
                                fontWeight="600"
                                textAnchor="middle"
                              >
                                {formatTime(value)}
                              </text>
                            );
                          }}
                        />
                      ) : null}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : null}
          </div>
        ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

function CompactFilter({
  ariaLabel,
  children,
  label,
  onChange,
  value,
}: {
  ariaLabel: string;
  children: ReactNode;
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <div className="flex w-fit items-center rounded-full border border-primary/10 bg-white px-3 py-2">
      <select
        aria-label={ariaLabel}
        className="w-auto appearance-none bg-transparent text-center text-sm text-foreground outline-none"
        onChange={(event) => onChange(event.target.value)}
        style={{ width: `${label.length + 1}ch` }}
        value={value}
      >
        {children}
      </select>
    </div>
  );
}

function ComparisonSplitsTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  label?: string | number;
  payload?: Array<{ color?: string; dataKey?: string; value?: number }>;
}) {
  if (!active || !payload?.length) {
    return null;
  }

  const primarySplit = payload.find(
    (entry) => entry.dataKey === "primaryTimeMs",
  )?.value;
  const comparisonSplit = payload.find(
    (entry) => entry.dataKey === "comparisonTimeMs",
  )?.value;

  return (
    <div className="rounded-xl border border-primary/10 bg-white px-3 py-2 text-sm shadow-[0_16px_40px_-28px_rgba(15,23,42,0.35)]">
      <div className="font-medium text-foreground">{`Split ${label}`}</div>
      {typeof primarySplit === "number" ? (
        <div className="text-amber-500">{formatTime(primarySplit)}</div>
      ) : null}
      {typeof comparisonSplit === "number" ? (
        <div className="text-sky-500">{formatTime(comparisonSplit)}</div>
      ) : null}
    </div>
  );
}

function SelectedSplitsTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  label?: string | number;
  payload?: Array<{ dataKey?: string; value?: number }>;
}) {
  if (!active || !payload?.length) {
    return null;
  }

  const splitTime = payload.find((entry) => entry.dataKey === "timeMs")?.value;

  return (
    <div className="rounded-xl border border-primary/10 bg-white px-3 py-2 text-sm shadow-[0_16px_40px_-28px_rgba(15,23,42,0.35)]">
      <div className="font-medium text-foreground">{`Split ${label}`}</div>
      {typeof splitTime === "number" ? (
        <div className="text-primary">{formatTime(splitTime)}</div>
      ) : null}
    </div>
  );
}

function getNextPrimaryPerformanceId(
  chartData: ChartDatum[],
  currentPerformanceId: string | null,
  direction: -1 | 1,
) {
  if (!chartData.length) {
    return null;
  }

  const currentIndex = chartData.findIndex(
    (datum) => datum.performanceId === currentPerformanceId,
  );

  if (currentIndex === -1) {
    return chartData[0]?.performanceId ?? null;
  }

  const nextIndex =
    (currentIndex + direction + chartData.length) % chartData.length;

  return chartData[nextIndex]?.performanceId ?? null;
}

function getNextComparisonPerformanceId({
  chartData,
  compareEligiblePerformanceIds,
  currentComparisonPerformanceId,
  direction,
  selectedPerformanceId,
}: {
  chartData: ChartDatum[];
  compareEligiblePerformanceIds: Set<string>;
  currentComparisonPerformanceId: string | null;
  direction: -1 | 1;
  selectedPerformanceId: string | null;
}) {
  const eligibleChartData = chartData.filter(
    (datum) =>
      datum.performanceId !== selectedPerformanceId &&
      compareEligiblePerformanceIds.has(datum.performanceId),
  );

  if (!eligibleChartData.length) {
    return null;
  }

  const currentIndex = eligibleChartData.findIndex(
    (datum) => datum.performanceId === currentComparisonPerformanceId,
  );

  if (currentIndex !== -1) {
    const nextIndex =
      (currentIndex + direction + eligibleChartData.length) %
      eligibleChartData.length;

    return eligibleChartData[nextIndex]?.performanceId ?? null;
  }

  const selectedIndex = chartData.findIndex(
    (datum) => datum.performanceId === selectedPerformanceId,
  );

  if (selectedIndex === -1) {
    return eligibleChartData[0]?.performanceId ?? null;
  }

  for (let offset = 1; offset < chartData.length; offset += 1) {
    const nextIndex =
      (selectedIndex + direction * offset + chartData.length) % chartData.length;
    const nextPerformanceId = chartData[nextIndex]?.performanceId;

    if (
      nextPerformanceId &&
      nextPerformanceId !== selectedPerformanceId &&
      compareEligiblePerformanceIds.has(nextPerformanceId)
    ) {
      return nextPerformanceId;
    }
  }

  return eligibleChartData[0]?.performanceId ?? null;
}

function getDateValue(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString().slice(0, 10);
}

function formatChartDate(value: string) {
  const date = new Date(`${value}T00:00:00.000Z`);

  return date
    .toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    })
    .replace(",", " -");
}

function formatTime(value: number) {
  const totalSeconds = Math.floor(value / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const hundredths = Math.floor((value % 1000) / 10);

  return `${minutes}:${String(seconds).padStart(2, "0")}.${String(hundredths).padStart(2, "0")}`;
}

function formatBestTimeDifference(selectedTime: number, bestTime: number) {
  const difference = selectedTime - bestTime;

  return `${difference >= 0 ? "+" : "-"}${formatTime(Math.abs(difference))} vs best`;
}

function formatChartEventLabel(
  distance: number | string | null | undefined,
  poolLengthUnit: string | null | undefined,
  stroke: unknown,
  poolLength: number | string | null | undefined,
) {
  const distanceLabel = formatDistance(distance, poolLengthUnit);
  const strokeLabel = formatStroke(stroke);
  const poolLabel = formatPoolLength(poolLength, poolLengthUnit);

  return `${distanceLabel} ${strokeLabel} ${poolLabel}`.trim();
}

function formatDistance(
  distance: number | string | null | undefined,
  poolLengthUnit: string | null | undefined,
) {
  const distanceValue = formatText(distance);
  const unit = normalizeUnit(poolLengthUnit);

  if (distanceValue === "-") {
    return "-";
  }

  if (unit === "meters") {
    return `${distanceValue}M`;
  }

  if (unit === "yards") {
    return `${distanceValue}Y`;
  }

  return distanceValue;
}

function formatStroke(value: unknown) {
  const stroke = formatText(value);

  if (stroke === "-") {
    return stroke;
  }

  const normalized = stroke.trim().toLowerCase();

  if (normalized === "freestyle") {
    return "Free";
  }

  if (normalized === "backstroke") {
    return "Back";
  }

  if (normalized === "breastroke" || normalized === "breaststroke") {
    return "Breast";
  }

  if (normalized === "butterfly") {
    return "Fly";
  }

  if (normalized === "medley") {
    return "Medley";
  }

  return stroke;
}

function formatText(value: unknown) {
  if (typeof value === "string") {
    return value || "-";
  }

  if (typeof value === "number") {
    return String(value);
  }

  return "-";
}

function asNumber(value: number | string | null | undefined) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);

    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
}

function formatPoolLength(
  poolLength: number | string | null | undefined,
  poolLengthUnit: string | null | undefined,
) {
  const length = asNumber(poolLength);
  const unit = normalizeUnit(poolLengthUnit);

  if (length === null) {
    return "-";
  }

  if (length === 50 && unit === "meters") {
    return "LCM";
  }

  if (length === 25 && unit === "meters") {
    return "SCM";
  }

  if (length === 50 && unit === "yards") {
    return "LCY";
  }

  if (length === 25 && unit === "yards") {
    return "SCY";
  }

  return unit ? `${length} ${unit}` : String(length);
}

function normalizeUnit(value: string | null | undefined) {
  if (!value) {
    return "";
  }

  const normalized = value.trim().toLowerCase();

  if (normalized === "meter" || normalized === "meters" || normalized === "m") {
    return "meters";
  }

  if (normalized === "yard" || normalized === "yards" || normalized === "y") {
    return "yards";
  }

  return normalized;
}

function getStrokeFilterValue(value: unknown): StrokeFilter {
  const normalized = String(value).trim().toLowerCase();

  if (normalized === "freestyle" || normalized === "free") {
    return "free";
  }

  if (normalized === "butterfly" || normalized === "fly") {
    return "fly";
  }

  if (normalized === "backstroke" || normalized === "back") {
    return "back";
  }

  if (normalized === "medley") {
    return "medley";
  }

  if (
    normalized === "breaststroke" ||
    normalized === "breastroke" ||
    normalized === "breast"
  ) {
    return "breast";
  }

  return "free";
}

function getStrokeFilterLabel(value: StrokeFilter) {
  if (value === "free") {
    return "Free";
  }

  if (value === "fly") {
    return "Fly";
  }

  if (value === "back") {
    return "Back";
  }

  if (value === "breast") {
    return "Breast";
  }

  if (value === "medley") {
    return "Medley";
  }

  return "Stroke";
}

function getAvailableDistanceFilters(stroke: StrokeFilter) {
  if (stroke === "medley") {
    return ["100", "200", "400"] as DistanceFilter[];
  }

  if (stroke === "fly" || stroke === "back" || stroke === "breast") {
    return ["25", "50", "100", "200"] as DistanceFilter[];
  }

  return ["25", "50", "100", "200", "400", "800", "1500"] as DistanceFilter[];
}

function normalizeSplits(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    (split): split is number => typeof split === "number" && split > 0,
  );
}

function hasMatchingSplitStructure(
  sourceSplits: number[],
  candidateSplits: number[],
) {
  return getComparableSplitCount(sourceSplits, candidateSplits) !== null;
}

function getComparableSplitCount(
  sourceSplits: number[],
  candidateSplits: number[],
) {
  if (sourceSplits.length <= 1 || candidateSplits.length <= 1) {
    return null;
  }

  const smallerSplitCount = Math.min(
    sourceSplits.length,
    candidateSplits.length,
  );
  const largerSplitCount = Math.max(
    sourceSplits.length,
    candidateSplits.length,
  );

  if (largerSplitCount % smallerSplitCount !== 0) {
    return null;
  }

  return smallerSplitCount;
}

function normalizeSplitsForComparison(
  splits: number[],
  targetSplitCount: number,
) {
  if (splits.length === targetSplitCount) {
    return splits;
  }

  const groupSize = splits.length / targetSplitCount;
  const normalizedSplits: number[] = [];

  for (let index = 0; index < targetSplitCount; index += 1) {
    const start = index * groupSize;
    const end = start + groupSize;
    normalizedSplits.push(
      splits.slice(start, end).reduce((sum, split) => sum + split, 0),
    );
  }

  return normalizedSplits;
}

function getSplitLabel(
  stroke: StrokeFilter,
  index: number,
  splitCount: number,
) {
  if (stroke === "medley" && splitCount === 4) {
    return ["Fly", "Back", "Breast", "Free"][index] ?? `${index + 1}`;
  }

  return `${index + 1}`;
}

function getSplitBarFill(split: number, splits: number[]) {
  const fastestSplit = Math.min(...splits);
  const slowestSplit = Math.max(...splits);

  if (fastestSplit === slowestSplit) {
    return "rgba(96,165,250,0.88)";
  }

  const ratio = (split - fastestSplit) / (slowestSplit - fastestSplit);
  const red = Math.round(147 - ratio * 88);
  const green = Math.round(197 - ratio * 98);
  const blue = Math.round(253 - ratio * 18);

  return `rgba(${red},${green},${blue},0.92)`;
}

function formatSourceType(value: unknown) {
  const sourceType = String(value).trim().toLowerCase();

  if (sourceType === "training") {
    return "Training";
  }

  return "Competition";
}

function getUnitFilterLabel(value: UnitFilter) {
  return value === "yards" ? "Y" : "M";
}
