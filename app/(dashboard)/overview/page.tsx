"use client"

import dynamic from "next/dynamic"

const ExecutiveOverviewContent = dynamic(
  () => import("@/components/executive-overview-content").then((m) => m.ExecutiveOverviewContent),
  { ssr: false }
)

export default function OverviewPage() {
  return <ExecutiveOverviewContent />
}
