"use client"

import React, { useState, useMemo, useRef, useCallback } from "react"
import { usePlanningPeriod, type DailyPlanRow } from "@/components/planning-period-context"
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
  Upload,
  FileSpreadsheet,
  X,
  AlertCircle,
  CheckCircle2,
  Search,
} from "lucide-react"

// Re-export type from context
export type { DailyPlanRow } from "@/components/planning-period-context"

// Distribute a total integer across n days as evenly as possible (no fractions)
function distributeEvenly(total: number, days: number): number[] {
  const base = Math.floor(total / days)
  const remainder = total - base * days
  return Array.from({ length: days }, (_, i) => base + (i < remainder ? 1 : 0))
}

// Monthly targets matching the monthly-plan-section sample data
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

// Build sample CSV where each part's daily values sum exactly to its monthly target
const buildSampleCSV = () => {
  const header = ["Part Number", ...Array.from({ length: WORK_DAYS }, (_, i) => `Day ${i + 1}`)].join(",")
  const rows = Object.entries(MONTHLY_TARGETS).map(([pn, target]) => {
    const dailies = distributeEvenly(target, WORK_DAYS)
    return [pn, ...dailies].join(",")
  })
  return [header, ...rows].join("\n")
}

const sampleCSV = buildSampleCSV()

interface DailyPlanSectionProps {
  selectedMonth?: string
}

export function DailyPlanSection({ selectedMonth = "January 2024" }: DailyPlanSectionProps) {
  const { dailyPlanRows: csvData, setDailyPlanRows: setCsvData } = usePlanningPeriod()
  const [uploadStatus, setUploadStatus] = useState<"idle" | "success" | "error">("idle")
  const [uploadMessage, setUploadMessage] = useState("")
  const [isDragging, setIsDragging] = useState(false)
  const [isUploadHovered, setIsUploadHovered] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
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

      const rows: DailyPlanRow[] = []
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(",").map(c => c.trim())
        if (cols.length < 2) continue
        const partNumber = cols[partIdx]
        if (!partNumber) continue
        const dailyQty = dayIndices.map(di => parseInt(cols[di]) || 0)
        rows.push({ id: `dp-${i}-${Date.now()}`, partNumber, dailyQty })
      }

      if (rows.length === 0) throw new Error("No valid data rows found.")

      setCsvData(rows)
      setUploadStatus("success")
      setUploadMessage(`Imported plan for ${rows.length} parts — ${dayIndices.length} days`)
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
  const handleLoadSample = useCallback(() => parseCSV(sampleCSV), [parseCSV])
  const handleClearData = useCallback(() => {
    setCsvData([])
    setUploadStatus("idle")
    setUploadMessage("")
    setSearchQuery("")
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
              Daily Plan — {selectedMonth}
            </CardTitle>
            {csvData.length > 0 && (
              <Badge variant="secondary" className="font-mono text-xs">
                {csvData.length} parts / {dayCount} days
              </Badge>
            )}
          </div>
          {csvData.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearData}
              className="gap-1.5 h-7 text-red-600 border-red-200 hover:bg-red-50 bg-transparent"
            >
              <X className="h-3.5 w-3.5" />
              Clear
            </Button>
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
              className={`relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 cursor-pointer transition-all ${
                isDragging
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
                  {isDragging ? "Drop CSV file here" : "Upload Daily Plan CSV"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Drag and drop or click to browse. Expected columns: Part Number, Day 1, Day 2, ...
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
                <p className="text-sm font-medium text-foreground">No data yet?</p>
                <p className="text-xs text-muted-foreground">
                  Load sample daily plan — each part's daily values sum to its monthly target
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={handleLoadSample} className="gap-1.5 bg-transparent">
                <FileSpreadsheet className="h-3.5 w-3.5" />
                Load Sample Data
              </Button>
            </div>

            {/* Format Guide */}
            <div className="p-3 rounded-lg border border-border bg-card">
              <p className="text-xs font-medium text-foreground mb-2">Expected CSV Format:</p>
              <div className="font-mono text-xs text-muted-foreground bg-muted/50 p-2 rounded overflow-x-auto">
                <p>Part Number,Day 1,Day 2,Day 3,...,Day 22</p>
                <p>F135-HPC-001,6,5,6,5,...,5</p>
                <p className="text-muted-foreground/60 mt-1">
                  * Each part's daily values must sum to its monthly target
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
                        <TableHead key={i} className="font-semibold text-xs text-right min-w-[52px]">
                          Day {i + 1}
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
                            {row.dailyQty.map((qty, di) => (
                              <TableCell key={di} className="font-mono text-xs text-right tabular-nums">
                                {qty}
                              </TableCell>
                            ))}
                            <TableCell className="font-mono text-xs text-right tabular-nums font-semibold">
                              {row.dailyQty.reduce((s, q) => s + q, 0)}
                            </TableCell>
                          </TableRow>
                        ))}
                        {/* Totals Row */}
                        <TableRow className="bg-muted/50 font-semibold sticky bottom-0">
                          <TableCell className="text-xs sticky left-0 bg-muted/50 z-10">Totals</TableCell>
                          {dayTotals.map((total, di) => (
                            <TableCell key={di} className="font-mono text-xs text-right tabular-nums">
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
