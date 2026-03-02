"use client"

import { usePathname } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  LayoutDashboard,
  Calendar,
  Settings2,
  FileBarChart,
  Clock,
  Monitor,
  Home,
  ClipboardList,
  CalendarRange,
  SlidersHorizontal,
} from "lucide-react"
import { useState, useEffect } from "react"
import { usePlanningPeriod, availableMonths, type OptimizerValues } from "@/components/planning-period-context"

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
  const [optimizerOpen, setOptimizerOpen] = useState(false)
  const { selectedMonth, setSelectedMonth, optimizerValues, setOptimizerValues } = usePlanningPeriod()

  // Local draft state for the dialog
  const [draft, setDraft] = useState<OptimizerValues>(optimizerValues)

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

  const handleOpenOptimizer = () => {
    setDraft(optimizerValues)
    setOptimizerOpen(true)
  }

  const handleSave = () => {
    setOptimizerValues(draft)
    setOptimizerOpen(false)
  }

  const handleNumericChange = (field: keyof OptimizerValues, value: string) => {
    const parsed = value === "" ? null : parseFloat(value)
    setDraft(prev => ({ ...prev, [field]: isNaN(parsed as number) ? null : parsed }))
  }

  return (
    <>
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
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1.5 text-muted-foreground cursor-default">
                  <Clock className="h-3.5 w-3.5" />
                  <span className="font-mono text-[11px] tabular-nums w-[60px]">{elapsed}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p className="text-xs">Time since simulation last updated</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

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
            {mounted ? (
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
            ) : (
              <div className="h-7 w-[110px] rounded-md border border-input bg-transparent px-2 flex items-center text-[11px] text-muted-foreground capitalize">
                {density}
              </div>
            )}
          </div>

          <Separator orientation="vertical" className="h-5" />

          {/* Configure Optimizer Values */}
          {mounted && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 gap-1.5 text-[11px] px-2.5"
              onClick={handleOpenOptimizer}
            >
              <SlidersHorizontal className="h-3 w-3" />
              Configure Optimizer
            </Button>
          )}
        </div>
      </header>

      {/* Configure Optimizer Values Dialog */}
      <Dialog open={optimizerOpen} onOpenChange={setOptimizerOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">Configure Optimizer Values</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Set the input parameters used by the optimizer to evaluate production scenarios.
              These values persist across all pages.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-medium">Target Utilization</Label>
                <div className="relative">
                  <Input
                    type="number"
                    placeholder="e.g. 60"
                    value={draft.targetUtilization ?? ""}
                    onChange={e => handleNumericChange("targetUtilization", e.target.value)}
                    className="h-8 text-xs pr-8"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">machines</span>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-medium">Shift Hours</Label>
                <div className="relative">
                  <Input
                    type="number"
                    placeholder="e.g. 8"
                    value={draft.shiftHours ?? ""}
                    onChange={e => handleNumericChange("shiftHours", e.target.value)}
                    className="h-8 text-xs pr-6"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">hr</span>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-medium">Shifts per Day</Label>
                <Input
                  type="number"
                  placeholder="e.g. 2"
                  value={draft.shiftsPerDay ?? ""}
                  onChange={e => handleNumericChange("shiftsPerDay", e.target.value)}
                  className="h-8 text-xs"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-medium">Buffer %</Label>
                <div className="relative">
                  <Input
                    type="number"
                    placeholder="e.g. 10"
                    value={draft.bufferPercent ?? ""}
                    onChange={e => handleNumericChange("bufferPercent", e.target.value)}
                    className="h-8 text-xs pr-5"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">%</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-medium">Notes</Label>
              <Textarea
                placeholder="Optional notes about this configuration..."
                value={draft.notes}
                onChange={e => setDraft(prev => ({ ...prev, notes: e.target.value }))}
                className="text-xs resize-none h-16"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" className="text-xs h-8" onClick={() => setOptimizerOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" className="text-xs h-8" onClick={handleSave}>
              Save Values
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}


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
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1.5 text-muted-foreground cursor-default">
                <Clock className="h-3.5 w-3.5" />
                <span className="font-mono text-[11px] tabular-nums w-[60px]">{elapsed}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p className="text-xs">Time since simulation last updated</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

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
          {mounted ? (
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
          ) : (
            <div className="h-7 w-[110px] rounded-md border border-input bg-transparent px-2 flex items-center text-[11px] text-muted-foreground capitalize">
              {density}
            </div>
          )}
        </div>

        <Separator orientation="vertical" className="h-5" />

        {/* Auto-refresh controls */}
        <div className="flex items-center gap-1.5">
          {mounted ? (
            <>
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
            </>
          ) : (
            <div className="h-7 w-[70px] rounded-md border border-input bg-transparent px-2 flex items-center text-[11px] text-muted-foreground">
              Refresh
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
