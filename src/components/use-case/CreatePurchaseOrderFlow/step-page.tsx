"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import { getDraft, type GenericStepData, updateDraftStep } from "./draft-api"
import { StepShell } from "./step-shell"

type StepNumber = 2 | 3 | 4 | 5

type CreatePurchaseOrderGenericStepProps = {
  step: StepNumber
  draftId: string
}

const STEP_CONFIG: Record<
  StepNumber,
  {
    title: string
    description: string
    fields: {
      label: string
      placeholder: string
      key: keyof GenericStepData
    }[]
  }
> = {
  2: {
    title: "Commercial Details",
    description: "Add make-believe commercial metadata for this draft.",
    fields: [
      { key: "primary", label: "Budget Code", placeholder: "BUD-2026-OPS" },
      { key: "secondary", label: "Cost Center", placeholder: "CC-1107" },
      { key: "tertiary", label: "Payment Terms", placeholder: "Net 30" },
    ],
  },
  3: {
    title: "Delivery Planning",
    description: "Capture simple delivery-related fields for now.",
    fields: [
      { key: "primary", label: "Delivery Window", placeholder: "Week 3, March" },
      { key: "secondary", label: "Delivery Location", placeholder: "Main Warehouse" },
      { key: "tertiary", label: "Transport Mode", placeholder: "Ground Freight" },
    ],
  },
  4: {
    title: "Compliance Inputs",
    description: "Use these placeholders for compliance and policy checks.",
    fields: [
      { key: "primary", label: "Compliance Type", placeholder: "Standard Procurement" },
      { key: "secondary", label: "Risk Flag", placeholder: "Low" },
      { key: "tertiary", label: "Document Ref", placeholder: "DOC-REF-001" },
    ],
  },
  5: {
    title: "Final Notes",
    description: "Add final placeholders before preview and submission.",
    fields: [
      { key: "primary", label: "Approver Group", placeholder: "Operations Managers" },
      { key: "secondary", label: "Internal Note", placeholder: "Urgent for maintenance run" },
      { key: "tertiary", label: "Vendor Note", placeholder: "Deliver in split lots" },
    ],
  },
}

export default function CreatePurchaseOrderGenericStep({
  step,
  draftId,
}: CreatePurchaseOrderGenericStepProps) {
  const router = useRouter()
  const config = STEP_CONFIG[step]

  const [values, setValues] = useState<GenericStepData>({
    primary: "",
    secondary: "",
    tertiary: "",
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    const loadDraft = async () => {
      setIsLoading(true)
      const draft = await getDraft(draftId)
      if (!draft) {
        setNotFound(true)
        setIsLoading(false)
        return
      }

      const stepKey = `step${step}` as "step2" | "step3" | "step4" | "step5"
      setValues(draft[stepKey])
      setIsLoading(false)
    }

    loadDraft()
  }, [draftId, step])

  const onNext = async () => {
    setIsSubmitting(true)

    const stepKey = `step${step}` as "step2" | "step3" | "step4" | "step5"
    const updated = await updateDraftStep(draftId, stepKey, values)

    if (!updated) {
      setNotFound(true)
      setIsSubmitting(false)
      return
    }

    if (step === 5) {
      router.push(`/purchase-orders/new/preview/${draftId}`)
      return
    }

    router.push(`/purchase-orders/new/step-${step + 1}/${draftId}`)
  }

  const onBack = () => {
    if (step === 2) {
      router.push(`/purchase-orders/new?draftId=${draftId}`)
      return
    }

    router.push(`/purchase-orders/new/step-${step - 1}/${draftId}`)
  }

  const isValid = useMemo(
    () =>
      values.primary.trim().length > 0 &&
      values.secondary.trim().length > 0 &&
      values.tertiary.trim().length > 0,
    [values]
  )

  if (notFound) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-lg font-semibold">Draft not found</p>
          <p className="text-muted-foreground mt-1 text-sm">
            This draft is no longer available. Start a new purchase order.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <StepShell title={config.title} description={config.description}>
      <div className="grid gap-4 md:grid-cols-2">
        {config.fields.map((field, index) => (
          <div
            key={field.key}
            className={index === 2 ? "space-y-2 md:col-span-2" : "space-y-2"}
          >
            <Label htmlFor={field.key}>{field.label}</Label>
            <Input
              id={field.key}
              value={values[field.key]}
              onChange={(event) =>
                setValues((previous) => ({
                  ...previous,
                  [field.key]: event.target.value,
                }))
              }
              placeholder={field.placeholder}
              disabled={isLoading}
            />
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between gap-3">
        <Button variant="outline" onClick={onBack} disabled={isSubmitting || isLoading}>
          Back
        </Button>
        <Button onClick={onNext} disabled={!isValid || isSubmitting || isLoading}>
          {isSubmitting ? "Saving..." : "Next"}
        </Button>
      </div>
    </StepShell>
  )
}
