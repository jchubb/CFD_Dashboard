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

export interface MonthlyPlanRow {
  id: string
  programFamily: string
  partNumber: string
  description: string
  monthlyTarget: number
  weeklyBreakdown: number[]
}

export interface DailyActualsRow {
  id: string
  partNumber: string
  dailyQty: (number | null)[]
}

export interface DailyPlanRow {
  id: string
  partNumber: string
  dailyQty: number[]
}

export interface DailyLERow {
  id: string
  partNumber: string
  dailyQty: number[]
}

// A single row in the optimized schedule output
export interface OptimizedScheduleRow {
  id: string
  partNumber: string
  programFamily: string
  scheduledDate: string   // ISO date string e.g. "2024-01-15"
  scheduledTime: string   // e.g. "08:00" — used for 36-hour horizon
  quantity: number
  machine: string
  shift: string
  status: "scheduled" | "in-progress" | "complete"
}

// Optimizer configuration values (for the Configure Optimizer button)
export interface OptimizerValues {
  targetUtilization: number | null
  shiftHours: number | null
  shiftsPerDay: number | null
  bufferPercent: number | null
  notes: string
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
  optimizedScheduleRows: OptimizedScheduleRow[]
  setOptimizedScheduleRows: (rows: OptimizedScheduleRow[]) => void
  optimizerValues: OptimizerValues
  setOptimizerValues: (values: OptimizerValues) => void
}

const DEFAULT_OPTIMIZER: OptimizerValues = {
  targetUtilization: null,
  shiftHours: null,
  shiftsPerDay: null,
  bufferPercent: null,
  notes: "",
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
  dailyLERows: [],
  setDailyLERows: () => {},
  optimizedScheduleRows: [],
  setOptimizedScheduleRows: () => {},
  optimizerValues: DEFAULT_OPTIMIZER,
  setOptimizerValues: () => {},
})

export function PlanningPeriodProvider({ children }: { children: React.ReactNode }) {
  const [selectedMonth, setSelectedMonth] = useState(availableMonths[0])
  const [monthlyPlanRows, setMonthlyPlanRows] = useState<MonthlyPlanRow[]>([])
  const [dailyActualsRows, setDailyActualsRows] = useState<DailyActualsRow[]>([])
  const [dailyPlanRows, setDailyPlanRows] = useState<DailyPlanRow[]>([])
  const [dailyLERows, setDailyLERows] = useState<DailyLERow[]>([])
  const [optimizedScheduleRows, setOptimizedScheduleRows] = useState<OptimizedScheduleRow[]>([])
  const [optimizerValues, setOptimizerValues] = useState<OptimizerValues>(DEFAULT_OPTIMIZER)

  return (
    <PlanningPeriodContext.Provider value={{
      selectedMonth, setSelectedMonth,
      monthlyPlanRows, setMonthlyPlanRows,
      dailyActualsRows, setDailyActualsRows,
      dailyPlanRows, setDailyPlanRows,
      dailyLERows, setDailyLERows,
      optimizedScheduleRows, setOptimizedScheduleRows,
      optimizerValues, setOptimizerValues,
    }}>
      {children}
    </PlanningPeriodContext.Provider>
  )
}

export function usePlanningPeriod() {
  return useContext(PlanningPeriodContext)
}
