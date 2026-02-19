import { NextRequest, NextResponse } from "next/server"
import { apiFetch } from "@/lib/api-fetch"

type GatewayResponse<T> = {
  body?: T
  message?: string
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const payload = await request.json()
    const response = await apiFetch("/purchase-orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    const gatewayPayload = (await response.json()) as GatewayResponse<unknown>
    const body = gatewayPayload.body ?? null

    if (!response.ok) {
      return NextResponse.json(
        {
          message: gatewayPayload.message ?? "Failed to create purchase order",
          body,
        },
        { status: response.status }
      )
    }

    return NextResponse.json(body, { status: response.status })
  } catch {
    return NextResponse.json({ message: "Failed to create purchase order" }, { status: 500 })
  }
}
