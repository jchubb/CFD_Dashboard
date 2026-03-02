"use client"

import React, { useState, useMemo, useRef, useCallback } from "react"
import { usePlanningPeriod, type DailyActualsRow } from "@/components/planning-period-context"
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
export type { DailyActualsRow } from "@/components/planning-period-context"

// Generate sample CSV with 31 days; days 11-31 are empty to represent incomplete actuals
const buildSampleCSV = () => {
  const header = ["Part Number", ...Array.from({ length: 31 }, (_, i) => `Day ${i + 1}`)].join(",")
  const parts = [
    "F135-HPC-001",
    "F135-LPT-002",
    "F135-FAN-003",
    "GTF-GB-001",
    "GTF-LPC-002",
    "GTF-HPT-003",
    "LEAP-CMB-001",
    "LEAP-HPT-002",
    "GENX-LPT-001",
    "GENX-HPC-002",
    "CFM-HPT-001",
    "CFM-FAN-002",
  ]
  const rows = parts.map((pn) => {
    const dailies = Array.from({ length: 31 }, (_, i) =>
      i < 10 ? Math.floor(Math.random() * 5 + 1) : ""
    )
    return [pn, ...dailies].join(",")
  })
  return [header, ...rows].join("\n")
}

const sampleCSV = buildSampleCSV()

interface DailyActualsSectionProps {
  selectedMonth?: string
}

export function DailyActualsSection({ selectedMonth = "January 2024" }: DailyActualsSectionProps) {
  const { dailyActualsRows: csvData, setDailyActualsRows: setCsvData } = usePlanningPeriod()
  const [uploadStatus, setUploadStatus] = useState<"idle" | "success" | "error">("idle")
  const [uploadMessage, setUploadMessage] = useState("")
  const [isDragging, setIsDragging] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const parseCSV = useCallback((text: string) => {
    try {
      const lines = text.trim().split("\n")
      if (lines.length < 2) throw new Error("CSV must have a header row and at least one data row.")

      const headers = lines[0].split(",").map(h => h.trim().toLowerCase())

      const partIdx = headers.findIndex(h => h.includes("part"))
      if (partIdx === -1) throw new Error("CSV must include a Part Number column.")

      // Day columns: anything that starts with "day" or matches d\d+
      const dayIndices: number[] = []
      headers.forEach((h, i) => {
        if (i !== partIdx && (h.includes("day") || h.match(/^d\d+/))) dayIndices.push(i)
      })

      if (dayIndices.length === 0) {
        throw new Error("CSV must include at least one Day column (e.g. Day 1, Day 2, ...).")
      }

      const rows: DailyActualsRow[] = []
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(",").map(c => c.trim())
        const partNumber = cols[partIdx]
        if (!partNumber) continue
        const dailyQty = dayIndices.map(di => {
          const raw = cols[di]
          return raw === "" || raw === undefined ? null : (parseInt(raw) || 0)
        })
        rows.push({ id: `da-${i}-${Date.now()}`, partNumber, dailyQty })
      }

      if (rows.length === 0) throw new Error("No valid data rows found.")

      setCsvData(rows)
      setUploadStatus("success")
      setUploadMessage(`Imported actuals for ${rows.length} parts — ${dayIndices.length} days`)
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
      filteredData.reduce((sum, row) => sum + (row.dailyQty[di] ?? 0), 0)    )
  }, [filteredData, dayCount])

  return (
    <Card className="border border-border">
      <CardHeader className="py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
              Daily Actuals — {selectedMonth}
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
              className={`relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 cursor-pointer transition-all ${
                isDragging
                  ? "border-blue-400 bg-blue-50"
                  : "border-border hover:border-muted-foreground/40 hover:bg-muted/30"
              }`}
            >
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
                  {isDragging ? "Drop CSV file here" : "Upload Daily Actuals CSV"}
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
                <p className="text-xs text-muted-foreground">Load sample daily actuals to preview the feature</p>
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
                <p>Part Number,Day 1,Day 2,Day 3,...,Day 31</p>
                <p>F135-HPC-001,4,3,5,...,2</p>
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
                        <TableHead className="font-semibold text-xs text-right min-w-[52px]">
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
                        <TableCell colSpan={dayCount + 1} className="text-center py-8 text-muted-foreground">
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
                              <TableCell key={di} className={`font-mono text-xs text-right tabular-nums ${qty === null ? "text-muted-foreground/30" : ""}`}>
                                {qty === null ? "—" : qty}
                              </TableCell>
                            ))}
                            <TableCell className="font-mono text-xs text-right tabular-nums font-semibold">
                              {row.dailyQty.reduce((s, q) => s + (q ?? 0), 0)}
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
