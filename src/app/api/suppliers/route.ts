import { NextRequest, NextResponse } from "next/server"
import { apiFetch } from "@/lib/api-fetch"
import { handleApiRouteError } from "@/lib/api-route-error"

type GatewayResponse<T> = {
  body?: T
  message?: string
}

function parsePositiveInteger(value: string | null, fallback: number): number {
  if (!value) {
    return fallback
  }

  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback
  }

  return Math.floor(parsed)
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = parsePositiveInteger(searchParams.get("page"), 1)
    const limit = Math.min(parsePositiveInteger(searchParams.get("limit"), 10), 100)
    const offset = (page - 1) * limit
    const search = searchParams.get("search")?.trim()

    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      offset: String(offset),
    })

    if (search) {
      params.set("search", search)
    }

    const response = await apiFetch(`/catalog/suppliers?${params.toString()}`)
    const gatewayPayload = (await response.json()) as GatewayResponse<unknown>
    const body = gatewayPayload.body ?? null

    if (!response.ok) {
      return NextResponse.json(
        {
          message: gatewayPayload.message ?? "Failed to fetch suppliers",
          body,
        },
        { status: response.status }
      )
    }

    return NextResponse.json(body, { status: response.status })
  } catch (error) {
    return handleApiRouteError(error, "Failed to fetch suppliers")
  }
}
