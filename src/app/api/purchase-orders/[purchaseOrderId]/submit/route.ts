import { NextResponse } from "next/server"
import { apiFetch } from "@/lib/api-fetch"

type GatewayResponse<T> = {
  body?: T
  message?: string
}

type RouteContext = {
  params: Promise<{
    purchaseOrderId: string
  }>
}

export async function POST(_request: Request, context: RouteContext): Promise<NextResponse> {
  try {
    const { purchaseOrderId } = await context.params
    const response = await apiFetch(`/purchase-orders/${encodeURIComponent(purchaseOrderId)}/submit`, {
      method: "POST",
    })

    const gatewayPayload = (await response.json()) as GatewayResponse<unknown>
    const body = gatewayPayload.body ?? null

    if (!response.ok) {
      return NextResponse.json(
        {
          message: gatewayPayload.message ?? "Failed to submit purchase order",
          body,
        },
        { status: response.status }
      )
    }

    return NextResponse.json(body, { status: response.status })
  } catch {
    return NextResponse.json({ message: "Failed to submit purchase order" }, { status: 500 })
  }
}
