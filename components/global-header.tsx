"use client"

import { usePathname } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  LayoutDashboard,
  Calendar,
  Settings2,
  FileBarChart,
  RefreshCw,
  Clock,
  Monitor,
  Home,
  ClipboardList,
  CalendarRange,
} from "lucide-react"
import { useState, useEffect } from "react"
import { usePlanningPeriod, availableMonths } from "@/components/planning-period-context"

type ViewDensity = "compact" | "default" | "comfortable"

interface GlobalHeaderProps {
  density: ViewDensity
  onDensityChange: (density: ViewDensity) => void
  autoRefresh: boolean
  onAutoRefreshChange: (enabled: boolean) => void
  refreshInterval: number
  onRefreshIntervalChange: (seconds: number) => void
}

const PAGE_META: Record<string, { title: string; description: string; icon: React.ElementType }> = {
  "/overview": {
    title: "Executive Overview",
    description: "Plant-wide performance summary and alerts",
    icon: Home,
  },
  "/dashboard": {
    title: "Operations Dashboard",
    description: "Manufacturing throughput and schedule monitoring",
    icon: LayoutDashboard,
  },
  "/monthly-inputs": {
    title: "Monthly Inputs",
    description: "Initial conditions, parameters, and part list configuration",
    icon: ClipboardList,
  },
  "/scheduling": {
    title: "Scheduling Tool",
    description: "Scenario-based production schedule generation",
    icon: Calendar,
  },
  "/parameters": {
    title: "Parameters Configuration",
    description: "Machine status, overrides, and part-family allocation",
    icon: Settings2,
  },
  "/monthly-plan": {
    title: "Data Ingestion",
    description: "Import and analyze monthly production targets",
    icon: FileBarChart,
  },
}

export function GlobalHeader({
  density,
  onDensityChange,
  autoRefresh,
  onAutoRefreshChange,
  refreshInterval,
  onRefreshIntervalChange,
}: GlobalHeaderProps) {
  const pathname = usePathname()
  const meta = PAGE_META[pathname] || PAGE_META["/overview"]
  const Icon = meta.icon
  const [elapsed, setElapsed] = useState<string>("00:00:00")
  const [mounted, setMounted] = useState(false)
  const { selectedMonth, setSelectedMonth } = usePlanningPeriod()

  useEffect(() => {
    setMounted(true)
    const refreshedAt = Date.now()
    const update = () => {
      const secs = Math.floor((Date.now() - refreshedAt) / 1000)
      const h = String(Math.floor(secs / 3600)).padStart(2, "0")
      const m = String(Math.floor((secs % 3600) / 60)).padStart(2, "0")
      const s = String(secs % 60).padStart(2, "0")
      setElapsed(`${h}:${m}:${s}`)
    }
    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <header className="flex items-center justify-between border-b border-border bg-card px-5 py-2.5 shrink-0">
      {/* Left: Page title and description */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center h-8 w-8 rounded-md bg-primary/10">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h1 className="text-sm font-semibold tracking-tight text-foreground leading-tight">
            {meta.title}
          </h1>
          <p className="text-xs text-muted-foreground leading-tight">{meta.description}</p>
        </div>
      </div>

      {/* Right: Display controls */}
      <div className="flex items-center gap-2">
        {/* Live indicator */}
        <Badge
          variant="outline"
          className="gap-1.5 font-mono text-[10px] border-success/40 text-success bg-success/5 h-7"
        >
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
          LIVE
        </Badge>

        <Separator orientation="vertical" className="h-5" />

        {/* Elapsed since load */}
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          <span className="font-mono text-[11px] tabular-nums w-[60px]">{elapsed}</span>
        </div>

        <Separator orientation="vertical" className="h-5" />

        {/* Planning Period */}
        <div className="flex items-center gap-1.5">
          <CalendarRange className="h-3.5 w-3.5 text-muted-foreground" />
          {mounted ? (
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="h-7 w-[150px] text-[11px] bg-transparent border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableMonths.map((month) => (
                  <SelectItem key={month} value={month} className="text-xs">{month}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <div className="h-7 w-[150px] rounded-md border border-input bg-transparent px-2 flex items-center text-[11px] text-muted-foreground">
              {selectedMonth}
            </div>
          )}
        </div>

        <Separator orientation="vertical" className="h-5" />

        {/* View density */}
        <div className="flex items-center gap-1.5">
          <Monitor className="h-3.5 w-3.5 text-muted-foreground" />
          <Select value={density} onValueChange={(v) => onDensityChange(v as ViewDensity)}>
            <SelectTrigger className="h-7 w-[110px] text-[11px] bg-transparent border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="compact" className="text-xs">Compact</SelectItem>
              <SelectItem value="default" className="text-xs">Default</SelectItem>
              <SelectItem value="comfortable" className="text-xs">Comfortable</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Separator orientation="vertical" className="h-5" />

        {/* Auto-refresh controls */}
        <div className="flex items-center gap-1.5">
          <Button
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
            className="h-7 gap-1.5 text-[11px] px-2.5"
            onClick={() => onAutoRefreshChange(!autoRefresh)}
          >
            <RefreshCw className={`h-3 w-3 ${autoRefresh ? "animate-spin" : ""}`} />
            {autoRefresh ? "Auto" : "Refresh"}
          </Button>
          {autoRefresh && (
            <Select
              value={refreshInterval.toString()}
              onValueChange={(v) => onRefreshIntervalChange(parseInt(v))}
            >
              <SelectTrigger className="h-7 w-[70px] text-[11px] bg-transparent border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5" className="text-xs">5s</SelectItem>
                <SelectItem value="10" className="text-xs">10s</SelectItem>
                <SelectItem value="30" className="text-xs">30s</SelectItem>
                <SelectItem value="60" className="text-xs">60s</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
      </div>
    </header>
  )
}
