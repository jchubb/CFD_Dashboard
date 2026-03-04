import dynamic from "next/dynamic"

const ParametersContent = dynamic(
  () => import("@/components/parameters-content").then((m) => m.ParametersContent),
  { ssr: false }
)

export default function ParametersPage() {
  return <ParametersContent />
}
