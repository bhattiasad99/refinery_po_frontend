"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  CircleCheckBig,
  CreditCard,
  ListChecks,
  UserRound,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import {
  type PurchaseOrderDraft,
} from "./draft-api"
import {
  getPurchaseOrder,
  mapPurchaseOrderToStepOne,
  mapPurchaseOrderToStepThree,
  mapPurchaseOrderToStepTwo,
  submitPurchaseOrder,
} from "./purchase-order-client"
import { StepShell } from "./step-shell"

type CreatePurchaseOrderPreviewProps = {
  draftId: string
}

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
})

function ReviewField({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="rounded-md border border-slate-200/70 bg-white p-3">
      <p className="text-[11px] font-semibold tracking-[0.08em] text-slate-500 uppercase">{label}</p>
      <p className="mt-1 text-sm font-medium text-slate-900">{value}</p>
    </div>
  )
}

export default function CreatePurchaseOrderPreview({
  draftId,
}: CreatePurchaseOrderPreviewProps) {
  const router = useRouter()

  const [draft, setDraft] = useState<PurchaseOrderDraft | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const purchaseOrderTotal =
    draft?.step2.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0) ?? 0

  useEffect(() => {
    let isMounted = true

    const loadPageData = async () => {
      setIsLoading(true)
      setErrorMessage(null)
      try {
        const purchaseOrder = await getPurchaseOrder(draftId)
        if (!isMounted) return

        setDraft({
          id: purchaseOrder.id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          step1: mapPurchaseOrderToStepOne(purchaseOrder),
          step2: mapPurchaseOrderToStepTwo(purchaseOrder),
          step3: mapPurchaseOrderToStepThree(purchaseOrder),
          step4: {
            primary: "",
            secondary: "",
            tertiary: "",
          },
          step5: {
            primary: "",
            secondary: "",
            tertiary: "",
          },
        })
      } catch (error) {
        if (!isMounted) return
        setDraft(null)
        setErrorMessage(error instanceof Error ? error.message : "Failed to load preview")
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadPageData()
    return () => {
      isMounted = false
    }
  }, [draftId])

  const onSubmit = async () => {
    if (!draft || isSubmitting) {
      return
    }

    setIsSubmitting(true)
    setErrorMessage(null)
    try {
      await submitPurchaseOrder(draft.id)
      router.push("/purchase-orders")
      router.refresh()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to submit purchase order")
      setIsSubmitting(false)
    }
  }

  return (
    <StepShell
      title="Review Purchase Order"
      description="Review all draft sections before final submission."
    >
      {isLoading ? (
        <p className="text-muted-foreground text-sm">Loading review...</p>
      ) : (
        <div className="space-y-5">
          {draft && (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <Card className="border-slate-200/80">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <UserRound className="size-4 text-slate-600" />
                      Basic Info
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-2 pt-0">
                    <ReviewField label="Requested By (Department)" value={draft.step1.requestedByDepartment} />
                    <ReviewField label="Requested By (User)" value={draft.step1.requestedByUser} />
                    <ReviewField label="Budget Code" value={draft.step1.budgetCode} />
                    <ReviewField label="Need By Date" value={draft.step1.needByDate ?? "Not specified"} />
                  </CardContent>
                </Card>

                <Card className="border-slate-200/80">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <ListChecks className="size-4 text-slate-600" />
                      Items
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-2 pt-0">
                    <ReviewField
                      label="Supplier Name"
                      value={draft.step2.supplierName || "No Supplier Added, please add items"}
                    />
                    <ReviewField label="Items Count" value={`${draft.step2.items.length}`} />
                    <div className="space-y-2 rounded-md border border-slate-200/70 bg-white p-3">
                      <p className="text-[11px] font-semibold tracking-[0.08em] text-slate-500 uppercase">
                        Line Items
                      </p>
                      {draft.step2.items.map((item) => (
                        <div key={item.id} className="rounded-md border border-slate-200 p-2">
                          <p className="text-sm font-semibold text-slate-900">{item.item}</p>
                          <p className="text-xs text-slate-600">
                            {item.quantity} x {currencyFormatter.format(item.unitPrice)} • {item.category}
                          </p>
                          <p className="mt-1 text-xs font-semibold text-slate-800">
                            Line Total: {currencyFormatter.format(item.quantity * item.unitPrice)}
                          </p>
                        </div>
                      ))}
                      <div className="rounded-md border border-slate-300 bg-slate-50 p-3">
                        <p className="text-[11px] font-semibold tracking-[0.08em] text-slate-500 uppercase">
                          Purchase Order Total
                        </p>
                        <p className="mt-1 text-base font-bold text-slate-900">
                          {currencyFormatter.format(purchaseOrderTotal)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-slate-200/80 md:col-span-2">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <CreditCard className="size-4 text-slate-600" />
                      Payment Terms
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-2 pt-0 md:grid-cols-2">
                    <ReviewField label="Payment Type" value={draft.step3.paymentTerm.label} />
                    <ReviewField label="Tax Included" value={draft.step3.taxIncluded ? "Yes" : "No"} />
                    <ReviewField label="Term Detail" value={draft.step3.paymentTerm.description} />
                    <ReviewField
                      label="Due Date Input"
                      value={draft.step1.needByDate ?? "No explicit due date provided"}
                    />
                  </CardContent>
                </Card>
              </div>
            </>
          )}

          <div className="mt-2 flex items-center justify-between gap-3">
            <Button
              variant="outline"
              onClick={() => router.push(`/purchase-orders/new/step-3/${draftId}`)}
              disabled={isSubmitting}
            >
              Back
            </Button>
            <Button
              className="bg-emerald-600 text-white hover:bg-emerald-700"
              onClick={onSubmit}
              disabled={isSubmitting || isLoading || !draft}
            >
              <CircleCheckBig className="size-4" />
              {isSubmitting ? "Submitting..." : "Submit Purchase Order"}
            </Button>
          </div>
          {errorMessage ? <p className="text-sm font-medium text-red-600">{errorMessage}</p> : null}
        </div>
      )}
    </StepShell>
  )
}
