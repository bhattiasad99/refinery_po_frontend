import { describe, expect, it } from "vitest"
import { buildPurchaseOrderIdempotencyKey } from "@/lib/idempotency/purchase-order-idempotency"

describe("buildPurchaseOrderIdempotencyKey", () => {
  it("uses the operation and purchase order id in key format", () => {
    const key = buildPurchaseOrderIdempotencyKey("update", "po-123")

    expect(key.startsWith("po:update:po-123:")).toBe(true)
  })

  it("uses new resource marker when purchase order id is missing", () => {
    const key = buildPurchaseOrderIdempotencyKey("create")

    expect(key.startsWith("po:create:new:")).toBe(true)
  })

  it("returns a unique key for each call", () => {
    const first = buildPurchaseOrderIdempotencyKey("submit", "po-111")
    const second = buildPurchaseOrderIdempotencyKey("submit", "po-111")

    expect(first).not.toBe(second)
  })
})
