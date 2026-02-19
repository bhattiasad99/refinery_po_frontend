"use client"

import { usePathname } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import {
  InternalHero,
  InternalPageBackLink,
  InternalPageTemplate,
} from "@/components/templates/internal-page-template"

type CreatePurchaseOrderFlowLayoutShellProps = {
  children: React.ReactNode
}

const STEP_LABELS: Record<number, string> = {
  1: "Basic Info",
  2: "Items",
  3: "Payment Terms",
  4: "Review",
}

const getActiveStep = (pathname: string) => {
  if (pathname.includes("/preview/")) return 4
  if (pathname.includes("/step-3/")) return 3
  if (pathname.includes("/step-2/")) return 2
  return 1
}

export default function CreatePurchaseOrderFlowLayoutShell({
  children,
}: CreatePurchaseOrderFlowLayoutShellProps) {
  const pathname = usePathname()
  const activeStep = getActiveStep(pathname)

  return (
    <InternalPageTemplate className="gap-4">
      <InternalPageBackLink href="/purchase-orders" label="Back to purchase orders" />

      <InternalHero
        eyebrow="Create Purchase Order"
        title={STEP_LABELS[activeStep]}
        actions={
          <Badge variant="secondary" className="bg-white text-slate-900 hover:bg-white">
            Step {activeStep} of 4
          </Badge>
        }
        contentClassName="gap-3"
        meta={
          <div className="grid w-full grid-cols-4 gap-2">
            {Array.from({ length: 4 }).map((_, index) => {
              const step = index + 1
              return (
                <div
                  key={step}
                  className={
                    step <= activeStep
                      ? "h-2 rounded-full bg-emerald-500"
                      : "h-2 rounded-full bg-white/25"
                  }
                />
              )
            })}
          </div>
        }
      />

      {children}
    </InternalPageTemplate>
  )
}
