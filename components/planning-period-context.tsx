"use client"

import { createContext, useContext, useState } from "react"
import type React from "react"

export const availableMonths = [
  "January 2024",
  "February 2024",
  "March 2024",
  "April 2024",
  "May 2024",
  "June 2024",
]

// ── Shared row types ──────────────────────────────────────────────────────────

export interface MonthlyPlanRow {
  id: string
  programFamily: string
  partNumber: string
  description: string
  monthlyTarget: number
  weeklyBreakdown: number[]
}

export interface DailyPlanRow {
  id: string
  partNumber: string
  dailyQty: number[]
}

export interface DailyActualsRow {
  id: string
  partNumber: string
  dailyQty: (number | null)[]
}

export interface DailyLERow {
  id: string
  partNumber: string
  dailyQty: number[]
}

// ── Context ───────────────────────────────────────────────────────────────────

interface PlanningPeriodContextValue {
  selectedMonth: string
  setSelectedMonth: (month: string) => void
  monthlyPlanRows: MonthlyPlanRow[]
  setMonthlyPlanRows: (rows: MonthlyPlanRow[]) => void
  dailyPlanRows: DailyPlanRow[]
  setDailyPlanRows: (rows: DailyPlanRow[]) => void
  dailyActualsRows: DailyActualsRow[]
  setDailyActualsRows: (rows: DailyActualsRow[]) => void
  dailyLERows: DailyLERow[]
  setDailyLERows: (rows: DailyLERow[]) => void
}

const PlanningPeriodContext = createContext<PlanningPeriodContextValue>({
  selectedMonth: availableMonths[0],
  setSelectedMonth: () => {},
  monthlyPlanRows: [],
  setMonthlyPlanRows: () => {},
  dailyPlanRows: [],
  setDailyPlanRows: () => {},
  dailyActualsRows: [],
  setDailyActualsRows: () => {},
  dailyLERows: [],
  setDailyLERows: () => {},
})

export function PlanningPeriodProvider({ children }: { children: React.ReactNode }) {
  const [selectedMonth, setSelectedMonth] = useState(availableMonths[0])
  const [monthlyPlanRows, setMonthlyPlanRows] = useState<MonthlyPlanRow[]>([])
  const [dailyPlanRows, setDailyPlanRows] = useState<DailyPlanRow[]>([])
  const [dailyActualsRows, setDailyActualsRows] = useState<DailyActualsRow[]>([])
  const [dailyLERows, setDailyLERows] = useState<DailyLERow[]>([])

  return (
    <PlanningPeriodContext.Provider value={{
      selectedMonth, setSelectedMonth,
      monthlyPlanRows, setMonthlyPlanRows,
      dailyPlanRows, setDailyPlanRows,
      dailyActualsRows, setDailyActualsRows,
      dailyLERows, setDailyLERows,
    }}>
      {children}
    </PlanningPeriodContext.Provider>
  )
}

export function usePlanningPeriod() {
  return useContext(PlanningPeriodContext)
}
