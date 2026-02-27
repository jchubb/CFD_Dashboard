"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Toggle } from "@/components/ui/toggle"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart } from "recharts"
import { cn } from "@/lib/utils"
import { Info } from "lucide-react"

const CHART_COLORS = {
  actuals: "#3b82f6",
  plan: "#3b82f6",
  rollingAvg: "#f97316",
  bullCase: "#22c55e",
  baseCase: "#6366f1",
  bearCase: "#ef4444",
}

const programFamilyBreakdown = {
  F135: { color: "#8b5cf6" },
  GTF: { color: "#06b6d4" },
  "LEAP-1A": { color: "#f59e0b" },
  GEnx: { color: "#10b981" },
  CFM56: { color: "#ec4899" },
}

const scenarioConditions = {
  bullCase: {
    name: "Bull Case",
    conditions: [
      "Supply chain optimization achieved",
      "No major equipment downtime",
      "Full workforce availability",
      "Increased shift capacity approved",
    ],
  },
  baseCase: {
    name: "Base Case",
    conditions: [
      "Current operational efficiency maintained",
      "Standard maintenance schedule",
      "Normal workforce levels",
      "No significant disruptions",
    ],
  },
  bearCase: {
    name: "Bear Case",
    conditions: [
      "Supply chain constraints persist",
      "Unplanned equipment maintenance",
      "Workforce shortages",
      "Quality issues requiring rework",
    ],
  },
}

type TimePeriod = "daily" | "weekly" | "monthly"

const generateChartData = (timePeriod: TimePeriod, showForecast: boolean) => {
  const data = []
  const startDate = new Date(2024, 0, 1)
  let cumulativeSum = 0
  let cumulativeCount = 0

  const weeklyActualsAnchors: number[] = []
  const programFamilyCounts: Record<string, number>[] = []

  const planCurvePoints = [112, 115, 113, 118, 122, 119, 125, 128, 126, 132, 135, 138]

  const historicalPeriods = timePeriod === "daily" ? 84 : timePeriod === "weekly" ? 12 : 6
  const forecastPeriods = timePeriod === "daily" ? 28 : timePeriod === "weekly" ? 8 : 4
  const totalPeriods = showForecast ? historicalPeriods + forecastPeriods : historicalPeriods

  for (let i = 0; i < 12; i++) {
    const actualValue = 100 + Math.floor(Math.random() * 30) + i * 2
    weeklyActualsAnchors.push(actualValue)

    const families = Object.keys(programFamilyBreakdown)
    const breakdown: Record<string, number> = {}
    let remaining = actualValue
    families.forEach((family, idx) => {
      if (idx === families.length - 1) {
        breakdown[family] = remaining
      } else {
        const portion = Math.floor(remaining * (0.15 + Math.random() * 0.25))
        breakdown[family] = portion
        remaining -= portion
      }
    })
    programFamilyCounts.push(breakdown)
  }

  const catmullRomInterpolate = (p0: number, p1: number, p2: number, p3: number, t: number): number => {
    const t2 = t * t
    const t3 = t2 * t
    return 0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3)
  }

  const getDailyActualValue = (dayIndex: number): number => {
    const weekFloat = dayIndex / 7
    const weekIndex = Math.floor(weekFloat)
    const t = weekFloat - weekIndex

    const p0 = weeklyActualsAnchors[Math.max(0, weekIndex - 1)]
    const p1 = weeklyActualsAnchors[Math.min(weekIndex, weeklyActualsAnchors.length - 1)]
    const p2 = weeklyActualsAnchors[Math.min(weekIndex + 1, weeklyActualsAnchors.length - 1)]
    const p3 = weeklyActualsAnchors[Math.min(weekIndex + 2, weeklyActualsAnchors.length - 1)]

    return catmullRomInterpolate(p0, p1, p2, p3, t)
  }

  const lastActualValue = weeklyActualsAnchors[weeklyActualsAnchors.length - 1]

  for (let i = 0; i < totalPeriods; i++) {
    const date = new Date(startDate)
    if (timePeriod === "daily") {
      date.setDate(startDate.getDate() + i)
    } else if (timePeriod === "weekly") {
      date.setDate(startDate.getDate() + i * 7)
    } else {
      date.setMonth(startDate.getMonth() + i)
    }

    const weekIndex = timePeriod === "daily" ? Math.floor(i / 7) : timePeriod === "weekly" ? i : i
    const isHistorical = i < historicalPeriods

    let dateLabel: string
    if (timePeriod === "daily") {
      dateLabel = date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
    } else if (timePeriod === "weekly") {
      dateLabel = `W${i + 1} (${date.toLocaleDateString("en-US", { month: "short", day: "numeric" })})`
    } else {
      dateLabel = date.toLocaleDateString("en-US", { month: "short", year: "2-digit" })
    }

    let actualValue: number | null = null
    let familyBreakdown: Record<string, number> | null = null

    if (isHistorical) {
      if (timePeriod === "daily") {
        actualValue = getDailyActualValue(i)
      } else {
        const actualIndex = Math.min(weekIndex, weeklyActualsAnchors.length - 1)
        actualValue = weeklyActualsAnchors[actualIndex]
      }

      const breakdownIndex = Math.min(weekIndex, programFamilyCounts.length - 1)
      familyBreakdown = programFamilyCounts[breakdownIndex]
    }

    let planValue = null
    let rollingAvg = null

    if (isHistorical) {
      if (timePeriod === "daily") {
        const progress = i / (historicalPeriods - 1)
        const curveIndex = progress * (planCurvePoints.length - 1)
        const lowerIndex = Math.floor(curveIndex)
        const upperIndex = Math.min(lowerIndex + 1, planCurvePoints.length - 1)
        const t = curveIndex - lowerIndex
        planValue = planCurvePoints[lowerIndex] * (1 - t) + planCurvePoints[upperIndex] * t
      } else if (timePeriod === "weekly") {
        planValue = planCurvePoints[Math.min(i, planCurvePoints.length - 1)]
      } else {
        const monthlyPlanIndex = Math.min(i * 2, planCurvePoints.length - 1)
        planValue = planCurvePoints[monthlyPlanIndex]
      }

      if (actualValue !== null) {
        cumulativeSum += actualValue
        cumulativeCount++
      }
      rollingAvg = cumulativeCount > 0 ? Math.round(cumulativeSum / cumulativeCount) : null
    }

    let bullValue = null
    let baseValue = null
    let bearValue = null

    if (showForecast && i >= historicalPeriods - 1) {
      const forecastIndex = i - (historicalPeriods - 1)
      bullValue = lastActualValue + forecastIndex * 3.5
      baseValue = lastActualValue + forecastIndex * 2
      bearValue = lastActualValue + forecastIndex * 0.5
    }

    data.push({
      period: dateLabel,
      date: dateLabel,
      timestamp:
        timePeriod === "daily" ? date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : null,
      actuals: actualValue,
      plan: planValue,
      rollingAvg: rollingAvg,
      bullCase: bullValue,
      baseCase: baseValue,
      bearCase: bearValue,
      familyBreakdown,
    })
  }

  return data
}

function CustomTooltip({ active, payload, label, timePeriod }: any) {
  if (!active || !payload || !payload.length) return null

  const forecastEntries = payload.filter(
    (p: any) => ["bullCase", "baseCase", "bearCase"].includes(p.dataKey) && p.value !== null,
  )

  const actualsEntry = payload.find((p: any) => p.dataKey === "actuals" && p.value !== null)
  const familyBreakdown = actualsEntry?.payload?.familyBreakdown
  const timestamp = actualsEntry?.payload?.timestamp

  return (
    <div className="rounded-md border border-border bg-card p-3 shadow-lg max-w-xs">
      <p className="mb-2 font-mono text-sm font-semibold">
        {label}
        {timePeriod === "daily" && timestamp && (
          <span className="ml-2 text-muted-foreground font-normal">{timestamp}</span>
        )}
      </p>
      <div className="space-y-1.5">
        {payload.map((entry: any, index: number) => {
          if (entry.value === null) return null
          return (
            <div key={index} className="flex items-center gap-2 text-xs">
              <div className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.stroke || entry.color }} />
              <span className="text-muted-foreground">{entry.name}:</span>
              <span className="font-mono font-medium">{Math.round(entry.value)}</span>
            </div>
          )
        })}
      </div>

      {actualsEntry && familyBreakdown && (
        <div className="mt-3 border-t border-border pt-3">
          <p className="text-xs font-medium text-muted-foreground mb-2">Pieces by Program Family:</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            {Object.entries(familyBreakdown).map(([family, count]) => (
              <div key={family} className="flex items-center gap-1.5 text-xs">
                <div
                  className="h-2 w-2 rounded-full"
                  style={{
                    backgroundColor: programFamilyBreakdown[family as keyof typeof programFamilyBreakdown]?.color,
                  }}
                />
                <span className="text-muted-foreground">{family}:</span>
                <span className="font-mono font-medium">{count as number}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {forecastEntries.length > 0 && (
        <div className="mt-3 border-t border-border pt-3">
          {forecastEntries.map((entry: any) => {
            const scenario = entry.dataKey as keyof typeof scenarioConditions
            const info = scenarioConditions[scenario]
            if (!info) return null

            return (
              <div key={scenario} className="mb-2 last:mb-0">
                <div className="flex items-center gap-1 mb-1">
                  <Info className="h-3 w-3 text-muted-foreground" />
                  <p
                    className={cn(
                      "text-xs font-medium",
                      scenario === "bullCase" && "text-green-500",
                      scenario === "baseCase" && "text-indigo-500",
                      scenario === "bearCase" && "text-red-500",
                    )}
                  >
                    {info.name} Conditions:
                  </p>
                </div>
                <ul className="ml-4 space-y-0.5">
                  {info.conditions.map((condition, idx) => (
                    <li key={idx} className="text-[10px] text-muted-foreground">
                      • {condition}
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function ForecastChart() {
  const [showActuals, setShowActuals] = useState(true)
  const [showPlan, setShowPlan] = useState(true)
  const [showRollingAvg, setShowRollingAvg] = useState(true)
  const [showBull, setShowBull] = useState(false)
  const [showBase, setShowBase] = useState(false)
  const [showBear, setShowBear] = useState(false)
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("weekly")

  const anyForecastSelected = showBull || showBase || showBear

  const chartData = useMemo(() => generateChartData(timePeriod, anyForecastSelected), [timePeriod, anyForecastSelected])

  return (
    <Card className="border-2 border-border bg-card">
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="text-sm font-medium uppercase tracking-wider text-foreground">
            Manufacturing Forecast
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1">Throughput projection with scenario analysis</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <Select value={timePeriod} onValueChange={(v) => setTimePeriod(v as TimePeriod)}>
            <SelectTrigger className="h-7 w-[100px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground mr-1">Data:</span>
            <Toggle
              pressed={showActuals}
              onPressedChange={setShowActuals}
              size="sm"
              className="h-7 px-2 text-xs data-[state=on]:bg-blue-500/20 data-[state=on]:text-blue-500"
            >
              Actuals
            </Toggle>
            <Toggle
              pressed={showPlan}
              onPressedChange={setShowPlan}
              size="sm"
              className="h-7 px-2 text-xs data-[state=on]:bg-blue-500/20 data-[state=on]:text-blue-400"
            >
              Plan
            </Toggle>
            <Toggle
              pressed={showRollingAvg}
              onPressedChange={setShowRollingAvg}
              size="sm"
              className="h-7 px-2 text-xs data-[state=on]:bg-orange-500/20 data-[state=on]:text-orange-500"
            >
              Avg
            </Toggle>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground mr-1">Forecast:</span>
            <Toggle
              pressed={showBull}
              onPressedChange={setShowBull}
              size="sm"
              className="h-7 px-2 text-xs data-[state=on]:bg-green-500/20 data-[state=on]:text-green-500"
            >
              Bull
            </Toggle>
            <Toggle
              pressed={showBase}
              onPressedChange={setShowBase}
              size="sm"
              className="h-7 px-2 text-xs data-[state=on]:bg-indigo-500/20 data-[state=on]:text-indigo-500"
            >
              Base
            </Toggle>
            <Toggle
              pressed={showBear}
              onPressedChange={setShowBear}
              size="sm"
              className="h-7 px-2 text-xs data-[state=on]:bg-red-500/20 data-[state=on]:text-red-500"
            >
              Bear
            </Toggle>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
              <XAxis
                dataKey="period"
                tick={{ fontSize: 10, fill: "#6b7280" }}
                tickLine={false}
                axisLine={false}
                fontFamily="monospace"
                interval={timePeriod === "daily" ? 6 : timePeriod === "weekly" ? 1 : 0}
                angle={timePeriod === "daily" ? -45 : 0}
                textAnchor={timePeriod === "daily" ? "end" : "middle"}
                height={timePeriod === "daily" ? 60 : 30}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#6b7280" }}
                tickLine={false}
                axisLine={false}
                fontFamily="monospace"
                domain={["auto", "auto"]}
              />
              <Tooltip content={<CustomTooltip timePeriod={timePeriod} />} />
              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 16 }} iconType="line" />

              {showPlan && (
                <Line
                  type="natural"
                  dataKey="plan"
                  name="Plan"
                  stroke={CHART_COLORS.plan}
                  strokeWidth={2}
                  strokeDasharray="8 4"
                  dot={false}
                  strokeOpacity={0.7}
                  connectNulls={false}
                />
              )}

              {showActuals && (
                <Line
                  type="monotone"
                  dataKey="actuals"
                  name="Actuals"
                  stroke={CHART_COLORS.actuals}
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5, fill: CHART_COLORS.actuals }}
                  connectNulls={false}
                />
              )}

              {showRollingAvg && (
                <Line
                  type="natural"
                  dataKey="rollingAvg"
                  name="Rolling Avg"
                  stroke={CHART_COLORS.rollingAvg}
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                  connectNulls={false}
                />
              )}

              {showBull && (
                <Line
                  type="natural"
                  dataKey="bullCase"
                  name="Bull Case"
                  stroke={CHART_COLORS.bullCase}
                  strokeWidth={2}
                  strokeDasharray="6 3"
                  dot={false}
                  connectNulls={true}
                />
              )}

              {showBase && (
                <Line
                  type="natural"
                  dataKey="baseCase"
                  name="Base Case"
                  stroke={CHART_COLORS.baseCase}
                  strokeWidth={2}
                  strokeDasharray="6 3"
                  dot={false}
                  connectNulls={true}
                />
              )}

              {showBear && (
                <Line
                  type="natural"
                  dataKey="bearCase"
                  name="Bear Case"
                  stroke={CHART_COLORS.bearCase}
                  strokeWidth={2}
                  strokeDasharray="6 3"
                  dot={false}
                  connectNulls={true}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
