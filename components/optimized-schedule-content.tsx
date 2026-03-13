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
type SourceSplit = {
  plan: number
  rollover: number
  manual: number
}

type ScheduleRow = {
  partNumber: string
  programFamily: string
  description: string
  quantity: number
  loads: number
  sourceSplit: SourceSplit
}

type DayType = "simulated" | "projected"

type ScheduleDay = {
  label: string
  fullLabel: string
  type: DayType
  rows: ScheduleRow[]
}

// ---------------------------------------------------------------------------
// Deterministic helpers (no Math.random — avoids hydration mismatches)
// ---------------------------------------------------------------------------

function calcLoads(partNumber: string, quantity: number): number {
  const seed = partNumber.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0)
  const factor = 0.25 + ((seed * quantity) % 100) / 400
  return Math.ceil(quantity * factor)
}

// Deterministic source split:
// - All parts have a plan qty (always >= 1)
// - Some get a small rollover (seeded by partNumber char sum)
// - Fewer still get a small manual (seeded differently)
function calcSourceSplit(partNumber: string, quantity: number): SourceSplit {
  const seed = partNumber.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0)

  // rollover: ~40% chance, 1-3 units
  const hasRollover = (seed % 5) >= 3
  const rollover = hasRollover ? 1 + ((seed * 3) % Math.min(3, Math.max(1, Math.floor(quantity * 0.15)))) : 0

  // manual: ~25% chance, 1-2 units — only if enough qty left
  const hasManual = (seed % 4) === 1
  const manual = hasManual && quantity - rollover > 2 ? 1 + ((seed * 7) % Math.min(2, Math.max(1, Math.floor(quantity * 0.1)))) : 0

  const plan = quantity - rollover - manual
  return { plan: Math.max(1, plan), rollover, manual }
}

// Heatcode mapping
const HEATCODE_MAP: Record<string, string[]> = {
  "PN-10045": ["PIREX", "PIREW"],
  "PN-20187": ["PIREY", "PIREZ"],
  "PN-30291": ["PIRAB", "PIRAC"],
  "PN-40334": ["PIRAD", "PIRAE"],
  "PN-10112": ["PIRAF"],
  "PN-20204": ["PIRAG", "PIRAH"],
  "PN-30378": ["PIRAI", "PIRAJ", "PIRAK"],
  "PN-40412": ["PIRAL"],
  "PN-10223": ["PIRAM"],
  "PN-50019": ["PIRAN", "PIRAO"],
  "PN-50067": ["PIRAP"],
  "PN-20315": ["PIRAQ"],
  "PN-30455": ["PIRAR"],
  "PN-40501": ["PIRAS", "PIRAT"],
}

function getHeatcodes(partNumber: string, quantity: number): string {
  const codes = HEATCODE_MAP[partNumber] || ["PIRAZ"]
  if (quantity <= 8) return codes[0]
  if (quantity <= 15) return codes.slice(0, Math.min(2, codes.length)).join(", ")
  return codes.join(", ")
}

// ---------------------------------------------------------------------------
// Row builder helpers
// ---------------------------------------------------------------------------
function row(partNumber: string, programFamily: string, description: string, quantity: number): ScheduleRow {
  return {
    partNumber,
    programFamily,
    description,
    quantity,
    loads: calcLoads(partNumber, quantity),
    sourceSplit: calcSourceSplit(partNumber, quantity),
  }
}

// ---------------------------------------------------------------------------
// Mock data — 3 windows
// ---------------------------------------------------------------------------
const DAYS: ScheduleDay[] = [
  {
    label: "0-24 Hrs", fullLabel: "0–24 Hour Window", type: "simulated",
    rows: [
      row("PN-10045", "F135",   getHeatcodes("PN-10045", 12), 12),
      row("PN-20187", "GTF",    getHeatcodes("PN-20187", 8),  8),
      row("PN-30291", "F100",   getHeatcodes("PN-30291", 10), 10),
      row("PN-40334", "PWC",    getHeatcodes("PN-40334", 6),  6),
      row("PN-10112", "F135",   getHeatcodes("PN-10112", 8),  8),
      row("PN-20204", "GTF",    getHeatcodes("PN-20204", 10), 10),
      row("PN-30378", "F100",   getHeatcodes("PN-30378", 30), 30),
      row("PN-40412", "PWC",    getHeatcodes("PN-40412", 4),  4),
      row("PN-10223", "F135",   getHeatcodes("PN-10223", 9),  9),
      row("PN-50019", "Legacy", getHeatcodes("PN-50019", 15), 15),
      row("PN-50067", "Legacy", getHeatcodes("PN-50067", 7),  7),
      row("PN-20315", "GTF",    getHeatcodes("PN-20315", 10), 10),
      row("PN-30455", "F100",   getHeatcodes("PN-30455", 5),  5),
      row("PN-40501", "PWC",    getHeatcodes("PN-40501", 11), 11),
    ],
  },
  {
    label: "24-48 Hrs", fullLabel: "24–48 Hour Window", type: "simulated",
    rows: [
      row("PN-10045", "F135",   getHeatcodes("PN-10045", 10), 10),
      row("PN-20187", "GTF",    getHeatcodes("PN-20187", 9),  9),
      row("PN-30291", "F100",   getHeatcodes("PN-30291", 12), 12),
      row("PN-40334", "PWC",    getHeatcodes("PN-40334", 5),  5),
      row("PN-10112", "F135",   getHeatcodes("PN-10112", 7),  7),
      row("PN-20204", "GTF",    getHeatcodes("PN-20204", 11), 11),
      row("PN-30378", "F100",   getHeatcodes("PN-30378", 28), 28),
      row("PN-50019", "Legacy", getHeatcodes("PN-50019", 14), 14),
      row("PN-10223", "F135",   getHeatcodes("PN-10223", 8),  8),
      row("PN-50067", "Legacy", getHeatcodes("PN-50067", 6),  6),
      row("PN-40501", "PWC",    getHeatcodes("PN-40501", 10), 10),
      row("PN-20315", "GTF",    getHeatcodes("PN-20315", 9),  9),
    ],
  },
  {
    label: "48-72 Hrs", fullLabel: "48–72 Hour Window", type: "projected",
    rows: [
      row("PN-10045", "F135",   "", 11),
      row("PN-20187", "GTF",    "", 7),
      row("PN-30291", "F100",   "", 9),
      row("PN-40334", "PWC",    "", 6),
      row("PN-20204", "GTF",    "", 10),
      row("PN-30378", "F100",   "", 24),
      row("PN-50019", "Legacy", "", 13),
      row("PN-50067", "Legacy", "", 5),
      row("PN-40501", "PWC",    "", 9),
      row("PN-10223", "F135",   "", 8),
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

// Source chip styles
const SOURCE_STYLES = {
  plan:     { bg: "bg-blue-50",   border: "border-blue-200",  text: "text-blue-700",  label: "Plan" },
  rollover: { bg: "bg-amber-50",  border: "border-amber-300", text: "text-amber-700", label: "Rollover" },
  manual:   { bg: "bg-red-50",    border: "border-red-300",   text: "text-red-700",   label: "Manual" },
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

  const totalUnits  = filtered.reduce((s, r) => s + r.quantity, 0)
  const totalLoads  = filtered.reduce((s, r) => s + r.loads, 0)
  const totalRollover = filtered.reduce((s, r) => s + r.sourceSplit.rollover, 0)
  const totalManual   = filtered.reduce((s, r) => s + r.sourceSplit.manual, 0)

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

          {/* Tab legend + day buttons */}
          <div className="flex flex-col gap-2">
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

          {/* Summary KPI strip */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: "Total Units",    value: totalUnits },
              { label: "Total Loads",    value: totalLoads },
              { label: "Rollover Units", value: totalRollover },
              { label: "Manual Units",   value: totalManual },
            ].map(({ label, value }) => (
              <div key={label} className="bg-muted/50 rounded-lg px-4 py-3">
                <p className="text-[11px] text-muted-foreground">{label}</p>
                <p className="text-xl font-semibold font-mono">{value}</p>
              </div>
            ))}
          </div>

          {/* Search + Source legend */}
          <div className="flex items-center justify-between gap-4">
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Search parts or programs..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="h-8 pl-8 text-xs"
              />
            </div>

            {/* Source legend */}
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <span className="mr-1 font-medium">Source:</span>
              {Object.values(SOURCE_STYLES).map(s => (
                <span
                  key={s.label}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border font-medium ${s.bg} ${s.border} ${s.text}`}
                >
                  {s.label}
                </span>
              ))}
            </div>
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
                  <TableHead className="text-xs font-semibold w-[160px]">Source</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r, i) => {
                  const { plan, rollover, manual } = r.sourceSplit
                  return (
                    <TableRow key={r.partNumber + i} className="hover:bg-muted/30">
                      <TableCell className="font-mono text-xs">{r.partNumber}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-xs ${PROGRAM_COLORS[r.programFamily] ?? "border-gray-200 text-gray-600"}`}>
                          {r.programFamily}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{r.description}</TableCell>
                      <TableCell className="font-mono text-xs text-right font-medium">{r.quantity}</TableCell>
                      <TableCell className="font-mono text-xs text-right font-medium">{r.loads}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 flex-wrap">
                          <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded border text-[11px] font-medium ${SOURCE_STYLES.plan.bg} ${SOURCE_STYLES.plan.border} ${SOURCE_STYLES.plan.text}`}>
                            <span className="font-mono">{plan}</span>
                            <span className="opacity-70">P</span>
                          </span>
                          {rollover > 0 && (
                            <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded border text-[11px] font-medium ${SOURCE_STYLES.rollover.bg} ${SOURCE_STYLES.rollover.border} ${SOURCE_STYLES.rollover.text}`}>
                              <span className="font-mono">{rollover}</span>
                              <span className="opacity-70">R</span>
                            </span>
                          )}
                          {manual > 0 && (
                            <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded border text-[11px] font-medium ${SOURCE_STYLES.manual.bg} ${SOURCE_STYLES.manual.border} ${SOURCE_STYLES.manual.text}`}>
                              <span className="font-mono">{manual}</span>
                              <span className="opacity-70">M</span>
                            </span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
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
