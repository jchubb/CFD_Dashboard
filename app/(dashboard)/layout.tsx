"use client"

import type React from "react"
import { useState } from "react"
import { usePathname } from "next/navigation"
import { Sidebar, type NavTab } from "@/components/sidebar"
import { GlobalHeader } from "@/components/global-header"
import { PlanningPeriodProvider } from "@/components/planning-period-context"
import { cn } from "@/lib/utils"

type ViewDensity = "compact" | "default" | "comfortable"

const DENSITY_CLASSES: Record<ViewDensity, string> = {
  compact: "density-compact",
  default: "density-default",
  comfortable: "density-comfortable",
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [density, setDensity] = useState<ViewDensity>("default")
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [refreshInterval, setRefreshInterval] = useState(30)
  const pathname = usePathname()

  const activeTab = (pathname.split("/")[1] as NavTab) || "dashboard"

  console.log("[v0] DashboardLayout rendering, pathname:", pathname)

  return (
    <PlanningPeriodProvider>
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar
          activeTab={activeTab}
          collapsed={sidebarCollapsed}
          onCollapsedChange={setSidebarCollapsed}
        />
        <div className="flex flex-1 flex-col overflow-hidden">
          <GlobalHeader
            density={density}
            onDensityChange={setDensity}
            autoRefresh={autoRefresh}
            onAutoRefreshChange={setAutoRefresh}
            refreshInterval={refreshInterval}
            onRefreshIntervalChange={setRefreshInterval}
          />
          <main className={cn("flex-1 overflow-auto", DENSITY_CLASSES[density])}>
            {children}
          </main>
        </div>
      </div>
    </PlanningPeriodProvider>
  )
}
