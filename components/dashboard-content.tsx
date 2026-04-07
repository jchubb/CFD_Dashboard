"use client"

import { KpiCards } from "@/components/kpi-cards"
import { ForecastChart } from "@/components/forecast-chart"
import { OperationsTable } from "@/components/operations-table"

export function DashboardContent() {
  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Section A: KPI Cards */}
      <KpiCards />

      {/* Section B: Forecast Chart */}
      <ForecastChart />

      {/* Section C: Operations Table */}
      <OperationsTable />
    </div>
  )
}
