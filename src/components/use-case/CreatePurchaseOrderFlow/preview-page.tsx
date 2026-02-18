"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { CircleCheckBig } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

import { getDraft, submitDraft, type PurchaseOrderDraft } from "./draft-api"
import { StepShell } from "./step-shell"

type CreatePurchaseOrderPreviewProps = {
  draftId: string
}

export default function CreatePurchaseOrderPreview({
  draftId,
}: CreatePurchaseOrderPreviewProps) {
  const router = useRouter()

  const [draft, setDraft] = useState<PurchaseOrderDraft | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const loadDraft = async () => {
      const existingDraft = await getDraft(draftId)
      setDraft(existingDraft)
      setIsLoading(false)
    }

    loadDraft()
  }, [draftId])

  const onSubmit = async () => {
    setIsSubmitting(true)

    await submitDraft(draftId)
    router.push("/purchase-orders")
    router.refresh()
  }

  if (!isLoading && !draft) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-lg font-semibold">Draft not found</p>
          <p className="text-muted-foreground mt-1 text-sm">
            This draft is unavailable. Start a new purchase order.
          </p>
        </CardContent>
      </Card>
    )
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
                  <p>Supplier: {draft.step1.supplierName}</p>
                  <p>Requested By: {draft.step1.requestedBy}</p>
                  <p>Department: {draft.step1.department}</p>
                </CardContent>
              </Card>

              {[draft.step2, draft.step3, draft.step4, draft.step5].map((stepData, index) => (
                <Card key={index}>
                  <CardContent className="space-y-2 p-4 text-sm">
                    <p className="font-semibold">Step {index + 2}</p>
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
