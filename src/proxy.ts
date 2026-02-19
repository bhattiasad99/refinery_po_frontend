import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { ACCESS_COOKIE_NAME } from "@/lib/auth/constants"

const PROTECTED_PREFIXES = [
  "/",
  "/dashboard",
  "/catalog",
  "/purchase-orders",
  "/suppliers",
  "/settings",
]

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((prefix) => {
    if (prefix === "/") {
      return pathname === "/"
    }
    return pathname === prefix || pathname.startsWith(`${prefix}/`)
  })
}

function getSafeContinuePath(pathname: string, search: string): string | null {
  const combinedPath = `${pathname}${search || ""}`
  if (!combinedPath.startsWith("/")) {
    return null
  }
  if (combinedPath.startsWith("//")) {
    return null
  }
  return combinedPath
}

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const accessToken = request.cookies.get(ACCESS_COOKIE_NAME)?.value

  if (pathname === "/login" && accessToken) {
    const requestedContinue = request.nextUrl.searchParams.get("continue")
    const continuePath =
      requestedContinue && requestedContinue.startsWith("/") && !requestedContinue.startsWith("//")
        ? requestedContinue
        : "/dashboard"
    return NextResponse.redirect(new URL(continuePath, request.url))
  }

  if (isProtectedPath(pathname) && !accessToken) {
    const loginUrl = new URL("/login", request.url)
    const continuePath = getSafeContinuePath(pathname, request.nextUrl.search)
    if (continuePath) {
      loginUrl.searchParams.set("continue", continuePath)
    }
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next|favicon.ico|.*\\..*).*)"],
}
