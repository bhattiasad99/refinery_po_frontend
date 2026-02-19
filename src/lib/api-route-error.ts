import "server-only"

import { NextResponse } from "next/server"
import { clearAuthCookies } from "@/lib/auth/server-auth"
import { isGatewayUnavailableError } from "@/lib/api-fetch"
import { buildGatewayUnavailablePayload } from "@/lib/gateway-unavailable"

export async function handleApiRouteError(
  error: unknown,
  fallbackMessage: string
): Promise<NextResponse> {
  if (isGatewayUnavailableError(error)) {
    await clearAuthCookies()
    return NextResponse.json(buildGatewayUnavailablePayload(), { status: 503 })
  }

  return NextResponse.json({ message: fallbackMessage }, { status: 500 })
}
