import "server-only"

import { cookies } from "next/headers"
import { ACCESS_COOKIE_NAME, REFRESH_COOKIE_NAME } from "./constants"

const IS_PRODUCTION = process.env.NODE_ENV === "production"

function parseCookieValueFromSetCookie(setCookie: string, cookieName: string): string | null {
  const parts = setCookie.split(";")
  const [name, ...rest] = (parts[0] || "").split("=")
  if (name?.trim() !== cookieName) {
    return null
  }
  return decodeURIComponent(rest.join("="))
}

export function extractRefreshFromGateway(setCookieHeader: string | null): string | null {
  if (!setCookieHeader) {
    return null
  }

  const cookieCandidates = setCookieHeader.split(/,(?=\s*\w+=)/)
  for (const cookieLine of cookieCandidates) {
    const value = parseCookieValueFromSetCookie(cookieLine.trim(), REFRESH_COOKIE_NAME)
    if (value) {
      return value
    }
  }

  return null
}

export function extractRefreshFromGatewaySetCookieList(setCookieHeaders: string[]): string | null {
  for (const header of setCookieHeaders) {
    const value = parseCookieValueFromSetCookie(header, REFRESH_COOKIE_NAME)
    if (value) {
      return value
    }
  }
  return null
}

export async function setAccessTokenCookie(token: string): Promise<void> {
  const store = await cookies()
  store.set(ACCESS_COOKIE_NAME, token, {
    httpOnly: true,
    secure: IS_PRODUCTION,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10,
  })
}

export async function setRefreshTokenCookie(token: string, maxAgeSeconds = 60 * 60 * 24 * 30): Promise<void> {
  const store = await cookies()
  store.set(REFRESH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: IS_PRODUCTION,
    sameSite: "lax",
    path: "/",
    maxAge: maxAgeSeconds,
  })
}

export async function getAccessTokenCookie(): Promise<string> {
  const store = await cookies()
  return store.get(ACCESS_COOKIE_NAME)?.value || ""
}

export async function getRefreshTokenCookie(): Promise<string> {
  const store = await cookies()
  return store.get(REFRESH_COOKIE_NAME)?.value || ""
}

export async function clearAuthCookies(): Promise<void> {
  const store = await cookies()
  store.delete(ACCESS_COOKIE_NAME)
  store.delete(REFRESH_COOKIE_NAME)
}
