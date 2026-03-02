"use client"

import { createContext, useContext, useState } from "react"

export const availableMonths = [
  "January 2024",
  "February 2024",
  "March 2024",
  "April 2024",
  "May 2024",
  "June 2024",
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

interface PlanningPeriodContextValue {
  selectedMonth: string
  setSelectedMonth: (month: string) => void
  monthlyPlanRows: MonthlyPlanRow[]
  setMonthlyPlanRows: (rows: MonthlyPlanRow[]) => void
  dailyActualsRows: DailyActualsRow[]
  setDailyActualsRows: (rows: DailyActualsRow[]) => void
  dailyPlanRows: DailyPlanRow[]
  setDailyPlanRows: (rows: DailyPlanRow[]) => void
}

const PlanningPeriodContext = createContext<PlanningPeriodContextValue>({
  selectedMonth: availableMonths[0],
  setSelectedMonth: () => {},
  monthlyPlanRows: [],
  setMonthlyPlanRows: () => {},
  dailyActualsRows: [],
  setDailyActualsRows: () => {},
  dailyPlanRows: [],
  setDailyPlanRows: () => {},
})

export function PlanningPeriodProvider({ children }: { children: React.ReactNode }) {
  const [selectedMonth, setSelectedMonth] = useState(availableMonths[0])
  const [monthlyPlanRows, setMonthlyPlanRows] = useState<MonthlyPlanRow[]>([])
  const [dailyActualsRows, setDailyActualsRows] = useState<DailyActualsRow[]>([])
  const [dailyPlanRows, setDailyPlanRows] = useState<DailyPlanRow[]>([])
  return (
    <PlanningPeriodContext.Provider value={{ selectedMonth, setSelectedMonth, monthlyPlanRows, setMonthlyPlanRows, dailyActualsRows, setDailyActualsRows, dailyPlanRows, setDailyPlanRows }}>
      {children}
    </PlanningPeriodContext.Provider>
  )
}

export function usePlanningPeriod() {
  return useContext(PlanningPeriodContext)
}
