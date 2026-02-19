"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"

type CreatePurchaseOrderFlowLayoutShellProps = {
  children: React.ReactNode
}

const STEP_LABELS: Record<number, string> = {
  1: "Basic Info",
  2: "Items",
  3: "Payment Terms",
  4: "Compliance",
  5: "Final Notes",
  6: "Preview",
}

const getActiveStep = (pathname: string) => {
  if (pathname.includes("/preview/")) return 6
  if (pathname.includes("/step-5/")) return 5
  if (pathname.includes("/step-4/")) return 4
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
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4">
      <Link
        href="/purchase-orders"
        className="text-muted-foreground hover:text-foreground inline-flex w-fit items-center gap-2 text-sm"
      >
        <ArrowLeft className="size-4" />
        Back to purchase orders
      </Link>

      <Card className="overflow-hidden border-none bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white shadow-lg">
        <CardHeader className="gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Badge className="bg-white/15 text-white hover:bg-white/15">Create Purchase Order</Badge>
            <Badge variant="secondary" className="bg-white text-slate-900 hover:bg-white">
              Step {activeStep} of 6
            </Badge>
          </div>
          <CardTitle className="text-2xl md:text-3xl">{STEP_LABELS[activeStep]}</CardTitle>
          <div className="grid grid-cols-6 gap-2">
            {Array.from({ length: 6 }).map((_, index) => {
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
        </CardHeader>
      </Card>

      {children}
    </div>
  )
}
