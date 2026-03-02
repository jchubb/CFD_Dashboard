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
  Package,
} from "lucide-react"
import { usePlanningPeriod, type WipRow } from "@/components/planning-period-context"

const FAMILY_COLORS: Record<string, string> = {
  F135: "#3b82f6",
  GTF: "#8b5cf6",
  "LEAP-1A": "#10b981",
  GEnx: "#f59e0b",
  CFM56: "#6b7280",
}

function getFamilyBadgeClass(family: string) {
  switch (family) {
    case "F135":    return "border-blue-300 text-blue-700 bg-blue-50"
    case "GTF":     return "border-purple-300 text-purple-700 bg-purple-50"
    case "LEAP-1A": return "border-emerald-300 text-emerald-700 bg-emerald-50"
    case "GEnx":    return "border-amber-300 text-amber-700 bg-amber-50"
    default:        return "border-gray-300 text-gray-700 bg-gray-50"
  }
}

const sampleCSV = `Program Family,Part Number,Description,Total Available
F135,F135-HPC-001,High Pressure Compressor Blade,45
F135,F135-LPT-002,Low Pressure Turbine Disk,22
F135,F135-FAN-003,Fan Blade Assembly,30
GTF,GTF-GB-001,Gearbox Housing,18
GTF,GTF-LPC-002,Low Pressure Compressor Stator,27
GTF,GTF-HPT-003,High Pressure Turbine Blade,14
LEAP-1A,LEAP-CMB-001,Combustor Liner,10
LEAP-1A,LEAP-HPT-002,HPT Nozzle Guide Vane,19
GEnx,GENX-LPT-001,LPT Blade,8
GEnx,GENX-HPC-002,HPC Rotor,12
CFM56,CFM-HPT-001,HPT Shroud,6
CFM56,CFM-FAN-002,Fan Case,9`

interface AvailableWipSectionProps {
  selectedMonth?: string
}

export function AvailableWipSection({ selectedMonth = "January 2024" }: AvailableWipSectionProps) {
  const { wipRows: rows, setWipRows: setRows } = usePlanningPeriod()
  const [uploadStatus, setUploadStatus] = useState<"idle" | "success" | "error">("idle")
  const [uploadMessage, setUploadMessage] = useState("")
  const [isDragging, setIsDragging] = useState(false)
  const [isUploadHovered, setIsUploadHovered] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeView, setActiveView] = useState<"table" | "chart">("table")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const parseCSV = useCallback((text: string) => {
    try {
      const lines = text.trim().split("\n")
      if (lines.length < 2) throw new Error("CSV must have a header row and at least one data row.")

      const headers = lines[0].split(",").map(h => h.trim().toLowerCase())
      const familyIdx  = headers.findIndex(h => h.includes("family") || h.includes("program"))
      const partIdx    = headers.findIndex(h => h.includes("part"))
      const descIdx    = headers.findIndex(h => h.includes("desc"))
      const availIdx   = headers.findIndex(h => h.includes("available") || h.includes("total"))

      if (familyIdx === -1 || partIdx === -1 || availIdx === -1) {
        throw new Error("CSV must include Program Family, Part Number, and Total Available columns.")
      }

      const parsed: WipRow[] = []
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(",").map(c => c.trim())
        if (cols.length < 2) continue
        parsed.push({
          id: `wip-${i}-${Date.now()}`,
          programFamily:  cols[familyIdx] || "Unknown",
          partNumber:     cols[partIdx]   || `PART-${i}`,
          description:    descIdx !== -1  ? cols[descIdx] || "" : "",
          totalAvailable: parseInt(cols[availIdx]) || 0,
        })
      }

      if (parsed.length === 0) throw new Error("No valid data rows found.")

      setRows(parsed)
      setUploadStatus("success")
      setUploadMessage(`Imported ${parsed.length} WIP parts for ${selectedMonth}`)
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
    reader.onload = (e) => parseCSV(e.target?.result as string)
    reader.onerror  = () => { setUploadStatus("error"); setUploadMessage("Failed to read the file.") }
    reader.readAsText(file)
  }, [parseCSV])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFileUpload(file)
  }, [handleFileUpload])

  const handleDragOver  = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(true)  }, [])
  const handleDragLeave = useCallback(() => setIsDragging(false), [])
  const handleLoadSample = useCallback(() => parseCSV(sampleCSV), [parseCSV])
  const handleClear = useCallback(() => {
    setRows([]); setUploadStatus("idle"); setUploadMessage(""); setSearchQuery("")
  }, [])

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return rows
    const q = searchQuery.toLowerCase()
    return rows.filter(r =>
      r.partNumber.toLowerCase().includes(q) ||
      r.programFamily.toLowerCase().includes(q) ||
      r.description.toLowerCase().includes(q)
    )
  }, [rows, searchQuery])

  const histogramData = useMemo(() => {
    const map: Record<string, { available: number; parts: number }> = {}
    rows.forEach(r => {
      if (!map[r.programFamily]) map[r.programFamily] = { available: 0, parts: 0 }
      map[r.programFamily].available += r.totalAvailable
      map[r.programFamily].parts += 1
    })
    return Object.entries(map)
      .map(([family, d]) => ({ family, available: d.available, parts: d.parts, fill: FAMILY_COLORS[family] || "#6b7280" }))
      .sort((a, b) => b.available - a.available)
  }, [rows])

  const chartConfig: ChartConfig = useMemo(() => {
    const cfg: ChartConfig = { available: { label: "Total Available", color: "#3b82f6" } }
    histogramData.forEach(item => { cfg[item.family] = { label: item.family, color: item.fill } })
    return cfg
  }, [histogramData])

  const totalAvailable = rows.reduce((s, r) => s + r.totalAvailable, 0)
  const totalParts     = rows.length

  return (
    <Card className="border border-border">
      <CardHeader className="py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Package className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
              Available WIP — {selectedMonth}
            </CardTitle>
            {rows.length > 0 && (
              <Badge variant="secondary" className="font-mono text-xs">
                {totalParts} parts / {totalAvailable} units
              </Badge>
            )}
          </div>
          {rows.length > 0 && (
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
                onClick={handleClear}
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
        {rows.length === 0 ? (
          <div className="space-y-3">
            {/* Drop zone */}
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
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f) }}
              />
              <div className={`p-3 rounded-xl ${isDragging ? "bg-blue-100" : "bg-muted"}`}>
                <Upload className={`h-6 w-6 ${isDragging ? "text-blue-600" : "text-muted-foreground"}`} />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">
                  {isDragging ? "Drop CSV file here" : "Upload Available WIP CSV"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Expected columns: Program Family, Part Number, Total Available
                </p>
              </div>
            </div>

            {uploadStatus === "error" && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200">
                <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
                <p className="text-sm text-red-700">{uploadMessage}</p>
              </div>
            )}

            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border">
              <div>
                <p className="text-sm font-medium text-foreground">No data yet?</p>
                <p className="text-xs text-muted-foreground">Load sample WIP data to preview the feature</p>
              </div>
              <Button variant="outline" size="sm" onClick={handleLoadSample} className="gap-1.5 bg-transparent">
                <FileSpreadsheet className="h-3.5 w-3.5" />
                Load Sample Data
              </Button>
            </div>

            <div className="p-3 rounded-lg border border-border bg-card">
              <p className="text-xs font-medium text-foreground mb-2">Expected CSV Format:</p>
              <div className="font-mono text-xs text-muted-foreground bg-muted/50 p-2 rounded overflow-x-auto">
                <p>Program Family,Part Number,Description,Total Available</p>
                <p>F135,F135-HPC-001,HPC Blade,45</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {uploadStatus === "success" && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <p className="text-sm text-emerald-700">{uploadMessage}</p>
              </div>
            )}

            {/* Table View */}
            {activeView === "table" && (
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search parts by number, family, or description..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <div className="border rounded-lg overflow-hidden">
                  <div className="max-h-[380px] overflow-y-auto">
                    <Table>
                      <TableHeader className="sticky top-0 bg-muted/90 backdrop-blur-sm">
                        <TableRow>
                          <TableHead className="font-semibold text-xs w-[100px]">Family</TableHead>
                          <TableHead className="font-semibold text-xs">Part Number</TableHead>
                          <TableHead className="font-semibold text-xs">Description</TableHead>
                          <TableHead className="font-semibold text-xs text-right w-[120px]">Total Available</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filtered.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                              No parts match your search.
                            </TableCell>
                          </TableRow>
                        ) : (
                          filtered.map((row) => (
                            <TableRow key={row.id} className="hover:bg-muted/30">
                              <TableCell>
                                <Badge variant="outline" className={`font-medium text-xs ${getFamilyBadgeClass(row.programFamily)}`}>
                                  {row.programFamily}
                                </Badge>
                              </TableCell>
                              <TableCell className="font-mono text-xs">{row.partNumber}</TableCell>
                              <TableCell className="text-xs text-muted-foreground">{row.description}</TableCell>
                              <TableCell className="font-mono text-xs text-right font-semibold">{row.totalAvailable}</TableCell>
                            </TableRow>
                          ))
                        )}
                        {filtered.length > 0 && (
                          <TableRow className="bg-muted/50 font-semibold">
                            <TableCell colSpan={3} className="text-xs text-right">Totals:</TableCell>
                            <TableCell className="font-mono text-xs text-right">
                              {filtered.reduce((s, r) => s + r.totalAvailable, 0)}
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            )}

            {/* Chart View */}
            {activeView === "chart" && (
              <div className="space-y-4">
                <div className="p-4 rounded-lg border border-border bg-card">
                  <h4 className="text-sm font-semibold text-foreground mb-1">WIP Distribution by Family</h4>
                  <p className="text-xs text-muted-foreground mb-4">
                    Total available units across program families for {selectedMonth}
                  </p>
                  <ChartContainer config={chartConfig} className="h-[280px] w-full">
                    <BarChart data={histogramData} margin={{ top: 8, right: 12, left: 12, bottom: 4 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="family" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                      <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                      <ChartTooltip
                        content={
                          <ChartTooltipContent
                            formatter={(value, _name, item) => (
                              <div className="flex flex-col gap-1">
                                <span className="font-semibold">{item.payload.family}</span>
                                <span>Available: {value} units</span>
                                <span className="text-muted-foreground">{item.payload.parts} part numbers</span>
                              </div>
                            )}
                          />
                        }
                      />
                      <Bar dataKey="available" radius={[6, 6, 0, 0]} maxBarSize={80}>
                        {histogramData.map((entry) => (
                          <Cell key={entry.family} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ChartContainer>
                </div>
                <div className="grid grid-cols-5 gap-3">
                  {histogramData.map(item => (
                    <div key={item.family} className="p-3 rounded-lg border border-border bg-card text-center">
                      <Badge variant="outline" className={`text-xs mb-2 ${getFamilyBadgeClass(item.family)}`}>
                        {item.family}
                      </Badge>
                      <p className="text-lg font-semibold font-mono">{item.available}</p>
                      <p className="text-[11px] text-muted-foreground">{item.parts} parts</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
