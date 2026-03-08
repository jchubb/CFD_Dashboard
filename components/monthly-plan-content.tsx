"use client"

import { useMemo } from "react"
import { Badge } from "@/components/ui/badge"
import {
  CalendarRange,
  TrendingUp,
  Target,
  Activity,
} from "lucide-react"
import { MonthlyPlanSection } from "@/components/monthly-plan-section"
import { AvailableWipSection } from "@/components/available-wip-section"
import { CellStatusSection } from "@/components/cell-status-section"
import { DailyActualsSection } from "@/components/daily-actuals-section"
import { DailyPlanSection } from "@/components/daily-plan-section"
import { DailyLESection } from "@/components/daily-le-section"
import { usePlanningPeriod } from "@/components/planning-period-context"

// Get days in a given month string e.g. "January 2024"
function getDaysInMonth(monthStr: string): number {
  const parts = monthStr.split(" ")
  const year = parseInt(parts[1]) || new Date().getFullYear()
  const monthIndex = new Date(`${parts[0]} 1, ${year}`).getMonth()
  return new Date(year, monthIndex + 1, 0).getDate()
}

export function MonthlyPlanContent() {
  const { selectedMonth, monthlyPlanRows, dailyLERows, dailyActualsRows, dailyPlanRows, wipRows, cellStatusRows } = usePlanningPeriod()

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

  // Avg daily units remaining = (totalTarget - totalActualsToDate - dailyLETotal) / (remainingDays - 1)
  const avgDailyUnitsRemaining = useMemo(() => {
    if (!monthSummary.totalTarget || dailyActualsRows.length === 0 || dailyLETotal === null) return null

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
    // -1 because the LE day is already accounted for in dailyLETotal
    const remainingDays = totalDays - lastActualDay - 1
    if (remainingDays <= 0) return 0

    const unitsRemaining = monthSummary.totalTarget - totalActuals - dailyLETotal
    return Math.round((unitsRemaining / remainingDays) * 10) / 10
  }, [monthSummary.totalTarget, dailyActualsRows, dailyLETotal, selectedMonth])

  return (
    <div className="flex flex-col gap-6">
      {/* Scrollable content */}
      <div className="flex flex-col gap-3 px-6 pb-4">
        <CellStatusSection selectedMonth={selectedMonth} />

        <AvailableWipSection selectedMonth={selectedMonth} />

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
    </div>
  )
}
