"use client"

import { useMemo } from "react"
import { Badge } from "@/components/ui/badge"
import { usePlanningPeriod } from "@/components/planning-period-context"
import { CalendarRange, TrendingUp, Target, Activity } from "lucide-react"

function getDaysInMonth(monthStr: string): number {
  const parts = monthStr.split(" ")
  const year = parseInt(parts[1]) || new Date().getFullYear()
  const monthIndex = new Date(`${parts[0]} 1, ${year}`).getMonth()
  return new Date(year, monthIndex + 1, 0).getDate()
}

export function PlanKpiBar() {
  const { selectedMonth, monthlyPlanRows, dailyLERows, dailyActualsRows } = usePlanningPeriod()

  const totalTarget = useMemo(() => {
    const t = monthlyPlanRows.reduce((sum, row) => sum + row.monthlyTarget, 0)
    return t > 0 ? t : null
  }, [monthlyPlanRows])

  const dailyLETotal = useMemo(() => {
    if (dailyLERows.length === 0) return null
    return dailyLERows.reduce((sum, row) => {
      const leValue = row.dailyQty[row.dailyQty.length - 1] ?? 0
      return sum + leValue
    }, 0)
  }, [dailyLERows])

  const avgDailyUnitsRemaining = useMemo(() => {
    if (!totalTarget || dailyActualsRows.length === 0 || dailyLETotal === null) return null

    const totalActuals = dailyActualsRows.reduce((sum, row) => {
      return sum + row.dailyQty.reduce((s, v) => s + (v ?? 0), 0)
    }, 0)

    let lastActualDay = 0
    dailyActualsRows.forEach(row => {
      row.dailyQty.forEach((v, i) => {
        if (v !== null && i + 1 > lastActualDay) lastActualDay = i + 1
      })
    })

    const totalDays = getDaysInMonth(selectedMonth)
    const remainingDays = totalDays - lastActualDay - 1
    if (remainingDays <= 0) return 0

    const unitsRemaining = totalTarget - totalActuals - dailyLETotal
    return Math.round((unitsRemaining / remainingDays) * 10) / 10
  }, [totalTarget, dailyActualsRows, dailyLETotal, selectedMonth])

  return (
    <div className="sticky top-0 z-10 bg-background border-b border-border px-6 py-2 shadow-sm">
      <div className="grid grid-cols-4 gap-3">

        <div className="flex items-center gap-3">
          <div className="p-2 rounded-md bg-blue-50 shrink-0">
            <Target className="h-4 w-4 text-blue-600" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] text-muted-foreground leading-none">Monthly Target</p>
            <p className="text-base font-semibold font-mono leading-tight">
              {totalTarget !== null ? totalTarget : "—"}
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
            <CalendarRange className="h-4 w-4 text-amber-600" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] text-muted-foreground leading-none">Plan Status</p>
            <div className="mt-0.5">
              <Badge
                variant="outline"
                className={`text-[11px] ${totalTarget !== null ? "border-emerald-300 text-emerald-700 bg-emerald-50" : "border-amber-300 text-amber-700 bg-amber-50"}`}
              >
                {totalTarget !== null ? "Loaded" : "Awaiting Data"}
              </Badge>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
