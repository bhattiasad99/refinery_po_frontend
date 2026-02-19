"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"

import SearchableDropdown, {
  type SearchableDropdownOption,
} from "@/components/common/SearchableDropdown"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  buildStepOnePayload,
  createPurchaseOrder,
  getPurchaseOrder,
  mapPurchaseOrderToStepOne,
  updatePurchaseOrder,
} from "./purchase-order-client"
import { useCreatePurchaseOrderReferenceData } from "./reference-data-context"

import { StepShell } from "./step-shell"

type CreatePurchaseOrderStepOneProps = {
  initialDraftId?: string | null
}

export default function CreatePurchaseOrderStepOne({
  initialDraftId = null,
}: CreatePurchaseOrderStepOneProps) {
  const router = useRouter()
  const draftId = initialDraftId?.trim() || null
  const referenceData = useCreatePurchaseOrderReferenceData()

  const [requestedByDepartment, setRequestedByDepartment] = useState("")
  const [requestedByUser, setRequestedByUser] = useState("")
  const [budgetCode, setBudgetCode] = useState("")
  const [needByDate, setNeedByDate] = useState("")
  const [isLoadingDraft, setIsLoadingDraft] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    const loadDraft = async () => {
      if (!draftId) {
        setErrorMessage(null)
        return
      }

      setIsLoadingDraft(true)
      setErrorMessage(null)

      try {
        const purchaseOrder = await getPurchaseOrder(draftId)
        const stepOne = mapPurchaseOrderToStepOne(purchaseOrder)
        if (!isMounted) return

        setRequestedByDepartment(stepOne.requestedByDepartment)
        setRequestedByUser(stepOne.requestedByUser)
        setBudgetCode(stepOne.budgetCode)
        setNeedByDate(stepOne.needByDate ?? "")
      } catch (error) {
        if (!isMounted) return
        setErrorMessage(error instanceof Error ? error.message : "Failed to load purchase order")
      } finally {
        if (isMounted) {
          setIsLoadingDraft(false)
        }
      }
    }

    loadDraft()
    return () => {
      isMounted = false
    }
  }, [draftId])

  const departmentOptions: SearchableDropdownOption[] = useMemo(
    () =>
      referenceData.departments.map((department) => ({
        label: department.name,
        value: department.name,
      })),
    [referenceData.departments]
  )

  const userOptions: SearchableDropdownOption[] = useMemo(() => {
    const usersInDepartment = requestedByDepartment
      ? referenceData.usersByDepartment[requestedByDepartment] ?? []
      : referenceData.users

    const options = usersInDepartment.map((user) => ({
      label: user.email,
      value: user.email,
    }))

    if (!requestedByUser) {
      return options
    }

    if (options.some((option) => option.value === requestedByUser)) {
      return options
    }

    return [{ label: requestedByUser, value: requestedByUser }, ...options]
  }, [referenceData.users, referenceData.usersByDepartment, requestedByDepartment, requestedByUser])

  const budgetCodeOptions: SearchableDropdownOption[] = [
    { label: "CC-1234", value: "CC-1234" },
    { label: "CC-2314", value: "CC-2314" },
    { label: "CC-4420", value: "CC-4420" },
    { label: "CC-9901", value: "CC-9901" },
    { label: "CC-7603", value: "CC-7603" },
  ]

  const today = new Date()
  const minNeedByDate = `${today.getFullYear()}-${String(
    today.getMonth() + 1
  ).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`

  const onNext = async () => {
    if (isLoadingDraft || isSubmitting) {
      return
    }

    setIsSubmitting(true)
    setErrorMessage(null)

    try {
      const payload = buildStepOnePayload({
        requestedByDepartment,
        requestedByUser,
        budgetCode,
        needByDate: needByDate || undefined,
      })

      const saved = draftId
        ? await updatePurchaseOrder(draftId, payload)
        : await createPurchaseOrder(payload)

      router.push(`/purchase-orders/new/step-2/${saved.id}`)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to save step 1")
      setIsSubmitting(false)
    }
  }

  const hasReferenceData =
    departmentOptions.length > 0 && userOptions.length > 0

  const isFormValid =
    requestedByDepartment.trim().length > 0 &&
    requestedByUser.trim().length > 0 &&
    budgetCode.trim().length > 0 &&
    hasReferenceData

  return (
    <StepShell
      title="Basic Request Information"
      description="Step 1 captures who is requesting this purchase order."
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="requested-by-department">Requested By (Department)</Label>
          <SearchableDropdown
            id="requested-by-department"
            value={requestedByDepartment}
            onChange={setRequestedByDepartment}
            options={departmentOptions}
            placeholder="Select department"
            searchPlaceholder="Search department..."
            disabled={isLoadingDraft || departmentOptions.length === 0}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="requested-by-user">Requested By (User Name)</Label>
          <SearchableDropdown
            id="requested-by-user"
            value={requestedByUser}
            onChange={setRequestedByUser}
            options={userOptions}
            placeholder="Select user"
            searchPlaceholder="Search user..."
            disabled={isLoadingDraft || userOptions.length === 0}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="budget-code">Budget Code</Label>
          <SearchableDropdown
            id="budget-code"
            value={budgetCode}
            onChange={setBudgetCode}
            options={budgetCodeOptions}
            placeholder="Select budget code"
            searchPlaceholder="Search budget code..."
            disabled={isLoadingDraft}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="need-by-date">Need By Date (Optional)</Label>
          <Input
            id="need-by-date"
            type="date"
            min={minNeedByDate}
            value={needByDate}
            onChange={(event) => setNeedByDate(event.target.value)}
            disabled={isLoadingDraft}
          />
        </div>
      </div>

      {referenceData.errorMessage ? (
        <p className="mt-4 text-sm font-medium text-red-600">{referenceData.errorMessage}</p>
      ) : null}
      {errorMessage ? <p className="mt-4 text-sm font-medium text-red-600">{errorMessage}</p> : null}

      <div className="mt-6 flex items-center justify-end gap-3">
        <Button onClick={onNext} disabled={!isFormValid || isSubmitting || isLoadingDraft}>
          {isSubmitting ? "Saving..." : "Next"}
        </Button>
      </div>
    </StepShell>
  )
}
