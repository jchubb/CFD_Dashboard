"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { CalendarIcon, Search, ChevronLeft, ChevronRight, Filter } from "lucide-react"
import { cn } from "@/lib/utils"

// Simple date formatting helper to replace date-fns
function formatDate(date: Date, formatStr: string): string {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  const day = date.getDate().toString().padStart(2, "0")
  const month = months[date.getMonth()]
  const year = date.getFullYear()
  const hours = date.getHours().toString().padStart(2, "0")
  const minutes = date.getMinutes().toString().padStart(2, "0")

  if (formatStr === "LLL dd") return `${month} ${day}`
  if (formatStr === "LLL dd, y") return `${month} ${day}, ${year}`
  if (formatStr === "MMM dd, HH:mm") return `${month} ${day}, ${hours}:${minutes}`
  return date.toLocaleDateString()
}

type DateRange = { from?: Date; to?: Date }

type Status = "In Queue" | "Done" | "Missed"

type ViewType = "daily" | "period"

interface OperationRecord {
  id: string
  partNumber: string
  programFamily: string
  status: Status
  quantity: number
  timestamp: Date
}

function seededRandom(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff
    return (s >>> 0) / 0xffffffff
  }
}

// Generate mock data with a fixed seed so server and client produce identical output
const generateOperations = (): OperationRecord[] => {
  const rand = seededRandom(42)
  const programs = ["F135", "GTF", "LEAP-1A", "GEnx", "CFM56"]
  const statuses: Status[] = ["In Queue", "Done", "Missed"]
  const operations: OperationRecord[] = []
  const EPOCH = new Date("2025-01-01T00:00:00.000Z").getTime()

  for (let i = 0; i < 50; i++) {
    const baseDate = new Date(EPOCH + i * 86_400_000)
    baseDate.setDate(baseDate.getDate() - Math.floor(rand() * 30))

    operations.push({
      id: `OP-${String(1000 + i).padStart(5, "0")}`,
      partNumber: `PN-${String(Math.floor(rand() * 9000) + 1000)}`,
      programFamily: programs[Math.floor(rand() * programs.length)],
      status: statuses[Math.floor(rand() * statuses.length)],
      quantity: Math.floor(rand() * 50) + 1,
      timestamp: baseDate,
    })
  }

  return operations.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
}

const statusColors: Record<Status, string> = {
  "In Queue": "bg-amber-500/15 text-amber-600 border-amber-500/30",
  Done: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
  Missed: "bg-red-500/15 text-red-600 border-red-500/30",
}

export function OperationsTable() {
  const [operations, setOperations] = useState<OperationRecord[]>(() => generateOperations())
  const [search, setSearch] = useState("")
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [currentPage, setCurrentPage] = useState(1)
  const [statusFilters, setStatusFilters] = useState<Status[]>(["In Queue", "Done", "Missed"])
  const [viewType, setViewType] = useState<ViewType>("daily")
  const itemsPerPage = 8

  const handleStatusChange = (id: string, newStatus: Status) => {
    setOperations((prev) => prev.map((op) => (op.id === id ? { ...op, status: newStatus } : op)))
  }

  const toggleStatusFilter = (status: Status) => {
    setStatusFilters((prev) => (prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]))
    setCurrentPage(1)
  }

  const filteredOperations = useMemo(() => {
    return operations.filter((op) => {
      const matchesSearch =
        search === "" ||
        op.partNumber.toLowerCase().includes(search.toLowerCase()) ||
        op.programFamily.toLowerCase().includes(search.toLowerCase()) ||
        op.id.toLowerCase().includes(search.toLowerCase())

      const matchesDate =
        !dateRange?.from || (op.timestamp >= dateRange.from && (!dateRange.to || op.timestamp <= dateRange.to))

      const matchesStatus = statusFilters.includes(op.status)

      return matchesSearch && matchesDate && matchesStatus
    })
  }, [operations, search, dateRange, statusFilters])

  const totalPages = Math.ceil(filteredOperations.length / itemsPerPage)
  const paginatedOperations = filteredOperations.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  return (
    <Card className="border-2 border-border bg-card">
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-sm font-medium uppercase tracking-wider text-foreground">Operations Log</CardTitle>
          <div className="flex flex-wrap gap-2 items-center">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search parts, programs..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setCurrentPage(1)
                }}
                className="h-9 w-full pl-8 text-sm sm:w-[200px]"
              />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 gap-1.5 bg-transparent">
                  <Filter className="h-4 w-4" />
                  <span>Status</span>
                  {statusFilters.length < 3 && (
                    <Badge variant="secondary" className="h-5 px-1 text-[10px]">
                      {statusFilters.length}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                {(["In Queue", "Done", "Missed"] as Status[]).map((status) => (
                  <DropdownMenuCheckboxItem
                    key={status}
                    checked={statusFilters.includes(status)}
                    onCheckedChange={() => toggleStatusFilter(status)}
                  >
                    <Badge
                      variant="outline"
                      className={cn("mr-2 font-medium text-xs rounded-full px-2.5", statusColors[status])}
                    >
                      {status}
                    </Badge>
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Select value={viewType} onValueChange={(v) => setViewType(v as ViewType)}>
              <SelectTrigger className="h-9 w-[100px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="period">Period</SelectItem>
              </SelectContent>
            </Select>

            {/* Date Range Picker */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn("h-9 justify-start text-left font-normal", !dateRange && "text-muted-foreground")}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {formatDate(dateRange.from, "LLL dd")} - {formatDate(dateRange.to, "LLL dd")}
                      </>
                    ) : (
                      formatDate(dateRange.from, "LLL dd, y")
                    )
                  ) : (
                    <span>Date filter</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={(range) => {
                    setDateRange(range)
                    setCurrentPage(1)
                  }}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
            {dateRange && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setDateRange(undefined)
                  setCurrentPage(1)
                }}
                className="h-9 px-2 text-xs"
              >
                Clear
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border border-border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="font-mono text-xs uppercase tracking-wider">Part Number</TableHead>
                <TableHead className="font-mono text-xs uppercase tracking-wider">Program Family</TableHead>
                <TableHead className="font-mono text-xs uppercase tracking-wider">Status</TableHead>
                <TableHead className="font-mono text-xs uppercase tracking-wider text-right">Qty</TableHead>
                {viewType === "daily" && (
                  <TableHead className="font-mono text-xs uppercase tracking-wider text-right">Timestamp</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedOperations.length > 0 ? (
                paginatedOperations.map((op) => (
                  <TableRow key={op.id} className="hover:bg-muted/30">
                    <TableCell className="font-mono text-sm">{op.partNumber}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center rounded border border-border bg-muted px-2 py-0.5 text-xs font-medium">
                        {op.programFamily}
                      </span>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-full">
                            <Badge
                              variant="outline"
                              className={cn(
                                "cursor-pointer rounded-full px-3 py-0.5 font-medium text-xs transition-colors hover:opacity-80",
                                statusColors[op.status],
                              )}
                            >
                              {op.status}
                            </Badge>
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-32">
                          {(["In Queue", "Done", "Missed"] as Status[]).map((status) => (
                            <DropdownMenuCheckboxItem
                              key={status}
                              checked={op.status === status}
                              onCheckedChange={() => handleStatusChange(op.id, status)}
                              className="focus:bg-gray-500/10 hover:bg-gray-500/10"
                            >
                              <Badge
                                variant="outline"
                                className={cn("font-medium text-xs rounded-full px-2.5", statusColors[status])}
                              >
                                {status}
                              </Badge>
                            </DropdownMenuCheckboxItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                    <TableCell className="font-mono text-sm text-right tabular-nums">{op.quantity}</TableCell>
                    {viewType === "daily" && (
                      <TableCell className="font-mono text-xs text-right text-muted-foreground tabular-nums">
                        {formatDate(op.timestamp, "MMM dd, HH:mm")}
                      </TableCell>
                    )}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={viewType === "daily" ? 5 : 4} className="h-24 text-center text-muted-foreground">
                    No operations found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between pt-4">
          <span className="text-xs text-muted-foreground">
            Showing {(currentPage - 1) * itemsPerPage + 1}-
            {Math.min(currentPage * itemsPerPage, filteredOperations.length)} of {filteredOperations.length} entries
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 bg-transparent"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="px-2 text-sm font-mono">
              {currentPage} / {totalPages || 1}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 bg-transparent"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
