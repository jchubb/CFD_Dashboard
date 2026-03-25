"use client"

import React, { useState, useMemo, useRef, useCallback } from "react"
import { usePlanningPeriod, type DailyActualsRow, type DailyPlanRow, type DailyLERow } from "@/components/planning-period-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Upload,
  FileSpreadsheet,
  X,
  AlertCircle,
  CheckCircle2,
  Search,
  Download,
} from "lucide-react"

// Re-export type from context
export type { DailyLERow } from "@/components/planning-period-context"

// Must match MONTHLY_TARGETS in daily-plan-section.tsx
const MONTHLY_TARGETS: Record<string, number> = {
  "F135-HPC-001": 120,
  "F135-LPT-002": 80,
  "F135-FAN-003": 100,
  "GTF-GB-001": 90,
  "GTF-LPC-002": 110,
  "GTF-HPT-003": 95,
  "LEAP-CMB-001": 75,
  "LEAP-HPT-002": 85,
  "GENX-LPT-001": 70,
  "GENX-HPC-002": 60,
  "CFM-HPT-001": 65,
  "CFM-FAN-002": 50,
}

const WORK_DAYS = 30

// Distribute a total integer across n days as evenly as possible (no fractions)
function distributeEvenly(total: number, days: number): number[] {
  const base = Math.floor(total / days)
  const remainder = total - base * days
  return Array.from({ length: days }, (_, i) => base + (i < remainder ? 1 : 0))
}

// Deterministic per-part actuals for days 1-10, matching sample actuals pattern.
// Using a simple per-part seed so values are stable across renders.
const SAMPLE_ACTUALS_DAYS1_10: Record<string, number[]> = {
  "F135-HPC-001": [4, 3, 5, 2, 4, 3, 4, 3, 2, 2],
  "F135-LPT-002": [3, 2, 4, 2, 3, 2, 3, 2, 2, 3],
  "F135-FAN-003": [3, 4, 3, 3, 4, 2, 3, 3, 2, 3],
  "GTF-GB-001": [3, 3, 4, 2, 3, 2, 4, 2, 2, 3],
  "GTF-LPC-002": [4, 3, 5, 3, 4, 3, 4, 3, 3, 3],
  "GTF-HPT-003": [3, 3, 4, 3, 3, 3, 4, 3, 2, 3],
  "LEAP-CMB-001": [2, 3, 3, 2, 3, 2, 3, 2, 2, 2],
  "LEAP-HPT-002": [3, 3, 4, 2, 3, 2, 3, 3, 2, 3],
  "GENX-LPT-001": [2, 3, 3, 2, 2, 2, 3, 2, 2, 2],
  "GENX-HPC-002": [2, 2, 3, 2, 2, 2, 2, 2, 2, 2],
  "CFM-HPT-001": [2, 2, 3, 2, 2, 2, 3, 2, 2, 2],
  "CFM-FAN-002": [2, 1, 2, 2, 2, 1, 2, 1, 1, 2],
}

/**
 * Build LE CSV from uploaded daily plan and daily actuals data.
 *
 * For each part:
 *   - Find how many days have actuals (count non-null values)
 *   - Sum plan values for those days
 *   - Sum actual values for those days
 *   - variance = planSum - actualsSum (positive = behind plan)
 *   - LE day = next day's plan + variance (catch-up)
 *
 * Falls back to hardcoded sample data if no uploads exist.
 */
function buildLECSV(planData: DailyPlanRow[], actualsData: DailyActualsRow[]): string {
  // If no plan data, use hardcoded fallback
  if (planData.length === 0) {
    const LE_DAYS = 11
    const header = ["Part Number", ...Array.from({ length: LE_DAYS }, (_, i) => `Day ${i + 1}`)].join(",")
    
    const rows = Object.entries(MONTHLY_TARGETS).map(([pn, target]) => {
      const planAll = distributeEvenly(target, WORK_DAYS)
      const planDays1_10 = planAll.slice(0, 10).reduce((s, v) => s + v, 0)
      
      let actualDays1_10: number
      const actualsRow = actualsData.find(r => r.partNumber === pn)
      if (actualsRow && actualsRow.dailyQty.length >= 10) {
        actualDays1_10 = actualsRow.dailyQty.slice(0, 10).reduce((s: number, v) => s + (v ?? 0), 0)
      } else {
        actualDays1_10 = (SAMPLE_ACTUALS_DAYS1_10[pn] ?? Array(10).fill(3))
          .reduce((s: number, v: number) => s + v, 0)
      }
      
      const variance = planDays1_10 - actualDays1_10
      const day11LE = planAll[10] + variance
      const leDailies = [...planAll.slice(0, 10), day11LE]
      return [pn, ...leDailies].join(",")
    })
    
    return [header, ...rows].join("\n")
  }
  
  // Build lookups from uploaded data
  const planLookup: Record<string, number[]> = {}
  planData.forEach(row => {
    planLookup[row.partNumber] = row.dailyQty
  })
  
  const actualsLookup: Record<string, (number | null)[]> = {}
  actualsData.forEach(row => {
    actualsLookup[row.partNumber] = row.dailyQty
  })
  
  // Determine LE day count: actuals days filled + 1 (the LE day)
  // Find the last day with actual data across all parts
  let lastActualDay = 0
  actualsData.forEach(row => {
    row.dailyQty.forEach((v, i) => {
      if (v !== null && i + 1 > lastActualDay) lastActualDay = i + 1
    })
  })
  const leDayIndex = lastActualDay  // 0-indexed, this is the LE day
  const leDays = lastActualDay + 1  // total columns including LE day
  
  const header = ["Part Number", ...Array.from({ length: leDays }, (_, i) => `Day ${i + 1}`)].join(",")
  
  const rows = planData.map(planRow => {
    const pn = planRow.partNumber
    const planQty = planLookup[pn] || []
    const actualsQty = actualsLookup[pn] || []
    
    // Sum plan and actuals for days with actual data (days 0 to lastActualDay-1)
    let planSum = 0
    let actualsSum = 0
    for (let i = 0; i < lastActualDay; i++) {
      planSum += planQty[i] ?? 0
      actualsSum += actualsQty[i] ?? 0
    }
    
    const variance = planSum - actualsSum  // positive = behind plan
    const leDayPlan = planQty[leDayIndex] ?? 0
    const leDayValue = leDayPlan + variance  // catch-up
    
    // Build LE row: actuals days plan values + LE day value
    const leDailies = planQty.slice(0, lastActualDay).concat([leDayValue])
    return [pn, ...leDailies].join(",")
  })
  
  return [header, ...rows].join("\n")
}

interface DailyLESectionProps {
  selectedMonth?: string
}

export function DailyLESection({ selectedMonth = "January 2024" }: DailyLESectionProps) {
  const { dailyActualsRows, dailyPlanRows, dailyLERows: csvData, setDailyLERows: setCsvData } = usePlanningPeriod()
  const [uploadStatus, setUploadStatus] = useState<"idle" | "success" | "error">("idle")
  const [uploadMessage, setUploadMessage] = useState("")
  const [isDragging, setIsDragging] = useState(false)
  const [isUploadHovered, setIsUploadHovered] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [editingRowId, setEditingRowId] = useState<string | null>(null)
  const [adjustments, setAdjustments] = useState<{ rework: string; hotJob: string; manual: string; manualReason: string }>({
    rework: "0",
    hotJob: "0",
    manual: "0",
    manualReason: "",
  })
  const [openPopoverId, setOpenPopoverId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const parseCSV = useCallback((text: string) => {
    try {
      const lines = text.trim().split("\n")
      if (lines.length < 2) throw new Error("CSV must have a header row and at least one data row.")

      const headers = lines[0].split(",").map(h => h.trim().toLowerCase())
      const partIdx = headers.findIndex(h => h.includes("part"))
      if (partIdx === -1) throw new Error("CSV must include a Part Number column.")

      const dayIndices: number[] = []
      headers.forEach((h, i) => {
        if (i !== partIdx && (h.includes("day") || h.match(/^d\d+/))) dayIndices.push(i)
      })

      if (dayIndices.length === 0) {
        throw new Error("CSV must include at least one Day column (e.g. Day 1, Day 2, ...).")
      }

      const rows: DailyLERow[] = []
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(",").map(c => c.trim())
        if (cols.length < 2) continue
        const partNumber = cols[partIdx]
        if (!partNumber) continue
        const dailyQty = dayIndices.map(di => parseInt(cols[di]) || 0)
        rows.push({ id: `le-${i}-${Date.now()}`, partNumber, dailyQty })
      }

      if (rows.length === 0) throw new Error("No valid data rows found.")

      setCsvData(rows)
      setUploadStatus("success")
      setUploadMessage(`Imported LE for ${rows.length} parts — ${dayIndices.length} days`)
    } catch (err) {
      setUploadStatus("error")
      setUploadMessage(err instanceof Error ? err.message : "Failed to parse CSV file.")
    }
  }, [])

  const handleFileUpload = useCallback((file: File) => {
    if (!file.name.endsWith(".csv")) {
      setUploadStatus("error")
      setUploadMessage("Please upload a .csv file.")
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => parseCSV(e.target?.result as string)
    reader.onerror = () => {
      setUploadStatus("error")
      setUploadMessage("Failed to read the file.")
    }
    reader.readAsText(file)
  }, [parseCSV])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFileUpload(file)
  }, [handleFileUpload])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback(() => setIsDragging(false), [])
  const handleLoadSample = useCallback(() => {
    const csv = buildLECSV(dailyPlanRows, dailyActualsRows)
    parseCSV(csv)
  }, [parseCSV, dailyPlanRows, dailyActualsRows])
  const handleClearData = useCallback(() => {
    setCsvData([])
    setUploadStatus("idle")
    setUploadMessage("")
    setSearchQuery("")
  }, [])

  const handleDownload = useCallback(() => {
    if (csvData.length === 0) return
    const days = csvData[0]?.dailyQty.length ?? 0
    const header = ["Part Number", ...Array.from({ length: days }, (_, i) => `Day ${i + 1}`), "Total"].join(",")
    const rows = csvData.map(row => {
      const total = row.dailyQty.reduce((s, q) => s + q, 0)
      return [row.partNumber, ...row.dailyQty, total].join(",")
    })
    const csv = [header, ...rows].join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `Daily_LE_${selectedMonth.replace(" ", "_")}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [csvData, selectedMonth])

  const handleOpenAdjustment = useCallback((row: DailyLERow) => {
    setEditingRowId(row.id)
    setAdjustments({ rework: "0", hotJob: "0", manual: "0", manualReason: "" })
    setOpenPopoverId(row.id)
  }, [])

  const handleApplyAdjustment = useCallback((rowId: string, baseValue: number) => {
    const rework = parseInt(adjustments.rework) || 0
    const hotJob = parseInt(adjustments.hotJob) || 0
    const manual = parseInt(adjustments.manual) || 0
    const newValue = baseValue + rework + hotJob + manual

    setCsvData(prev => prev.map(r => {
      if (r.id !== rowId) return r
      const updated = [...r.dailyQty]
      updated[updated.length - 1] = newValue
      return { ...r, dailyQty: updated }
    }))

    setOpenPopoverId(null)
    setEditingRowId(null)
    setAdjustments({ rework: "0", hotJob: "0", manual: "0", manualReason: "" })
  }, [adjustments, setCsvData])

  const handleCancelAdjustment = useCallback(() => {
    setOpenPopoverId(null)
    setEditingRowId(null)
    setAdjustments({ rework: "0", hotJob: "0", manual: "0", manualReason: "" })
  }, [])

  const dayCount = csvData[0]?.dailyQty.length ?? 0

  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return csvData
    const q = searchQuery.toLowerCase()
    return csvData.filter(row => row.partNumber.toLowerCase().includes(q))
  }, [csvData, searchQuery])

  const dayTotals = useMemo(() => {
    return Array.from({ length: dayCount }, (_, di) =>
      filteredData.reduce((sum, row) => sum + (row.dailyQty[di] ?? 0), 0)
    )
  }, [filteredData, dayCount])

  return (
    <Card className="border border-border">
      <CardHeader className="py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
              Daily LE — {selectedMonth}
            </CardTitle>
            {csvData.length > 0 && (
              <Badge variant="secondary" className="font-mono text-xs">
                {csvData.length} parts / {dayCount} days
              </Badge>
            )}
          </div>
          {csvData.length > 0 && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                className="gap-1.5 h-7 text-emerald-600 border-emerald-200 hover:bg-emerald-50 bg-transparent"
              >
                <Download className="h-3.5 w-3.5" />
                Download
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearData}
                className="gap-1.5 h-7 text-red-600 border-red-200 hover:bg-red-50 bg-transparent"
              >
                <X className="h-3.5 w-3.5" />
                Clear
              </Button>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="pb-4">
        {csvData.length === 0 ? (
          <div className="space-y-3">
            {/* Drop Zone */}
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              onMouseEnter={() => setIsUploadHovered(true)}
              onMouseLeave={() => setIsUploadHovered(false)}
              className={`relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 cursor-pointer transition-all ${isDragging
                ? "border-blue-400 bg-blue-50"
                : "border-border hover:border-muted-foreground/40 hover:bg-muted/30"
                }`}
            >
              {/* ATO hover notice */}
              {isUploadHovered && (
                <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-background/90 px-6">
                  <p className="text-center text-xs font-medium text-amber-700">
                    File upload not approved by ATO — please place files in network folder: C:/file location/
                  </p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleFileUpload(file)
                }}
              />
              <div className={`p-3 rounded-xl ${isDragging ? "bg-blue-100" : "bg-muted"}`}>
                <Upload className={`h-6 w-6 ${isDragging ? "text-blue-600" : "text-muted-foreground"}`} />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">
                  {isDragging ? "Drop CSV file here" : "Upload Daily LE CSV"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Drag and drop or click to browse. Expected columns: Part Number, Day 1 … Day 11
                </p>
              </div>
            </div>

            {/* Error */}
            {uploadStatus === "error" && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200">
                <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
                <p className="text-sm text-red-700">{uploadMessage}</p>
              </div>
            )}

            {/* Sample Data */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border">
              <div>
                <p className="text-sm font-medium text-foreground">
                  {dailyPlanRows.length > 0 && dailyActualsRows.length > 0
                    ? "Generate LE from uploaded data"
                    : "No data yet?"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {dailyPlanRows.length > 0 && dailyActualsRows.length > 0
                    ? "Calculate LE using your uploaded Daily Plan and Daily Actuals"
                    : "Load sample LE — uses hardcoded plan/actuals data"}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={handleLoadSample} className="gap-1.5 bg-transparent">
                <FileSpreadsheet className="h-3.5 w-3.5" />
                {dailyPlanRows.length > 0 && dailyActualsRows.length > 0 ? "Generate LE" : "Load Sample Data"}
              </Button>
            </div>

            {/* Format Guide */}
            <div className="p-3 rounded-lg border border-border bg-card">
              <p className="text-xs font-medium text-foreground mb-2">Expected CSV Format:</p>
              <div className="font-mono text-xs text-muted-foreground bg-muted/50 p-2 rounded overflow-x-auto">
                <p>Part Number,Day 1,Day 2,...,Day 11</p>
                <p>F135-HPC-001,5,5,6,5,5,5,6,5,5,5,33</p>
                <p className="text-muted-foreground/60 mt-1">
                  * Day 11 = Day 11 Plan + (Sum Plan Days 1–10 − Sum Actuals Days 1–10)
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Success Banner */}
            {uploadStatus === "success" && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <p className="text-sm text-emerald-700">{uploadMessage}</p>
              </div>
            )}

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by part number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Table */}
            <div className="border rounded-lg overflow-hidden">
              <div className="max-h-[400px] overflow-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-muted/90 backdrop-blur-sm">
                    <TableRow>
                      <TableHead className="font-semibold text-xs sticky left-0 bg-muted/90 z-10 min-w-[150px]">
                        Part Number
                      </TableHead>
                      {Array.from({ length: dayCount }, (_, i) => (
                        <TableHead
                          key={i}
                          className={`font-semibold text-xs text-right min-w-[52px] ${i === dayCount - 1 ? "bg-amber-50 text-amber-700" : ""
                            }`}
                        >
                          Day {i + 1}
                          {i === dayCount - 1 && (
                            <span className="ml-1 text-[10px] font-normal">(LE)</span>
                          )}
                        </TableHead>
                      ))}
                      <TableHead className="font-semibold text-xs text-right min-w-[64px] bg-muted/90">
                        Total
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={dayCount + 2} className="text-center py-8 text-muted-foreground">
                          No parts match your search.
                        </TableCell>
                      </TableRow>
                    ) : (
                      <>
                        {filteredData.map((row) => (
                          <TableRow key={row.id} className="hover:bg-muted/30">
                            <TableCell className="font-mono text-xs sticky left-0 bg-background z-10">
                              {row.partNumber}
                            </TableCell>
                            {row.dailyQty.map((qty, di) => {
                              const isLE = di === dayCount - 1
                              const baseValue = qty
                              const rework = parseInt(adjustments.rework) || 0
                              const hotJob = parseInt(adjustments.hotJob) || 0
                              const manual = parseInt(adjustments.manual) || 0
                              const previewValue = openPopoverId === row.id ? baseValue + rework + hotJob + manual : qty

                              if (isLE) {
                                return (
                                  <TableCell
                                    key={di}
                                    className="font-mono text-xs text-right tabular-nums bg-amber-50 font-semibold text-amber-800 p-0"
                                  >
                                    <Popover
                                      open={openPopoverId === row.id}
                                      onOpenChange={(open) => {
                                        if (open) handleOpenAdjustment(row)
                                        else handleCancelAdjustment()
                                      }}
                                    >
                                      <PopoverTrigger asChild>
                                        <button
                                          className="w-full h-full px-4 py-2 text-right hover:bg-amber-100 transition-colors cursor-pointer"
                                          title="Click to adjust LE"
                                        >
                                          {previewValue}
                                        </button>
                                      </PopoverTrigger>
                                      <PopoverContent className="w-72" align="end">
                                        <div className="space-y-3">
                                          <div>
                                            <p className="text-sm font-semibold">Adjust LE for {row.partNumber}</p>
                                            <p className="text-xs text-muted-foreground">Base LE: {baseValue}</p>
                                          </div>
                                          <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                              <Label className="w-20 text-xs">Rework Qty</Label>
                                              <Input
                                                type="number"
                                                className="h-8 text-xs font-mono"
                                                value={adjustments.rework}
                                                onChange={(e) => setAdjustments(prev => ({ ...prev, rework: e.target.value }))}
                                              />
                                            </div>
                                            <div className="flex items-center gap-2">
                                              <Label className="w-20 text-xs">Hot_Job Qty</Label>
                                              <Input
                                                type="number"
                                                className="h-8 text-xs font-mono"
                                                value={adjustments.hotJob}
                                                onChange={(e) => setAdjustments(prev => ({ ...prev, hotJob: e.target.value }))}
                                              />
                                            </div>
                                            <div className="flex items-center gap-2">
                                              <Label className="w-20 text-xs">Manual Qty</Label>
                                              <Input
                                                type="number"
                                                className="h-8 text-xs font-mono"
                                                value={adjustments.manual}
                                                onChange={(e) => setAdjustments(prev => ({ ...prev, manual: e.target.value }))}
                                              />
                                            </div>
                                            <div className="flex items-start gap-2">
                                              <Label className="w-20 text-xs pt-2">Reason</Label>
                                              <Input
                                                type="text"
                                                placeholder="Optional reason for manual adjustment"
                                                className="h-8 text-xs flex-1"
                                                value={adjustments.manualReason}
                                                onChange={(e) => setAdjustments(prev => ({ ...prev, manualReason: e.target.value }))}
                                              />
                                            </div>
                                          </div>
                                          <div className="pt-2 border-t">
                                            <p className="text-xs text-muted-foreground mb-2">
                                              New LE = {baseValue} + {rework} + {hotJob} + {manual} = <span className="font-semibold text-foreground">{baseValue + rework + hotJob + manual}</span>
                                            </p>
                                            <div className="flex gap-2">
                                              <Button
                                                size="sm"
                                                className="flex-1 h-8 text-xs"
                                                onClick={() => handleApplyAdjustment(row.id, baseValue)}
                                              >
                                                Apply
                                              </Button>
                                              <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-8 text-xs"
                                                onClick={handleCancelAdjustment}
                                              >
                                                Cancel
                                              </Button>
                                            </div>
                                          </div>
                                        </div>
                                      </PopoverContent>
                                    </Popover>
                                  </TableCell>
                                )
                              }

                              return (
                                <TableCell
                                  key={di}
                                  className="font-mono text-xs text-right tabular-nums"
                                >
                                  {qty}
                                </TableCell>
                              )
                            })}
                            <TableCell className="font-mono text-xs text-right tabular-nums font-semibold">
                              {row.dailyQty.reduce((s, q) => s + q, 0)}
                            </TableCell>
                          </TableRow>
                        ))}
                        {/* Totals Row */}
                        <TableRow className="bg-muted/50 font-semibold sticky bottom-0">
                          <TableCell className="text-xs sticky left-0 bg-muted/50 z-10">Totals</TableCell>
                          {dayTotals.map((total, di) => (
                            <TableCell
                              key={di}
                              className={`font-mono text-xs text-right tabular-nums ${di === dayCount - 1 ? "bg-amber-50 text-amber-800 font-semibold" : ""
                                }`}
                            >
                              {total}
                            </TableCell>
                          ))}
                          <TableCell className="font-mono text-xs text-right tabular-nums font-bold">
                            {dayTotals.reduce((s, t) => s + t, 0)}
                          </TableCell>
                        </TableRow>
                      </>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
