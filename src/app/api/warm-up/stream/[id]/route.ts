import { NextRequest, NextResponse } from "next/server"
import { getGatewayBaseUrl } from "@/lib/auth/constants"
import { buildGatewayUnavailablePayload } from "@/lib/gateway-unavailable"

type RouteContext = {
  params: Promise<{
    id: string
  }>
}

const GATEWAY_UNAVAILABLE_STATUSES = new Set([502, 503, 504])

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest, context: RouteContext): Promise<Response> {
  try {
    const { id } = await context.params
    const upstream = await fetch(`${getGatewayBaseUrl()}/warm-up/stream/${encodeURIComponent(id)}`, {
      method: "GET",
      headers: {
        accept: request.headers.get("accept") ?? "text/event-stream",
      },
      cache: "no-store",
    })

    if (GATEWAY_UNAVAILABLE_STATUSES.has(upstream.status)) {
      return NextResponse.json(buildGatewayUnavailablePayload(), { status: 503 })
    }

    if (!upstream.ok || !upstream.body) {
      let payload: unknown = null
      try {
        payload = await upstream.json()
      } catch {
        payload = null
      }

      return NextResponse.json(
        {
          message: "Failed to stream warm-up status",
          body: payload,
        },
        { status: upstream.status || 500 }
      )
    }

    const headers = new Headers()
    headers.set("Content-Type", "text/event-stream")
    headers.set("Cache-Control", "no-cache, no-transform")
    headers.set("Connection", "keep-alive")

    return new Response(upstream.body, {
      status: upstream.status,
      headers,
    })
  } catch {
    return NextResponse.json(buildGatewayUnavailablePayload(), { status: 503 })
  }
}
