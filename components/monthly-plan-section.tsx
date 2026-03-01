"use client"

import React, { useState, useMemo, useRef, useCallback } from "react"
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
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Bar, BarChart, XAxis, YAxis, CartesianGrid, Cell } from "recharts"
import {
  Upload,
  FileSpreadsheet,
  X,
  AlertCircle,
  CheckCircle2,
  BarChart3,
  TableIcon,
  Search,
} from "lucide-react"
import { usePlanningPeriod } from "@/components/planning-period-context"

export type { MonthlyPlanRow } from "@/components/planning-period-context"
import type { MonthlyPlanRow } from "@/components/planning-period-context"

const FAMILY_COLORS: Record<string, string> = {
  F135: "#3b82f6",
  GTF: "#8b5cf6",
  "LEAP-1A": "#10b981",
  GEnx: "#f59e0b",
  CFM56: "#6b7280",
}

function getFamilyBadgeClass(family: string) {
  switch (family) {
    case "F135":
      return "border-blue-300 text-blue-700 bg-blue-50"
    case "GTF":
      return "border-purple-300 text-purple-700 bg-purple-50"
    case "LEAP-1A":
      return "border-emerald-300 text-emerald-700 bg-emerald-50"
    case "GEnx":
      return "border-amber-300 text-amber-700 bg-amber-50"
    default:
      return "border-gray-300 text-gray-700 bg-gray-50"
  }
}

const sampleCSV = `Program Family,Part Number,Description,Monthly Target,Week 1,Week 2,Week 3,Week 4
F135,F135-HPC-001,High Pressure Compressor Blade,120,30,30,30,30
F135,F135-LPT-002,Low Pressure Turbine Disk,80,20,20,20,20
F135,F135-FAN-003,Fan Blade Assembly,100,25,25,25,25
GTF,GTF-GB-001,Gearbox Housing,90,22,23,22,23
GTF,GTF-LPC-002,Low Pressure Compressor Stator,110,28,27,28,27
GTF,GTF-HPT-003,High Pressure Turbine Blade,95,24,24,23,24
LEAP-1A,LEAP-CMB-001,Combustor Liner,75,19,19,18,19
LEAP-1A,LEAP-HPT-002,HPT Nozzle Guide Vane,85,21,22,21,21
GEnx,GENX-LPT-001,LPT Blade,70,18,17,18,17
GEnx,GENX-HPC-002,HPC Rotor,60,15,15,15,15
CFM56,CFM-HPT-001,HPT Shroud,65,16,17,16,16
CFM56,CFM-FAN-002,Fan Case,50,12,13,12,13`

interface MonthlyPlanSectionProps {
  selectedMonth?: string
}

export function MonthlyPlanSection({ selectedMonth = "January 2024" }: MonthlyPlanSectionProps) {
  const { monthlyPlanRows: csvData, setMonthlyPlanRows: setCsvData } = usePlanningPeriod()
  const [uploadStatus, setUploadStatus] = useState<"idle" | "success" | "error">("idle")
  const [uploadMessage, setUploadMessage] = useState("")
  const [isDragging, setIsDragging] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeView, setActiveView] = useState<"table" | "chart">("table")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const parseCSV = useCallback((text: string) => {
    try {
      const lines = text.trim().split("\n")
      if (lines.length < 2) throw new Error("CSV must have a header row and at least one data row.")

      const headers = lines[0].split(",").map(h => h.trim().toLowerCase())

      const familyIdx = headers.findIndex(h => h.includes("family") || h.includes("program"))
      const partIdx = headers.findIndex(h => h.includes("part number") || h.includes("part"))
      const descIdx = headers.findIndex(h => h.includes("description") || h.includes("desc"))
      const targetIdx = headers.findIndex(h => h.includes("target") || h.includes("monthly"))

      const weekIndices: number[] = []
      headers.forEach((h, i) => {
        if (h.includes("week") || h.match(/^w\d/)) weekIndices.push(i)
      })

      if (familyIdx === -1 || partIdx === -1 || targetIdx === -1) {
        throw new Error("CSV must include Program Family, Part Number, and Monthly Target columns.")
      }

      const rows: MonthlyPlanRow[] = []
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(",").map(c => c.trim())
        if (cols.length < 3) continue

        const target = parseInt(cols[targetIdx]) || 0
        const weeklyBreakdown = weekIndices.length > 0
          ? weekIndices.map(wi => parseInt(cols[wi]) || 0)
          : [
            Math.ceil(target * 0.25),
            Math.ceil(target * 0.25),
            Math.ceil(target * 0.25),
            target - Math.ceil(target * 0.25) * 3,
          ]

        rows.push({
          id: `csv-${i}-${Date.now()}`,
          programFamily: cols[familyIdx] || "Unknown",
          partNumber: cols[partIdx] || `PART-${i}`,
          description: descIdx !== -1 ? cols[descIdx] || "" : "",
          monthlyTarget: target,
          weeklyBreakdown,
        })
      }

      if (rows.length === 0) throw new Error("No valid data rows found.")

      setCsvData(rows)
      setUploadStatus("success")
      setUploadMessage(`Imported ${rows.length} parts for ${selectedMonth}`)
    } catch (err) {
      setUploadStatus("error")
      setUploadMessage(err instanceof Error ? err.message : "Failed to parse CSV file.")
    }
  }, [selectedMonth])

  const handleFileUpload = useCallback((file: File) => {
    if (!file.name.endsWith(".csv")) {
      setUploadStatus("error")
      setUploadMessage("Please upload a .csv file.")
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      parseCSV(text)
    }
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

  const handleDragLeave = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleLoadSample = useCallback(() => {
    parseCSV(sampleCSV)
  }, [parseCSV])

  const handleClearData = useCallback(() => {
    setCsvData([])
    setUploadStatus("idle")
    setUploadMessage("")
    setSearchQuery("")
  }, [])

  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return csvData
    const q = searchQuery.toLowerCase()
    return csvData.filter(row =>
      row.partNumber.toLowerCase().includes(q) ||
      row.programFamily.toLowerCase().includes(q) ||
      row.description.toLowerCase().includes(q)
    )
  }, [csvData, searchQuery])

  // Histogram data: aggregate by program family
  const histogramData = useMemo(() => {
    const familyMap: Record<string, { target: number; parts: number }> = {}
    csvData.forEach(row => {
      if (!familyMap[row.programFamily]) {
        familyMap[row.programFamily] = { target: 0, parts: 0 }
      }
      familyMap[row.programFamily].target += row.monthlyTarget
      familyMap[row.programFamily].parts += 1
    })
    return Object.entries(familyMap)
      .map(([family, data]) => ({
        family,
        target: data.target,
        parts: data.parts,
        fill: FAMILY_COLORS[family] || "#6b7280",
      }))
      .sort((a, b) => b.target - a.target)
  }, [csvData])

  const chartConfig: ChartConfig = useMemo(() => {
    const config: ChartConfig = {
      target: { label: "Monthly Target", color: "#3b82f6" },
    }
    histogramData.forEach(item => {
      config[item.family] = {
        label: item.family,
        color: FAMILY_COLORS[item.family] || "#6b7280",
      }
    })
    return config
  }, [histogramData])

  const totalTarget = csvData.reduce((s, r) => s + r.monthlyTarget, 0)
  const totalParts = csvData.length

  return (
    <Card className="border border-border">
      <CardHeader className="py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
              Monthly Plan - {selectedMonth}
            </CardTitle>
            {csvData.length > 0 && (
              <Badge variant="secondary" className="font-mono text-xs">
                {totalParts} parts / {totalTarget} units
              </Badge>
            )}
          </div>
          {csvData.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-muted rounded-lg p-0.5">
                <Button
                  variant={activeView === "table" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setActiveView("table")}
                  className="gap-1.5 h-7"
                >
                  <TableIcon className="h-3.5 w-3.5" />
                  Table
                </Button>
                <Button
                  variant={activeView === "chart" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setActiveView("chart")}
                  className="gap-1.5 h-7"
                >
                  <BarChart3 className="h-3.5 w-3.5" />
                  Part Mix
                </Button>
              </div>
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
        {/* Upload Section */}
        {csvData.length === 0 ? (
          <div className="space-y-3">
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 cursor-pointer transition-all ${isDragging
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
                  {isDragging ? "Drop CSV file here" : "Upload Monthly Plan CSV"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Drag and drop or click to browse. Expected columns: Program Family, Part Number, Monthly Target
                </p>
              </div>
            </div>

            {/* Status Message */}
            {uploadStatus === "error" && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200">
                <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
                <p className="text-sm text-red-700">{uploadMessage}</p>
              </div>
            )}

            {/* Sample Data Option */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border">
              <div>
                <p className="text-sm font-medium text-foreground">No data yet?</p>
                <p className="text-xs text-muted-foreground">Load sample monthly plan data to preview the feature</p>
              </div>
              <Button variant="outline" size="sm" onClick={handleLoadSample} className="gap-1.5 bg-transparent">
                <FileSpreadsheet className="h-3.5 w-3.5" />
                Load Sample Data
              </Button>
            </div>

            {/* CSV Format Guide */}
            <div className="p-3 rounded-lg border border-border bg-card">
              <p className="text-xs font-medium text-foreground mb-2">Expected CSV Format:</p>
              <div className="font-mono text-xs text-muted-foreground bg-muted/50 p-2 rounded overflow-x-auto">
                <p>Program Family,Part Number,Description,Monthly Target</p>
                <p>F135,F135-HPC-001,HPC Blade,120</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Success Banner */}
            {uploadStatus === "success" && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <p className="text-sm text-emerald-700">{uploadMessage}</p>
              </div>
            )}

            {/* Table View */}
            {activeView === "table" && (
              <div className="space-y-3">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search parts by number, family, or description..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>

                {/* Table */}
                <div className="border rounded-lg overflow-hidden">
                  <div className="max-h-[380px] overflow-y-auto">
                    <Table>
                      <TableHeader className="sticky top-0 bg-muted/90 backdrop-blur-sm">
                        <TableRow>
                          <TableHead className="font-semibold text-xs w-[100px]">Family</TableHead>
                          <TableHead className="font-semibold text-xs">Part Number</TableHead>
                          <TableHead className="font-semibold text-xs">Description</TableHead>
                          <TableHead className="font-semibold text-xs text-right w-[100px]">Monthly Target</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredData.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                              No parts match your search.
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredData.map((row) => (
                            <TableRow key={row.id} className="hover:bg-muted/30">
                              <TableCell>
                                <Badge variant="outline" className={`font-medium text-xs ${getFamilyBadgeClass(row.programFamily)}`}>
                                  {row.programFamily}
                                </Badge>
                              </TableCell>
                              <TableCell className="font-mono text-xs">{row.partNumber}</TableCell>
                              <TableCell className="text-xs text-muted-foreground">{row.description}</TableCell>
                              <TableCell className="font-mono text-xs text-right font-semibold">{row.monthlyTarget}</TableCell>
                            </TableRow>
                          ))
                        )}
                        {/* Totals Row */}
                        {filteredData.length > 0 && (
                          <TableRow className="bg-muted/50 font-semibold">
                            <TableCell colSpan={3} className="text-xs text-right">Totals:</TableCell>
                            <TableCell className="font-mono text-xs text-right">
                              {filteredData.reduce((s, r) => s + r.monthlyTarget, 0)}
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            )}

            {/* Histogram View */}
            {activeView === "chart" && (
              <div className="space-y-4">
                {/* Part Mix Distribution Histogram */}
                <div className="p-4 rounded-lg border border-border bg-card">
                  <h4 className="text-sm font-semibold text-foreground mb-1">Part Mix Distribution</h4>
                  <p className="text-xs text-muted-foreground mb-4">
                    Monthly target allocation across program families for {selectedMonth}
                  </p>
                  <ChartContainer config={chartConfig} className="h-[280px] w-full">
                    <BarChart data={histogramData} margin={{ top: 8, right: 12, left: 12, bottom: 4 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis
                        dataKey="family"
                        tickLine={false}
                        axisLine={false}
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        tick={{ fontSize: 11 }}
                        tickFormatter={(value) => `${value}`}
                      />
                      <ChartTooltip
                        content={
                          <ChartTooltipContent
                            formatter={(value, name, item) => (
                              <div className="flex flex-col gap-1">
                                <span className="font-semibold">{item.payload.family}</span>
                                <span>Target: {value} units</span>
                                <span className="text-muted-foreground">{item.payload.parts} part numbers</span>
                              </div>
                            )}
                          />
                        }
                      />
                      <Bar dataKey="target" radius={[6, 6, 0, 0]} maxBarSize={80}>
                        {histogramData.map((entry) => (
                          <Cell key={entry.family} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ChartContainer>
                </div>

                {/* Summary Cards Below Chart */}
                <div className="grid grid-cols-5 gap-3">
                  {histogramData.map(item => {
                    const pct = totalTarget > 0 ? ((item.target / totalTarget) * 100).toFixed(1) : "0"
                    return (
                      <div key={item.family} className="p-3 rounded-lg border border-border bg-card text-center">
                        <div className="flex items-center justify-center gap-2 mb-1">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.fill }} />
                          <span className="text-xs font-semibold">{item.family}</span>
                        </div>
                        <p className="text-lg font-bold font-mono text-foreground">{item.target}</p>
                        <p className="text-xs text-muted-foreground">{pct}% of mix</p>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
