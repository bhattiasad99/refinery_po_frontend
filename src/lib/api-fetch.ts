import "server-only"

import { redirect } from "next/navigation"
import { clearAuthCookies, extractRefreshFromGateway, getAccessTokenCookie, getRefreshTokenCookie, setAccessTokenCookie, setRefreshTokenCookie } from "@/lib/auth/server-auth"
import { getGatewayBaseUrl, REFRESH_COOKIE_NAME } from "@/lib/auth/constants"

type GatewaySuccess<T> = {
  error: boolean
  body: T
  message: string
}

type FetchOptions = RequestInit & {
  retryOnUnauthorized?: boolean
}

const GATEWAY_UNAVAILABLE_STATUSES = new Set([502, 503, 504])

export class GatewayUnavailableError extends Error {
  constructor(message = "API gateway is unavailable.") {
    super(message)
    this.name = "GatewayUnavailableError"
  }
}

export function isGatewayUnavailableError(error: unknown): error is GatewayUnavailableError {
  return error instanceof GatewayUnavailableError
}

function isGatewayUnavailableStatus(status: number): boolean {
  return GATEWAY_UNAVAILABLE_STATUSES.has(status)
}

async function gatewayFetch(path: string, init: RequestInit): Promise<Response> {
  try {
    const response = await fetch(`${getGatewayBaseUrl()}${path}`, init)
    if (isGatewayUnavailableStatus(response.status)) {
      throw new GatewayUnavailableError()
    }
    return response
  } catch (error) {
    if (isGatewayUnavailableError(error)) {
      throw error
    }
    throw new GatewayUnavailableError()
  }
}

async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = await getRefreshTokenCookie()
  if (!refreshToken) {
    return false
  }

  const response = await gatewayFetch("/auth/refresh", {
    method: "POST",
    headers: {
      cookie: `${REFRESH_COOKIE_NAME}=${encodeURIComponent(refreshToken)}`,
    },
    cache: "no-store",
  })

  if (!response.ok) {
    await clearAuthCookies()
    return false
  }

  const parsed = (await response.json()) as GatewaySuccess<{ accessToken: string }>
  const accessToken = parsed.body?.accessToken
  const rotatedRefreshToken = extractRefreshFromGateway(response.headers.get("set-cookie"))
  if (!accessToken || !rotatedRefreshToken) {
    await clearAuthCookies()
    return false
  }

  await setAccessTokenCookie(accessToken)
  await setRefreshTokenCookie(rotatedRefreshToken)
  return true
}

async function bestEffortLogoutAndClearCookies(): Promise<void> {
  const refreshToken = await getRefreshTokenCookie()

  try {
    await fetch(`${getGatewayBaseUrl()}/auth/logout`, {
      method: "POST",
      headers: refreshToken
        ? {
          cookie: `${REFRESH_COOKIE_NAME}=${encodeURIComponent(refreshToken)}`,
        }
        : undefined,
      cache: "no-store",
    })
  } catch {
    // Ignore network failures; local cookie clearing is still required.
  }

  await clearAuthCookies()
}

export async function apiFetch(path: string, options: FetchOptions = {}): Promise<Response> {
  const { retryOnUnauthorized = true, headers: originalHeaders, ...init } = options
  const headers = new Headers(originalHeaders)
  const accessToken = await getAccessTokenCookie()

  if (accessToken) {
    headers.set("authorization", `Bearer ${accessToken}`)
  }

  let response = await gatewayFetch(path, {
    ...init,
    headers,
    cache: "no-store",
  })

  if (response.status !== 401 || !retryOnUnauthorized) {
    return response
  }

  const refreshed = await refreshAccessToken()
  if (!refreshed) {
    await bestEffortLogoutAndClearCookies()
    redirect("/login")
  }

  const retryHeaders = new Headers(originalHeaders)
  const retryToken = await getAccessTokenCookie()
  if (retryToken) {
    retryHeaders.set("authorization", `Bearer ${retryToken}`)
  }

  response = await gatewayFetch(path, {
    ...init,
    headers: retryHeaders,
    cache: "no-store",
  })

  if (response.status === 401) {
    await bestEffortLogoutAndClearCookies()
    redirect("/login")
  }

  return response
}
