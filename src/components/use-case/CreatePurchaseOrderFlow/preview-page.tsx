"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { CircleCheckBig } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

import {
  PAYMENT_TERM_OPTIONS,
  type PurchaseOrderDraft,
} from "./draft-api"
import { StepShell } from "./step-shell"

type CreatePurchaseOrderPreviewProps = {
  draftId: string
}

export default function CreatePurchaseOrderPreview({
  draftId,
}: CreatePurchaseOrderPreviewProps) {
  const router = useRouter()

  const [draft, setDraft] = useState<PurchaseOrderDraft | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const loadPageData = async () => {
      setIsLoading(true)
      setDraft({
        id: draftId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        step1: {
          requestedByDepartment: "Procurement Dept",
          requestedByUser: "Ayesha Khan",
          budgetCode: "CC-1234",
          needByDate: undefined,
        },
        step2: {
          supplierName: "",
          items: [],
        },
        step3: {
          paymentTerm:
            PAYMENT_TERM_OPTIONS.find((option) => option.id === "NET_30") ??
            PAYMENT_TERM_OPTIONS[0],
          taxIncluded: false,
          advancePercentage: null,
          balanceDueInDays: null,
          customTerms: "",
          milestones: [],
        },
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
      setIsLoading(false)
    }

    loadPageData()
  }, [draftId])

  const onSubmit = async () => {
    setIsSubmitting(true)
    router.push("/purchase-orders")
    router.refresh()
  }

  return (
    <StepShell
      title="Preview Purchase Order"
      description="Review all draft sections before final submission."
    >
      {isLoading ? (
        <p className="text-muted-foreground text-sm">Loading preview...</p>
      ) : (
        <div className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold">Draft ID</p>
                <Badge variant="outline">{draft?.id}</Badge>
              </div>
            </CardContent>
          </Card>

          {draft && (
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardContent className="space-y-2 p-4 text-sm">
                  <p className="font-semibold">Step 1</p>
                  <p>Requested By (Department): {draft.step1.requestedByDepartment}</p>
                  <p>Requested By (User): {draft.step1.requestedByUser}</p>
                  <p>Budget Code: {draft.step1.budgetCode}</p>
                  <p>Need By Date: {draft.step1.needByDate ?? "Not specified"}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="space-y-2 p-4 text-sm">
                  <p className="font-semibold">Step 2</p>
                  <p>
                    Supplier Name:{" "}
                    {draft.step2.supplierName || "No Supplier Added, please add items"}
                  </p>
                  <p>Items Count: {draft.step2.items.length}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="space-y-2 p-4 text-sm">
                  <p className="font-semibold">Step 3</p>
                  <p>Payment Type: {draft.step3.paymentTerm.label}</p>
                  <p>Payment Detail: {draft.step3.paymentTerm.description}</p>
                  <p>Tax Included: {draft.step3.taxIncluded ? "Yes" : "No"}</p>
                </CardContent>
              </Card>
              {[draft.step4, draft.step5].map((stepData, index) => (
                <Card key={index}>
                  <CardContent className="space-y-2 p-4 text-sm">
                    <p className="font-semibold">Step {index + 4}</p>
                    <p>Primary: {stepData.primary}</p>
                    <p>Secondary: {stepData.secondary}</p>
                    <p>Tertiary: {stepData.tertiary}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <div className="mt-2 flex items-center justify-between gap-3">
            <Button
              variant="outline"
              onClick={() => router.push(`/purchase-orders/new/step-5/${draftId}`)}
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
        </div>
      )}
    </StepShell>
  )
}
