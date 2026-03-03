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
  Upload,
  FileSpreadsheet,
  X,
  AlertCircle,
  CheckCircle2,
  Search,
  Activity,
} from "lucide-react"

import { usePlanningPeriod, type CellStatusRow } from "@/components/planning-period-context"

export type { CellStatusRow }

const STATUS_COLORS: Record<string, string> = {
  active:    "border-emerald-300 text-emerald-700 bg-emerald-50",
  complete:  "border-blue-300 text-blue-700 bg-blue-50",
  pending:   "border-amber-300 text-amber-700 bg-amber-50",
  hold:      "border-red-300 text-red-700 bg-red-50",
  idle:      "border-gray-200 text-gray-500 bg-gray-50",
}

function getStatusClass(status: string) {
  return STATUS_COLORS[status.toLowerCase()] ?? "border-gray-200 text-gray-500 bg-gray-50"
}

const sampleCSV = `Load Number,Part Number,Heatcode,Cycle,Status,Start Time
L-0041,F135-HPC-001,HC-7741,Cycle-3,Active,2026-02-11 06:00
L-0042,GTF-LPC-002,HC-7742,Cycle-1,Active,2026-02-11 06:30
L-0043,LEAP-CMB-001,HC-7743,Cycle-2,Complete,2026-02-11 02:00
L-0044,GENX-LPT-001,HC-7744,Cycle-4,Pending,2026-02-11 10:00
L-0045,F135-FAN-003,HC-7745,Cycle-1,Active,2026-02-11 07:15
L-0046,CFM-HPT-001,HC-7746,Cycle-3,Hold,2026-02-11 05:45
L-0047,GTF-HPT-003,HC-7747,Cycle-2,Complete,2026-02-11 01:30
L-0048,LEAP-HPT-002,HC-7748,Cycle-1,Pending,2026-02-11 11:00
L-0049,F135-LPT-002,HC-7749,Cycle-5,Active,2026-02-11 08:00
L-0050,GENX-HPC-002,HC-7750,Cycle-2,Idle,2026-02-11 09:30`

interface CellStatusSectionProps {
  selectedMonth?: string
}

export function CellStatusSection({ selectedMonth = "January 2024" }: CellStatusSectionProps) {
  const { cellStatusRows: rows, setCellStatusRows: setRows } = usePlanningPeriod()
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
      const loadIdx   = headers.findIndex(h => h.includes("load"))
      const partIdx   = headers.findIndex(h => h.includes("part"))
      const heatIdx   = headers.findIndex(h => h.includes("heat"))
      const cycleIdx  = headers.findIndex(h => h.includes("cycle"))
      const statusIdx = headers.findIndex(h => h.includes("status"))
      const startIdx  = headers.findIndex(h => h.includes("start"))

      if (loadIdx === -1 || partIdx === -1 || statusIdx === -1) {
        throw new Error("CSV must include Load Number, Part Number, and Status columns.")
      }

      const parsed: CellStatusRow[] = []
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(",").map(c => c.trim())
        if (cols.length < 2) continue
        parsed.push({
          id:        `cell-${i}-${Date.now()}`,
          loadNumber: loadIdx  !== -1 ? cols[loadIdx]  || `L-${i}` : `L-${i}`,
          partNumber: partIdx  !== -1 ? cols[partIdx]  || "" : "",
          heatcode:   heatIdx  !== -1 ? cols[heatIdx]  || "" : "",
          cycle:      cycleIdx !== -1 ? cols[cycleIdx] || "" : "",
          status:     statusIdx !== -1 ? cols[statusIdx] || "" : "",
          startTime:  startIdx  !== -1 ? cols[startIdx]  || "" : "",
        })
      }

      if (parsed.length === 0) throw new Error("No valid data rows found.")
      setRows(parsed)
      setUploadStatus("success")
      setUploadMessage(`Imported ${parsed.length} cell status records for ${selectedMonth}`)
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
    reader.onerror = () => { setUploadStatus("error"); setUploadMessage("Failed to read the file.") }
    reader.readAsText(file)
  }, [parseCSV])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFileUpload(file)
  }, [handleFileUpload])

  const handleDragOver  = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(true) }, [])
  const handleDragLeave = useCallback(() => setIsDragging(false), [])
  const handleLoadSample = useCallback(() => parseCSV(sampleCSV), [parseCSV])
  const handleClear = useCallback(() => {
    setRows([]); setUploadStatus("idle"); setUploadMessage(""); setSearchQuery("")
  }, [])

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return rows
    const q = searchQuery.toLowerCase()
    return rows.filter(r =>
      r.loadNumber.toLowerCase().includes(q) ||
      r.partNumber.toLowerCase().includes(q) ||
      r.heatcode.toLowerCase().includes(q) ||
      r.cycle.toLowerCase().includes(q) ||
      r.status.toLowerCase().includes(q)
    )
  }, [rows, searchQuery])

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    rows.forEach(r => {
      const s = r.status.toLowerCase()
      counts[s] = (counts[s] || 0) + 1
    })
    return counts
  }, [rows])

  return (
    <Card className="border border-border">
      <CardHeader className="py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Activity className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
              Cell Status — {selectedMonth}
            </CardTitle>
            {rows.length > 0 && (
              <Badge variant="secondary" className="font-mono text-xs">
                {rows.length} loads
              </Badge>
            )}
          </div>
          {rows.length > 0 && (
            <div className="flex items-center gap-2">
              {/* Status summary chips */}
              {Object.entries(statusCounts).map(([s, count]) => (
                <Badge key={s} variant="outline" className={`text-xs capitalize ${getStatusClass(s)}`}>
                  {s}: {count}
                </Badge>
              ))}
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
                  {isDragging ? "Drop CSV file here" : "Upload Cell Status CSV"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Expected columns: Load Number, Part Number, Heatcode, Cycle, Status, Start Time
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
                <p className="text-xs text-muted-foreground">Load sample cell status data to preview the feature</p>
              </div>
              <Button variant="outline" size="sm" onClick={handleLoadSample} className="gap-1.5 bg-transparent">
                <FileSpreadsheet className="h-3.5 w-3.5" />
                Load Sample Data
              </Button>
            </div>

            <div className="p-3 rounded-lg border border-border bg-card">
              <p className="text-xs font-medium text-foreground mb-2">Expected CSV Format:</p>
              <div className="font-mono text-xs text-muted-foreground bg-muted/50 p-2 rounded overflow-x-auto">
                <p>Load Number,Part Number,Heatcode,Cycle,Status,Start Time</p>
                <p>L-0041,F135-HPC-001,HC-7741,Cycle-3,Active,2026-02-11 06:00</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {uploadStatus === "success" && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <p className="text-sm text-emerald-700">{uploadMessage}</p>
              </div>
            )}

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by load number, part number, heatcode, cycle, or status..."
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
                      <TableHead className="font-semibold text-xs w-[110px]">Load Number</TableHead>
                      <TableHead className="font-semibold text-xs">Part Number</TableHead>
                      <TableHead className="font-semibold text-xs w-[110px]">Heatcode</TableHead>
                      <TableHead className="font-semibold text-xs w-[100px]">Cycle</TableHead>
                      <TableHead className="font-semibold text-xs w-[100px]">Status</TableHead>
                      <TableHead className="font-semibold text-xs w-[150px]">Start Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No records match your search.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filtered.map((row) => (
                        <TableRow key={row.id} className="hover:bg-muted/30">
                          <TableCell className="font-mono text-xs font-semibold">{row.loadNumber}</TableCell>
                          <TableCell className="font-mono text-xs">{row.partNumber}</TableCell>
                          <TableCell className="font-mono text-xs">{row.heatcode}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{row.cycle}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`text-xs capitalize ${getStatusClass(row.status)}`}>
                              {row.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-xs text-muted-foreground">{row.startTime}</TableCell>
                        </TableRow>
                      ))
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
