"use client"

import { useMemo } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import {
  TrendingUp,
  TrendingDown,
  Target,
  AlertTriangle,
  CheckCircle2,
  Activity,
  LayoutDashboard,
  Calendar,
  Settings2,
  FileBarChart,
  ArrowRight,
  Clock,
  AlertCircle,
  Info,
} from "lucide-react"
import {
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
} from "recharts"

// -- Executive KPI data --
const EXEC_KPIS = [
  {
    title: "Monthly Output",
    value: "523",
    subtitle: "/ 950 units",
    progress: 55,
    trend: { value: "+8.3% vs prior month", direction: "up" as const },
    variant: "default" as const,
    icon: <Target className="h-4 w-4 text-muted-foreground" />,
  },
  {
    title: "Schedule Adherence",
    value: "87.3%",
    trend: { value: "+2.1% vs target", direction: "up" as const },
    variant: "success" as const,
    icon: <CheckCircle2 className="h-4 w-4 text-success" />,
  },
  {
    title: "Machine Availability",
    value: "91.2%",
    subtitle: "18 of 20 online",
    trend: { value: "-0.8% from last week", direction: "down" as const },
    variant: "default" as const,
    icon: <Activity className="h-4 w-4 text-muted-foreground" />,
  },
  {
    title: "Active Alerts",
    value: "3",
    subtitle: "require attention",
    trend: { value: "1 critical, 2 warning", direction: "neutral" as const },
    variant: "warning" as const,
    icon: <AlertTriangle className="h-4 w-4 text-warning" />,
  },
]

// -- Monthly targets vs actuals chart data (6 months) --
function generateMonthlyData() {
  const months = ["Sep 25", "Oct 25", "Nov 25", "Dec 25", "Jan 26", "Feb 26"]
  const targets = [900, 920, 950, 950, 960, 950]
  const actuals = [872, 908, 934, 921, 948, 523]
  return months.map((month, i) => ({
    month,
    target: targets[i],
    actuals: i === months.length - 1 ? null : actuals[i],
    projected: i === months.length - 1 ? actuals[i] : null,
  }))
}

// -- Section status data: top row (shown above KPI cards) --
const SECTIONS_TOP = [
  {
    id: "monthly-plan",
    name: "Data Ingestion",
    icon: FileBarChart,
    href: "/monthly-plan",
    color: "text-success",
    bgColor: "bg-success/10",
    metrics: [
      { label: "Active WIP", value: "2444 units" },
      { label: "Monthly Target", value: "950 units" },
      { label: "Daily LE", value: "95 units" },
    ],
  },
  {
    id: "scheduling",
    name: "Scheduling Tool",
    icon: Calendar,
    href: "/scheduling",
    color: "text-chart-1",
    bgColor: "bg-chart-1/10",
    metrics: [
      { label: "Active Scenario", value: "Base Case" },
      { label: "Current View", value: "Weekly" },
      { label: "Forecast", value: "Enabled", positive: true },
    ],
  },
]

// -- Section status data: bottom row (shown after chart) --
const SECTIONS_BOTTOM = [
  {
    id: "dashboard",
    name: "Operations Dashboard",
    icon: LayoutDashboard,
    href: "/dashboard",
    color: "text-primary",
    bgColor: "bg-primary/10",
    metrics: [
      { label: "Run Rate", value: "125 units/wk" },
      { label: "Variation", value: "-10.7%", negative: true },
      { label: "Adherence", value: "87.3%", positive: true },
    ],
  },
  {
    id: "parameters",
    name: "Parameters Setup",
    icon: Settings2,
    href: "/parameters",
    color: "text-accent",
    bgColor: "bg-accent/10",
    metrics: [
      { label: "Online", value: "18 machines", positive: true },
      { label: "Offline", value: "1 machine", negative: true },
      { label: "Maintenance", value: "1 machine" },
    ],
  },
]

// -- Recent activity feed --
const RECENT_ACTIVITY = [
  {
    time: "14:32",
    message: "Machine CNC-07 returned to online status",
    severity: "success" as const,
    icon: CheckCircle2,
  },
  {
    time: "13:18",
    message: "Schedule adherence dropped below 85% threshold",
    severity: "destructive" as const,
    icon: AlertCircle,
  },
  {
    time: "12:45",
    message: "Monthly plan for Feb 2026 imported successfully",
    severity: "default" as const,
    icon: Info,
  },
  {
    time: "11:02",
    message: "Maintenance scheduled for EDM-03 starting tomorrow",
    severity: "warning" as const,
    icon: AlertTriangle,
  },
  {
    time: "09:30",
    message: "Bull case scenario updated with new parameters",
    severity: "default" as const,
    icon: Info,
  },
  {
    time: "08:15",
    message: "Shift A handoff completed — 42 units produced",
    severity: "success" as const,
    icon: CheckCircle2,
  },
]

// -- KPI Card (inline, matching kpi-cards.tsx pattern) --
function ExecKpiCard({
  title,
  value,
  subtitle,
  progress: progressValue,
  trend,
  variant = "default",
  icon,
}: {
  title: string
  value: string
  subtitle?: string
  progress?: number
  trend?: { value: string; direction: "up" | "down" | "neutral" }
  variant?: "default" | "success" | "destructive" | "warning"
  icon?: React.ReactNode
}) {
  const trendColor =
    trend?.direction === "up"
      ? "text-success"
      : trend?.direction === "down"
        ? "text-destructive"
        : "text-muted-foreground"

  return (
    <Card className="border-2 border-border bg-card">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {title}
        </CardTitle>
        {icon}
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <div className="flex items-baseline gap-2">
          <span
            className={cn(
              "font-mono text-3xl font-bold tabular-nums",
              variant === "destructive" && "text-destructive",
              variant === "success" && "text-success",
              variant === "warning" && "text-warning",
            )}
          >
            {value}
          </span>
          {subtitle && <span className="text-sm text-muted-foreground">{subtitle}</span>}
        </div>
        {progressValue !== undefined && (
          <Progress value={progressValue} className="h-1.5" />
        )}
        {trend && (
          <div className={cn("flex items-center gap-1 text-sm", trendColor)}>
            {trend.direction === "up" && <TrendingUp className="h-4 w-4" />}
            {trend.direction === "down" && <TrendingDown className="h-4 w-4" />}
            <span className="font-mono text-xs">{trend.value}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// -- Custom chart tooltip --
function OverviewChartTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null
  return (
    <div className="rounded-md border border-border bg-card p-3 shadow-lg">
      <p className="mb-2 font-mono text-sm font-semibold">{label}</p>
      <div className="flex flex-col gap-1">
        {payload.map((entry: any, i: number) => {
          if (entry.value === null) return null
          return (
            <div key={i} className="flex items-center gap-2 text-xs">
              <div
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: entry.fill || entry.stroke || entry.color }}
              />
              <span className="text-muted-foreground">{entry.name}:</span>
              <span className="font-mono font-medium">{entry.value}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// -- Main content component --
export function ExecutiveOverviewContent() {
  const monthlyData = useMemo(() => generateMonthlyData(), [])

  return (
    <div className="flex flex-col gap-6 p-6">

      {/* Section A: Data Ingestion & Scheduling Tool — top of page */}
      <div className="grid gap-4 md:grid-cols-2">
        {SECTIONS_TOP.map((section) => {
          const Icon = section.icon
          return (
            <Card key={section.id} className="border-2 border-border bg-card group">
              <CardContent className="flex flex-col gap-4 pt-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn("flex items-center justify-center h-9 w-9 rounded-md", section.bgColor)}>
                      <Icon className={cn("h-5 w-5", section.color)} />
                    </div>
                    <h3 className="text-sm font-semibold text-foreground">{section.name}</h3>
                  </div>
                  <Button variant="ghost" size="sm" asChild className="gap-1.5 text-xs text-muted-foreground hover:text-foreground">
                    <Link href={section.href}>
                      Open
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {section.metrics.map((metric) => (
                    <div key={metric.label} className="flex flex-col gap-0.5">
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{metric.label}</span>
                      <span className={cn("font-mono text-sm font-medium", metric.negative && "text-destructive", metric.positive && "text-success", !metric.negative && !metric.positive && "text-foreground")}>
                        {metric.value}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Section B: Executive KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {EXEC_KPIS.map((kpi) => (
          <ExecKpiCard key={kpi.title} {...kpi} />
        ))}
      </div>

      {/* Section B: Monthly Targets vs Actuals */}
      <Card className="border-2 border-border bg-card">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-sm font-medium uppercase tracking-wider text-foreground">
              Monthly Targets vs Actuals
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              6-month production performance with current month projection
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-sm bg-primary/30" />
              <span>Target</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-0.5 w-4 bg-success" />
              <span>Actuals</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-0.5 w-4 bg-warning" style={{ borderTop: "2px dashed" }} />
              <span>Projected</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={monthlyData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.4} />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: "#6b7280" }}
                  tickLine={false}
                  axisLine={false}
                  fontFamily="monospace"
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#6b7280" }}
                  tickLine={false}
                  axisLine={false}
                  fontFamily="monospace"
                  domain={[800, "auto"]}
                />
                <Tooltip content={<OverviewChartTooltip />} />
                <Bar
                  dataKey="target"
                  name="Target"
                  fill="oklch(0.35 0.15 250 / 0.2)"
                  stroke="oklch(0.35 0.15 250 / 0.4)"
                  strokeWidth={1}
                  radius={[3, 3, 0, 0]}
                  barSize={40}
                />
                <Line
                  type="monotone"
                  dataKey="actuals"
                  name="Actuals"
                  stroke="#22c55e"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: "#22c55e", stroke: "#fff", strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: "#22c55e" }}
                  connectNulls={false}
                />
                <Line
                  type="monotone"
                  dataKey="projected"
                  name="Projected"
                  stroke="#eab308"
                  strokeWidth={2}
                  strokeDasharray="6 3"
                  dot={{ r: 4, fill: "#eab308", stroke: "#fff", strokeWidth: 2 }}
                  connectNulls={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Section D: Operations Dashboard & Parameters Setup */}
      <div className="grid gap-4 md:grid-cols-2">
        {SECTIONS_BOTTOM.map((section) => {
          const Icon = section.icon
          return (
            <Card key={section.id} className="border-2 border-border bg-card group">
              <CardContent className="flex flex-col gap-4 pt-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn("flex items-center justify-center h-9 w-9 rounded-md", section.bgColor)}>
                      <Icon className={cn("h-5 w-5", section.color)} />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">{section.name}</h3>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    asChild
                    className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                  >
                    <Link href={section.href}>
                      Open
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {section.metrics.map((metric) => (
                    <div key={metric.label} className="flex flex-col gap-0.5">
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        {metric.label}
                      </span>
                      <span
                        className={cn(
                          "font-mono text-sm font-medium",
                          metric.negative && "text-destructive",
                          metric.positive && "text-success",
                          !metric.negative && !metric.positive && "text-foreground",
                        )}
                      >
                        {metric.value}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Section D: Recent Activity Feed */}
      <Card className="border-2 border-border bg-card">
        <CardHeader>
          <CardTitle className="text-sm font-medium uppercase tracking-wider text-foreground">
            Recent Activity
          </CardTitle>
          <p className="text-xs text-muted-foreground">Latest operations events and alerts</p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-0">
            {RECENT_ACTIVITY.map((item, i) => {
              const Icon = item.icon
              return (
                <div
                  key={i}
                  className={cn(
                    "flex items-start gap-3 py-3",
                    i < RECENT_ACTIVITY.length - 1 && "border-b border-border",
                  )}
                >
                  <div className="flex items-center gap-2 shrink-0 pt-0.5">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span className="font-mono text-xs text-muted-foreground w-10 tabular-nums">
                      {item.time}
                    </span>
                  </div>
                  <div className="flex items-start gap-2 flex-1 min-w-0">
                    <Icon
                      className={cn(
                        "h-4 w-4 shrink-0 mt-0.5",
                        item.severity === "success" && "text-success",
                        item.severity === "destructive" && "text-destructive",
                        item.severity === "warning" && "text-warning",
                        item.severity === "default" && "text-muted-foreground",
                      )}
                    />
                    <span className="text-sm text-foreground leading-tight">{item.message}</span>
                  </div>
                  <Badge
                    variant={item.severity === "default" ? "secondary" : item.severity === "success" ? "outline" : item.severity}
                    className={cn(
                      "shrink-0 text-[10px] font-mono uppercase",
                      item.severity === "success" && "border-success/40 text-success bg-success/5",
                      item.severity === "warning" && "border-warning/40 text-warning bg-warning/5",
                    )}
                  >
                    {item.severity === "destructive" ? "Critical" : item.severity === "warning" ? "Warning" : "Info"}
                  </Badge>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
