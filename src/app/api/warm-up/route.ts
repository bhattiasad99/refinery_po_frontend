import { NextResponse } from "next/server"
import { getGatewayBaseUrl } from "@/lib/auth/constants"
import { buildGatewayUnavailablePayload } from "@/lib/gateway-unavailable"

type GatewayEnvelope<T> = {
  body?: T
  message?: string
}

type WarmUpSession = {
  id: string
  status: string
  createdAt: string
  statusUrl: string
  streamUrl: string
}

const GATEWAY_UNAVAILABLE_STATUSES = new Set([502, 503, 504])

export const dynamic = "force-dynamic"

export async function GET(): Promise<NextResponse> {
  try {
    const response = await fetch(`${getGatewayBaseUrl()}/warm-up`, {
      method: "GET",
      cache: "no-store",
    })

    if (GATEWAY_UNAVAILABLE_STATUSES.has(response.status)) {
      return NextResponse.json(buildGatewayUnavailablePayload(), { status: 503 })
    }

    const payload = (await response.json()) as GatewayEnvelope<WarmUpSession>
    if (!response.ok) {
      return NextResponse.json(
        {
          message: payload.message ?? "Failed to start warm-up",
          body: payload.body ?? null,
        },
        { status: response.status }
      )
    }

    return NextResponse.json(payload.body ?? null, { status: response.status })
  } catch {
    return NextResponse.json(buildGatewayUnavailablePayload(), { status: 503 })
  }
}
