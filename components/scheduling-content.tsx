"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { 
  ChevronDown, 
  ChevronUp, 
  Calendar,
  CalendarDays,
  CalendarRange,
  Info,
  Download,
  Plus,
  Zap,
  Check,
  Trash2
} from "lucide-react"


type ViewType = "daily" | "weekly" | "monthly"

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

// Program families and part data
const programFamilies = ["F135", "GTF", "LEAP-1A", "GEnx", "CFM56"]
const partPrefixes: Record<string, string[]> = {
  "F135": ["F135-HPC", "F135-LPT", "F135-FAN"],
  "GTF": ["GTF-GB", "GTF-LPC", "GTF-HPT"],
  "LEAP-1A": ["LEAP-CMB", "LEAP-HPT", "LEAP-FAN"],
  "GEnx": ["GENX-LPT", "GENX-HPC", "GENX-CMB"],
  "CFM56": ["CFM-HPT", "CFM-LPC", "CFM-FAN"],
}

interface ScheduleItem {
  id: string
  programFamily: string
  partNumber: string
  quantity: number
  serialCode: string
  scheduledDate: string
  isManuallyAdded?: boolean
  selected?: boolean
}

// Available parts catalog for adding to schedule
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
  { id: "p1", programFamily: "F135", partNumber: "F135-HPC-001", description: "High Pressure Compressor Blade", standardCycleTime: 45, priority: "high", monthlyTarget: 120, currentScheduled: 85 },
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

export function SchedulingContent() {
  const [viewType, setViewType] = useState<ViewType>("weekly")
  const [appliedConditions, setAppliedConditions] = useState<InitialConditions>(defaultConditions)
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [manuallyAddedItems, setManuallyAddedItems] = useState<ScheduleItem[]>([])
  const [selectedDay, setSelectedDay] = useState<number>(0) // For daily view, which day is selected
  const [isAddPartDialogOpen, setIsAddPartDialogOpen] = useState(false)
  const [selectedPartToAdd, setSelectedPartToAdd] = useState<string>("")
  const [addPartQuantity, setAddPartQuantity] = useState(1)
  const [addPartScheduleOption, setAddPartScheduleOption] = useState<"today" | "optimal">("today")
  const [partSearchQuery, setPartSearchQuery] = useState("")

  // Filter parts catalog based on search query
  const filteredPartsCatalog = useMemo(() => {
    if (!partSearchQuery.trim()) return partsCatalog
    const query = partSearchQuery.toLowerCase()
    return partsCatalog.filter(part => 
      part.partNumber.toLowerCase().includes(query) ||
      part.programFamily.toLowerCase().includes(query) ||
      part.description.toLowerCase().includes(query)
    )
  }, [partSearchQuery])

  const scheduleItems = useMemo(() => {
    const effectiveCapacity = (appliedConditions.availableHours - appliedConditions.plannedDowntime) * 
      60 / appliedConditions.cycleTime * 
      (appliedConditions.oee / 100) * 
      (appliedConditions.laborEfficiency / 100) *
      (appliedConditions.materialAvailability / 100) *
      (appliedConditions.qualityRate / 100)

    // More realistic item counts based on view type
    const baseItems = viewType === "daily" ? 8 : viewType === "weekly" ? 25 : 60
    const capacityMultiplier = effectiveCapacity / 14 // Normalize around base capacity
    const itemsPerPeriod = Math.max(3, Math.round(baseItems * capacityMultiplier))
    
    const periods = viewType === "daily" ? 7 : viewType === "weekly" ? 4 : 3
    const startDate = new Date(2024, 0, 8) // Start from Jan 8, 2024

    const items: ScheduleItem[] = []
    let serialCounter = 1000 + Math.floor(Math.random() * 9000)

    // Program family distribution
    const familyWeights = {
      "F135": 0.25,
      "GTF": 0.25,
      "LEAP-1A": 0.20,
      "GEnx": 0.15,
      "CFM56": 0.15,
    }

    const selectWeightedFamily = () => {
      const rand = Math.random()
      let cumulative = 0
      for (const [family, weight] of Object.entries(familyWeights)) {
        cumulative += weight
        if (rand < cumulative) return family
      }
      return "GTF"
    }

    for (let p = 0; p < periods; p++) {
      const periodDate = new Date(startDate)
      if (viewType === "daily") {
        periodDate.setDate(periodDate.getDate() + p)
      } else if (viewType === "weekly") {
        periodDate.setDate(periodDate.getDate() + p * 7)
      } else {
        periodDate.setMonth(periodDate.getMonth() + p)
      }

      // Vary item count by period with realistic patterns
      const periodVariation = viewType === "daily" 
        ? (p === 5 || p === 6 ? 0.6 : 1.0) // Weekend reduction for daily
        : viewType === "weekly"
          ? (p === 0 ? 0.9 : p === 3 ? 1.1 : 1.0) // Ramp up pattern for weekly
          : (p === 1 ? 1.15 : 1.0) // Peak in second month for monthly

      const itemCount = Math.max(2, Math.round(itemsPerPeriod * periodVariation * (0.85 + Math.random() * 0.3)))

      for (let i = 0; i < itemCount; i++) {
        const family = selectWeightedFamily()
        const parts = partPrefixes[family]
        const partBase = parts[Math.floor(Math.random() * parts.length)]
        const partSuffix = String(Math.floor(Math.random() * 900) + 100)

        // More realistic quantities
        const baseQty = 4
        const quantity = Math.max(1, Math.round(baseQty * (0.5 + Math.random())))

        items.push({
          id: `item-${p}-${i}`,
          programFamily: family,
          partNumber: `${partBase}-${partSuffix}`,
          quantity,
          serialCode: `SN-${serialCounter++}`,
          scheduledDate: periodDate.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          }),
        })
      }
    }

    return items
  }, [viewType, appliedConditions])

  // Combine generated and manually added items, filter for daily view
  const displayedScheduleItems = useMemo(() => {
    const allItems = [...scheduleItems, ...manuallyAddedItems]
    
    if (viewType === "daily") {
      // For daily view, show only selected day's items
      const startDate = new Date(2024, 0, 8)
      const targetDate = new Date(startDate)
      targetDate.setDate(targetDate.getDate() + selectedDay)
      const targetDateStr = targetDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
      return allItems.filter(item => item.scheduledDate === targetDateStr)
    }
    
    return allItems
  }, [scheduleItems, manuallyAddedItems, viewType, selectedDay])

  // Get available days for daily view navigation
  const availableDays = useMemo(() => {
    const startDate = new Date(2024, 0, 8)
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(startDate)
      date.setDate(date.getDate() + i)
      return {
        index: i,
        label: date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
        date: date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      }
    })
  }, [])

  // Calculate summary metrics
  const summaryMetrics = useMemo(() => {
    const totalQuantity = scheduleItems.reduce((sum, item) => sum + item.quantity, 0)
    const uniqueParts = new Set(scheduleItems.map(item => item.partNumber)).size
    const familyCounts = programFamilies.map(family => ({
      family,
      count: scheduleItems.filter(item => item.programFamily === family).reduce((sum, item) => sum + item.quantity, 0),
    }))
    const totalDays = viewType === "daily" ? 7 : viewType === "weekly" ? 28 : 90
    const avgPerDay = (totalQuantity / totalDays).toFixed(1)
    
    return {
      totalQuantity,
      uniqueParts,
      familyCounts,
      avgPerDay,
      totalItems: scheduleItems.length,
    }
  }, [scheduleItems, viewType])

  // Generate summary explanation
  const summaryExplanation = useMemo(() => {
    const effectiveHours = appliedConditions.availableHours - appliedConditions.plannedDowntime
    const theoreticalCapacity = Math.round(
      effectiveHours * 60 / appliedConditions.cycleTime * 
      (appliedConditions.oee / 100) * 
      (appliedConditions.laborEfficiency / 100) *
      (appliedConditions.materialAvailability / 100) *
      (appliedConditions.qualityRate / 100)
    )

    const viewPeriod = viewType === "daily" ? "7-day" : viewType === "weekly" ? "4-week" : "3-month"
    const topFamilies = summaryMetrics.familyCounts
      .sort((a, b) => b.count - a.count)
      .slice(0, 2)
      .map(f => f.family)
      .join(" and ")

    return {
      viewPeriod,
      theoreticalCapacity,
      effectiveHours,
      topFamilies,
    }
  }, [appliedConditions, viewType, summaryMetrics])

  const handleSelectScenario = (scenario: ScenarioType) => {
    setActiveScenario(scenario)
    if (scenario === "bull") {
      setAppliedConditions(bullCaseConditions)
    } else if (scenario === "bear") {
      setAppliedConditions(bearCaseConditions)
    } else if (scenario === "base") {
      setAppliedConditions(baseCaseConditions)
    } else {
      setAppliedConditions(defaultConditions)
    }
  }

  const handleExportCSV = () => {
    const headers = ["Program Family", "Part Number", "Quantity", "Serial Code", "Scheduled Date"]
    const rows = displayedScheduleItems.map(item => [
      item.programFamily,
      item.partNumber,
      item.quantity.toString(),
      item.serialCode,
      item.scheduledDate
    ])
    
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n")
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `schedule-${viewType}-${activeScenario}-${new Date().toISOString().split("T")[0]}.csv`
    link.click()
    URL.revokeObjectURL(link.href)
  }

  const handleToggleItemSelection = (itemId: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev)
      if (newSet.has(itemId)) {
        newSet.delete(itemId)
      } else {
        newSet.add(itemId)
      }
      return newSet
    })
  }

  const handleSelectAllItems = () => {
    if (selectedItems.size === scheduleItems.length) {
      setSelectedItems(new Set())
    } else {
      setSelectedItems(new Set(scheduleItems.map(item => item.id)))
    }
  }

  const handleDeleteSelectedItems = () => {
    setManuallyAddedItems(prev => prev.filter(item => !selectedItems.has(item.id)))
    setSelectedItems(new Set())
  }

  const handleAddPartToSchedule = () => {
    if (!selectedPartToAdd) return

    const partInfo = partsCatalog.find(p => p.id === selectedPartToAdd)
    if (!partInfo) return

    const today = new Date(2024, 0, 8) // Base date
    let scheduleDate: Date

    if (addPartScheduleOption === "today") {
      scheduleDate = new Date(today)
      if (viewType === "daily") {
        scheduleDate.setDate(scheduleDate.getDate() + selectedDay)
      }
    } else {
      // Optimal placement - find the day with lowest utilization
      const gap = partInfo.monthlyTarget - partInfo.currentScheduled
      const daysRemaining = 30 - (today.getDate() - 1)
      const optimalDay = Math.min(Math.floor(gap / (partInfo.monthlyTarget / 30)) + 3, daysRemaining)
      scheduleDate = new Date(today)
      scheduleDate.setDate(scheduleDate.getDate() + optimalDay)
    }

    const newItem: ScheduleItem = {
      id: `manual-${Date.now()}`,
      programFamily: partInfo.programFamily,
      partNumber: partInfo.partNumber,
      quantity: addPartQuantity,
      serialCode: `SN-M${Math.floor(Math.random() * 9000) + 1000}`,
      scheduledDate: scheduleDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      isManuallyAdded: true,
    }

    setManuallyAddedItems(prev => [...prev, newItem])
    setIsAddPartDialogOpen(false)
    setSelectedPartToAdd("")
    setAddPartQuantity(1)
    setAddPartScheduleOption("today")
    setPartSearchQuery("")
  }

  // Calculate rollover info
  const rolloverInfo = useMemo(() => {
    const effectiveHoursPerDay = appliedConditions.availableHours - appliedConditions.plannedDowntime
    const unitsPerDay = Math.floor(effectiveHoursPerDay * 60 / appliedConditions.cycleTime * (appliedConditions.oee / 100))
    const weeklyCapacity = unitsPerDay * 5 // Assuming 5 working days
    const monthlyCapacity = unitsPerDay * 22 // Assuming 22 working days

    return {
      dailyCapacity: unitsPerDay,
      weeklyCapacity,
      monthlyCapacity,
      rolloverThreshold: Math.floor(unitsPerDay * 0.15), // 15% buffer for rollover
      maxRolloverDays: 3,
    }
  }, [appliedConditions])

  return (
    <div className="flex flex-col gap-4 p-6 h-full overflow-auto">
      {/* View Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {/* View Toggle */}
          <div className="flex items-center bg-muted rounded-lg p-1">
            <Button
              variant={viewType === "daily" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewType("daily")}
              className="gap-1.5"
            >
              <Calendar className="h-4 w-4" />
              Daily
            </Button>
            <Button
              variant={viewType === "weekly" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewType("weekly")}
              className="gap-1.5"
            >
              <CalendarDays className="h-4 w-4" />
              Weekly
            </Button>
            <Button
              variant={viewType === "monthly" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewType("monthly")}
              className="gap-1.5"
            >
              <CalendarRange className="h-4 w-4" />
              Monthly
            </Button>
          </div>
        </div>
      </div>

      {/* Schedule Table */}
      <Card className="border border-border">
        <CardHeader className="py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CardTitle className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                {viewType === "daily" ? "Daily Schedule" : viewType === "weekly" ? "Weekly Schedule" : "Monthly Schedule"}
              </CardTitle>
              {viewType === "daily" && (
                <Badge variant="outline" className="font-medium border-blue-300 text-blue-700 bg-blue-50">
                  {availableDays[selectedDay]?.label}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="font-mono">
                {displayedScheduleItems.length} items
              </Badge>
              <Badge variant="secondary" className="font-mono">
                {displayedScheduleItems.reduce((sum, item) => sum + item.quantity, 0)} units
              </Badge>
              {selectedItems.size > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDeleteSelectedItems}
                  className="gap-1.5 h-7 text-red-600 border-red-200 hover:bg-red-50 bg-transparent"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Remove ({selectedItems.size})
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAddPartDialogOpen(true)}
                className="gap-1.5 h-7 bg-transparent"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Part
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportCSV}
                className="gap-1.5 h-7 bg-transparent"
              >
                <Download className="h-3.5 w-3.5" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pb-4">
          {/* Daily View Navigation */}
          {viewType === "daily" && (
            <div className="mb-4 p-3 rounded-lg bg-muted/50 border border-border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground">Select Day:</span>
                <span className="text-xs text-muted-foreground">
                  Showing {displayedScheduleItems.length} items for {availableDays[selectedDay]?.label}
                </span>
              </div>
              <div className="flex gap-1">
                {availableDays.map((day) => (
                  <Button
                    key={day.index}
                    variant={selectedDay === day.index ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedDay(day.index)}
                    className={`flex-1 h-9 text-xs ${selectedDay === day.index ? "" : "bg-transparent"}`}
                  >
                    {day.label}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Metrics Row */}
          <div className="grid grid-cols-5 gap-4 mb-4">
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-xs text-muted-foreground">Total Quantity</p>
              <p className="text-lg font-semibold font-mono">{displayedScheduleItems.reduce((sum, item) => sum + item.quantity, 0)}</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-xs text-muted-foreground">Unique Parts</p>
              <p className="text-lg font-semibold font-mono">{new Set(displayedScheduleItems.map(item => item.partNumber)).size}</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-xs text-muted-foreground">{viewType === "daily" ? "Today" : "Avg/Day"}</p>
              <p className="text-lg font-semibold font-mono">
                {viewType === "daily" 
                  ? displayedScheduleItems.reduce((sum, item) => sum + item.quantity, 0)
                  : summaryMetrics.avgPerDay
                }
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-xs text-muted-foreground">Schedule Items</p>
              <p className="text-lg font-semibold font-mono">{displayedScheduleItems.length}</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-xs text-muted-foreground">Capacity Util.</p>
              <p className={`text-lg font-semibold font-mono ${
                viewType === "daily"
                  ? displayedScheduleItems.reduce((sum, item) => sum + item.quantity, 0) > rolloverInfo.dailyCapacity
                    ? "text-red-600"
                    : "text-emerald-600"
                  : "text-emerald-600"
              }`}>
                {viewType === "daily"
                  ? Math.round((displayedScheduleItems.reduce((sum, item) => sum + item.quantity, 0) / rolloverInfo.dailyCapacity) * 100)
                  : Math.min(100, Math.round((summaryMetrics.totalQuantity / (appliedConditions.targetOutput * (viewType === "weekly" ? 28 : 90))) * 100))
                }%
              </p>
            </div>
          </div>

          {/* Table */}
          <div className="border rounded-lg overflow-hidden">
            <div className="max-h-[400px] overflow-y-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-muted/80 backdrop-blur-sm">
                  <TableRow>
                    <TableHead className="w-[40px]">
                      <Checkbox
                        checked={selectedItems.size === displayedScheduleItems.length && displayedScheduleItems.length > 0}
                        onCheckedChange={handleSelectAllItems}
                      />
                    </TableHead>
                    <TableHead className="font-semibold text-xs">Program Family</TableHead>
                    <TableHead className="font-semibold text-xs">Part Number</TableHead>
                    <TableHead className="font-semibold text-xs text-right">Quantity</TableHead>
                    <TableHead className="font-semibold text-xs">Serial Code</TableHead>
                    <TableHead className="font-semibold text-xs">Scheduled Date</TableHead>
                    <TableHead className="font-semibold text-xs w-[80px]">Source</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayedScheduleItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No items scheduled for this {viewType === "daily" ? "day" : "period"}. Click "Add Part" to add items.
                      </TableCell>
                    </TableRow>
                  ) : (
                    displayedScheduleItems.map((item) => (
                      <TableRow 
                        key={item.id} 
                        className={`hover:bg-muted/30 ${selectedItems.has(item.id) ? "bg-blue-50" : ""} ${item.isManuallyAdded ? "bg-emerald-50/50" : ""}`}
                      >
                        <TableCell>
                          <Checkbox
                            checked={selectedItems.has(item.id)}
                            onCheckedChange={() => handleToggleItemSelection(item.id)}
                          />
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline" 
                            className={`font-medium ${
                              item.programFamily === "F135" ? "border-blue-300 text-blue-700 bg-blue-50" :
                              item.programFamily === "GTF" ? "border-purple-300 text-purple-700 bg-purple-50" :
                              item.programFamily === "LEAP-1A" ? "border-emerald-300 text-emerald-700 bg-emerald-50" :
                              item.programFamily === "GEnx" ? "border-amber-300 text-amber-700 bg-amber-50" :
                              "border-gray-300 text-gray-700 bg-gray-50"
                            }`}
                          >
                            {item.programFamily}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{item.partNumber}</TableCell>
                        <TableCell className="font-mono text-sm text-right">{item.quantity}</TableCell>
                        <TableCell className="font-mono text-sm text-muted-foreground">{item.serialCode}</TableCell>
                        <TableCell className="text-sm">{item.scheduledDate}</TableCell>
                        <TableCell>
                          {item.isManuallyAdded ? (
                            <Badge variant="outline" className="text-xs border-emerald-300 text-emerald-700 bg-emerald-50">
                              Manual
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs border-gray-300 text-gray-600 bg-gray-50">
                              Auto
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Executive Summary - Enhanced Visual Card */}
      <Card className={`border-2 ${
        activeScenario === "bull" ? "border-emerald-200 bg-emerald-50/30" :
        activeScenario === "bear" ? "border-red-200 bg-red-50/30" :
        activeScenario === "base" ? "border-slate-200 bg-slate-50/30" :
        "border-border"
      }`}>
        <CardHeader className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${
                activeScenario === "bull" ? "bg-emerald-100" :
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
                <CardTitle className="text-base font-semibold">Executive Summary</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {activeScenario === "bull" ? "Optimistic scenario  |  High throughput projections" :
                   activeScenario === "bear" ? "Conservative scenario  |  Risk-adjusted projections" :
                   activeScenario === "base" ? "Baseline scenario  |  Standard operating conditions" :
                   "Custom configuration  |  User-defined parameters"}
                </p>
              </div>
            </div>
            {activeScenario !== "custom" && (
              <Badge 
                variant="outline" 
                className={`text-xs font-semibold px-3 py-1 ${
                  activeScenario === "bull" ? "border-emerald-400 text-emerald-700 bg-emerald-100" :
                  activeScenario === "bear" ? "border-red-400 text-red-700 bg-red-100" :
                  "border-slate-400 text-slate-700 bg-slate-100"
                }`}
              >
                {activeScenario === "bull" ? "BULL" : activeScenario === "bear" ? "BEAR" : "BASE"}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0 pb-5">
          {/* Key Metrics Highlight */}
          <div className={`mb-4 p-4 rounded-xl ${
            activeScenario === "bull" ? "bg-emerald-100/50 border border-emerald-200" :
            activeScenario === "bear" ? "bg-red-100/50 border border-red-200" :
            activeScenario === "base" ? "bg-slate-100/50 border border-slate-200" :
            "bg-muted/50 border border-border"
          }`}>
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold font-mono text-foreground">{summaryMetrics.totalQuantity}</p>
                <p className="text-xs text-muted-foreground font-medium">Total Units</p>
              </div>
              <div>
                <p className="text-2xl font-bold font-mono text-foreground">{summaryMetrics.avgPerDay}</p>
                <p className="text-xs text-muted-foreground font-medium">Units/Day</p>
              </div>
              <div>
                <p className="text-2xl font-bold font-mono text-foreground">{summaryExplanation.theoreticalCapacity}</p>
                <p className="text-xs text-muted-foreground font-medium">Daily Capacity</p>
              </div>
              <div>
                <p className={`text-2xl font-bold font-mono ${
                  Number(summaryMetrics.avgPerDay) >= summaryExplanation.theoreticalCapacity * 0.8 ? "text-emerald-600" :
                  Number(summaryMetrics.avgPerDay) >= summaryExplanation.theoreticalCapacity * 0.6 ? "text-amber-600" :
                  "text-red-600"
                }`}>
                  {Math.round((Number(summaryMetrics.avgPerDay) / summaryExplanation.theoreticalCapacity) * 100)}%
                </p>
                <p className="text-xs text-muted-foreground font-medium">Utilization</p>
              </div>
            </div>
          </div>

          {/* Scenario Description */}
          {activeScenario !== "custom" && (
            <div className={`mb-4 p-3 rounded-lg border-l-4 ${
              activeScenario === "bull" ? "border-l-emerald-500 bg-emerald-50" :
              activeScenario === "bear" ? "border-l-red-500 bg-red-50" :
              "border-l-slate-500 bg-slate-50"
            }`}>
              <p className={`text-sm ${
                activeScenario === "bull" ? "text-emerald-800" :
                activeScenario === "bear" ? "text-red-800" :
                "text-slate-800"
              }`}>
                {activeScenario === "bull" 
                  ? "This projection assumes optimal conditions: 95% OEE, 20h operating window, 35min cycle time, and minimal downtime. Requires full staffing, uninterrupted material supply, and peak equipment performance."
                  : activeScenario === "bear"
                    ? "Conservative estimate accounting for potential disruptions: 65% OEE, 12h operating window, 60min cycle time, and 4h planned downtime. Factors in supply chain risks, equipment constraints, and reduced labor availability."
                    : "Baseline projection using standard operating parameters: 85% OEE, 16h operating window, 45min cycle time, and 2h planned downtime. Represents typical production conditions."
                }
              </p>
            </div>
          )}

          {/* Detailed Analysis Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-4 rounded-lg border border-border bg-card">
              <h4 className="font-semibold text-sm text-foreground mb-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                Schedule Overview
              </h4>
              <p className="text-sm text-muted-foreground">
                This {summaryExplanation.viewPeriod} schedule allocates{" "}
                <span className="font-mono font-semibold text-foreground">{summaryMetrics.totalQuantity} units</span> across{" "}
                <span className="font-mono font-semibold text-foreground">{summaryMetrics.uniqueParts} unique parts</span> and{" "}
                <span className="font-mono font-semibold text-foreground">{summaryMetrics.totalItems} work orders</span>.
              </p>
            </div>

            <div className="p-4 rounded-lg border border-border bg-card">
              <h4 className="font-semibold text-sm text-foreground mb-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                Capacity Parameters
              </h4>
              <p className="text-sm text-muted-foreground">
                Operating at <span className="font-mono font-semibold text-foreground">{appliedConditions.oee}% OEE</span> with{" "}
                <span className="font-mono font-semibold text-foreground">{summaryExplanation.effectiveHours}h</span> effective production time 
                and <span className="font-mono font-semibold text-foreground">{appliedConditions.cycleTime}min</span> cycle time.
              </p>
            </div>

            <div className="p-4 rounded-lg border border-border bg-card">
              <h4 className="font-semibold text-sm text-foreground mb-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                Program Distribution
              </h4>
              <p className="text-sm text-muted-foreground">
                Priority allocation to <span className="font-semibold text-foreground">{summaryExplanation.topFamilies}</span> families, 
                targeting <span className="font-mono font-semibold text-foreground">{appliedConditions.qualityRate}%</span> quality rate.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Part to Schedule Dialog */}
      <Dialog open={isAddPartDialogOpen} onOpenChange={setIsAddPartDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add Part to Schedule
            </DialogTitle>
            <DialogDescription>
              Select a part and choose when to schedule it. The system can automatically find the optimal placement based on demand targets.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Part Selection with Search */}
            <div className="space-y-2">
              <Label>Select Part</Label>
              <div className="space-y-2">
                {/* Search Input */}
                <Input
                  type="text"
                  placeholder="Search by part number, family, or description..."
                  value={partSearchQuery}
                  onChange={(e) => setPartSearchQuery(e.target.value)}
                  className="w-full"
                />
                {/* Dropdown Select */}
                <Select value={selectedPartToAdd} onValueChange={setSelectedPartToAdd}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a part to schedule..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-[240px]">
                    {filteredPartsCatalog.length === 0 ? (
                      <div className="py-4 text-center text-sm text-muted-foreground">
                        No parts found matching "{partSearchQuery}"
                      </div>
                    ) : (
                      filteredPartsCatalog.map((part) => {
                        const gap = part.monthlyTarget - part.currentScheduled
                        return (
                          <SelectItem key={part.id} value={part.id}>
                            <div className="flex items-center gap-2">
                              <Badge 
                                variant="outline" 
                                className={`text-xs ${
                                  part.programFamily === "F135" ? "border-blue-300 text-blue-700 bg-blue-50" :
                                  part.programFamily === "GTF" ? "border-purple-300 text-purple-700 bg-purple-50" :
                                  part.programFamily === "LEAP-1A" ? "border-emerald-300 text-emerald-700 bg-emerald-50" :
                                  part.programFamily === "GEnx" ? "border-amber-300 text-amber-700 bg-amber-50" :
                                  "border-gray-300 text-gray-700 bg-gray-50"
                                }`}
                              >
                                {part.programFamily}
                              </Badge>
                              <span className="font-mono text-sm">{part.partNumber}</span>
                              <span className={`text-xs ${gap > 20 ? "text-red-600" : "text-muted-foreground"}`}>
                                (VP: {gap})
                              </span>
                            </div>
                          </SelectItem>
                        )
                      })
                    )}
                  </SelectContent>
                </Select>
                {partSearchQuery && (
                  <p className="text-xs text-muted-foreground">
                    Showing {filteredPartsCatalog.length} of {partsCatalog.length} parts
                  </p>
                )}
              </div>
            </div>

            {/* Selected Part Info */}
            {selectedPartToAdd && (
              <div className="p-3 rounded-lg bg-muted/50 border border-border">
                {(() => {
                  const part = partsCatalog.find(p => p.id === selectedPartToAdd)
                  if (!part) return null
                  const gap = part.monthlyTarget - part.currentScheduled
                  return (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">{part.description}</p>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <span className="text-muted-foreground">Priority: </span>
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${
                              part.priority === "high" ? "border-red-300 text-red-700 bg-red-50" :
                              part.priority === "medium" ? "border-amber-300 text-amber-700 bg-amber-50" :
                              "border-gray-300 text-gray-600 bg-gray-50"
                            }`}
                          >
                            {part.priority}
                          </Badge>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Target: </span>
                          <span className="font-mono font-semibold">{part.monthlyTarget}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">VP: </span>
                          <span className={`font-mono font-semibold ${gap > 20 ? "text-red-600" : "text-emerald-600"}`}>{gap}</span>
                        </div>
                      </div>
                    </div>
                  )
                })()}
              </div>
            )}

            {/* Quantity */}
            <div className="space-y-2">
              <Label>Quantity</Label>
              <Input
                type="number"
                min={1}
                max={50}
                value={addPartQuantity}
                onChange={(e) => setAddPartQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="font-mono"
              />
            </div>

            {/* Schedule Option */}
            <div className="space-y-3">
              <Label>When to Schedule</Label>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant={addPartScheduleOption === "today" ? "default" : "outline"}
                  className={`h-auto py-3 flex flex-col items-center gap-1 ${addPartScheduleOption !== "today" ? "bg-transparent" : ""}`}
                  onClick={() => setAddPartScheduleOption("today")}
                >
                  <Calendar className="h-5 w-5" />
                  <span className="text-sm font-medium">
                    {viewType === "daily" ? availableDays[selectedDay]?.label : "Today"}
                  </span>
                  <span className="text-xs text-accent">Schedule immediately</span>
                </Button>
                <Button
                  type="button"
                  variant={addPartScheduleOption === "optimal" ? "default" : "outline"}
                  className={`h-auto py-3 flex flex-col items-center gap-1 ${addPartScheduleOption !== "optimal" ? "bg-transparent" : ""}`}
                  onClick={() => setAddPartScheduleOption("optimal")}
                >
                  <Zap className="h-5 w-5" />
                  <span className="text-sm font-medium">Optimal Placement</span>
                  <span className="text-xs text-muted-foreground">Based on demand targets</span>
                </Button>
              </div>
              {addPartScheduleOption === "optimal" && (
                <p className="text-xs text-muted-foreground p-2 bg-blue-50 rounded border border-blue-200">
                  The system will analyze monthly targets and current schedule to find the best date that helps meet demand while balancing daily capacity.
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddPartDialogOpen(false)} className="bg-transparent">
              Cancel
            </Button>
            <Button onClick={handleAddPartToSchedule} disabled={!selectedPartToAdd} className="gap-1.5">
              <Check className="h-4 w-4" />
              Add to Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
