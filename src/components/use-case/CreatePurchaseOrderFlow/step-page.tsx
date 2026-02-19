"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import { type GenericStepData } from "./draft-api"
import { StepShell } from "./step-shell"

type StepNumber = 4 | 5

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
  const [isLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const onNext = async () => {
    setIsSubmitting(true)

    if (step === 5) {
      router.push(`/purchase-orders/new/preview/${draftId}`)
      return
    }

    router.push(`/purchase-orders/new/step-${step + 1}/${draftId}`)
  }

  const onBack = () => {
    router.push(`/purchase-orders/new/step-${step - 1}/${draftId}`)
  }

  const isValid = useMemo(
    () =>
      values.primary.trim().length > 0 &&
      values.secondary.trim().length > 0 &&
      values.tertiary.trim().length > 0,
    [values]
  )

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
