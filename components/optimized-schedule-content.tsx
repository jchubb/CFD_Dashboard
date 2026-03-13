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
  loads: number
  source: Source
}

// Returns loads as ceil(quantity * factor) where factor is between 0.25 and 0.5
// Using a deterministic seed based on partNumber + quantity to avoid hydration issues
function calcLoads(partNumber: string, quantity: number): number {
  const seed = partNumber.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0)
  const factor = 0.25 + ((seed * quantity) % 100) / 400 // range: 0.25 – 0.5
  return Math.ceil(quantity * factor)
}

type DayType = "simulated" | "projected"

type ScheduleDay = {
  label: string
  fullLabel: string
  type: DayType
  rows: ScheduleRow[]
}

// Heatcode mapping: each part number gets unique heatcodes based on quantity
const HEATCODE_MAP: Record<string, string[]> = {
  "PN-10045": ["PIREX", "PIREW"],        // 12, 10, 11, 13, 10, 12, 11, 10, 8, 9, 12, 11, 10, 13, 12
  "PN-20187": ["PIREY", "PIREZ"],        // 8, 9, 7, 8, 9
  "PN-30291": ["PIRAB", "PIRAC"],        // 10, 12, 9, 8, 10
  "PN-40334": ["PIRAD", "PIRAE"],        // 6, 5, 6, 7, 5, 6
  "PN-10112": ["PIRAF"],                 // 8, 7, 6
  "PN-20204": ["PIRAG", "PIRAH"],        // 10, 11, 10, 12, 9, 11, 12, 10, 9
  "PN-30378": ["PIRAI", "PIRAJ", "PIRAK"], // 30, 28, 24, 25, 22, 26, 23, 27, 19, 21, 25, 24, 23
  "PN-40412": ["PIRAL"],                 // 4
  "PN-10223": ["PIRAM"],                 // 9, 8, 8, 7, 7, 8, 8
  "PN-50019": ["PIRAN", "PIRAO"],        // 15, 14, 13, 11, 14, 13, 11, 12, 14, 13
  "PN-50067": ["PIRAP"],                 // 7, 6, 5, 6, 5, 7, 6, 5, 7, 5
  "PN-20315": ["PIRAQ"],                 // 10, 9, 8, 6, 6
  "PN-30455": ["PIRAR"],                 // 5, 4
  "PN-40501": ["PIRAS", "PIRAT"],        // 11, 10, 9, 8, 9, 8, 7, 9, 8
}

function getHeatcodes(partNumber: string, quantity: number): string {
  const codes = HEATCODE_MAP[partNumber] || ["PIRAZ"]
  if (quantity <= 8) return codes[0]
  if (quantity <= 15) return codes.slice(0, Math.min(2, codes.length)).join(", ")
  return codes.join(", ")
}

// ---------------------------------------------------------------------------
// Mock data — 3 windows only
// ---------------------------------------------------------------------------
const DAYS: ScheduleDay[] = [
  {
    label: "0-24 Hrs", fullLabel: "0–24 Hour Window", type: "simulated",
    rows: [
      { partNumber: "PN-10045", programFamily: "F135", description: getHeatcodes("PN-10045", 12), quantity: 12, loads: calcLoads("PN-10045", 12), source: "Plan" },
      { partNumber: "PN-20187", programFamily: "GTF",  description: getHeatcodes("PN-20187", 8),  quantity: 8,  loads: calcLoads("PN-20187", 8),  source: "Plan" },
      { partNumber: "PN-30291", programFamily: "F100", description: getHeatcodes("PN-30291", 10), quantity: 10, loads: calcLoads("PN-30291", 10), source: "Rollover" },
      { partNumber: "PN-40334", programFamily: "PWC",  description: getHeatcodes("PN-40334", 6),  quantity: 6,  loads: calcLoads("PN-40334", 6),  source: "Plan" },
      { partNumber: "PN-10112", programFamily: "F135", description: getHeatcodes("PN-10112", 8),  quantity: 8,  loads: calcLoads("PN-10112", 8),  source: "Manual" },
      { partNumber: "PN-20204", programFamily: "GTF",  description: getHeatcodes("PN-20204", 10), quantity: 10, loads: calcLoads("PN-20204", 10), source: "Plan" },
      { partNumber: "PN-30378", programFamily: "F100", description: getHeatcodes("PN-30378", 30), quantity: 30, loads: calcLoads("PN-30378", 30), source: "Rollover" },
      { partNumber: "PN-40412", programFamily: "PWC",  description: getHeatcodes("PN-40412", 4),  quantity: 4,  loads: calcLoads("PN-40412", 4),  source: "Manual" },
      { partNumber: "PN-10223", programFamily: "F135", description: getHeatcodes("PN-10223", 9),  quantity: 9,  loads: calcLoads("PN-10223", 9),  source: "Plan" },
      { partNumber: "PN-50019", programFamily: "Legacy", description: getHeatcodes("PN-50019", 15), quantity: 15, loads: calcLoads("PN-50019", 15), source: "Rollover" },
      { partNumber: "PN-50067", programFamily: "Legacy", description: getHeatcodes("PN-50067", 7),  quantity: 7,  loads: calcLoads("PN-50067", 7),  source: "Plan" },
      { partNumber: "PN-20315", programFamily: "GTF",  description: getHeatcodes("PN-20315", 10), quantity: 10, loads: calcLoads("PN-20315", 10), source: "Plan" },
      { partNumber: "PN-30455", programFamily: "F100", description: getHeatcodes("PN-30455", 5),  quantity: 5,  loads: calcLoads("PN-30455", 5),  source: "Manual" },
      { partNumber: "PN-40501", programFamily: "PWC",  description: getHeatcodes("PN-40501", 11), quantity: 11, loads: calcLoads("PN-40501", 11), source: "Rollover" },
    ],
  },
  {
    label: "24-48 Hrs", fullLabel: "24–48 Hour Window", type: "simulated",
    rows: [
      { partNumber: "PN-10045", programFamily: "F135", description: getHeatcodes("PN-10045", 10), quantity: 10, loads: calcLoads("PN-10045", 10), source: "Plan" },
      { partNumber: "PN-20187", programFamily: "GTF",  description: getHeatcodes("PN-20187", 9),  quantity: 9,  loads: calcLoads("PN-20187", 9),  source: "Plan" },
      { partNumber: "PN-30291", programFamily: "F100", description: getHeatcodes("PN-30291", 12), quantity: 12, loads: calcLoads("PN-30291", 12), source: "Rollover" },
      { partNumber: "PN-40334", programFamily: "PWC",  description: getHeatcodes("PN-40334", 5),  quantity: 5,  loads: calcLoads("PN-40334", 5),  source: "Plan" },
      { partNumber: "PN-10112", programFamily: "F135", description: getHeatcodes("PN-10112", 7),  quantity: 7,  loads: calcLoads("PN-10112", 7),  source: "Manual" },
      { partNumber: "PN-20204", programFamily: "GTF",  description: getHeatcodes("PN-20204", 11), quantity: 11, loads: calcLoads("PN-20204", 11), source: "Plan" },
      { partNumber: "PN-30378", programFamily: "F100", description: getHeatcodes("PN-30378", 28), quantity: 28, loads: calcLoads("PN-30378", 28), source: "Rollover" },
      { partNumber: "PN-50019", programFamily: "Legacy", description: getHeatcodes("PN-50019", 14), quantity: 14, loads: calcLoads("PN-50019", 14), source: "Rollover" },
      { partNumber: "PN-10223", programFamily: "F135", description: getHeatcodes("PN-10223", 8),  quantity: 8,  loads: calcLoads("PN-10223", 8),  source: "Plan" },
      { partNumber: "PN-50067", programFamily: "Legacy", description: getHeatcodes("PN-50067", 6),  quantity: 6,  loads: calcLoads("PN-50067", 6),  source: "Plan" },
      { partNumber: "PN-40501", programFamily: "PWC",  description: getHeatcodes("PN-40501", 10), quantity: 10, loads: calcLoads("PN-40501", 10), source: "Plan" },
      { partNumber: "PN-20315", programFamily: "GTF",  description: getHeatcodes("PN-20315", 9),  quantity: 9,  loads: calcLoads("PN-20315", 9),  source: "Plan" },
    ],
  },
  {
    label: "48-72 Hrs", fullLabel: "48–72 Hour Window", type: "projected",
    rows: [
      { partNumber: "PN-10045", programFamily: "F135", description: "", quantity: 11, loads: calcLoads("PN-10045", 11), source: "Plan" },
      { partNumber: "PN-20187", programFamily: "GTF",  description: "", quantity: 7,  loads: calcLoads("PN-20187", 7),  source: "Plan" },
      { partNumber: "PN-30291", programFamily: "F100", description: "", quantity: 9,  loads: calcLoads("PN-30291", 9),  source: "Plan" },
      { partNumber: "PN-40334", programFamily: "PWC",  description: "", quantity: 6,  loads: calcLoads("PN-40334", 6),  source: "Plan" },
      { partNumber: "PN-20204", programFamily: "GTF",  description: "", quantity: 10, loads: calcLoads("PN-20204", 10), source: "Plan" },
      { partNumber: "PN-30378", programFamily: "F100", description: "", quantity: 24, loads: calcLoads("PN-30378", 24), source: "Plan" },
      { partNumber: "PN-50019", programFamily: "Legacy", description: "", quantity: 13, loads: calcLoads("PN-50019", 13), source: "Plan" },
      { partNumber: "PN-50067", programFamily: "Legacy", description: "", quantity: 5,  loads: calcLoads("PN-50067", 5),  source: "Plan" },
      { partNumber: "PN-40501", programFamily: "PWC",  description: "", quantity: 9,  loads: calcLoads("PN-40501", 9),  source: "Plan" },
      { partNumber: "PN-10223", programFamily: "F135", description: "", quantity: 8,  loads: calcLoads("PN-10223", 8),  source: "Plan" },
    ],
  },
]

const PROGRAM_COLORS: Record<string, string> = {
  "F135":   "border-blue-300 text-blue-700 bg-blue-50",
  "GTF":    "border-purple-300 text-purple-700 bg-purple-50",
  "F100":   "border-emerald-300 text-emerald-700 bg-emerald-50",
  "PWC":    "border-amber-300 text-amber-700 bg-amber-50",
  "Legacy": "border-rose-300 text-rose-700 bg-rose-50",
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
  const totalLoads    = filtered.reduce((s, r) => s + r.loads, 0)
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
                  24 Hour Optimized Part Mix
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
              { label: "Total Loads",    value: totalLoads },
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
                  <TableHead className="text-xs font-semibold">Heat</TableHead>
                  <TableHead className="text-xs font-semibold text-right w-[80px]">Quantity</TableHead>
                  <TableHead className="text-xs font-semibold text-right w-[70px]">Loads</TableHead>
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
                    <TableCell className="font-mono text-xs text-right font-medium">{row.loads}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-xs ${SOURCE_COLORS[row.source]}`}>
                        {row.source}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-xs text-muted-foreground py-8">
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
