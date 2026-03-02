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

// Shared type for daily LE rows
export interface DailyLERow {
  id: string
  partNumber: string
  dailyQty: number[]
}

// Optimizer values stored from the Configure Optimizer Values dialog
export interface OptimizerValues {
  targetUtilization: number | null   // e.g. 60 (machines per shift)
  shiftHours: number | null          // e.g. 8
  shiftsPerDay: number | null        // e.g. 2
  bufferPercent: number | null       // e.g. 10
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
  optimizerValues: DEFAULT_OPTIMIZER,
  setOptimizerValues: () => {},
})

export function PlanningPeriodProvider({ children }: { children: React.ReactNode }) {
  const [selectedMonth, setSelectedMonth] = useState(availableMonths[0])
  const [monthlyPlanRows, setMonthlyPlanRows] = useState<MonthlyPlanRow[]>([])
  const [dailyActualsRows, setDailyActualsRows] = useState<DailyActualsRow[]>([])
  const [dailyPlanRows, setDailyPlanRows] = useState<DailyPlanRow[]>([])
  const [dailyLERows, setDailyLERows] = useState<DailyLERow[]>([])
  const [optimizerValues, setOptimizerValues] = useState<OptimizerValues>(DEFAULT_OPTIMIZER)
  return (
    <PlanningPeriodContext.Provider value={{ selectedMonth, setSelectedMonth, monthlyPlanRows, setMonthlyPlanRows, dailyActualsRows, setDailyActualsRows, dailyPlanRows, setDailyPlanRows, dailyLERows, setDailyLERows, optimizerValues, setOptimizerValues }}>
      {children}
    </PlanningPeriodContext.Provider>
  )
}

export function usePlanningPeriod() {
  return useContext(PlanningPeriodContext)
}
