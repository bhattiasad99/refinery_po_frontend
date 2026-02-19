import { isGatewayUnavailablePayload } from "@/lib/gateway-unavailable"

export function handleGatewayUnavailableLogout(status: number, payload: unknown): boolean {
  if (status !== 503 || !isGatewayUnavailablePayload(payload)) {
    return false
  }

  window.location.assign("/login?error=server_unavailable")
  return true
}
