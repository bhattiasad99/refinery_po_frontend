import { handleGatewayUnavailableLogout } from "@/lib/client-session"

type ApiErrorPayload = {
  message?: string
}

type ApiRequestOptions = Omit<RequestInit, "body"> & {
  body?: BodyInit | null | Record<string, unknown>
  fallbackErrorMessage?: string
}

export class ApiError extends Error {
  status: number
  body: unknown

  constructor(message: string, status: number, body: unknown) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.body = body
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function shouldSerializeJsonBody(body: ApiRequestOptions["body"]): body is Record<string, unknown> {
  if (!isPlainObject(body)) {
    return false
  }

  return !(body instanceof FormData) && !(body instanceof URLSearchParams)
}

async function parseResponseBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") ?? ""
  if (contentType.includes("application/json")) {
    try {
      return await response.json()
    } catch {
      return null
    }
  }

  try {
    const text = await response.text()
    return text.length > 0 ? text : null
  } catch {
    return null
  }
}

function resolveErrorMessage(payload: unknown, fallbackErrorMessage: string): string {
  if (
    payload &&
    typeof payload === "object" &&
    "message" in payload &&
    typeof (payload as ApiErrorPayload).message === "string"
  ) {
    return (payload as ApiErrorPayload).message as string
  }

  return fallbackErrorMessage
}

async function request<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { body, fallbackErrorMessage = "Request failed", headers: originalHeaders, ...init } = options
  const headers = new Headers(originalHeaders)

  let requestBody: BodyInit | null | undefined = body
  if (shouldSerializeJsonBody(body)) {
    requestBody = JSON.stringify(body)
    if (!headers.has("content-type")) {
      headers.set("content-type", "application/json")
    }
  }

  const response = await fetch(path, {
    ...init,
    body: requestBody,
    headers,
    credentials: init.credentials ?? "include",
  })

  const payload = await parseResponseBody(response)
  if (typeof window !== "undefined" && handleGatewayUnavailableLogout(response.status, payload)) {
    throw new Error("Session ended because API gateway is unavailable.")
  }

  if (!response.ok) {
    throw new ApiError(
      resolveErrorMessage(payload, fallbackErrorMessage),
      response.status,
      payload
    )
  }

  return payload as T
}

export function apiGet<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  return request<T>(path, { ...options, method: "GET" })
}

export function apiPost<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  return request<T>(path, { ...options, method: "POST" })
}

export function apiPut<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  return request<T>(path, { ...options, method: "PUT" })
}
