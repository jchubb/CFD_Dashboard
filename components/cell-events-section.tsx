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
  Calendar,
} from "lucide-react"

import { usePlanningPeriod, type CellEventsRow } from "@/components/planning-period-context"

export type { CellEventsRow }

const EVENT_COLORS: Record<string, string> = {
  load_start: "border-emerald-300 text-emerald-700 bg-emerald-50",
  load_complete: "border-blue-300 text-blue-700 bg-blue-50",
  cycle_start: "border-amber-300 text-amber-700 bg-amber-50",
  cycle_complete: "border-purple-300 text-purple-700 bg-purple-50",
  unload: "border-red-300 text-red-700 bg-red-50",
  hold: "border-gray-300 text-gray-700 bg-gray-50",
}

function getEventClass(event: string) {
  return EVENT_COLORS[event.toLowerCase()] ?? "border-gray-200 text-gray-500 bg-gray-50"
}

const sampleCSV = `Part Number,Date,Heatcode,Event,BT_ID,Cycle,Load Number
F135-HPC-001,2026-02-11,PIREW2021,LOAD_START,543289,3,20261231
F135-HPC-001,2026-02-11,PIREW2022,CYCLE_START,543233,1,20261232
F135-HPC-001,2026-02-11,PIREW2023,CYCLE_COMPLETE,543273,2,20261233
F135-HPC-001,2026-02-11,PIREW2024,LOAD_COMPLETE,543280,4,20261234
F135-FAN-003,2026-02-11,PIREX3001,UNLOAD,543272,1,20261235
CFM-HPT-001,2026-02-11,PDQUA2031,HOLD,543287,3,20261236
GTF-HPT-003,2026-02-11,PDQWA2021,LOAD_START,543289,2,20261237
LEAP-HPT-002,2026-02-11,PDXMA2011,CYCLE_START,543289,1,20261238
F135-LPT-002,2026-02-12,PIREZ2012,LOAD_COMPLETE,543289,5,20261239
GENX-HPC-002,2026-02-12,PIRFX2011,CYCLE_COMPLETE,543289,2,20261240`

interface CellEventsSectionProps {
  selectedMonth?: string
}

export function CellEventsSection({ selectedMonth = "January 2024" }: CellEventsSectionProps) {
  const { cellEventsRows: rows, setCellEventsRows: setRows } = usePlanningPeriod()
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
      const dateIdx = headers.findIndex(h => h.includes("date"))
      const heatIdx = headers.findIndex(h => h.includes("heat"))
      const eventIdx = headers.findIndex(h => h.includes("event"))
      const btIdx = headers.findIndex(h => h.includes("bt"))
      const cycleIdx = headers.findIndex(h => h.includes("cycle"))
      const loadIdx = headers.findIndex(h => h.includes("load"))

      if (partIdx === -1 || eventIdx === -1) {
        throw new Error("CSV must include Part Number and Event columns.")
      }

      const parsed: CellEventsRow[] = []
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(",").map(c => c.trim())
        if (cols.length < 2) continue
        parsed.push({
          id: `event-${i}-${Date.now()}`,
          partNumber: partIdx !== -1 ? cols[partIdx] || "" : "",
          date: dateIdx !== -1 ? cols[dateIdx] || "" : "",
          heatcode: heatIdx !== -1 ? cols[heatIdx] || "" : "",
          event: eventIdx !== -1 ? cols[eventIdx] || "" : "",
          btid: btIdx !== -1 ? cols[btIdx] || "" : "",
          cycle: cycleIdx !== -1 ? cols[cycleIdx] || "" : "",
          loadNumber: loadIdx !== -1 ? cols[loadIdx] || "" : "",
        })
      }

      if (parsed.length === 0) throw new Error("No valid data rows found.")
      setRows(parsed)
      setUploadStatus("success")
      setUploadMessage(`Imported ${parsed.length} cell event records for ${selectedMonth}`)
    } catch (err) {
      setUploadStatus("error")
      setUploadMessage(err instanceof Error ? err.message : "Failed to parse CSV file.")
    }
  }, [selectedMonth, setRows])

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

  const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(true) }, [])
  const handleDragLeave = useCallback(() => setIsDragging(false), [])
  const handleLoadSample = useCallback(() => parseCSV(sampleCSV), [parseCSV])
  const handleClear = useCallback(() => {
    setRows([]); setUploadStatus("idle"); setUploadMessage(""); setSearchQuery("")
  }, [setRows])

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return rows
    const q = searchQuery.toLowerCase()
    return rows.filter(r =>
      r.partNumber.toLowerCase().includes(q) ||
      r.date.toLowerCase().includes(q) ||
      r.heatcode.toLowerCase().includes(q) ||
      r.event.toLowerCase().includes(q) ||
      r.btid.toLowerCase().includes(q) ||
      r.cycle.toLowerCase().includes(q) ||
      r.loadNumber.toLowerCase().includes(q)
    )
  }, [rows, searchQuery])

  return (
    <Card className="border border-border">
      <CardHeader className="py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
              Cell Events — {selectedMonth}
            </CardTitle>
            {rows.length > 0 && (
              <Badge variant="secondary" className="font-mono text-xs">
                {rows.length} events
              </Badge>
            )}
          </div>
          {rows.length > 0 && (
            <div className="flex items-center gap-2">
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
              className={`relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 cursor-pointer transition-all ${isDragging
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
                  {isDragging ? "Drop CSV file here" : "Upload Cell Events CSV"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Expected columns: Part Number, Date, Heatcode, Event, BT_ID, Cycle, Load Number
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
                <p className="text-xs text-muted-foreground">Load sample cell events data to preview the feature</p>
              </div>
              <Button variant="outline" size="sm" onClick={handleLoadSample} className="gap-1.5 bg-transparent">
                <FileSpreadsheet className="h-3.5 w-3.5" />
                Load Sample Data
              </Button>
            </div>

            <div className="p-3 rounded-lg border border-border bg-card">
              <p className="text-xs font-medium text-foreground mb-2">Expected CSV Format:</p>
              <div className="font-mono text-xs text-muted-foreground bg-muted/50 p-2 rounded overflow-x-auto">
                <p>Part Number,Date,Heatcode,Event,BT_ID,Cycle,Load Number</p>
                <p>F135-HPC-001,2026-02-11,PIRAQ0012,LOAD_START,543289,3,20261231</p>
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
                placeholder="Search by part number, date, heatcode, event, BT_ID, cycle, or load number..."
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
                      <TableHead className="font-semibold text-xs">Part Number</TableHead>
                      <TableHead className="font-semibold text-xs w-[100px]">Date</TableHead>
                      <TableHead className="font-semibold text-xs w-[110px]">Heatcode</TableHead>
                      <TableHead className="font-semibold text-xs w-[130px]">Event</TableHead>
                      <TableHead className="font-semibold text-xs w-[100px]">BT_ID</TableHead>
                      <TableHead className="font-semibold text-xs w-[80px]">Cycle</TableHead>
                      <TableHead className="font-semibold text-xs w-[110px]">Load Number</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No records match your search.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filtered.map((row) => (
                        <TableRow key={row.id} className="hover:bg-muted/30">
                          <TableCell className="font-mono text-xs">{row.partNumber}</TableCell>
                          <TableCell className="font-mono text-xs text-muted-foreground">{row.date}</TableCell>
                          <TableCell className="font-mono text-xs">{row.heatcode}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{row.event.replace(/_/g, ' ')}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{row.btid}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{row.cycle}</TableCell>
                          <TableCell className="font-mono text-xs font-semibold">{row.loadNumber}</TableCell>
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
