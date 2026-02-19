export const ACCESS_COOKIE_NAME = "at"
export const REFRESH_COOKIE_NAME = "rt"

export function getGatewayBaseUrl(): string {
  return process.env.API_GATEWAY_URL?.trim() || "http://localhost:8000"
}
