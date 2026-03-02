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
import { CalendarClock, Download, Search, Info } from "lucide-react"

// ---------------------------------------------------------------------------
// Hardcoded Next Day Schedule — replace with API/CSV data when available
// ---------------------------------------------------------------------------
type Source = "Plan" | "Rollover" | "Manual"

const NEXT_DAY_SCHEDULE: { partNumber: string; programFamily: string; description: string; quantity: number; source: Source }[] = [
  { partNumber: "PN-10045",  programFamily: "F135",    description: "Fan Blade Assembly",          quantity: 12, source: "Plan" },
  { partNumber: "PN-20187",  programFamily: "GTF",     description: "Compressor Disk Stage 3",     quantity: 8,  source: "Plan" },
  { partNumber: "PN-30291",  programFamily: "LEAP-1A", description: "Low Pressure Turbine Vane",   quantity: 24, source: "Rollover" },
  { partNumber: "PN-40334",  programFamily: "GEnx",    description: "High Pressure Turbine Disk",  quantity: 6,  source: "Plan" },
  { partNumber: "PN-10112",  programFamily: "F135",    description: "Stator Vane Cluster",          quantity: 18, source: "Manual" },
  { partNumber: "PN-20204",  programFamily: "GTF",     description: "Combustor Liner Panel",        quantity: 10, source: "Plan" },
  { partNumber: "PN-30378",  programFamily: "LEAP-1A", description: "Turbine Blade Tip Seal",       quantity: 30, source: "Rollover" },
  { partNumber: "PN-40412",  programFamily: "GEnx",    description: "Accessory Gearbox Cover",     quantity: 4,  source: "Manual" },
  { partNumber: "PN-10223",  programFamily: "F135",    description: "Variable Exhaust Nozzle",      quantity: 9,  source: "Plan" },
  { partNumber: "PN-50019",  programFamily: "CF6",     description: "Bearing Housing Assembly",     quantity: 15, source: "Rollover" },
  { partNumber: "PN-50067",  programFamily: "CF6",     description: "Oil Pump Drive Gear",          quantity: 7,  source: "Plan" },
  { partNumber: "PN-20315",  programFamily: "GTF",     description: "Fan Exit Guide Vane",          quantity: 20, source: "Plan" },
  { partNumber: "PN-30455",  programFamily: "LEAP-1A", description: "Bleed Air Manifold",           quantity: 5,  source: "Manual" },
  { partNumber: "PN-40501",  programFamily: "GEnx",    description: "Thrust Reverser Bracket",     quantity: 11, source: "Rollover" },
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
  const [search, setSearch] = useState("")

  const dateLabel = "Wednesday, February 11, 2026"

  const filtered = NEXT_DAY_SCHEDULE.filter(row =>
    row.partNumber.toLowerCase().includes(search.toLowerCase()) ||
    row.programFamily.toLowerCase().includes(search.toLowerCase()) ||
    row.description.toLowerCase().includes(search.toLowerCase())
  )

  const totalUnits = filtered.reduce((s, r) => s + r.quantity, 0)
  const uniqueParts = new Set(filtered.map(r => r.partNumber)).size
  const rolloverCount = filtered.filter(r => r.source === "Rollover").length
  const manualCount = filtered.filter(r => r.source === "Manual").length

  return (
    <div className="flex flex-col gap-3 p-4">

      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">Optimized Schedule</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Machine-generated production schedule output
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/60 border border-border rounded-md px-3 py-1.5">
          <Info className="h-3.5 w-3.5 shrink-0" />
          Hardcoded data — will be replaced by optimizer API output
        </div>
      </div>

      {/* Next Day Schedule card */}
      <Card className="border border-border">
        <CardHeader className="py-3 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center h-7 w-7 rounded-md bg-primary/10">
                <CalendarClock className="h-4 w-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                  Next Day Schedule
                </CardTitle>
                <p className="text-xs text-muted-foreground">{dateLabel}</p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="h-7 gap-1.5 text-xs">
              <Download className="h-3.5 w-3.5" />
              Export CSV
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex flex-col gap-4 pt-4 pb-4">

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
