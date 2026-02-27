"use client"

import { KpiCards } from "@/components/kpi-cards"
import { ForecastChart } from "@/components/forecast-chart"
import { OperationsTable } from "@/components/operations-table"

export function DashboardContent() {
  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Operations Dashboard</h1>
          <p className="text-sm text-muted-foreground">Manufacturing throughput and schedule monitoring</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="inline-block h-2 w-2 rounded-full bg-success animate-pulse" />
          <span className="font-mono">LIVE DATA</span>
        </div>
      </div>

      {/* Section A: KPI Cards */}
      <KpiCards />

      {/* Section B: Forecast Chart */}
      <ForecastChart />

      {/* Section C: Operations Table */}
      <OperationsTable />
    </div>
  )
}
