"use client"

import { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { MonthlyPlanSection } from "@/components/monthly-plan-section"
import {
  FileBarChart,
  CalendarRange,
  TrendingUp,
  Package,
  Target,
} from "lucide-react"

const availableMonths = [
  "January 2024",
  "February 2024",
  "March 2024",
  "April 2024",
  "May 2024",
  "June 2024",
]

export function MonthlyPlanContent() {
  const [selectedMonth, setSelectedMonth] = useState("January 2024")

  // Summary cards data based on selected month (simulated)
  const monthSummary = useMemo(() => {
    const monthIndex = availableMonths.indexOf(selectedMonth)
    const baseTarget = 950 + monthIndex * 30
    const baseParts = 12 + Math.floor(monthIndex * 0.5)
    const baseFamilies = 5
    const baseCompletion = 0

    return {
      totalTarget: baseTarget,
      totalParts: baseParts,
      families: baseFamilies,
      completionRate: baseCompletion,
    }
  }, [selectedMonth])

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Planning Period Selector */}
      <div className="flex items-center gap-3">
        <label className="text-sm text-muted-foreground">Planning Period:</label>
        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger className="w-[180px] h-9">
            <CalendarRange className="h-4 w-4 mr-2 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {availableMonths.map((month) => (
              <SelectItem key={month} value={month}>
                {month}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="border border-border">
          <CardContent className="py-4 px-5 flex items-center gap-4">
            <div className="p-2.5 rounded-lg bg-blue-50">
              <Target className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Monthly Target</p>
              <p className="text-xl font-semibold font-mono">{monthSummary.totalTarget}</p>
              <p className="text-xs text-muted-foreground">total units</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-border">
          <CardContent className="py-4 px-5 flex items-center gap-4">
            <div className="p-2.5 rounded-lg bg-emerald-50">
              <Package className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Unique Parts</p>
              <p className="text-xl font-semibold font-mono">{monthSummary.totalParts}</p>
              <p className="text-xs text-muted-foreground">in plan</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-border">
          <CardContent className="py-4 px-5 flex items-center gap-4">
            <div className="p-2.5 rounded-lg bg-purple-50">
              <FileBarChart className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Program Families</p>
              <p className="text-xl font-semibold font-mono">{monthSummary.families}</p>
              <p className="text-xs text-muted-foreground">active</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-border">
          <CardContent className="py-4 px-5 flex items-center gap-4">
            <div className="p-2.5 rounded-lg bg-amber-50">
              <TrendingUp className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Plan Status</p>
              <p className="text-xl font-semibold font-mono">
                {monthSummary.completionRate > 0 ? (
                  <>{monthSummary.completionRate}%</>
                ) : (
                  <Badge variant="outline" className="text-xs border-amber-300 text-amber-700 bg-amber-50">
                    Awaiting Data
                  </Badge>
                )}
              </p>
              {monthSummary.completionRate > 0 && (
                <p className="text-xs text-muted-foreground">completion</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Monthly Plan Section - CSV Upload, Table, and Histogram */}
      <MonthlyPlanSection selectedMonth={selectedMonth} />

      {/* Footer Guidance */}
      <div className="flex items-center justify-between px-1">
        <p className="text-xs text-muted-foreground">
          Upload a CSV or load sample data to populate the plan. Use the Scheduling Tool tab to generate schedules based on these targets.
        </p>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs text-muted-foreground">
            <CalendarRange className="h-3 w-3 mr-1" />
            {selectedMonth}
          </Badge>
        </div>
      </div>
    </div>
  )
}
