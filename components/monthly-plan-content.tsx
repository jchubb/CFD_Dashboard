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
  FileBarChart,
  CalendarRange,
  TrendingUp,
  Package,
  Target,
} from "lucide-react"

export function MonthlyPlanContent() {
  const { selectedMonth, monthlyPlanRows } = usePlanningPeriod()

  // Summary cards derived directly from persisted context data
  const monthSummary = useMemo(() => {
    const totalTarget = monthlyPlanRows.reduce((sum, row) => sum + row.monthlyTarget, 0)
    const totalParts = monthlyPlanRows.length
    const families = new Set(monthlyPlanRows.map(r => r.programFamily)).size
    return {
      totalTarget: totalTarget > 0 ? totalTarget : null,
      totalParts: totalParts > 0 ? totalParts : null,
      families: families > 0 ? families : null,
    }
  }, [monthlyPlanRows])

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
              <Package className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Unique Parts</p>
              <p className="text-xl font-semibold font-mono">
                {monthSummary.totalParts !== null ? monthSummary.totalParts : "—"}
              </p>
              <p className="text-xs text-muted-foreground">in plan</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-border">
          <CardContent className="py-4 px-5 flex items-center gap-4">
            <div className="p-2.5 rounded-lg bg-purple-50">
              <FileBarChart className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Program Families</p>
              <p className="text-xl font-semibold font-mono">
                {monthSummary.families !== null ? monthSummary.families : "—"}
              </p>
              <p className="text-xs text-muted-foreground">active</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-border">
          <CardContent className="py-4 px-5 flex items-center gap-4">
            <div className="p-2.5 rounded-lg bg-amber-50">
              <TrendingUp className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Plan Status</p>
              <p className="text-xl font-semibold font-mono">
                {monthSummary.totalTarget !== null ? (
                  <Badge variant="outline" className="text-xs border-emerald-300 text-emerald-700 bg-emerald-50">
                    Loaded
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-xs border-amber-300 text-amber-700 bg-amber-50">
                    Awaiting Data
                  </Badge>
                )}
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
          Upload a CSV or load sample data to populate the plan. Use the Scheduling Tool tab to generate schedules based on these targets.
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
