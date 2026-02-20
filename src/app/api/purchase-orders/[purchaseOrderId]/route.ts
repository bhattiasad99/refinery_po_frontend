import { NextRequest, NextResponse } from "next/server"
import { apiFetch } from "@/lib/api-fetch"
import { handleApiRouteError } from "@/lib/api-route-error"

type GatewayResponse<T> = {
  body?: T
  message?: string
}

type PurchaseOrderLookupRow = {
  poNumber?: string | null
}

type RouteContext = {
  params: Promise<{
    purchaseOrderId: string
  }>
}

export async function GET(_request: NextRequest, context: RouteContext): Promise<NextResponse> {
  try {
    const { purchaseOrderId } = await context.params
    const encodedId = encodeURIComponent(purchaseOrderId)
    const response = await apiFetch(`/purchase-orders/${encodedId}`)
    const gatewayPayload = (await response.json()) as GatewayResponse<unknown>
    const body = gatewayPayload.body ?? null

    if (response.status === 404) {
      const listResponse = await apiFetch("/purchase-orders")
      const listPayload = (await listResponse.json()) as GatewayResponse<unknown>
      const listBody = listPayload.body ?? []

      if (listResponse.ok && Array.isArray(listBody)) {
        const matchedPurchaseOrder = listBody.find((row) => {
          if (!row || typeof row !== "object") {
            return false
          }
          const candidate = row as PurchaseOrderLookupRow
          return (
            typeof candidate.poNumber === "string" &&
            candidate.poNumber.trim().toLowerCase() === purchaseOrderId.trim().toLowerCase()
          )
        })

        if (matchedPurchaseOrder) {
          return NextResponse.json(matchedPurchaseOrder, { status: 200 })
        }
      }
    }

    if (!response.ok) {
      return NextResponse.json(
        {
          message: gatewayPayload.message ?? "Failed to fetch purchase order",
          body,
        },
        { status: response.status }
      )
    }

    return NextResponse.json(body, { status: response.status })
  } catch (error) {
    return handleApiRouteError(error, "Failed to fetch purchase order")
  }
}

export async function PUT(request: NextRequest, context: RouteContext): Promise<NextResponse> {
  try {
    const { purchaseOrderId } = await context.params
    const payload = await request.json()
    const idempotencyKey = request.headers.get("idempotency-key")?.trim() ?? ""
    const response = await apiFetch(`/purchase-orders/${encodeURIComponent(purchaseOrderId)}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
      },
      body: JSON.stringify(payload),
    })

    const gatewayPayload = (await response.json()) as GatewayResponse<unknown>
    const body = gatewayPayload.body ?? null

    if (!response.ok) {
      return NextResponse.json(
        {
          message: gatewayPayload.message ?? "Failed to update purchase order",
          body,
        },
        { status: response.status }
      )
    }

    return NextResponse.json(body, { status: response.status })
  } catch (error) {
    return handleApiRouteError(error, "Failed to update purchase order")
  }
}
