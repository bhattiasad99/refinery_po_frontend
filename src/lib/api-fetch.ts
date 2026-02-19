import "server-only"

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

async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = await getRefreshTokenCookie()
  if (!refreshToken) {
    return false
  }

  const response = await fetch(`${getGatewayBaseUrl()}/auth/refresh`, {
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

export async function apiFetch(path: string, options: FetchOptions = {}): Promise<Response> {
  const { retryOnUnauthorized = true, headers: originalHeaders, ...init } = options
  const headers = new Headers(originalHeaders)
  const accessToken = await getAccessTokenCookie()

  if (accessToken) {
    headers.set("authorization", `Bearer ${accessToken}`)
  }

  let response = await fetch(`${getGatewayBaseUrl()}${path}`, {
    ...init,
    headers,
    cache: "no-store",
  })

  if (response.status !== 401 || !retryOnUnauthorized) {
    return response
  }

  const refreshed = await refreshAccessToken()
  if (!refreshed) {
    return response
  }

  const retryHeaders = new Headers(originalHeaders)
  const retryToken = await getAccessTokenCookie()
  if (retryToken) {
    retryHeaders.set("authorization", `Bearer ${retryToken}`)
  }

  response = await fetch(`${getGatewayBaseUrl()}${path}`, {
    ...init,
    headers: retryHeaders,
    cache: "no-store",
  })

  return response
}
