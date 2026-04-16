import type { CatalogItemRecord, PurchaseOrderRecord } from "@/lib/mock-data/types"

type PurchaseOrderWritePayload = {
  step1?: {
    requestedByDepartment?: string | null
    requestedByUser?: string | null
    budgetCode?: string | null
    needByDate?: string | null
  } | null
  step2?: {
    supplierName?: string | null
    items?: Array<{
      id?: string
      catalogItemId?: string | null
      item?: string | null
      supplier?: string | null
      category?: string | null
      description?: string | null
      quantity?: number | null
      unitPrice?: number | null
    }> | null
  } | null
  step3?: {
    paymentTerm?: {
      id?: string | null
      label?: string | null
      description?: string | null
    } | null
    taxIncluded?: boolean | null
    advancePercentage?: number | null
    balanceDueInDays?: number | null
    customTerms?: string | null
    milestones?: Array<{
      id?: string
      label?: string | null
      percentage?: number | null
      dueInDays?: number | null
    }> | null
  } | null
}

export type MockRuntimeApi = {
  createPurchaseOrder: (payload: PurchaseOrderWritePayload) => PurchaseOrderRecord
  updatePurchaseOrder: (id: string, payload: PurchaseOrderWritePayload) => PurchaseOrderRecord
  getPurchaseOrder: (id: string) => PurchaseOrderRecord
  transitionPurchaseOrderStatus: (
    id: string,
    action: "submit" | "approve" | "reject" | "fulfill"
  ) => PurchaseOrderRecord
  getCatalogItem: (id: string) => CatalogItemRecord | null
}

let runtimeApi: MockRuntimeApi | null = null

export function setMockRuntimeApi(api: MockRuntimeApi): void {
  runtimeApi = api
}

export function getMockRuntimeApi(): MockRuntimeApi {
  if (!runtimeApi) {
    throw new Error("Mock app runtime is not ready")
  }
  return runtimeApi
}
