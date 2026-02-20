import { NextRequest, NextResponse } from "next/server"
import { getGatewayBaseUrl } from "@/lib/auth/constants"
import { buildGatewayUnavailablePayload } from "@/lib/gateway-unavailable"

type GatewayEnvelope<T> = {
  body?: T
  message?: string
}

type WarmUpServiceStatus = "pending" | "warming" | "ready" | "failed" | "skipped"
type WarmUpJobStatus = "running" | "completed"

type WarmUpServiceResult = {
  serviceName: string
  target: string | null
  status: WarmUpServiceStatus
  httpStatus: number | null
  durationMs: number | null
  message: string
  startedAt: string | null
  completedAt: string | null
}

type WarmUpJob = {
  id: string
  status: WarmUpJobStatus
  createdAt: string
  updatedAt: string
  completedAt: string | null
  services: WarmUpServiceResult[]
}

type RouteContext = {
  params: Promise<{
    id: string
  }>
}

const GATEWAY_UNAVAILABLE_STATUSES = new Set([502, 503, 504])

export const dynamic = "force-dynamic"

export async function GET(_request: NextRequest, context: RouteContext): Promise<NextResponse> {
  try {
    const { id } = await context.params
    const response = await fetch(`${getGatewayBaseUrl()}/warm-up/status/${encodeURIComponent(id)}`, {
      method: "GET",
      cache: "no-store",
    })

    if (GATEWAY_UNAVAILABLE_STATUSES.has(response.status)) {
      return NextResponse.json(buildGatewayUnavailablePayload(), { status: 503 })
    }

    const payload = (await response.json()) as GatewayEnvelope<WarmUpJob>
    if (!response.ok) {
      return NextResponse.json(
        {
          message: payload.message ?? "Failed to fetch warm-up status",
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
