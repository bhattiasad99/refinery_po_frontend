"use client"

import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

type PurchaseOrderStatus = "draft" | "submitted" | "approved" | "rejected" | "fulfilled"

type StatusActionButtonsProps = {
  purchaseOrderId: string
  status: PurchaseOrderStatus
}

type ActionConfig = {
  label: string
  endpoint: "submit" | "approve" | "reject" | "fulfill"
  variant: "secondary" | "destructive"
  className?: string
}

async function runStatusAction(
  purchaseOrderId: string,
  endpoint: ActionConfig["endpoint"],
): Promise<void> {
  const response = await fetch(`/api/purchase-orders/${encodeURIComponent(purchaseOrderId)}/${endpoint}`, {
    method: "POST",
  })

  let body: unknown = null
  try {
    body = await response.json()
  } catch {
    body = null
  }

  if (!response.ok) {
    const message =
      body && typeof body === "object" && "message" in body && typeof body.message === "string"
        ? body.message
        : "Failed to update purchase order status"
    throw new Error(message)
  }
}

function getActions(status: PurchaseOrderStatus): ActionConfig[] {
  if (status === "draft") {
    return [
      { label: "Submit", endpoint: "submit", variant: "secondary", className: "bg-emerald-600 text-white hover:bg-emerald-700" },
    ]
  }
  if (status === "submitted") {
    return [
      { label: "Approve", endpoint: "approve", variant: "secondary", className: "bg-emerald-600 text-white hover:bg-emerald-700" },
      { label: "Reject", endpoint: "reject", variant: "destructive" },
    ]
  }
  if (status === "approved") {
    return [
      { label: "Fulfill", endpoint: "fulfill", variant: "secondary", className: "bg-emerald-600 text-white hover:bg-emerald-700" },
    ]
  }

  return []
}

export default function StatusActionButtons({ purchaseOrderId, status }: StatusActionButtonsProps) {
  const router = useRouter()
  const [isPending, setIsPending] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const actions = getActions(status)

  if (status === "rejected" || status === "fulfilled") {
    return null
  }

  const onActionClick = async (action: ActionConfig) => {
    if (isPending) {
      return
    }

    setIsPending(true)
    setErrorMessage(null)
    try {
      await runStatusAction(purchaseOrderId, action.endpoint)
      router.refresh()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to update purchase order status")
      setIsPending(false)
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {status === "draft" ? (
        <Button
          asChild
          size="sm"
          variant="secondary"
          className="bg-white/15 text-white hover:bg-white/25"
          disabled={isPending}
        >
          <Link href={`/purchase-orders/${purchaseOrderId}/edit`}>Edit</Link>
        </Button>
      ) : null}
      {actions.map((action) => (
        <Button
          key={action.label}
          size="sm"
          variant={action.variant}
          className={action.className}
          disabled={isPending}
          onClick={() => {
            void onActionClick(action)
          }}
        >
          {isPending ? "Saving..." : action.label}
        </Button>
      ))}
      {errorMessage ? <p className="w-full text-xs text-rose-200">{errorMessage}</p> : null}
    </div>
  )
}
