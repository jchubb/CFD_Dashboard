"use client"

import { useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MonthlyPlanSection } from "@/components/monthly-plan-section"
import { DailyActualsSection } from "@/components/daily-actuals-section"
import { DailyPlanSection } from "@/components/daily-plan-section"
import { DailyLESection } from "@/components/daily-le-section"
import { usePlanningPeriod } from "@/components/planning-period-context"
import {
  CalendarRange,
  TrendingUp,
  Target,
  Activity,
} from "lucide-react"

// Get days in a given month string e.g. "January 2024"
function getDaysInMonth(monthStr: string): number {
  const parts = monthStr.split(" ")
  const year = parseInt(parts[1]) || new Date().getFullYear()
  const monthIndex = new Date(`${parts[0]} 1, ${year}`).getMonth()
  return new Date(year, monthIndex + 1, 0).getDate()
}

export function MonthlyPlanContent() {
  const { selectedMonth, monthlyPlanRows, dailyLERows, dailyActualsRows } = usePlanningPeriod()

  // Monthly plan summary
  const monthSummary = useMemo(() => {
    const totalTarget = monthlyPlanRows.reduce((sum, row) => sum + row.monthlyTarget, 0)
    return {
      totalTarget: totalTarget > 0 ? totalTarget : null,
    }
  }, [monthlyPlanRows])

  // Daily LE total: sum of the last column (LE day) across all parts
  const dailyLETotal = useMemo(() => {
    if (dailyLERows.length === 0) return null
    return dailyLERows.reduce((sum, row) => {
      const leValue = row.dailyQty[row.dailyQty.length - 1] ?? 0
      return sum + leValue
    }, 0)
  }, [dailyLERows])

  // Avg daily units remaining = (totalTarget - totalActualsToDate) / remainingDays
  const avgDailyUnitsRemaining = useMemo(() => {
    if (!monthSummary.totalTarget || dailyActualsRows.length === 0) return null

    // Sum all non-null actuals across all parts
    const totalActuals = dailyActualsRows.reduce((sum, row) => {
      return sum + row.dailyQty.reduce((s, v) => s + (v ?? 0), 0)
    }, 0)

    // Find the last day with actuals data
    let lastActualDay = 0
    dailyActualsRows.forEach(row => {
      row.dailyQty.forEach((v, i) => {
        if (v !== null && i + 1 > lastActualDay) lastActualDay = i + 1
      })
    })

    const totalDays = getDaysInMonth(selectedMonth)
    const remainingDays = totalDays - lastActualDay
    if (remainingDays <= 0) return 0

    const unitsRemaining = monthSummary.totalTarget - totalActuals
    return Math.round((unitsRemaining / remainingDays) * 10) / 10
  }, [monthSummary.totalTarget, dailyActualsRows, selectedMonth])

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Summary KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="border border-border">
          <CardContent className="py-4 px-5 flex items-center gap-4">
            <div className="p-2.5 rounded-lg bg-blue-50">
              <Target className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Monthly Target</p>
              <p className="text-xl font-semibold font-mono">
                {monthSummary.totalTarget !== null ? monthSummary.totalTarget : "—"}
              </p>
              <p className="text-xs text-muted-foreground">total units</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border">
          <CardContent className="py-4 px-5 flex items-center gap-4">
            <div className="p-2.5 rounded-lg bg-emerald-50">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Daily LE Target</p>
              <p className="text-xl font-semibold font-mono">
                {dailyLETotal !== null ? dailyLETotal : "—"}
              </p>
              <p className="text-xs text-muted-foreground">total units</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border">
          <CardContent className="py-4 px-5 flex items-center gap-4">
            <div className="p-2.5 rounded-lg bg-purple-50">
              <Activity className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Avg Daily Units Remaining</p>
              <p className="text-xl font-semibold font-mono">
                {avgDailyUnitsRemaining !== null ? avgDailyUnitsRemaining : "—"}
              </p>
              <p className="text-xs text-muted-foreground">units / day</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border">
          <CardContent className="py-4 px-5 flex items-center gap-4">
            <div className="p-2.5 rounded-lg bg-amber-50">
              <Target className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Plan Status</p>
              <p className="text-xl font-semibold font-mono">
                <Badge variant="outline" className="text-xs border-amber-300 text-amber-700 bg-amber-50">
                  {monthSummary.totalTarget !== null ? "Loaded" : "Awaiting Data"}
                </Badge>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Monthly Plan Section - CSV Upload, Table, and Histogram */}
      <MonthlyPlanSection selectedMonth={selectedMonth} />

      {/* Daily Plan Section */}
      <DailyPlanSection selectedMonth={selectedMonth} />

      {/* Daily Actuals Section */}
      <DailyActualsSection selectedMonth={selectedMonth} />

      {/* Daily LE Section */}
      <DailyLESection selectedMonth={selectedMonth} />

      {/* Footer Guidance */}
      <div className="flex items-center justify-between px-1">
        <p className="text-xs text-muted-foreground">
          Upload a CSV or load sample data to populate the plan. Use the Data Ingestion tab to manage monthly targets and daily inputs.
        </p>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs text-muted-foreground">
            <CalendarRange className="h-3 w-3 mr-1" />
            {selectedMonth}
          </Badge>
        </div>
      </div>
    </div>
  )
}
