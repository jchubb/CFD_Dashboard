"use client"

import { createContext, useContext, useState, useEffect } from "react"

export const availableMonths = [
  "January 2024",
  "February 2024",
  "March 2024",
  "April 2024",
  "May 2024",
  "June 2024",
]

interface PlanningPeriodContextValue {
  selectedMonth: string
  setSelectedMonth: (month: string) => void
}

const PlanningPeriodContext = createContext<PlanningPeriodContextValue>({
  selectedMonth: availableMonths[0],
  setSelectedMonth: () => {},
})

export function PlanningPeriodProvider({ children }: { children: React.ReactNode }) {
  const [selectedMonth, setSelectedMonth] = useState(availableMonths[0])
  return (
    <PlanningPeriodContext.Provider value={{ selectedMonth, setSelectedMonth }}>
      {children}
    </PlanningPeriodContext.Provider>
  )
}

export function usePlanningPeriod() {
  return useContext(PlanningPeriodContext)
}
