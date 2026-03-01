"use client"

import React, { useRef, useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Settings2,
  RotateCcw,
  Play,
  TrendingUp,
  TrendingDown,
  Info,
  Package,
  AlertTriangle,
} from "lucide-react"

// ------------------------------------------------------------------
// Types & data (shared with scheduling page)
// ------------------------------------------------------------------

interface InitialConditions {
  oee: number
  targetOutput: number
  availableHours: number
  cycleTime: number
  plannedDowntime: number
  laborEfficiency: number
  materialAvailability: number
  qualityRate: number
}

const defaultConditions: InitialConditions = {
  oee: 85,
  targetOutput: 140,
  availableHours: 16,
  cycleTime: 45,
  plannedDowntime: 2,
  laborEfficiency: 92,
  materialAvailability: 95,
  qualityRate: 98,
}

const baseCaseConditions: InitialConditions = {
  oee: 85,
  targetOutput: 140,
  availableHours: 16,
  cycleTime: 45,
  plannedDowntime: 2,
  laborEfficiency: 92,
  materialAvailability: 95,
  qualityRate: 98,
}

const bullCaseConditions: InitialConditions = {
  oee: 95,
  targetOutput: 180,
  availableHours: 20,
  cycleTime: 35,
  plannedDowntime: 1,
  laborEfficiency: 98,
  materialAvailability: 99,
  qualityRate: 99.5,
}

const bearCaseConditions: InitialConditions = {
  oee: 65,
  targetOutput: 100,
  availableHours: 12,
  cycleTime: 60,
  plannedDowntime: 4,
  laborEfficiency: 75,
  materialAvailability: 80,
  qualityRate: 92,
}

type ScenarioType = "custom" | "base" | "bull" | "bear"

interface PartCatalogItem {
  id: string
  programFamily: string
  partNumber: string
  description: string
  standardCycleTime: number
  priority: "high" | "medium" | "low"
  monthlyTarget: number
  currentScheduled: number
}

const partsCatalog: PartCatalogItem[] = [
  { id: "p1", programFamily: "F135", partNumber: "9S54111549G1S", description: "High Pressure Compressor Blade", standardCycleTime: 45, priority: "high", monthlyTarget: 120, currentScheduled: 85 },
  { id: "p2", programFamily: "F135", partNumber: "F135-LPT-002", description: "Low Pressure Turbine Disk", standardCycleTime: 60, priority: "high", monthlyTarget: 80, currentScheduled: 62 },
  { id: "p3", programFamily: "F135", partNumber: "F135-FAN-003", description: "Fan Blade Assembly", standardCycleTime: 35, priority: "medium", monthlyTarget: 100, currentScheduled: 78 },
  { id: "p4", programFamily: "GTF", partNumber: "GTF-GB-001", description: "Gearbox Housing", standardCycleTime: 55, priority: "high", monthlyTarget: 90, currentScheduled: 65 },
  { id: "p5", programFamily: "GTF", partNumber: "GTF-LPC-002", description: "Low Pressure Compressor Stator", standardCycleTime: 40, priority: "medium", monthlyTarget: 110, currentScheduled: 88 },
  { id: "p6", programFamily: "GTF", partNumber: "GTF-HPT-003", description: "High Pressure Turbine Blade", standardCycleTime: 50, priority: "high", monthlyTarget: 95, currentScheduled: 71 },
  { id: "p7", programFamily: "LEAP-1A", partNumber: "LEAP-CMB-001", description: "Combustor Liner", standardCycleTime: 65, priority: "medium", monthlyTarget: 75, currentScheduled: 58 },
  { id: "p8", programFamily: "LEAP-1A", partNumber: "LEAP-HPT-002", description: "HPT Nozzle Guide Vane", standardCycleTime: 48, priority: "high", monthlyTarget: 85, currentScheduled: 64 },
  { id: "p9", programFamily: "GEnx", partNumber: "GENX-LPT-001", description: "LPT Blade", standardCycleTime: 42, priority: "medium", monthlyTarget: 70, currentScheduled: 52 },
  { id: "p10", programFamily: "GEnx", partNumber: "GENX-HPC-002", description: "HPC Rotor", standardCycleTime: 70, priority: "low", monthlyTarget: 60, currentScheduled: 45 },
  { id: "p11", programFamily: "CFM56", partNumber: "CFM-HPT-001", description: "HPT Shroud", standardCycleTime: 38, priority: "low", monthlyTarget: 65, currentScheduled: 55 },
  { id: "p12", programFamily: "CFM56", partNumber: "CFM-FAN-002", description: "Fan Case", standardCycleTime: 55, priority: "low", monthlyTarget: 50, currentScheduled: 42 },
]

// ------------------------------------------------------------------
// DoubleClickSlider helper
// ------------------------------------------------------------------

function DoubleClickSlider({
  id,
  label,
  value,
  onChange,
  min,
  max,
  step,
  unit = "%",
}: {
  id: string
  label: string
  value: number
  onChange: (value: number) => void
  min: number
  max: number
  step: number
  unit?: string
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [inputValue, setInputValue] = useState(value.toString())
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDoubleClick = () => {
    setIsEditing(true)
    setInputValue(value.toString())
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  const handleInputBlur = () => {
    setIsEditing(false)
    const numValue = parseFloat(inputValue)
    if (!isNaN(numValue)) {
      onChange(Math.min(max, Math.max(min, numValue)))
    }
  }

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleInputBlur()
    } else if (e.key === "Escape") {
      setIsEditing(false)
      setInputValue(value.toString())
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label htmlFor={id} className="text-sm">{label}</Label>
        {isEditing ? (
          <Input
            ref={inputRef}
            type="number"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onBlur={handleInputBlur}
            onKeyDown={handleInputKeyDown}
            className="w-20 h-6 text-sm font-mono text-right px-2"
            min={min}
            max={max}
            step={step}
          />
        ) : (
          <span
            className="text-sm font-mono text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
            onDoubleClick={handleDoubleClick}
            title="Double-click to edit"
          >
            {value}{unit}
          </span>
        )}
      </div>
      <div onDoubleClick={handleDoubleClick} className="cursor-pointer">
        <Slider
          id={id}
          min={min}
          max={max}
          step={step}
          value={[value]}
          onValueChange={(v) => onChange(v[0])}
          className="w-full"
        />
      </div>
    </div>
  )
}

// ------------------------------------------------------------------
// MonthlyInputsContent component
// ------------------------------------------------------------------

export function MonthlyInputsContent() {
  const [conditions, setConditions] = useState<InitialConditions>(defaultConditions)
  const [appliedConditions, setAppliedConditions] = useState<InitialConditions>(defaultConditions)
  const [activeScenario, setActiveScenario] = useState<ScenarioType>("base")

  const handleApplyConditions = () => {
    setAppliedConditions({ ...conditions })
    setActiveScenario("custom")
  }

  const handleResetConditions = () => {
    setConditions(defaultConditions)
    setAppliedConditions(defaultConditions)
    setActiveScenario("custom")
  }

  const handleSelectScenario = (scenario: ScenarioType) => {
    setActiveScenario(scenario)
    if (scenario === "bull") {
      setConditions(bullCaseConditions)
      setAppliedConditions(bullCaseConditions)
    } else if (scenario === "bear") {
      setConditions(bearCaseConditions)
      setAppliedConditions(bearCaseConditions)
    } else if (scenario === "base") {
      setConditions(baseCaseConditions)
      setAppliedConditions(baseCaseConditions)
    } else {
      setConditions(defaultConditions)
      setAppliedConditions(defaultConditions)
    }
  }

  // Derived rollover / capacity info
  const rolloverInfo = useMemo(() => {
    const effectiveHoursPerDay = appliedConditions.availableHours - appliedConditions.plannedDowntime
    const unitsPerDay = Math.floor(
      (effectiveHoursPerDay * 60) /
      appliedConditions.cycleTime *
      (appliedConditions.oee / 100),
    )
    const weeklyCapacity = unitsPerDay * 5
    const monthlyCapacity = unitsPerDay * 22

    return {
      dailyCapacity: unitsPerDay,
      weeklyCapacity,
      monthlyCapacity,
      rolloverThreshold: Math.floor(unitsPerDay * 0.15),
      maxRolloverDays: 3,
    }
  }, [appliedConditions])

  const effectiveHours = appliedConditions.availableHours - appliedConditions.plannedDowntime
  const theoreticalDailyCapacity = Math.round(
    (effectiveHours * 60) /
    appliedConditions.cycleTime *
    (appliedConditions.oee / 100) *
    (appliedConditions.laborEfficiency / 100) *
    (appliedConditions.materialAvailability / 100) *
    (appliedConditions.qualityRate / 100),
  )

  return (
    <div className="flex flex-col gap-6 p-6 h-full overflow-auto">
      {/* Scenario Picker */}
      <div className="flex items-center gap-1.5">
        <span className="text-sm text-muted-foreground mr-1">Scenario:</span>
        <Button
          variant={activeScenario === "base" ? "default" : "outline"}
          size="sm"
          onClick={() => handleSelectScenario("base")}
          className={`gap-1.5 h-8 ${activeScenario === "base" ? "bg-slate-600 hover:bg-slate-700" : "bg-transparent"}`}
        >
          Base Case
        </Button>
        <Button
          variant={activeScenario === "bull" ? "default" : "outline"}
          size="sm"
          onClick={() => handleSelectScenario("bull")}
          className={`gap-1.5 h-8 ${activeScenario === "bull" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-transparent"}`}
        >
          <TrendingUp className="h-3.5 w-3.5" />
          Bull Case
        </Button>
        <Button
          variant={activeScenario === "bear" ? "default" : "outline"}
          size="sm"
          onClick={() => handleSelectScenario("bear")}
          className={`gap-1.5 h-8 ${activeScenario === "bear" ? "bg-red-600 hover:bg-red-700" : "bg-transparent"}`}
        >
          <TrendingDown className="h-3.5 w-3.5" />
          Bear Case
        </Button>
      </div>

      {/* Capacity Summary Card */}
      <Card className={`border-2 ${activeScenario === "bull" ? "border-emerald-200 bg-emerald-50/30" :
        activeScenario === "bear" ? "border-red-200 bg-red-50/30" :
          activeScenario === "base" ? "border-slate-200 bg-slate-50/30" :
            "border-border"
        }`}>
        <CardHeader className="py-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${activeScenario === "bull" ? "bg-emerald-100" :
              activeScenario === "bear" ? "bg-red-100" :
                activeScenario === "base" ? "bg-slate-100" :
                  "bg-muted"
              }`}>
              {activeScenario === "bull" ? (
                <TrendingUp className="h-5 w-5 text-emerald-600" />
              ) : activeScenario === "bear" ? (
                <TrendingDown className="h-5 w-5 text-red-600" />
              ) : (
                <Info className="h-5 w-5 text-slate-600" />
              )}
            </div>
            <div>
              <CardTitle className="text-base font-semibold">Capacity Summary</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Derived from the current parameter set
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0 pb-5">
          <div className="grid grid-cols-4 gap-4 text-center">
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold font-mono text-foreground">{theoreticalDailyCapacity}</p>
              <p className="text-xs text-muted-foreground font-medium">Units / Day</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold font-mono text-foreground">{rolloverInfo.weeklyCapacity}</p>
              <p className="text-xs text-muted-foreground font-medium">Units / Week</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold font-mono text-foreground">{rolloverInfo.monthlyCapacity}</p>
              <p className="text-xs text-muted-foreground font-medium">Units / Month</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold font-mono text-foreground">{effectiveHours}h</p>
              <p className="text-xs text-muted-foreground font-medium">Effective Hrs / Day</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Initial Conditions & Parameters Card (always expanded) */}
      <Card className="border border-border">
        <CardHeader className="py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings2 className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">Initial Conditions & Parameters</CardTitle>
              <span className="text-xs text-muted-foreground ml-2">(double-click slider to enter precise value)</span>
            </div>
            <span className="text-xs text-muted-foreground">
              OEE: {appliedConditions.oee}% | Target: {appliedConditions.targetOutput} units
            </span>
          </div>
        </CardHeader>
        <CardContent className="pt-0 pb-4">
          <Tabs defaultValue="efficiency" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="efficiency">Efficiency</TabsTrigger>
              <TabsTrigger value="capacity">Capacity</TabsTrigger>
              <TabsTrigger value="quality">Quality</TabsTrigger>
            </TabsList>

            <TabsContent value="efficiency" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <DoubleClickSlider id="oee" label="OEE" value={conditions.oee} onChange={(v) => setConditions((c) => ({ ...c, oee: v }))} min={50} max={100} step={1} />
                <DoubleClickSlider id="labor" label="Labor Efficiency" value={conditions.laborEfficiency} onChange={(v) => setConditions((c) => ({ ...c, laborEfficiency: v }))} min={50} max={100} step={1} />
                <DoubleClickSlider id="material" label="Material Availability" value={conditions.materialAvailability} onChange={(v) => setConditions((c) => ({ ...c, materialAvailability: v }))} min={50} max={100} step={1} />
              </div>
            </TabsContent>

            <TabsContent value="capacity" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <DoubleClickSlider id="target" label="Target Output (units)" value={conditions.targetOutput} onChange={(v) => setConditions((c) => ({ ...c, targetOutput: v }))} min={50} max={300} step={5} unit=" units" />
                <DoubleClickSlider id="hours" label="Available Hours/Day" value={conditions.availableHours} onChange={(v) => setConditions((c) => ({ ...c, availableHours: v }))} min={8} max={24} step={1} unit=" hrs" />
                <DoubleClickSlider id="cycle" label="Cycle Time (minutes)" value={conditions.cycleTime} onChange={(v) => setConditions((c) => ({ ...c, cycleTime: v }))} min={15} max={120} step={5} unit=" min" />
              </div>
            </TabsContent>

            <TabsContent value="quality" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <DoubleClickSlider id="quality" label="Quality Rate" value={conditions.qualityRate} onChange={(v) => setConditions((c) => ({ ...c, qualityRate: v }))} min={80} max={100} step={0.5} />
                <DoubleClickSlider id="downtime" label="Planned Downtime (hours)" value={conditions.plannedDowntime} onChange={(v) => setConditions((c) => ({ ...c, plannedDowntime: v }))} min={0} max={8} step={0.5} unit=" hrs" />
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t border-border">
            <Button variant="outline" size="sm" onClick={handleResetConditions} className="gap-1.5 bg-transparent">
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </Button>
            <Button size="sm" onClick={handleApplyConditions} className="gap-1.5">
              <Play className="h-3.5 w-3.5" />
              Apply & Recalculate
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Part List / Data Card */}
      <Card className="border border-border">
        <CardHeader className="py-3">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">Part List / Data</CardTitle>
            <Badge variant="secondary" className="text-xs">{partsCatalog.length} parts</Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0 pb-4 space-y-3">
          {/* Rollover Conditions Info */}
          <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-amber-800">Rollover Conditions & Scheduling Logic</h4>
                <p className="text-xs text-amber-700 mt-1">
                  Daily capacity: <span className="font-mono font-semibold">{rolloverInfo.dailyCapacity} units</span> |
                  Rollover threshold: <span className="font-mono font-semibold">{rolloverInfo.rolloverThreshold} units</span> |
                  Max rollover: <span className="font-mono font-semibold">{rolloverInfo.maxRolloverDays} days</span>
                </p>
                <p className="text-xs text-amber-600 mt-1">
                  Parts exceeding daily capacity will automatically roll over to the next available slot within {rolloverInfo.maxRolloverDays} days.
                </p>
              </div>
            </div>
          </div>

          {/* Parts Catalog Table */}
          <div className="border rounded-lg overflow-hidden">
            <div className="max-h-[440px] overflow-y-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-muted/90 backdrop-blur-sm">
                  <TableRow>
                    <TableHead className="font-semibold text-xs w-[100px]">Family</TableHead>
                    <TableHead className="font-semibold text-xs">Part Number</TableHead>
                    <TableHead className="font-semibold text-xs">Description</TableHead>
                    <TableHead className="font-semibold text-xs text-center w-[80px]">Priority</TableHead>
                    <TableHead className="font-semibold text-xs text-right w-[100px]">Monthly Target</TableHead>
                    <TableHead className="font-semibold text-xs text-right w-[100px]">Scheduled</TableHead>
                    <TableHead className="font-semibold text-xs text-right w-[80px]">VP</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {partsCatalog.map((part) => {
                    const gap = part.monthlyTarget - part.currentScheduled
                    const gapPercent = ((gap / part.monthlyTarget) * 100).toFixed(0)
                    return (
                      <TableRow key={part.id} className="hover:bg-muted/30">
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`font-medium text-xs ${part.programFamily === "F135" ? "border-blue-300 text-blue-700 bg-blue-50" :
                              part.programFamily === "GTF" ? "border-purple-300 text-purple-700 bg-purple-50" :
                                part.programFamily === "LEAP-1A" ? "border-emerald-300 text-emerald-700 bg-emerald-50" :
                                  part.programFamily === "GEnx" ? "border-amber-300 text-amber-700 bg-amber-50" :
                                    "border-gray-300 text-gray-700 bg-gray-50"
                              }`}
                          >
                            {part.programFamily}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs">{part.partNumber}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{part.description}</TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant="outline"
                            className={`text-xs ${part.priority === "high" ? "border-red-300 text-red-700 bg-red-50" :
                              part.priority === "medium" ? "border-amber-300 text-amber-700 bg-amber-50" :
                                "border-gray-300 text-gray-600 bg-gray-50"
                              }`}
                          >
                            {part.priority}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-right">{part.monthlyTarget}</TableCell>
                        <TableCell className="font-mono text-xs text-right">{part.currentScheduled}</TableCell>
                        <TableCell className={`font-mono text-xs text-right font-semibold ${gap > part.monthlyTarget * 0.3 ? "text-red-600" :
                          gap > part.monthlyTarget * 0.15 ? "text-amber-600" :
                            "text-emerald-600"
                          }`}>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="cursor-help underline decoration-dotted underline-offset-2">
                                  {gap} ({gapPercent}%)
                                </span>
                              </TooltipTrigger>
                              <TooltipContent side="left" className="max-w-[280px] p-3 bg-card border border-border shadow-lg text-foreground">
                                <div className="space-y-2">
                                  <p className="font-semibold text-sm">Variance to Plan (VP)</p>
                                  <p className="text-xs text-muted-foreground">
                                    The difference between the monthly production target and units currently scheduled.
                                  </p>
                                  <div className="text-xs space-y-1 pt-1 border-t">
                                    <p><span className="text-muted-foreground">Target:</span> <span className="font-mono">{part.monthlyTarget}</span></p>
                                    <p><span className="text-muted-foreground">Scheduled:</span> <span className="font-mono">{part.currentScheduled}</span></p>
                                    <p><span className="text-muted-foreground">Remaining:</span> <span className="font-mono font-semibold">{gap} units ({gapPercent}%)</span></p>
                                  </div>
                                  <p className="text-xs text-muted-foreground pt-1 border-t">
                                    {gap > part.monthlyTarget * 0.3
                                      ? "High variance - immediate scheduling attention needed."
                                      : gap > part.monthlyTarget * 0.15
                                        ? "Moderate variance - schedule additional units soon."
                                        : "On track - variance within acceptable range."}
                                  </p>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
