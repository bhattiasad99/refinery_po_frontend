export type PurchaseOrderMutationAction =
  | "create"
  | "update"
  | "submit"
  | "approve"
  | "reject"
  | "fulfill"

function generateNonce(): string {
  const randomUuid = globalThis.crypto?.randomUUID?.()
  if (randomUuid) {
    return randomUuid
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function buildPurchaseOrderIdempotencyKey(
  action: PurchaseOrderMutationAction,
  purchaseOrderId?: string
): string {
  const normalizedPurchaseOrderId = purchaseOrderId?.trim() || "new"
  return `po:${action}:${normalizedPurchaseOrderId}:${generateNonce()}`
}
