"use server"

import { redirect } from "next/navigation"
import {
  clearAuthCookies,
  extractRefreshFromGateway,
  extractRefreshFromGatewaySetCookieList,
  getRefreshTokenCookie,
  setAccessTokenCookie,
  setRefreshTokenCookie,
} from "@/lib/auth/server-auth"
import { getGatewayBaseUrl, REFRESH_COOKIE_NAME } from "@/lib/auth/constants"

type GatewaySuccess<T> = {
  error: boolean
  body: T
  message: string
}

type LoginState = {
  error: string | null
}

function getSafeContinuePath(rawValue: FormDataEntryValue | null): string {
  const value = typeof rawValue === "string" ? rawValue.trim() : ""
  if (!value.startsWith("/")) {
    return "/dashboard"
  }
  if (value.startsWith("//")) {
    return "/dashboard"
  }
  return value
}

async function parseGatewayResponse<T>(response: Response): Promise<GatewaySuccess<T>> {
  const data = (await response.json()) as GatewaySuccess<T>
  return data
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function getSetCookieHeaders(response: Response): string[] {
  const headersWithList = response.headers as Headers & { getSetCookie?: () => string[] }
  if (typeof headersWithList.getSetCookie === "function") {
    return headersWithList.getSetCookie()
  }

  const merged = response.headers.get("set-cookie")
  return merged ? [merged] : []
}

export async function loginAction(_prevState: { error: string | null }, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") || "").trim()
  const password = String(formData.get("password") || "")
  const continuePath = getSafeContinuePath(formData.get("continue"))

  if (!email || !password) {
    return { error: "Email and password are required." }
  }

  if (!isValidEmail(email)) {
    return { error: "Enter a valid email address." }
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." }
  }

  let response: Response
  try {
    response = await fetch(`${getGatewayBaseUrl()}/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password }),
      cache: "no-store",
    })
  } catch {
    return { error: "Cannot reach API gateway. Check backend is running." }
  }

  let parsed: GatewaySuccess<Record<string, unknown>> | null = null
  try {
    parsed = await parseGatewayResponse<Record<string, unknown>>(response)
  } catch {
    return { error: "Login failed due to invalid server response." }
  }

  if (!response.ok) {
    return { error: parsed.message || "Login failed. Check credentials." }
  }

  const body = parsed.body || {}
  const accessToken =
    typeof body.accessToken === "string" && body.accessToken ? body.accessToken : null

  const setCookieHeaders = getSetCookieHeaders(response)
  const refreshToken =
    extractRefreshFromGatewaySetCookieList(setCookieHeaders) ||
    extractRefreshFromGateway(response.headers.get("set-cookie"))

  if (!accessToken) {
    const legacyAuthenticated = body.authenticated === true
    if (legacyAuthenticated) {
      return {
        error:
          "Gateway is still running old auth code (no access token issued). Restart API gateway service.",
      }
    }
    return { error: "Login succeeded but access token was missing." }
  }

  if (!refreshToken) {
    return {
      error:
        "Login succeeded but refresh cookie was missing. Restart API gateway and verify AUTH_COOKIE_NAME=rt.",
    }
  }

  await setAccessTokenCookie(accessToken)
  await setRefreshTokenCookie(refreshToken)

  redirect(continuePath)
}

export async function logoutAction(): Promise<void> {
  const refreshToken = await getRefreshTokenCookie()

  const response = await fetch(`${getGatewayBaseUrl()}/auth/logout`, {
    method: "POST",
    headers: refreshToken
      ? {
        cookie: `${REFRESH_COOKIE_NAME}=${encodeURIComponent(refreshToken)}`,
      }
      : undefined,
    cache: "no-store",
  })

  await clearAuthCookies()

  if (!response.ok) {
    redirect("/login?error=logout_failed")
  }

  redirect("/login")
}
