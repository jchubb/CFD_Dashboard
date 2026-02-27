"use client"

import type React from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Target, AlertTriangle, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface KpiCardProps {
  title: string
  value: string
  subtitle?: string
  trend?: {
    value: string
    direction: "up" | "down" | "neutral"
  }
  variant?: "default" | "success" | "destructive" | "warning"
  icon?: React.ReactNode
}

function KpiCard({ title, value, subtitle, trend, variant = "default", icon }: KpiCardProps) {
  const trendColor =
    trend?.direction === "up"
      ? "text-success"
      : trend?.direction === "down"
        ? "text-destructive"
        : "text-muted-foreground"

  return (
    <Card className="border-2 border-border bg-card">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent className="space-y-1">
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

export function KpiCards() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <KpiCard
        title="Throughput Run Rate (RR)"
        value="125"
        subtitle="units/week"
        trend={{ value: "+4.2% vs last week", direction: "up" }}
        icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
      />
      <KpiCard
        title="Throughput Target"
        value="140"
        subtitle="units/week"
        icon={<Target className="h-4 w-4 text-muted-foreground" />}
      />
      <KpiCard
        title="Variation to Plan"
        value="-10.7%"
        variant="destructive"
        trend={{ value: "15 units behind schedule", direction: "down" }}
        icon={<AlertTriangle className="h-4 w-4 text-destructive" />}
      />
      <KpiCard
        title="Schedule Adherence"
        value="87.3%"
        variant="success"
        trend={{ value: "+2.1% vs target", direction: "up" }}
        icon={<CheckCircle2 className="h-4 w-4 text-success" />}
      />
    </div>
  )
}
