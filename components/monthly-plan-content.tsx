"use client"

import { useMemo } from "react"
import { Badge } from "@/components/ui/badge"
import { MonthlyPlanSection } from "@/components/monthly-plan-section"
import { DailyActualsSection } from "@/components/daily-actuals-section"
import { DailyPlanSection } from "@/components/daily-plan-section"
import { DailyLESection } from "@/components/daily-le-section"
import { PlanKpiBar } from "@/components/plan-kpi-bar"
import { usePlanningPeriod } from "@/components/planning-period-context"
import { CalendarRange } from "lucide-react"

export function MonthlyPlanContent() {
  const { selectedMonth } = usePlanningPeriod()

  return (
    <div className="flex flex-col gap-6">
      <PlanKpiBar />

      <div className="flex flex-col gap-6 px-6 pb-6">
        <MonthlyPlanSection selectedMonth={selectedMonth} />
        <DailyPlanSection selectedMonth={selectedMonth} />
        <DailyActualsSection selectedMonth={selectedMonth} />
        <DailyLESection selectedMonth={selectedMonth} />

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

