"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog"
import { MonthlyPlanSection } from "@/components/monthly-plan-section"
import { AvailableWipSection } from "@/components/available-wip-section"
import { CellStatusSection } from "@/components/cell-status-section"
import { DailyActualsSection } from "@/components/daily-actuals-section"
import { DailyPlanSection } from "@/components/daily-plan-section"
import { DailyLESection } from "@/components/daily-le-section"
import { usePlanningPeriod } from "@/components/planning-period-context"
import {
  CalendarRange,
  TrendingUp,
  Target,
  Activity,
  LineChart,
} from "lucide-react"

// Get days in a given month string e.g. "January 2024"
function getDaysInMonth(monthStr: string): number {
  const parts = monthStr.split(" ")
  const year = parseInt(parts[1]) || new Date().getFullYear()
  const monthIndex = new Date(`${parts[0]} 1, ${year}`).getMonth()
  return new Date(year, monthIndex + 1, 0).getDate()
}

export function MonthlyPlanContent() {
  const router = useRouter()
  const { selectedMonth, monthlyPlanRows, dailyLERows, dailyActualsRows, dailyPlanRows, wipRows, cellStatusRows } = usePlanningPeriod()
  const [confirmOpen, setConfirmOpen] = useState(false)

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
      {/* Sticky KPI Header Bar */}
      <div className="sticky top-0 z-30 bg-background border-b border-border px-6 py-2 shadow-sm">
        <div className="grid grid-cols-5 gap-3">

          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-blue-50 shrink-0">
              <Target className="h-4 w-4 text-blue-600" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-muted-foreground leading-none">Monthly Target</p>
              <p className="text-base font-semibold font-mono leading-tight">
                {monthSummary.totalTarget !== null ? monthSummary.totalTarget : "—"}
              </p>
              <p className="text-[11px] text-muted-foreground leading-none">total units</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-emerald-50 shrink-0">
              <TrendingUp className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-muted-foreground leading-none">Daily LE Target</p>
              <p className="text-base font-semibold font-mono leading-tight">
                {dailyLETotal !== null ? dailyLETotal : "—"}
              </p>
              <p className="text-[11px] text-muted-foreground leading-none">total units</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-purple-50 shrink-0">
              <Activity className="h-4 w-4 text-purple-600" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-muted-foreground leading-none">Avg Daily Units Remaining</p>
              <p className="text-base font-semibold font-mono leading-tight">
                {avgDailyUnitsRemaining !== null ? avgDailyUnitsRemaining : "—"}
              </p>
              <p className="text-[11px] text-muted-foreground leading-none">units / day</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-amber-50 shrink-0">
              <Target className="h-4 w-4 text-amber-600" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-muted-foreground leading-none">Plan Status</p>
              <div className="mt-0.5">
                {(() => {
                  const allLoaded =
                    monthSummary.totalTarget !== null &&
                    dailyPlanRows.length > 0 &&
                    dailyActualsRows.length > 0 &&
                    dailyLERows.length > 0 &&
                    cellStatusRows.length > 0
                  const anyLoaded =
                    monthSummary.totalTarget !== null ||
                    dailyPlanRows.length > 0 ||
                    dailyActualsRows.length > 0 ||
                    dailyLERows.length > 0 ||
                    wipRows.length > 0 ||
                    cellStatusRows.length > 0
                  return allLoaded ? (
                    <Badge variant="outline" className="text-[11px] border-emerald-300 text-emerald-700 bg-emerald-50">
                      Loaded
                    </Badge>
                  ) : anyLoaded ? (
                    <Badge variant="outline" className="text-[11px] border-blue-300 text-blue-700 bg-blue-50">
                      Partial
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[11px] border-amber-300 text-amber-700 bg-amber-50">
                      Awaiting Data
                    </Badge>
                  )
                })()}
              </div>
            </div>
          </div>

          {/* Generate Forecast button */}
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-primary/10 shrink-0">
              <LineChart className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-muted-foreground leading-none">Forecast</p>
              <div className="mt-0.5">
                {(() => {
                  const allLoaded =
                    monthSummary.totalTarget !== null &&
                    dailyPlanRows.length > 0 &&
                    dailyActualsRows.length > 0 &&
                    dailyLERows.length > 0
                  return (
                    <Button
                      size="sm"
                      variant="outline"
                      className={`h-6 px-2 text-[11px] gap-1 transition-colors ${
                        allLoaded
                          ? "border-primary/40 text-primary hover:bg-primary/5"
                          : "border-muted-foreground/20 text-muted-foreground/50 cursor-not-allowed"
                      }`}
                      onClick={() => allLoaded && setConfirmOpen(true)}
                    >
                      <LineChart className="h-3 w-3" />
                      Generate Forecast
                    </Button>
                  )
                })()}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Confirmation dialog */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-sm">Generate Forecast</AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              All input data up to date and verified asset statuses?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-xs h-8">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="text-xs h-8"
              onClick={() => router.push("/optimized-schedule")}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
