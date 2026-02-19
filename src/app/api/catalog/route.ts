import { NextRequest, NextResponse } from "next/server"
import { apiFetch } from "@/lib/api-fetch"

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
    const limit = Math.min(parsePositiveInteger(searchParams.get("limit"), 20), 200)
    const offset = (page - 1) * limit

    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      offset: String(offset),
    })

    const search = searchParams.get("search")?.trim()
    const category = searchParams.get("category")?.trim()

    if (search) {
      params.set("search", search)
    }
    if (category) {
      params.set("category", category)
    }

    const response = await apiFetch(`/catalog?${params.toString()}`)
    const gatewayPayload = (await response.json()) as GatewayResponse<unknown>
    const body = gatewayPayload.body ?? null

    if (!response.ok) {
      return NextResponse.json(
        {
          message: gatewayPayload.message ?? "Failed to fetch catalog items",
          body,
        },
        { status: response.status }
      )
    }

    return NextResponse.json(body, { status: response.status })
  } catch {
    return NextResponse.json({ message: "Failed to fetch catalog items" }, { status: 500 })
  }
}
