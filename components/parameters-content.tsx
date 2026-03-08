"use client"

import React from "react"
import { useState, useMemo, useRef, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Settings2,
  Activity,
  Power,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Wrench,
  Sparkles,
  Upload,
  Calendar,
  Trash2,
} from "lucide-react"

type MachineStatus = "online" | "offline" | "maintenance"

interface MaintenanceDowntime {
  id: string
  startDate: string
  startTime: string
  endDate: string
  endTime: string
}

interface Machine {
  id: string
  name: string
  sectionId: number
  group: "A" | "B"
  status: MachineStatus           // simulated real-time status
  overrideEnabled: boolean | null  // null = follow real-time, true/false = manual
  assignedFamily: string
  utilization: number              // 0-100
  hoursToday: number // unused in UI
}

// ------------------------------------------------------------------
// Mock data: 4 sections x 8 machines (2 parallel groups of 4)
// ------------------------------------------------------------------
function generateMockMachines(): Machine[] {
  const sections = [
    { id: 1, name: "Line 1", families: ["F135", "F135", "GTF", "GTF", "F100", "F100", "PWC", "Legacy"] },
    { id: 2, name: "Line 2", families: ["F135", "GTF", "GTF", "F100", "F100", "PWC", "PWC", "Legacy"] },
    { id: 3, name: "Line 3", families: ["F135", "F135", "GTF", "F100", "PWC", "PWC", "Legacy", "Legacy"] },
    { id: 4, name: "Line 4", families: ["F135", "GTF", "GTF", "GTF", "F100", "PWC", "Legacy", "Legacy"] },
  ]

  // Simulated real-time statuses (some offline / maintenance for realism)
  const statusPatterns: MachineStatus[][] = [
    ["online", "online", "online", "online", "online", "offline", "online", "maintenance"],
    ["online", "online", "maintenance", "online", "online", "online", "online", "online"],
    ["online", "online", "online", "offline", "online", "online", "online", "online"],
    ["online", "offline", "online", "online", "online", "online", "maintenance", "online"],
  ]

  const machines: Machine[] = []

  sections.forEach((section, si) => {
    for (let i = 0; i < 8; i++) {
      const group: "A" | "B" = i < 4 ? "A" : "B"
      const idx = i < 4 ? i + 1 : i - 3
      machines.push({
        id: `S${section.id}-${group}${idx}`,
        name: `${group}${idx}`,
        sectionId: section.id,
        group,
        status: statusPatterns[si][i],
        overrideEnabled: null,
        assignedFamily: section.families[i],
        utilization: statusPatterns[si][i] === "online"
          ? Math.floor(60 + Math.random() * 35)
          : statusPatterns[si][i] === "maintenance" ? 0 : 0,
        hoursToday: statusPatterns[si][i] === "online"
          ? parseFloat((4 + Math.random() * 10).toFixed(1))
          : 0,
      })
    }
  })

  return machines
}

const SECTION_NAMES = ["Line 1", "Line 2", "Line 3", "Line 4"]

// ------------------------------------------------------------------
// Component
// ------------------------------------------------------------------
export function ParametersContent() {
  const [machines, setMachines] = useState<Machine[]>(generateMockMachines)
  const [lineDowntimes, setLineDowntimes] = useState<Record<number, MaintenanceDowntime[]>>({
    1: [],
    2: [],
    3: [],
    4: [],
  })
  const [openPopovers, setOpenPopovers] = useState<Record<number, boolean>>({
    1: false,
    2: false,
    3: false,
    4: false,
  })
  const [newDowntime, setNewDowntime] = useState<Record<number, MaintenanceDowntime>>({
    1: { id: "", startDate: "", startTime: "", endDate: "", endTime: "" },
    2: { id: "", startDate: "", startTime: "", endDate: "", endTime: "" },
    3: { id: "", startDate: "", startTime: "", endDate: "", endTime: "" },
    4: { id: "", startDate: "", startTime: "", endDate: "", endTime: "" },
  })

  // Derived counts
  const summary = useMemo(() => {
    const total = machines.length
    const online = machines.filter(m => getEffectiveStatus(m) === "online").length
    const offline = machines.filter(m => getEffectiveStatus(m) === "offline").length
    const maint = machines.filter(m => getEffectiveStatus(m) === "maintenance").length
    const overrides = machines.filter(m => m.overrideEnabled !== null).length
    return { total, online, offline, maint, overrides }
  }, [machines])

  function getEffectiveStatus(m: Machine): MachineStatus {
    if (m.overrideEnabled === true) return "online"
    if (m.overrideEnabled === false) return "offline"
    return m.status
  }

  function handleToggle(machineId: string) {
    setMachines(prev =>
      prev.map(m => {
        if (m.id !== machineId) return m
        // Cycle: follow-real -> force-on -> force-off -> follow-real (if real was online, skip force-on)
        if (m.overrideEnabled === null) {
          // First toggle: override to opposite of current real status
          return { ...m, overrideEnabled: m.status !== "online" }
        }
        // Second toggle: remove override, go back to real-time
        return { ...m, overrideEnabled: null }
      }),
    )
  }

  function handleFamilyChange(machineId: string, newFamily: string) {
    setMachines(prev =>
      prev.map(m =>
        m.id === machineId ? { ...m, assignedFamily: newFamily } : m
      ),
    )
  }

  const csvInputRef = useRef<HTMLInputElement>(null)

  // Optimize allocation based on simulated monthly demand targets
  const handleOptimizeAllocation = useCallback(() => {
    // Simulated monthly demand targets (weighted proportions)
    const demandWeights: Record<string, number> = {
      "F135": 0.28,
      "GTF": 0.25,
      "F100": 0.22,
      "PWC": 0.15,
      "Legacy": 0.10,
    }

    const families = Object.keys(demandWeights)
    const totalMachines = machines.length

    // Calculate ideal machine count per family
    const idealCounts: Record<string, number> = {}
    let allocated = 0
    families.forEach((fam, idx) => {
      if (idx === families.length - 1) {
        idealCounts[fam] = totalMachines - allocated
      } else {
        const count = Math.round(totalMachines * demandWeights[fam])
        idealCounts[fam] = count
        allocated += count
      }
    })

    // Build assignment array
    const assignments: string[] = []
    for (const fam of families) {
      for (let i = 0; i < idealCounts[fam]; i++) {
        assignments.push(fam)
      }
    }

    // Distribute across machines preserving section balance
    setMachines(prev => {
      const updated = [...prev]
      // Sort by section and group for balanced distribution
      const sorted = updated.map((m, i) => ({ m, i })).sort((a, b) => {
        if (a.m.sectionId !== b.m.sectionId) return a.m.sectionId - b.m.sectionId
        if (a.m.group !== b.m.group) return a.m.group.localeCompare(b.m.group)
        return a.m.name.localeCompare(b.m.name)
      })

      sorted.forEach((entry, idx) => {
        updated[entry.i] = {
          ...updated[entry.i],
          assignedFamily: assignments[idx % assignments.length],
        }
      })

      return updated
    })
  }, [machines.length])

  // CSV upload handler
  const handleCSVUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      if (!text) return

      const lines = text.trim().split("\n")
      if (lines.length < 2) return // Need at least header + 1 row

      // Parse CSV: machine_id, assigned_family
      const updates: Record<string, string> = {}
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(",").map(c => c.trim())
        if (cols.length >= 2) {
          const machineId = cols[0]
          const family = cols[1]
          if (machineId && family && FAMILY_COLORS[family]) {
            updates[machineId] = family
          }
        }
      }

      setMachines(prev =>
        prev.map(m =>
          updates[m.id] ? { ...m, assignedFamily: updates[m.id] } : m
        ),
      )

      // Reset input so re-uploading same file works
      if (csvInputRef.current) csvInputRef.current.value = ""
    }
    reader.readAsText(file)
  }, [])

  const sectionMachines = (sectionId: number) =>
    machines.filter(m => m.sectionId === sectionId)

  function addDowntime(sectionId: number) {
    const dt = newDowntime[sectionId]
    if (!dt.startDate || !dt.startTime || !dt.endDate || !dt.endTime) return

    const id = `dt-${Date.now()}`
    setLineDowntimes(prev => ({
      ...prev,
      [sectionId]: [...(prev[sectionId] || []), { ...dt, id }],
    }))
    setNewDowntime(prev => ({
      ...prev,
      [sectionId]: { id: "", startDate: "", startTime: "", endDate: "", endTime: "" },
    }))
    setOpenPopovers(prev => ({ ...prev, [sectionId]: false }))
  }

  function deleteDowntime(sectionId: number, id: string) {
    setLineDowntimes(prev => ({
      ...prev,
      [sectionId]: prev[sectionId].filter(dt => dt.id !== id),
    }))
  }

  function formatDowntimeDisplay(dt: MaintenanceDowntime): string {
    const start = new Date(`${dt.startDate}T${dt.startTime}`)
    const end = new Date(`${dt.endDate}T${dt.endTime}`)
    const startStr = start.toLocaleDateString("en-US", { month: "short", day: "numeric" })
    const startTime = start.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
    const endStr = end.toLocaleDateString("en-US", { month: "short", day: "numeric" })
    const endTime = end.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })

    if (dt.startDate === dt.endDate) {
      return `${startStr}, ${startTime} - ${endTime}`
    }
    return `${startStr}, ${startTime} - ${endStr}, ${endTime}`
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Machine status summary badges */}
      <div className="flex items-center gap-3">
        <Badge variant="outline" className="gap-1.5 font-mono text-xs border-emerald-300 text-emerald-700 bg-emerald-50">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
          {summary.online} Online
        </Badge>
        <Badge variant="outline" className="gap-1.5 font-mono text-xs border-red-300 text-red-700 bg-red-50">
          <span className="inline-block w-2 h-2 rounded-full bg-red-500" />
          {summary.offline} Offline
        </Badge>
        <Badge variant="outline" className="gap-1.5 font-mono text-xs border-amber-300 text-amber-700 bg-amber-50">
          <span className="inline-block w-2 h-2 rounded-full bg-amber-500" />
          {summary.maint} Maint
        </Badge>
        {summary.overrides > 0 && (
          <Badge variant="outline" className="gap-1.5 font-mono text-xs border-blue-300 text-blue-700 bg-blue-50">
            {summary.overrides} Override{summary.overrides > 1 ? "s" : ""}
          </Badge>
        )}
      </div>

      {/* Part Family Legend */}
      <Card className="border border-border">
        <CardHeader className="py-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">HT Asset Overview</CardTitle>
            <div className="flex items-center gap-2">
              {/* Optimize Allocation Button */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleOptimizeAllocation}
                      className="gap-1.5 h-8 bg-transparent"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      Optimize Allocation
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="bg-white border border-border shadow-lg text-foreground max-w-[320px] p-3">
                    <div className="space-y-2">
                      <p className="text-sm font-semibold">Optimize Allocation</p>
                      <p className="text-xs text-muted-foreground">
                        Automatically redistributes part family assignments across all machines based on monthly demand targets and optimized mix ratios.
                      </p>
                      <div className="text-xs border-t pt-2 space-y-1">
                        <p className="font-medium text-muted-foreground">Current Demand Weights:</p>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                          <span>F135: <span className="font-mono font-semibold">28%</span></span>
                          <span>GTF: <span className="font-mono font-semibold">25%</span></span>
                          <span>F100: <span className="font-mono font-semibold">22%</span></span>
                          <span>PWC: <span className="font-mono font-semibold">15%</span></span>
                          <span>Legacy: <span className="font-mono font-semibold">10%</span></span>
                        </div>
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {/* Manual Override CSV Upload Button */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => csvInputRef.current?.click()}
                      className="gap-1.5 h-8 bg-transparent"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      Manual Override .csv
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="bg-white border border-border shadow-lg text-foreground max-w-[340px] p-3">
                    <div className="space-y-2">
                      <p className="text-sm font-semibold">Manual Override via CSV</p>
                      <p className="text-xs text-muted-foreground">
                        Upload a .csv file to manually assign part families to specific machines, overriding the current allocation.
                      </p>
                      <div className="text-xs border-t pt-2 space-y-1">
                        <p className="font-medium text-muted-foreground">Required CSV Schema:</p>
                        <div className="bg-muted/50 rounded p-2 font-mono text-[11px] space-y-0.5">
                          <p className="text-muted-foreground">BT_id,assigned_family,status</p>
                          <p>S1-A1,F135</p>
                          <p>S1-A2,GTF</p>
                          <p>S2-B3,F100</p>
                          <p className="text-muted-foreground">...</p>
                        </div>
                        <p className="text-muted-foreground">
                          Machine IDs: <span className="font-mono">S[1-4]-[A|B][1-4]</span>
                        </p>
                        <p className="text-muted-foreground pt-1">
                          Valid families: <span className="font-mono">F135, GTF, F100, PWC, Legacy</span>
                        </p>
                        <p className="text-muted-foreground pt-1">
                          Statuses: <span className="font-mono"> 0 (off), 1 (on), 2 (maint)</span>
                        </p>
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <input
                ref={csvInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleCSVUpload}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="pb-4 pt-0 flex flex-col gap-4">

          {/* Machine map: 4 sections × 2 columns each = 8 columns total */}
          <div className="grid grid-cols-4 gap-x-6 gap-y-0">
            {[1, 2, 3, 4].map(sectionId => {
              const mList = machines.filter(m => m.sectionId === sectionId)
              const groupA = mList.filter(m => m.group === "A")
              const groupB = mList.filter(m => m.group === "B")
              return (
                <div key={sectionId} className="flex flex-col gap-2">
                  {/* Section title — centered */}
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide text-center">
                    Line {sectionId}
                  </p>
                  {/* Two columns: Oven (A) + Quench (B) */}
                  <div className="grid grid-cols-2 gap-1.5">
                    {/* Column headers */}
                    <p className="text-[10px] text-muted-foreground/70 text-center">Oven</p>
                    <p className="text-[10px] text-muted-foreground/70 text-center">Quench</p>
                    {/* Machine chips interleaved row by row */}
                    {groupA.map((ma, i) => {
                      const mb = groupB[i]
                      const renderChip = (m: Machine) => {
                        const fc = FAMILY_COLORS[m.assignedFamily] ?? FAMILY_COLORS.Legacy
                        const eff = getEffectiveStatus(m)
                        const isDown = eff !== "online"
                        return (
                          <TooltipProvider key={m.id}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div
                                  className={`flex items-center justify-center rounded px-1 py-1.5 border text-[10px] font-mono font-semibold leading-none select-none transition-colors ${isDown
                                    ? "bg-transparent border-border/30 text-muted-foreground/30"
                                    : `${fc.bg} ${fc.border} ${fc.text}`
                                    }`}
                                >
                                  {m.name}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="bg-white border border-border shadow-lg text-foreground">
                                <p className="text-xs font-semibold">{m.id}</p>
                                <p className="text-[11px] text-muted-foreground">{m.assignedFamily} · {eff}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )
                      }
                      return (
                        <React.Fragment key={ma.id}>
                          {renderChip(ma)}
                          {mb && renderChip(mb)}
                        </React.Fragment>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Color key — below machine map, centered */}
          <div className="flex flex-wrap justify-center items-center gap-4 border-t border-border pt-3">
            {Object.values(FAMILY_COLORS).map(fc => (
              <div key={fc.label} className="flex items-center gap-2">
                <span className={`inline-block w-3 h-3 rounded-full ${fc.dot}`} />
                <Badge variant="outline" className={`text-xs font-medium ${fc.border} ${fc.text} ${fc.bg}`}>
                  {fc.label}
                </Badge>
              </div>
            ))}
          </div>

        </CardContent>
      </Card>

      {/* Sections grid */}
      <div className="grid grid-cols-1 gap-5">
        {[1, 2, 3, 4].map(sectionId => {
          const sectionName = SECTION_NAMES[sectionId - 1]
          const mList = sectionMachines(sectionId)
          const groupA = mList.filter(m => m.group === "A")
          const groupB = mList.filter(m => m.group === "B")
          const onlineCount = mList.filter(m => getEffectiveStatus(m) === "online").length

          return (
            <Card key={sectionId} className="border border-border">
              <CardHeader className="py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Settings2 className="h-4 w-4 text-muted-foreground" />
                    <CardTitle className="text-sm font-semibold">
                      {sectionName}
                    </CardTitle>
                    {/* Maintenance downtime scheduler — only on Line 1 for now */}
                    {sectionId === 1 && (
                      <Popover open={openPopovers[sectionId]} onOpenChange={(open) => setOpenPopovers(prev => ({ ...prev, [sectionId]: open }))}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 ml-1"
                            title="Schedule maintenance downtime"
                          >
                            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80" align="start">
                          <div className="space-y-3">
                            <p className="text-sm font-semibold">Schedule Downtime</p>
                            <div className="space-y-2">
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="text-[11px] text-muted-foreground">Start Date</label>
                                  <Input
                                    type="date"
                                    className="h-8 text-xs"
                                    value={newDowntime[sectionId].startDate}
                                    onChange={(e) => setNewDowntime(prev => ({
                                      ...prev,
                                      [sectionId]: { ...prev[sectionId], startDate: e.target.value }
                                    }))}
                                  />
                                </div>
                                <div>
                                  <label className="text-[11px] text-muted-foreground">Start Time</label>
                                  <Input
                                    type="time"
                                    className="h-8 text-xs"
                                    value={newDowntime[sectionId].startTime}
                                    onChange={(e) => setNewDowntime(prev => ({
                                      ...prev,
                                      [sectionId]: { ...prev[sectionId], startTime: e.target.value }
                                    }))}
                                  />
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="text-[11px] text-muted-foreground">End Date</label>
                                  <Input
                                    type="date"
                                    className="h-8 text-xs"
                                    value={newDowntime[sectionId].endDate}
                                    onChange={(e) => setNewDowntime(prev => ({
                                      ...prev,
                                      [sectionId]: { ...prev[sectionId], endDate: e.target.value }
                                    }))}
                                  />
                                </div>
                                <div>
                                  <label className="text-[11px] text-muted-foreground">End Time</label>
                                  <Input
                                    type="time"
                                    className="h-8 text-xs"
                                    value={newDowntime[sectionId].endTime}
                                    onChange={(e) => setNewDowntime(prev => ({
                                      ...prev,
                                      [sectionId]: { ...prev[sectionId], endTime: e.target.value }
                                    }))}
                                  />
                                </div>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              className="w-full h-8 text-xs"
                              onClick={() => addDowntime(sectionId)}
                            >
                              Add Downtime
                            </Button>
                          </div>
                        </PopoverContent>
                      </Popover>
                    )}
                  </div>
                  <Badge variant="secondary" className="font-mono text-xs">
                    {onlineCount}/8 online
                  </Badge>
                </div>
                {/* Display scheduled downtimes */}
                {sectionId === 1 && lineDowntimes[sectionId]?.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap mt-2">
                    {lineDowntimes[sectionId].map(dt => (
                      <div key={dt.id} className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded px-2 py-1">
                        <span className="text-[11px] text-amber-900">{formatDowntimeDisplay(dt)}</span>
                        <button
                          onClick={() => deleteDowntime(sectionId, dt.id)}
                          className="p-0.5 hover:bg-amber-100 rounded transition-colors"
                          title="Delete downtime"
                        >
                          <Trash2 className="h-3 w-3 text-amber-600" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              <CardContent className="pb-4 pt-0">
                <div className="grid grid-cols-2 gap-4">
                  {/* Group A */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 mb-3">
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Oven</span>
                      <span className="flex-1 h-px bg-border" />
                    </div>
                    {groupA.map(machine => (
                      <MachineRow
                        key={machine.id}
                        machine={machine}
                        effectiveStatus={getEffectiveStatus(machine)}
                        onToggle={handleToggle}
                        onFamilyChange={handleFamilyChange}
                      />
                    ))}
                  </div>

                  {/* Parallel divider */}
                  {/* Group B */}
                  <div className="space-y-2 border-l border-dashed border-border pl-4">
                    <div className="flex items-center gap-1.5 mb-3">
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Quench</span>
                      <span className="flex-1 h-px bg-border" />
                    </div>
                    {groupB.map(machine => (
                      <MachineRow
                        key={machine.id}
                        machine={machine}
                        effectiveStatus={getEffectiveStatus(machine)}
                        onToggle={handleToggle}
                        onFamilyChange={handleFamilyChange}
                      />
                    ))}
                  </div>
                </div>

                {/* Section family summary */}
                <div className="mt-4 pt-3 border-t border-border">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-muted-foreground font-medium">Allocated families:</span>
                    {Array.from(new Set(mList.map(m => m.assignedFamily))).map(family => {
                      const fc = FAMILY_COLORS[family]
                      const count = mList.filter(m => m.assignedFamily === family).length
                      return (
                        <Badge key={family} variant="outline" className={`text-xs ${fc.border} ${fc.text} ${fc.bg} gap-1`}>
                          <span className={`inline-block w-1.5 h-1.5 rounded-full ${fc.dot}`} />
                          {fc.label} ({count})
                        </Badge>
                      )
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

// ------------------------------------------------------------------
// Machine Row sub-component
// ------------------------------------------------------------------
function MachineRow({
  machine,
  effectiveStatus,
  onToggle,
  onFamilyChange,
}: {
  machine: Machine
  effectiveStatus: MachineStatus
  onToggle: (id: string) => void
  onFamilyChange: (id: string, family: string) => void
}) {
  const fc = FAMILY_COLORS[machine.assignedFamily] ?? FAMILY_COLORS.Legacy
  const isOverridden = machine.overrideEnabled !== null
  const statusIcon = effectiveStatus === "online"
    ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
    : effectiveStatus === "maintenance"
      ? <Wrench className="h-3.5 w-3.5 text-amber-600" />
      : <XCircle className="h-3.5 w-3.5 text-red-500" />

  return (
    <div className={`flex items-center gap-3 rounded-lg border p-2.5 transition-colors ${effectiveStatus === "online"
      ? "border-emerald-200 bg-emerald-50/40"
      : effectiveStatus === "maintenance"
        ? "border-amber-200 bg-amber-50/40"
        : "border-red-200 bg-red-50/40"
      }`}>
      {/* Family color indicator */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className={`w-2.5 h-8 rounded-sm shrink-0 ${fc.dot}`} />
          </TooltipTrigger>
          <TooltipContent side="left" className="bg-white border border-border shadow-lg text-foreground">
            <p className="text-xs">{fc.label} family</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Machine info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          {statusIcon}
          <span className="text-sm font-mono font-semibold text-foreground">{machine.id}</span>
          {isOverridden && (
            <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4 border-blue-300 text-blue-600 bg-blue-50 font-medium">
              Override
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <Select
            value={machine.assignedFamily}
            onValueChange={(value) => onFamilyChange(machine.id, value)}
          >
            <SelectTrigger className={`h-5 w-auto min-w-[80px] px-1.5 py-0 text-[10px] font-medium border ${fc.border} ${fc.text} ${fc.bg} gap-1 [&>svg]:h-3 [&>svg]:w-3`}>
              <span className={`inline-block w-1.5 h-1.5 rounded-full shrink-0 ${fc.dot}`} />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="min-w-[140px]">
              {Object.entries(FAMILY_COLORS).map(([key, fColor]) => (
                <SelectItem key={key} value={key} className="text-xs">
                  <div className="flex items-center gap-2">
                    <span className={`inline-block w-2 h-2 rounded-full shrink-0 ${fColor.dot}`} />
                    <span className={fColor.text}>{fColor.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {effectiveStatus === "maintenance" && (
            <span className="text-[10px] text-amber-600 font-medium">Scheduled maintenance</span>
          )}
          {effectiveStatus === "offline" && (
            <span className="text-[10px] text-red-600 font-medium">Inactive</span>
          )}
        </div>
      </div>

      {/* Toggle */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1.5 shrink-0">
              <Switch
                checked={effectiveStatus === "online"}
                onCheckedChange={() => onToggle(machine.id)}
                aria-label={`Toggle machine ${machine.id}`}
              />
              <Power className={`h-3.5 w-3.5 ${effectiveStatus === "online" ? "text-emerald-600" : "text-muted-foreground"}`} />
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="bg-white border border-border shadow-lg text-foreground max-w-[200px]">
            <p className="text-xs">
              {isOverridden
                ? `Manual override active (real-time: ${machine.status}). Toggle to return to real-time status.`
                : `Currently following real-time status (${machine.status}). Toggle to manually override.`}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  )
}
