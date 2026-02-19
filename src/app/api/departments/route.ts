import { NextResponse } from "next/server"
import { apiFetch } from "@/lib/api-fetch"
import { handleApiRouteError } from "@/lib/api-route-error"

type GatewayResponse<T> = {
  body?: T
  message?: string
}

export async function GET(): Promise<NextResponse> {
  try {
    const response = await apiFetch("/departments")
    const gatewayPayload = (await response.json()) as GatewayResponse<unknown>
    const body = gatewayPayload.body ?? null

    if (!response.ok) {
      return NextResponse.json(
        {
          message: gatewayPayload.message ?? "Failed to fetch departments",
          body,
        },
        { status: response.status }
      )
    }

    return NextResponse.json(body, { status: response.status })
  } catch (error) {
    return handleApiRouteError(error, "Failed to fetch departments")
  }
}
