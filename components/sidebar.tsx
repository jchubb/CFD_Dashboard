"use client"

import type React from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { LayoutDashboard, Settings2, FileBarChart, ChevronLeft, ChevronRight, Activity, Home } from "lucide-react"

export type NavTab = "overview" | "dashboard" | "parameters" | "monthly-plan"

interface SidebarProps {
  activeTab: NavTab
  collapsed: boolean
  onCollapsedChange: (collapsed: boolean) => void
}

const navItems: { id: NavTab; label: string; icon: React.ElementType; href: string }[] = [
  { id: "overview",     label: "Overview",                  icon: Home,            href: "/overview" },
  { id: "monthly-plan", label: "Data Ingestion",            icon: FileBarChart,    href: "/monthly-plan" },
  { id: "parameters",   label: "Parameters Setup",          icon: Settings2,       href: "/parameters" },
  { id: "dashboard",    label: "Future State - Dashboard",  icon: LayoutDashboard, href: "/dashboard" },
]

export function Sidebar({ activeTab, collapsed, onCollapsedChange }: SidebarProps) {
  return (
    <aside
      className={cn(
        "flex flex-col border-r border-sidebar-border bg-sidebar backdrop-blur-md text-sidebar-foreground transition-all duration-300",
        collapsed ? "w-16" : "w-64",
      )}
    >
      {/* Logo Area */}
      <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <Activity className="h-6 w-6 text-sidebar-primary" />
            <span className="text-sm font-semibold uppercase tracking-wider">CFD Scheduling</span>
          </div>
        )}
        {collapsed && <Activity className="mx-auto h-6 w-6 text-sidebar-primary" />}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = activeTab === item.id
          return (
            <Button
              key={item.id}
              variant="ghost"
              asChild
              className={cn(
                "w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                isActive && "bg-sidebar-accent text-sidebar-accent-foreground font-medium",
                collapsed && "justify-center px-2",
              )}
            >
              <Link href={item.href}>
                <Icon className="h-5 w-5 shrink-0" />
                {!collapsed && <span className="text-sm">{item.label}</span>}
              </Link>
            </Button>
          )
        })}
      </nav>

      {/* Collapse Toggle */}
      <div className="border-t border-sidebar-border p-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onCollapsedChange(!collapsed)}
          className={cn(
            "w-full text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            collapsed ? "justify-center" : "justify-start gap-2",
          )}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4" />
              <span className="text-xs">Collapse</span>
            </>
          )}
        </Button>
      </div>
    </aside>
  )
}
