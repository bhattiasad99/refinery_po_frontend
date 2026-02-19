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

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const accessToken = request.cookies.get(ACCESS_COOKIE_NAME)?.value

  if (pathname === "/login" && accessToken) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  if (isProtectedPath(pathname) && !accessToken) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next|favicon.ico|.*\\..*).*)"],
}
