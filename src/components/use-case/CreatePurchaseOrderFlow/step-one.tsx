"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import {
  createDraft,
  getActiveDraftId,
  getDraft,
  updateDraftStep,
} from "./draft-api"
import { StepShell } from "./step-shell"

type CreatePurchaseOrderStepOneProps = {
  initialDraftId?: string
}

export default function CreatePurchaseOrderStepOne({
  initialDraftId,
}: CreatePurchaseOrderStepOneProps) {
  const router = useRouter()

  const [supplierName, setSupplierName] = useState("")
  const [requestedBy, setRequestedBy] = useState("")
  const [department, setDepartment] = useState("")
  const [isLoadingDraft, setIsLoadingDraft] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const loadExistingDraft = async () => {
      const draftId = initialDraftId ?? getActiveDraftId() ?? undefined
      if (!draftId) {
        setIsLoadingDraft(false)
        return
      }

      const existingDraft = await getDraft(draftId)
      if (existingDraft) {
        setSupplierName(existingDraft.step1.supplierName)
        setRequestedBy(existingDraft.step1.requestedBy)
        setDepartment(existingDraft.step1.department)
      }

      setIsLoadingDraft(false)
    }

    loadExistingDraft()
  }, [initialDraftId])

  const onNext = async () => {
    setIsSubmitting(true)

    const draftId = initialDraftId ?? getActiveDraftId() ?? undefined
    const step1Payload = {
      supplierName,
      requestedBy,
      department,
    }

    if (draftId) {
      const updatedDraft = await updateDraftStep(draftId, "step1", step1Payload)
      if (updatedDraft) {
        router.push(`/purchase-orders/new/step-2/${updatedDraft.id}`)
        return
      }
    }

    const createdDraft = await createDraft(step1Payload)
    router.push(`/purchase-orders/new/step-2/${createdDraft.id}`)
  }

  const isFormValid =
    supplierName.trim().length > 0 &&
    requestedBy.trim().length > 0 &&
    department.trim().length > 0

  return (
    <StepShell
      title="Basic Request Information"
      description="Step 1 captures the core request details before you move to subsequent pages."
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="supplier-name">Supplier Name</Label>
          <Input
            id="supplier-name"
            placeholder="e.g. Alpha Industrial Supplies"
            value={supplierName}
            onChange={(event) => setSupplierName(event.target.value)}
            disabled={isLoadingDraft}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="requested-by">Requested By</Label>
          <Input
            id="requested-by"
            placeholder="e.g. Procurement Dept"
            value={requestedBy}
            onChange={(event) => setRequestedBy(event.target.value)}
            disabled={isLoadingDraft}
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="department">Department</Label>
          <Input
            id="department"
            placeholder="e.g. Plant Operations"
            value={department}
            onChange={(event) => setDepartment(event.target.value)}
            disabled={isLoadingDraft}
          />
        </div>
      </div>

      <div className="mt-6 flex items-center justify-end gap-3">
        <Button onClick={onNext} disabled={!isFormValid || isSubmitting || isLoadingDraft}>
          {isSubmitting ? "Saving..." : "Next"}
        </Button>
      </div>
    </StepShell>
  )
}
