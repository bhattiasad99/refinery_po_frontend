"use client"

import { type FocusEvent, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  PAYMENT_TERM_OPTIONS,
  type PaymentMilestone,
  type StepThreeData,
} from "./draft-api"
import {
  buildStepThreePayload,
  getPurchaseOrder,
  mapPurchaseOrderToStepThree,
  updatePurchaseOrder,
} from "./purchase-order-client"
import { StepShell } from "./step-shell"

type CreatePurchaseOrderStepThreeProps = {
  draftId: string
}

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
})

const emptyStepThreeData = (): StepThreeData => ({
  paymentTerm: PAYMENT_TERM_OPTIONS.find((option) => option.id === "NET_30")!,
  taxIncluded: false,
  advancePercentage: null,
  balanceDueInDays: null,
  customTerms: "",
  milestones: [],
})

const defaultPaymentTerm =
  PAYMENT_TERM_OPTIONS.find((option) => option.id === "NET_30") ??
  PAYMENT_TERM_OPTIONS[0]

const selectAllOnFocus = (event: FocusEvent<HTMLInputElement>) => {
  event.currentTarget.select()
}

const createMilestone = (index: number): PaymentMilestone => ({
  id: crypto.randomUUID(),
  label: `Milestone ${index + 1}`,
  percentage: 0,
  dueInDays: 0,
})

export default function CreatePurchaseOrderStepThree({
  draftId,
}: CreatePurchaseOrderStepThreeProps) {
  const router = useRouter()

  const [values, setValues] = useState<StepThreeData>(emptyStepThreeData())
  const [itemSubtotal, setItemSubtotal] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    const loadPageData = async () => {
      setIsLoading(true)
      setErrorMessage(null)

      try {
        const purchaseOrder = await getPurchaseOrder(draftId)
        if (!isMounted) return

        setValues(mapPurchaseOrderToStepThree(purchaseOrder))
        const nextSubtotal = (purchaseOrder.lineItems ?? []).reduce(
          (runningTotal, item) => runningTotal + (item.quantity ?? 0) * (item.unitPrice ?? 0),
          0
        )
        setItemSubtotal(nextSubtotal)
      } catch (error) {
        if (!isMounted) return
        setValues(emptyStepThreeData())
        setItemSubtotal(0)
        setErrorMessage(error instanceof Error ? error.message : "Failed to load step 3")
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

  const safePaymentTerm = values.paymentTerm ?? defaultPaymentTerm

  const milestonePercentageTotal = useMemo(
    () =>
      values.milestones.reduce(
        (runningTotal, milestone) => runningTotal + milestone.percentage,
        0
      ),
    [values.milestones]
  )

  const validationMessage = useMemo(() => {
    if (safePaymentTerm.id === "ADVANCE") {
      if (values.advancePercentage === null) return "Advance percentage is required."
      if (values.advancePercentage <= 0 || values.advancePercentage >= 100) {
        return "Advance percentage must be between 1 and 99."
      }
      if (values.balanceDueInDays === null || values.balanceDueInDays < 0) {
        return "Balance due days must be 0 or greater."
      }
    }

    if (safePaymentTerm.id === "MILESTONE") {
      if (values.milestones.length === 0) return "Add at least one milestone."

      const hasInvalidMilestone = values.milestones.some(
        (milestone) =>
          milestone.label.trim().length === 0 ||
          milestone.percentage <= 0 ||
          milestone.dueInDays < 0
      )
      if (hasInvalidMilestone) return "All milestones must have valid values."
      if (milestonePercentageTotal !== 100) return "Milestone percentages must total 100%."
    }

    if (safePaymentTerm.id === "CUSTOM" && values.customTerms.trim().length === 0) {
      return "Custom terms are required."
    }

    return null
  }, [milestonePercentageTotal, safePaymentTerm.id, values])

  const isValid = validationMessage === null

  const onAddMilestone = () => {
    setValues((previous) => ({
      ...previous,
      milestones: [...previous.milestones, createMilestone(previous.milestones.length)],
    }))
  }

  const onRemoveMilestone = (id: string) => {
    setValues((previous) => ({
      ...previous,
      milestones: previous.milestones.filter((milestone) => milestone.id !== id),
    }))
  }

  const onUpdateMilestone = (
    id: string,
    key: "label" | "percentage" | "dueInDays",
    value: string
  ) => {
    setValues((previous) => ({
      ...previous,
      milestones: previous.milestones.map((milestone) => {
        if (milestone.id !== id) return milestone

        if (key === "label") return { ...milestone, label: value }
        if (key === "percentage") return { ...milestone, percentage: Number(value) }
        return { ...milestone, dueInDays: Number(value) }
      }),
    }))
  }

  const onNext = async () => {
    if (!isValid) return
    if (isLoading || isSubmitting) return

    setIsSubmitting(true)
    setErrorMessage(null)

    try {
      await updatePurchaseOrder(draftId, buildStepThreePayload(values))
      router.push(`/purchase-orders/new/preview/${draftId}`)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to save step 3")
      setIsSubmitting(false)
    }
  }

  const onBack = () => {
    router.push(`/purchase-orders/new/step-2/${draftId}`)
  }

  return (
    <StepShell
      title="Payment Terms"
      description="Define how this purchase order will be settled."
    >
      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-4 md:col-span-2">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="payment-term-type">Payment Term Type</Label>
              <Select
                value={safePaymentTerm.id}
                onValueChange={(value) =>
                  setValues((previous) => ({
                    ...previous,
                    paymentTerm:
                      PAYMENT_TERM_OPTIONS.find((option) => option.id === value) ??
                      PAYMENT_TERM_OPTIONS[1],
                  }))
                }
              >
                <SelectTrigger id="payment-term-type" className="w-full">
                  <SelectValue placeholder="Select payment term" />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_TERM_OPTIONS.map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-muted-foreground text-xs">
                {safePaymentTerm.description}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tax-included">Tax Included</Label>
            <Select
              value={values.taxIncluded ? "YES" : "NO"}
              onValueChange={(value) =>
                setValues((previous) => ({
                  ...previous,
                  taxIncluded: value === "YES",
                }))
              }
            >
              <SelectTrigger id="tax-included" className="w-full md:w-[220px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="YES">Yes</SelectItem>
                <SelectItem value="NO">No</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {safePaymentTerm.id === "ADVANCE" ? (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="advance-percentage">Advance Percentage</Label>
                <Input
                  id="advance-percentage"
                  type="number"
                  min={1}
                  max={99}
                  value={values.advancePercentage ?? ""}
                  onFocus={selectAllOnFocus}
                  onChange={(event) =>
                    setValues((previous) => ({
                      ...previous,
                      advancePercentage:
                        event.target.value === "" ? null : Number(event.target.value),
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="balance-due-days">Balance Due In (Days)</Label>
                <Input
                  id="balance-due-days"
                  type="number"
                  min={0}
                  value={values.balanceDueInDays ?? ""}
                  onFocus={selectAllOnFocus}
                  onChange={(event) =>
                    setValues((previous) => ({
                      ...previous,
                      balanceDueInDays:
                        event.target.value === "" ? null : Number(event.target.value),
                    }))
                  }
                />
              </div>
            </div>
          ) : null}

          {safePaymentTerm.id === "MILESTONE" ? (
            <div className="space-y-3 rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <p className="font-semibold">Milestones</p>
                <Button type="button" variant="outline" onClick={onAddMilestone}>
                  Add Milestone
                </Button>
              </div>
              {values.milestones.map((milestone) => (
                <div key={milestone.id} className="grid gap-2 rounded-md border p-3 md:grid-cols-4">
                  <div className="space-y-1">
                    <Label htmlFor={`milestone-label-${milestone.id}`}>Milestone Label</Label>
                    <Input
                      id={`milestone-label-${milestone.id}`}
                      placeholder="eg. Delivery Completed"
                      value={milestone.label}
                      onChange={(event) =>
                        onUpdateMilestone(milestone.id, "label", event.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor={`milestone-percentage-${milestone.id}`}>Percentage (%)</Label>
                    <Input
                      id={`milestone-percentage-${milestone.id}`}
                      type="number"
                      min={1}
                      max={100}
                      placeholder="eg. 40"
                      value={milestone.percentage}
                      onFocus={selectAllOnFocus}
                      onChange={(event) =>
                        onUpdateMilestone(milestone.id, "percentage", event.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor={`milestone-days-${milestone.id}`}>Due In (Days)</Label>
                    <Input
                      id={`milestone-days-${milestone.id}`}
                      type="number"
                      min={0}
                      placeholder="eg. 30"
                      value={milestone.dueInDays}
                      onFocus={selectAllOnFocus}
                      onChange={(event) =>
                        onUpdateMilestone(milestone.id, "dueInDays", event.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor={`milestone-remove-${milestone.id}`}>Actions</Label>
                    <Button
                      id={`milestone-remove-${milestone.id}`}
                      type="button"
                      variant="outline"
                      onClick={() => onRemoveMilestone(milestone.id)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
              <p className="text-muted-foreground text-sm">
                Milestone Total: {milestonePercentageTotal}%
              </p>
            </div>
          ) : null}

          {safePaymentTerm.id === "CUSTOM" ? (
            <div className="space-y-2">
              <Label htmlFor="custom-terms">Custom Terms</Label>
              <textarea
                id="custom-terms"
                className="border-input w-full rounded-md border p-3 text-sm"
                rows={4}
                value={values.customTerms}
                onChange={(event) =>
                  setValues((previous) => ({
                    ...previous,
                    customTerms: event.target.value,
                  }))
                }
              />
            </div>
          ) : null}

          {validationMessage ? (
            <p className="text-sm font-medium text-red-600">{validationMessage}</p>
          ) : null}
        </div>

        <Card className="h-fit">
          <CardContent className="space-y-2 p-4 text-sm">
            <p className="font-semibold">Payment Summary</p>
            <p>
              Item Subtotal:{" "}
              <span className="font-semibold">{currencyFormatter.format(itemSubtotal)}</span>
            </p>
            <p>Payment Type: {safePaymentTerm.label}</p>
            <p>Tax Included: {values.taxIncluded ? "Yes" : "No"}</p>
            {safePaymentTerm.id === "MILESTONE" ? (
              <p>Milestone Total: {milestonePercentageTotal}%</p>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 flex items-center justify-between gap-3">
        <Button variant="outline" onClick={onBack} disabled={isSubmitting || isLoading}>
          Back
        </Button>
        <Button onClick={onNext} disabled={!isValid || isSubmitting || isLoading}>
          {isSubmitting ? "Saving..." : "Next"}
        </Button>
      </div>
      {errorMessage ? <p className="mt-3 text-sm font-medium text-red-600">{errorMessage}</p> : null}
    </StepShell>
  )
}
