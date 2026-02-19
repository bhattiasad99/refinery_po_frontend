export const GATEWAY_UNAVAILABLE_CODE = "GATEWAY_UNAVAILABLE"

type GatewayUnavailablePayload = {
  message: string
  code: typeof GATEWAY_UNAVAILABLE_CODE
  shouldLogout: true
}

export function buildGatewayUnavailablePayload(): GatewayUnavailablePayload {
  return {
    message: "API gateway is unavailable. Please sign in again once backend is back online.",
    code: GATEWAY_UNAVAILABLE_CODE,
    shouldLogout: true,
  }
}

export function isGatewayUnavailablePayload(value: unknown): boolean {
  if (!value || typeof value !== "object") {
    return false
  }

  const candidate = value as Record<string, unknown>
  return (
    candidate.code === GATEWAY_UNAVAILABLE_CODE ||
    candidate.shouldLogout === true
  )
}
