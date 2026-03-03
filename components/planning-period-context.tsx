"use client"

import { createContext, useContext, useState } from "react"

export const availableMonths = [
  "October 2025",
  "November 2025",
  "December 2025",
  "January 2026",
  "February 2026",
  "March 2026",
  "April 2026",
  "May 2026",
  "June 2026",
  "July 2026",
  "August 2026"
]

// Shared type for monthly plan rows
export interface MonthlyPlanRow {
  id: string
  programFamily: string
  partNumber: string
  description: string
  monthlyTarget: number
  weeklyBreakdown: number[]
}

// Shared type for daily actuals rows
export interface DailyActualsRow {
  id: string
  partNumber: string
  dailyQty: (number | null)[]
}

// Shared type for daily plan rows
export interface DailyPlanRow {
  id: string
  partNumber: string
  dailyQty: number[]
}

// Shared type for daily LE rows
export interface DailyLERow {
  id: string
  partNumber: string
  dailyQty: number[]
}

// Shared type for available WIP rows
export interface WipRow {
  id: string
  programFamily: string
  partNumber: string
  description: string
  totalAvailable: number
}

interface PlanningPeriodContextValue {
  selectedMonth: string
  setSelectedMonth: (month: string) => void
  monthlyPlanRows: MonthlyPlanRow[]
  setMonthlyPlanRows: (rows: MonthlyPlanRow[]) => void
  dailyActualsRows: DailyActualsRow[]
  setDailyActualsRows: (rows: DailyActualsRow[]) => void
  dailyPlanRows: DailyPlanRow[]
  setDailyPlanRows: (rows: DailyPlanRow[]) => void
  dailyLERows: DailyLERow[]
  setDailyLERows: (rows: DailyLERow[]) => void
  wipRows: WipRow[]
  setWipRows: (rows: WipRow[]) => void
}

const PlanningPeriodContext = createContext<PlanningPeriodContextValue>({
  selectedMonth: "February 2026",
  setSelectedMonth: () => { },
  monthlyPlanRows: [],
  setMonthlyPlanRows: () => { },
  dailyActualsRows: [],
  setDailyActualsRows: () => { },
  dailyPlanRows: [],
  setDailyPlanRows: () => { },
  dailyLERows: [],
  setDailyLERows: () => { },
  wipRows: [],
  setWipRows: () => { },
})

export function PlanningPeriodProvider({ children }: { children: React.ReactNode }) {
  const [selectedMonth, setSelectedMonth] = useState("February 2026")
  const [monthlyPlanRows, setMonthlyPlanRows] = useState<MonthlyPlanRow[]>([])
  const [dailyActualsRows, setDailyActualsRows] = useState<DailyActualsRow[]>([])
  const [dailyPlanRows, setDailyPlanRows] = useState<DailyPlanRow[]>([])
  const [dailyLERows, setDailyLERows] = useState<DailyLERow[]>([])
  const [wipRows, setWipRows] = useState<WipRow[]>([])
  return (
    <PlanningPeriodContext.Provider value={{ selectedMonth, setSelectedMonth, monthlyPlanRows, setMonthlyPlanRows, dailyActualsRows, setDailyActualsRows, dailyPlanRows, setDailyPlanRows, dailyLERows, setDailyLERows, wipRows, setWipRows }}>
      {children}
    </PlanningPeriodContext.Provider>
  )
}

export function usePlanningPeriod() {
  return useContext(PlanningPeriodContext)
}
