import { Suspense, lazy } from "react"
import { CatalogPageFallback } from "@/components/use-case/CatalogPageComponent/fallback"

const CatalogPageComponent = lazy(() => import("@/components/use-case/CatalogPageComponent"))

const CatalogPage = () => {
  return (
    <Suspense fallback={<CatalogPageFallback />}>
      <CatalogPageComponent />
    </Suspense>
  )
}

export default CatalogPage
