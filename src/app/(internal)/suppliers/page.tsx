import { Suspense, lazy } from "react"
import { SuppliersPageFallback } from "@/components/use-case/SuppliersPageComponent/fallback"

const SuppliersPageComponent = lazy(() => import("@/components/use-case/SuppliersPageComponent"))

const SuppliersPage = () => {
  return (
    <Suspense fallback={<SuppliersPageFallback />}>
      <SuppliersPageComponent />
    </Suspense>
  )
}

export default SuppliersPage
