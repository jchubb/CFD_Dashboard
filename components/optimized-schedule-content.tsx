"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { CalendarClock, Download, Search } from "lucide-react"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type Source = "Plan" | "Rollover" | "Manual"

type ScheduleRow = {
  partNumber: string
  programFamily: string
  description: string
  quantity: number
  source: Source
}

type DayType = "simulated" | "projected"

type ScheduleDay = {
  label: string
  fullLabel: string
  type: DayType
  rows: ScheduleRow[]
}

// ---------------------------------------------------------------------------
// Projected row pool — reused with quantity variation across projected days
// ---------------------------------------------------------------------------
function projectedRows(quantities: number[]): ScheduleRow[] {
  const pool: Omit<ScheduleRow, "quantity">[] = [
    { partNumber: "PN-10045", programFamily: "F135",    description: "Fan Blade Assembly",          source: "Plan" },
    { partNumber: "PN-20187", programFamily: "GTF",     description: "Compressor Disk Stage 3",      source: "Plan" },
    { partNumber: "PN-30291", programFamily: "LEAP-1A", description: "Low Pressure Turbine Vane",    source: "Plan" },
    { partNumber: "PN-40334", programFamily: "GEnx",    description: "High Pressure Turbine Disk",   source: "Plan" },
    { partNumber: "PN-20204", programFamily: "GTF",     description: "Combustor Liner Panel",        source: "Plan" },
    { partNumber: "PN-30378", programFamily: "LEAP-1A", description: "Turbine Blade Tip Seal",       source: "Plan" },
    { partNumber: "PN-50019", programFamily: "CF6",     description: "Bearing Housing Assembly",     source: "Plan" },
    { partNumber: "PN-50067", programFamily: "CF6",     description: "Oil Pump Drive Gear",          source: "Plan" },
    { partNumber: "PN-40501", programFamily: "GEnx",    description: "Thrust Reverser Bracket",      source: "Plan" },
    { partNumber: "PN-10223", programFamily: "F135",    description: "Variable Exhaust Nozzle",      source: "Plan" },
  ]
  return pool.slice(0, quantities.length).map((r, i) => ({ ...r, quantity: quantities[i] }))
}

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------
const DAYS: ScheduleDay[] = [
  {
    label: "Mar 5",  fullLabel: "Thursday, March 5, 2026",  type: "simulated",
    rows: [
      { partNumber: "PN-10045", programFamily: "F135",    description: "Fan Blade Assembly",          quantity: 12, source: "Plan" },
      { partNumber: "PN-20187", programFamily: "GTF",     description: "Compressor Disk Stage 3",      quantity: 8,  source: "Plan" },
      { partNumber: "PN-30291", programFamily: "LEAP-1A", description: "Low Pressure Turbine Vane",    quantity: 10, source: "Rollover" },
      { partNumber: "PN-40334", programFamily: "GEnx",    description: "High Pressure Turbine Disk",   quantity: 6,  source: "Plan" },
      { partNumber: "PN-10112", programFamily: "F135",    description: "Stator Vane Cluster",          quantity: 8,  source: "Manual" },
      { partNumber: "PN-20204", programFamily: "GTF",     description: "Combustor Liner Panel",        quantity: 10, source: "Plan" },
      { partNumber: "PN-30378", programFamily: "LEAP-1A", description: "Turbine Blade Tip Seal",       quantity: 30, source: "Rollover" },
      { partNumber: "PN-40412", programFamily: "GEnx",    description: "Accessory Gearbox Cover",      quantity: 4,  source: "Manual" },
      { partNumber: "PN-10223", programFamily: "F135",    description: "Variable Exhaust Nozzle",      quantity: 9,  source: "Plan" },
      { partNumber: "PN-50019", programFamily: "CF6",     description: "Bearing Housing Assembly",     quantity: 15, source: "Rollover" },
      { partNumber: "PN-50067", programFamily: "CF6",     description: "Oil Pump Drive Gear",          quantity: 7,  source: "Plan" },
      { partNumber: "PN-20315", programFamily: "GTF",     description: "Fan Exit Guide Vane",          quantity: 10, source: "Plan" },
      { partNumber: "PN-30455", programFamily: "LEAP-1A", description: "Bleed Air Manifold",           quantity: 5,  source: "Manual" },
      { partNumber: "PN-40501", programFamily: "GEnx",    description: "Thrust Reverser Bracket",      quantity: 11, source: "Rollover" },
    ],
  },
  {
    label: "Mar 6",  fullLabel: "Friday, March 6, 2026",  type: "simulated",
    rows: [
      { partNumber: "PN-10045", programFamily: "F135",    description: "Fan Blade Assembly",          quantity: 10, source: "Plan" },
      { partNumber: "PN-20187", programFamily: "GTF",     description: "Compressor Disk Stage 3",      quantity: 9,  source: "Plan" },
      { partNumber: "PN-30291", programFamily: "LEAP-1A", description: "Low Pressure Turbine Vane",    quantity: 12, source: "Rollover" },
      { partNumber: "PN-40334", programFamily: "GEnx",    description: "High Pressure Turbine Disk",   quantity: 5,  source: "Plan" },
      { partNumber: "PN-10112", programFamily: "F135",    description: "Stator Vane Cluster",          quantity: 7,  source: "Manual" },
      { partNumber: "PN-20204", programFamily: "GTF",     description: "Combustor Liner Panel",        quantity: 11, source: "Plan" },
      { partNumber: "PN-30378", programFamily: "LEAP-1A", description: "Turbine Blade Tip Seal",       quantity: 28, source: "Rollover" },
      { partNumber: "PN-50019", programFamily: "CF6",     description: "Bearing Housing Assembly",     quantity: 14, source: "Rollover" },
      { partNumber: "PN-10223", programFamily: "F135",    description: "Variable Exhaust Nozzle",      quantity: 8,  source: "Plan" },
      { partNumber: "PN-50067", programFamily: "CF6",     description: "Oil Pump Drive Gear",          quantity: 6,  source: "Plan" },
      { partNumber: "PN-40501", programFamily: "GEnx",    description: "Thrust Reverser Bracket",      quantity: 10, source: "Plan" },
      { partNumber: "PN-20315", programFamily: "GTF",     description: "Fan Exit Guide Vane",          quantity: 9,  source: "Plan" },
    ],
  },
  { label: "Mar 7",  fullLabel: "Saturday, March 7, 2026",   type: "projected", rows: projectedRows([11,7,9,6,10,24,13,5,9,8]) },
  { label: "Mar 8",  fullLabel: "Sunday, March 8, 2026",     type: "projected", rows: projectedRows([13,8,8,7,12,25,11,6,8,7]) },
  { label: "Mar 9",  fullLabel: "Monday, March 9, 2026",     type: "projected", rows: projectedRows([10,8,9,5,9,22,12,6,8,7]) },
  { label: "Mar 10", fullLabel: "Tuesday, March 10, 2026",   type: "projected", rows: projectedRows([12,9,10,6,11,26,14,7,9]) },
  { label: "Mar 11", fullLabel: "Wednesday, March 11, 2026", type: "projected", rows: projectedRows([9,7,8,5,10,20,11,5,7,6]) },
  { label: "Mar 12", fullLabel: "Thursday, March 12, 2026",  type: "projected", rows: projectedRows([11,8,9,6,12,23,13,6,8]) },
  { label: "Mar 13", fullLabel: "Friday, March 13, 2026",    type: "projected", rows: projectedRows([10,9,11,7,10,27,12,7,9,8]) },
  { label: "Mar 14", fullLabel: "Saturday, March 14, 2026",  type: "projected", rows: projectedRows([8,6,7,4,9,19,10,5,7]) },
  { label: "Mar 15", fullLabel: "Sunday, March 15, 2026",    type: "projected", rows: projectedRows([9,7,8,5,10,21,11,5,7,6]) },
  { label: "Mar 16", fullLabel: "Monday, March 16, 2026",    type: "projected", rows: projectedRows([12,9,10,7,12,25,14,7,9,8]) },
  { label: "Mar 17", fullLabel: "Tuesday, March 17, 2026",   type: "projected", rows: projectedRows([11,8,9,6,11,24,13,6,8]) },
  { label: "Mar 18", fullLabel: "Wednesday, March 18, 2026", type: "projected", rows: projectedRows([10,7,9,5,10,22,12,6,8,7]) },
  { label: "Mar 19", fullLabel: "Thursday, March 19, 2026",  type: "projected", rows: projectedRows([13,9,11,7,12,26,14,7,9,8]) },
  { label: "Mar 20", fullLabel: "Friday, March 20, 2026",    type: "projected", rows: projectedRows([11,8,10,6,11,23,13,6,8]) },
  { label: "Mar 21", fullLabel: "Saturday, March 21, 2026",  type: "projected", rows: projectedRows([8,6,7,4,9,18,10,5,7]) },
  { label: "Mar 22", fullLabel: "Sunday, March 22, 2026",    type: "projected", rows: projectedRows([9,7,8,5,10,20,11,5,7,6]) },
  { label: "Mar 23", fullLabel: "Monday, March 23, 2026",    type: "projected", rows: projectedRows([12,9,10,7,12,24,14,7,9]) },
  { label: "Mar 24", fullLabel: "Tuesday, March 24, 2026",   type: "projected", rows: projectedRows([11,8,9,6,11,23,13,6,8,7]) },
  { label: "Mar 25", fullLabel: "Wednesday, March 25, 2026", type: "projected", rows: projectedRows([10,8,9,5,10,22,12,6,8]) },
  { label: "Mar 26", fullLabel: "Thursday, March 26, 2026",  type: "projected", rows: projectedRows([13,9,11,7,12,25,14,7,9,8]) },
  { label: "Mar 27", fullLabel: "Friday, March 27, 2026",    type: "projected", rows: projectedRows([11,8,10,6,11,23,13,6,8]) },
  { label: "Mar 28", fullLabel: "Saturday, March 28, 2026",  type: "projected", rows: projectedRows([8,5,7,4,9,17,10,5,6]) },
  { label: "Mar 29", fullLabel: "Sunday, March 29, 2026",    type: "projected", rows: projectedRows([9,7,8,5,10,19,11,5,7,6]) },
  { label: "Mar 30", fullLabel: "Monday, March 30, 2026",    type: "projected", rows: projectedRows([12,9,10,7,12,24,14,7,9]) },
  { label: "Mar 31", fullLabel: "Tuesday, March 31, 2026",   type: "projected", rows: projectedRows([11,8,9,6,11,22,13,6,8,7]) },
]

const PROGRAM_COLORS: Record<string, string> = {
  "F135":    "border-blue-300 text-blue-700 bg-blue-50",
  "GTF":     "border-purple-300 text-purple-700 bg-purple-50",
  "LEAP-1A": "border-emerald-300 text-emerald-700 bg-emerald-50",
  "GEnx":    "border-amber-300 text-amber-700 bg-amber-50",
  "CF6":     "border-rose-300 text-rose-700 bg-rose-50",
}

const SOURCE_COLORS: Record<Source, string> = {
  "Plan":     "border-gray-200 text-gray-600 bg-gray-50",
  "Rollover": "border-yellow-300 text-yellow-700 bg-yellow-50",
  "Manual":   "border-red-300 text-red-700 bg-red-50",
}

export function OptimizedScheduleContent() {
  const [selectedDayIndex, setSelectedDayIndex] = useState(0)
  const [search, setSearch] = useState("")

  const day = DAYS[selectedDayIndex]

  const filtered = day.rows.filter(row =>
    row.partNumber.toLowerCase().includes(search.toLowerCase()) ||
    row.programFamily.toLowerCase().includes(search.toLowerCase()) ||
    row.description.toLowerCase().includes(search.toLowerCase())
  )

  const totalUnits    = filtered.reduce((s, r) => s + r.quantity, 0)
  const uniqueParts   = new Set(filtered.map(r => r.partNumber)).size
  const rolloverCount = filtered.filter(r => r.source === "Rollover").length
  const manualCount   = filtered.filter(r => r.source === "Manual").length

  return (
    <div className="flex flex-col gap-3 p-4">
      <Card className="border border-border">
        <CardHeader className="py-3 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center h-7 w-7 rounded-md bg-primary/10">
                <CalendarClock className="h-4 w-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                  Daily Schedule
                </CardTitle>
                <p className="text-xs text-muted-foreground">{day.fullLabel}</p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="h-7 gap-1.5 text-xs">
              <Download className="h-3.5 w-3.5" />
              Export CSV
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex flex-col gap-4 pt-4 pb-4">

          {/* Legend + scrollable day buttons */}
          <div className="flex flex-col gap-2">

            {/* Legend */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="inline-block w-3 h-3 rounded-sm bg-amber-100 border border-amber-300" />
                <span className="text-[11px] text-muted-foreground">Fully Optimized</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="inline-block w-3 h-3 rounded-sm bg-primary/20 border border-primary/40" />
                <span className="text-[11px] text-muted-foreground">Projected</span>
              </div>
            </div>

            {/* Single scrollable row of day buttons */}
            <div className="overflow-x-auto pb-1 -mb-1">
              <div className="flex items-center gap-1.5 w-max">
                {DAYS.map((d, i) => (
                  <Button
                    key={d.label}
                    size="sm"
                    variant={selectedDayIndex === i ? "default" : "outline"}
                    className={`h-7 px-3 text-xs shrink-0 transition-colors ${
                      selectedDayIndex !== i
                        ? d.type === "simulated"
                          ? "border-amber-300 text-amber-700 hover:bg-amber-50"
                          : "border-primary/30 text-primary/80 hover:bg-primary/5"
                        : d.type === "simulated"
                          ? "bg-amber-500 hover:bg-amber-600 border-amber-500 text-white"
                          : ""
                    }`}
                    onClick={() => { setSelectedDayIndex(i); setSearch("") }}
                  >
                    {d.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Summary strip */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: "Total Units",    value: totalUnits },
              { label: "Unique Parts",   value: uniqueParts },
              { label: "Rollover",       value: rolloverCount },
              { label: "Manual Entries", value: manualCount },
            ].map(({ label, value }) => (
              <div key={label} className="bg-muted/50 rounded-lg px-4 py-3">
                <p className="text-[11px] text-muted-foreground">{label}</p>
                <p className="text-xl font-semibold font-mono">{value}</p>
              </div>
            ))}
          </div>

          {/* Search */}
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search parts or programs..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="h-8 pl-8 text-xs"
            />
          </div>

          {/* Table */}
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/60">
                <TableRow>
                  <TableHead className="text-xs font-semibold w-[110px]">Part Number</TableHead>
                  <TableHead className="text-xs font-semibold w-[100px]">Program</TableHead>
                  <TableHead className="text-xs font-semibold">Description</TableHead>
                  <TableHead className="text-xs font-semibold text-right w-[80px]">Quantity</TableHead>
                  <TableHead className="text-xs font-semibold w-[90px]">Source</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((row, i) => (
                  <TableRow key={row.partNumber + i} className="hover:bg-muted/30">
                    <TableCell className="font-mono text-xs">{row.partNumber}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-xs ${PROGRAM_COLORS[row.programFamily] ?? "border-gray-200 text-gray-600"}`}>
                        {row.programFamily}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{row.description}</TableCell>
                    <TableCell className="font-mono text-xs text-right font-medium">{row.quantity}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-xs ${SOURCE_COLORS[row.source]}`}>
                        {row.source}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-xs text-muted-foreground py-8">
                      No results match your search.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

        </CardContent>
      </Card>
    </div>
  )
}

  {
    label: "Mar 5",
    fullLabel: "Thursday, March 5, 2026",
    type: "simulated",
    rows: [
      { partNumber: "PN-10045", programFamily: "F135",   description: "Fan Blade Assembly",           quantity: 12, source: "Plan" },
      { partNumber: "PN-20187", programFamily: "GTF",    description: "Compressor Disk Stage 3",       quantity: 8,  source: "Plan" },
      { partNumber: "PN-30291", programFamily: "LEAP-1A",description: "Low Pressure Turbine Vane",     quantity: 10, source: "Rollover" },
      { partNumber: "PN-40334", programFamily: "GEnx",   description: "High Pressure Turbine Disk",    quantity: 6,  source: "Plan" },
      { partNumber: "PN-10112", programFamily: "F135",   description: "Stator Vane Cluster",           quantity: 8,  source: "Manual" },
      { partNumber: "PN-20204", programFamily: "GTF",    description: "Combustor Liner Panel",         quantity: 10, source: "Plan" },
      { partNumber: "PN-30378", programFamily: "LEAP-1A",description: "Turbine Blade Tip Seal",        quantity: 30, source: "Rollover" },
      { partNumber: "PN-40412", programFamily: "GEnx",   description: "Accessory Gearbox Cover",       quantity: 4,  source: "Manual" },
      { partNumber: "PN-10223", programFamily: "F135",   description: "Variable Exhaust Nozzle",       quantity: 9,  source: "Plan" },
      { partNumber: "PN-50019", programFamily: "CF6",    description: "Bearing Housing Assembly",      quantity: 15, source: "Rollover" },
      { partNumber: "PN-50067", programFamily: "CF6",    description: "Oil Pump Drive Gear",           quantity: 7,  source: "Plan" },
      { partNumber: "PN-20315", programFamily: "GTF",    description: "Fan Exit Guide Vane",           quantity: 10, source: "Plan" },
      { partNumber: "PN-30455", programFamily: "LEAP-1A",description: "Bleed Air Manifold",            quantity: 5,  source: "Manual" },
      { partNumber: "PN-40501", programFamily: "GEnx",   description: "Thrust Reverser Bracket",       quantity: 11, source: "Rollover" },
    ],
  },
  {
    label: "Mar 6",
    fullLabel: "Friday, March 6, 2026",
    type: "simulated",
    rows: [
      { partNumber: "PN-10045", programFamily: "F135",   description: "Fan Blade Assembly",           quantity: 10, source: "Plan" },
      { partNumber: "PN-20187", programFamily: "GTF",    description: "Compressor Disk Stage 3",       quantity: 9,  source: "Plan" },
      { partNumber: "PN-30291", programFamily: "LEAP-1A",description: "Low Pressure Turbine Vane",     quantity: 12, source: "Rollover" },
      { partNumber: "PN-40334", programFamily: "GEnx",   description: "High Pressure Turbine Disk",    quantity: 5,  source: "Plan" },
      { partNumber: "PN-10112", programFamily: "F135",   description: "Stator Vane Cluster",           quantity: 7,  source: "Manual" },
      { partNumber: "PN-20204", programFamily: "GTF",    description: "Combustor Liner Panel",         quantity: 11, source: "Plan" },
      { partNumber: "PN-30378", programFamily: "LEAP-1A",description: "Turbine Blade Tip Seal",        quantity: 28, source: "Rollover" },
      { partNumber: "PN-50019", programFamily: "CF6",    description: "Bearing Housing Assembly",      quantity: 14, source: "Rollover" },
      { partNumber: "PN-10223", programFamily: "F135",   description: "Variable Exhaust Nozzle",       quantity: 8,  source: "Plan" },
      { partNumber: "PN-50067", programFamily: "CF6",    description: "Oil Pump Drive Gear",           quantity: 6,  source: "Plan" },
      { partNumber: "PN-40501", programFamily: "GEnx",   description: "Thrust Reverser Bracket",       quantity: 10, source: "Plan" },
      { partNumber: "PN-20315", programFamily: "GTF",    description: "Fan Exit Guide Vane",           quantity: 9,  source: "Plan" },
    ],
  },
  {
    label: "Mar 7",
    fullLabel: "Saturday, March 7, 2026",
    type: "projected",
    rows: [
      { partNumber: "PN-10045", programFamily: "F135",   description: "Fan Blade Assembly",           quantity: 11, source: "Plan" },
      { partNumber: "PN-20187", programFamily: "GTF",    description: "Compressor Disk Stage 3",       quantity: 7,  source: "Plan" },
      { partNumber: "PN-30291", programFamily: "LEAP-1A",description: "Low Pressure Turbine Vane",     quantity: 9,  source: "Plan" },
      { partNumber: "PN-40334", programFamily: "GEnx",   description: "High Pressure Turbine Disk",    quantity: 6,  source: "Plan" },
      { partNumber: "PN-20204", programFamily: "GTF",    description: "Combustor Liner Panel",         quantity: 10, source: "Plan" },
      { partNumber: "PN-50019", programFamily: "CF6",    description: "Bearing Housing Assembly",      quantity: 13, source: "Plan" },
      { partNumber: "PN-10223", programFamily: "F135",   description: "Variable Exhaust Nozzle",       quantity: 8,  source: "Plan" },
      { partNumber: "PN-50067", programFamily: "CF6",    description: "Oil Pump Drive Gear",           quantity: 5,  source: "Plan" },
      { partNumber: "PN-40501", programFamily: "GEnx",   description: "Thrust Reverser Bracket",       quantity: 9,  source: "Plan" },
    ],
  },
  {
    label: "Mar 8",
    fullLabel: "Sunday, March 8, 2026",
    type: "projected",
    rows: [
      { partNumber: "PN-10045", programFamily: "F135",   description: "Fan Blade Assembly",           quantity: 13, source: "Plan" },
      { partNumber: "PN-30291", programFamily: "LEAP-1A",description: "Low Pressure Turbine Vane",     quantity: 8,  source: "Plan" },
      { partNumber: "PN-40334", programFamily: "GEnx",   description: "High Pressure Turbine Disk",    quantity: 7,  source: "Plan" },
      { partNumber: "PN-20204", programFamily: "GTF",    description: "Combustor Liner Panel",         quantity: 12, source: "Plan" },
      { partNumber: "PN-30378", programFamily: "LEAP-1A",description: "Turbine Blade Tip Seal",        quantity: 25, source: "Plan" },
      { partNumber: "PN-50019", programFamily: "CF6",    description: "Bearing Housing Assembly",      quantity: 11, source: "Plan" },
      { partNumber: "PN-20315", programFamily: "GTF",    description: "Fan Exit Guide Vane",           quantity: 8,  source: "Plan" },
      { partNumber: "PN-10112", programFamily: "F135",   description: "Stator Vane Cluster",           quantity: 6,  source: "Plan" },
    ],
  },
  {
    label: "Mar 9",
    fullLabel: "Monday, March 9, 2026",
    type: "projected",
    rows: [
      { partNumber: "PN-10045", programFamily: "F135",   description: "Fan Blade Assembly",           quantity: 10, source: "Plan" },
      { partNumber: "PN-20187", programFamily: "GTF",    description: "Compressor Disk Stage 3",       quantity: 8,  source: "Plan" },
      { partNumber: "PN-40334", programFamily: "GEnx",   description: "High Pressure Turbine Disk",    quantity: 5,  source: "Plan" },
      { partNumber: "PN-20204", programFamily: "GTF",    description: "Combustor Liner Panel",         quantity: 9,  source: "Plan" },
      { partNumber: "PN-30378", programFamily: "LEAP-1A",description: "Turbine Blade Tip Seal",        quantity: 22, source: "Plan" },
      { partNumber: "PN-50067", programFamily: "CF6",    description: "Oil Pump Drive Gear",           quantity: 6,  source: "Plan" },
      { partNumber: "PN-40501", programFamily: "GEnx",   description: "Thrust Reverser Bracket",       quantity: 8,  source: "Plan" },
      { partNumber: "PN-10223", programFamily: "F135",   description: "Variable Exhaust Nozzle",       quantity: 7,  source: "Plan" },
      { partNumber: "PN-30455", programFamily: "LEAP-1A",description: "Bleed Air Manifold",            quantity: 4,  source: "Plan" },
    ],
  },
]

const PROGRAM_COLORS: Record<string, string> = {
  "F135":   "border-blue-300 text-blue-700 bg-blue-50",
  "GTF":    "border-purple-300 text-purple-700 bg-purple-50",
  "LEAP-1A":"border-emerald-300 text-emerald-700 bg-emerald-50",
  "GEnx":   "border-amber-300 text-amber-700 bg-amber-50",
  "CF6":    "border-rose-300 text-rose-700 bg-rose-50",
}

const SOURCE_COLORS: Record<Source, string> = {
  "Plan":    "border-gray-200 text-gray-600 bg-gray-50",
  "Rollover":"border-yellow-300 text-yellow-700 bg-yellow-50",
  "Manual":  "border-red-300 text-red-700 bg-red-50",
}

export function OptimizedScheduleContent() {
  const [selectedDayIndex, setSelectedDayIndex] = useState(0)
  const [search, setSearch] = useState("")

  const day = DAYS[selectedDayIndex]

  const filtered = day.rows.filter(row =>
    row.partNumber.toLowerCase().includes(search.toLowerCase()) ||
    row.programFamily.toLowerCase().includes(search.toLowerCase()) ||
    row.description.toLowerCase().includes(search.toLowerCase())
  )

  const totalUnits   = filtered.reduce((s, r) => s + r.quantity, 0)
  const uniqueParts  = new Set(filtered.map(r => r.partNumber)).size
  const rolloverCount = filtered.filter(r => r.source === "Rollover").length
  const manualCount  = filtered.filter(r => r.source === "Manual").length

  return (
    <div className="flex flex-col gap-3 p-4">
      <Card className="border border-border">
        <CardHeader className="py-3 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center h-7 w-7 rounded-md bg-primary/10">
                <CalendarClock className="h-4 w-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                  Daily Schedule
                </CardTitle>
                <p className="text-xs text-muted-foreground">{day.fullLabel}</p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="h-7 gap-1.5 text-xs">
              <Download className="h-3.5 w-3.5" />
              Export CSV
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex flex-col gap-4 pt-4 pb-4">

          {/* Legend + Day selectors */}
          <div className="flex flex-col gap-2">

            {/* Legend */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="inline-block w-3 h-3 rounded-sm bg-amber-100 border border-amber-300" />
                <span className="text-[11px] text-muted-foreground">Fully Optimized</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="inline-block w-3 h-3 rounded-sm bg-primary/20 border border-primary/40" />
                <span className="text-[11px] text-muted-foreground">Projected</span>
              </div>
            </div>

            {/* Day buttons */}
            <div className="flex items-center gap-1.5">
              {DAYS.map((d, i) => (
                <Button
                  key={d.label}
                  size="sm"
                  variant={selectedDayIndex === i ? "default" : "outline"}
                  className={`h-7 px-3 text-xs transition-colors ${
                    selectedDayIndex !== i
                      ? d.type === "simulated"
                        ? "border-amber-300 text-amber-700 hover:bg-amber-50"
                        : "border-primary/30 text-primary/80 hover:bg-primary/5"
                      : d.type === "simulated"
                        ? "bg-amber-500 hover:bg-amber-600 border-amber-500 text-white"
                        : ""
                  }`}
                  onClick={() => { setSelectedDayIndex(i); setSearch("") }}
                >
                  {d.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Summary strip */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: "Total Units",    value: totalUnits },
              { label: "Unique Parts",   value: uniqueParts },
              { label: "Rollover",       value: rolloverCount },
              { label: "Manual Entries", value: manualCount },
            ].map(({ label, value }) => (
              <div key={label} className="bg-muted/50 rounded-lg px-4 py-3">
                <p className="text-[11px] text-muted-foreground">{label}</p>
                <p className="text-xl font-semibold font-mono">{value}</p>
              </div>
            ))}
          </div>

          {/* Search */}
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search parts or programs..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="h-8 pl-8 text-xs"
            />
          </div>

          {/* Table */}
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/60">
                <TableRow>
                  <TableHead className="text-xs font-semibold w-[110px]">Part Number</TableHead>
                  <TableHead className="text-xs font-semibold w-[100px]">Program</TableHead>
                  <TableHead className="text-xs font-semibold">Description</TableHead>
                  <TableHead className="text-xs font-semibold text-right w-[80px]">Quantity</TableHead>
                  <TableHead className="text-xs font-semibold w-[90px]">Source</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((row, i) => (
                  <TableRow key={row.partNumber + i} className="hover:bg-muted/30">
                    <TableCell className="font-mono text-xs">{row.partNumber}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-xs ${PROGRAM_COLORS[row.programFamily] ?? "border-gray-200 text-gray-600"}`}>
                        {row.programFamily}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{row.description}</TableCell>
                    <TableCell className="font-mono text-xs text-right font-medium">{row.quantity}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-xs ${SOURCE_COLORS[row.source]}`}>
                        {row.source}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-xs text-muted-foreground py-8">
                      No results match your search.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

        </CardContent>
      </Card>
    </div>
  )
}
