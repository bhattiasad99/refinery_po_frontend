"use client"

import { createContext, useContext, useMemo, useReducer } from "react"

import { createSeedState } from "@/lib/mock-data/seed"
import { setMockRuntimeApi } from "@/lib/mock-data/runtime"
import type {
  CatalogItemRecord,
  DepartmentRecord,
  PurchaseOrderLineItemRecord,
  PurchaseOrderMilestoneRecord,
  PurchaseOrderRecord,
  PurchaseOrderStatusHistoryRecord,
  UserRecord,
} from "@/lib/mock-data/types"

type MockAppState = {
  departments: DepartmentRecord[]
  users: UserRecord[]
  catalogItems: CatalogItemRecord[]
  purchaseOrders: PurchaseOrderRecord[]
}

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

type MockAppContextValue = {
  state: MockAppState
  usersByDepartment: Record<string, UserRecord[]>
  catalogBySupplier: Record<string, CatalogItemRecord[]>
  createPurchaseOrder: (payload: PurchaseOrderWritePayload) => PurchaseOrderRecord
  updatePurchaseOrder: (id: string, payload: PurchaseOrderWritePayload) => PurchaseOrderRecord
  getPurchaseOrder: (id: string) => PurchaseOrderRecord
  getCatalogItem: (id: string) => CatalogItemRecord | null
  transitionPurchaseOrderStatus: (
    id: string,
    action: "submit" | "approve" | "reject" | "fulfill"
  ) => PurchaseOrderRecord
  resetDemoData: () => void
}

type Action =
  | { type: "create_po"; payload: PurchaseOrderRecord }
  | { type: "replace_po"; payload: PurchaseOrderRecord }
  | { type: "reset" }

const initialState = createSeedState()

const MockAppContext = createContext<MockAppContextValue | null>(null)

function reducer(state: MockAppState, action: Action): MockAppState {
  if (action.type === "create_po") {
    return {
      ...state,
      purchaseOrders: [action.payload, ...state.purchaseOrders],
    }
  }

  if (action.type === "replace_po") {
    return {
      ...state,
      purchaseOrders: state.purchaseOrders.map((purchaseOrder) =>
        purchaseOrder.id === action.payload.id ? action.payload : purchaseOrder
      ),
    }
  }

  return createSeedState()
}

function buildRecordId(prefix: string, count: number): string {
  return `${prefix}-${String(count).padStart(4, "0")}`
}

function cloneLineItems(items: PurchaseOrderRecord["lineItems"]): PurchaseOrderLineItemRecord[] {
  return items.map((item) => ({ ...item }))
}

function cloneMilestones(items: PurchaseOrderRecord["milestones"]): PurchaseOrderMilestoneRecord[] {
  return items.map((item) => ({ ...item }))
}

function cloneHistory(items: PurchaseOrderRecord["statusHistory"]): PurchaseOrderStatusHistoryRecord[] {
  return items.map((item) => ({ ...item }))
}

function mergePurchaseOrder(
  existing: PurchaseOrderRecord,
  payload: PurchaseOrderWritePayload
): PurchaseOrderRecord {
  const now = new Date().toISOString()
  const nextLineItems =
    payload.step2?.items?.map((item, index) => ({
      id: item.id ?? buildRecordId(`${existing.id}-L`, index + 1),
      catalogItemId: item.catalogItemId ?? null,
      item: item.item ?? null,
      supplier: item.supplier ?? null,
      category: item.category ?? null,
      description: item.description ?? null,
      quantity: item.quantity ?? 0,
      unitPrice: item.unitPrice ?? 0,
      sortOrder: index,
    })) ?? cloneLineItems(existing.lineItems)

  const nextMilestones =
    payload.step3?.milestones?.map((milestone, index) => ({
      id: milestone.id ?? buildRecordId(`${existing.id}-M`, index + 1),
      label: milestone.label ?? null,
      percentage: milestone.percentage ?? 0,
      dueInDays: milestone.dueInDays ?? 0,
      sortOrder: index,
    })) ?? cloneMilestones(existing.milestones)

  return {
    ...existing,
    updatedAt: now,
    requestedByDepartment:
      payload.step1?.requestedByDepartment ?? existing.requestedByDepartment,
    requestedByUser: payload.step1?.requestedByUser ?? existing.requestedByUser,
    budgetCode: payload.step1?.budgetCode ?? existing.budgetCode,
    needByDate:
      payload.step1?.needByDate === undefined ? existing.needByDate : payload.step1.needByDate,
    supplierName: payload.step2?.supplierName ?? existing.supplierName,
    paymentTermId: payload.step3?.paymentTerm?.id ?? existing.paymentTermId,
    paymentTermLabel: payload.step3?.paymentTerm?.label ?? existing.paymentTermLabel,
    paymentTermDescription:
      payload.step3?.paymentTerm?.description ?? existing.paymentTermDescription,
    taxIncluded:
      payload.step3?.taxIncluded === undefined ? existing.taxIncluded : payload.step3.taxIncluded,
    advancePercentage:
      payload.step3?.advancePercentage === undefined
        ? existing.advancePercentage
        : payload.step3.advancePercentage,
    balanceDueInDays:
      payload.step3?.balanceDueInDays === undefined
        ? existing.balanceDueInDays
        : payload.step3.balanceDueInDays,
    customTerms:
      payload.step3?.customTerms === undefined ? existing.customTerms : payload.step3.customTerms,
    lineItems: nextLineItems,
    milestones: nextMilestones,
  }
}

function createDraftPurchaseOrder(
  state: MockAppState,
  payload: PurchaseOrderWritePayload
): PurchaseOrderRecord {
  const now = new Date().toISOString()
  const id = `PO-${String(1000 + state.purchaseOrders.length + 1)}`
  const lineItems =
    payload.step2?.items?.map((item, index) => ({
      id: item.id ?? buildRecordId(`${id}-L`, index + 1),
      catalogItemId: item.catalogItemId ?? null,
      item: item.item ?? null,
      supplier: item.supplier ?? null,
      category: item.category ?? null,
      description: item.description ?? null,
      quantity: item.quantity ?? 0,
      unitPrice: item.unitPrice ?? 0,
      sortOrder: index,
    })) ?? []
  const milestones =
    payload.step3?.milestones?.map((milestone, index) => ({
      id: milestone.id ?? buildRecordId(`${id}-M`, index + 1),
      label: milestone.label ?? null,
      percentage: milestone.percentage ?? 0,
      dueInDays: milestone.dueInDays ?? 0,
      sortOrder: index,
    })) ?? []

  return {
    id,
    status: "DRAFT",
    createdAt: now,
    updatedAt: now,
    submittedAt: null,
    submittedBy: null,
    approvedAt: null,
    approvedBy: null,
    rejectedAt: null,
    rejectedBy: null,
    fulfilledAt: null,
    fulfilledBy: null,
    requestedByDepartment: payload.step1?.requestedByDepartment ?? null,
    requestedByUser: payload.step1?.requestedByUser ?? null,
    budgetCode: payload.step1?.budgetCode ?? null,
    needByDate: payload.step1?.needByDate ?? null,
    supplierName: payload.step2?.supplierName ?? null,
    paymentTermId: payload.step3?.paymentTerm?.id ?? "NET_30",
    paymentTermLabel: payload.step3?.paymentTerm?.label ?? "Net 30",
    paymentTermDescription:
      payload.step3?.paymentTerm?.description ??
      "Full payment is due within 30 days after invoice date.",
    taxIncluded: payload.step3?.taxIncluded ?? false,
    advancePercentage: payload.step3?.advancePercentage ?? null,
    balanceDueInDays: payload.step3?.balanceDueInDays ?? null,
    customTerms: payload.step3?.customTerms ?? null,
    lineItems,
    milestones,
    statusHistory: [],
  }
}

function assertSupplierIntegrity(items: PurchaseOrderLineItemRecord[]): void {
  const suppliers = new Set(
    items.map((item) => item.supplier).filter((supplier): supplier is string => Boolean(supplier))
  )
  if (suppliers.size > 1) {
    throw new Error("All items in a PO must come from the same supplier")
  }
}

function buildStatusTransition(
  purchaseOrder: PurchaseOrderRecord,
  action: "submit" | "approve" | "reject" | "fulfill"
): PurchaseOrderRecord {
  const allowed =
    (action === "submit" && purchaseOrder.status === "DRAFT") ||
    (action === "approve" && purchaseOrder.status === "SUBMITTED") ||
    (action === "reject" && purchaseOrder.status === "SUBMITTED") ||
    (action === "fulfill" && purchaseOrder.status === "APPROVED")

  if (!allowed) {
    throw new Error("Status transition is not allowed for this purchase order")
  }

  if (action === "submit" && purchaseOrder.lineItems.length === 0) {
    throw new Error("Add at least one item before submitting this purchase order")
  }

  const now = new Date().toISOString()
  const actor = purchaseOrder.requestedByUser ?? "demo@refinery.com"
  const nextStatus =
    action === "submit"
      ? "SUBMITTED"
      : action === "approve"
        ? "APPROVED"
        : action === "reject"
          ? "REJECTED"
          : "FULFILLED"

  const historyEntry: PurchaseOrderStatusHistoryRecord = {
    id: `${purchaseOrder.id}-H${purchaseOrder.statusHistory.length + 1}`,
    fromStatus: purchaseOrder.status === "DRAFT" ? null : purchaseOrder.status,
    toStatus: nextStatus,
    changedBy: actor,
    changedAt: now,
  }

  return {
    ...purchaseOrder,
    status: nextStatus,
    updatedAt: now,
    submittedAt: action === "submit" ? now : purchaseOrder.submittedAt,
    submittedBy: action === "submit" ? actor : purchaseOrder.submittedBy,
    approvedAt: action === "approve" ? now : purchaseOrder.approvedAt,
    approvedBy: action === "approve" ? actor : purchaseOrder.approvedBy,
    rejectedAt: action === "reject" ? now : purchaseOrder.rejectedAt,
    rejectedBy: action === "reject" ? actor : purchaseOrder.rejectedBy,
    fulfilledAt: action === "fulfill" ? now : purchaseOrder.fulfilledAt,
    fulfilledBy: action === "fulfill" ? actor : purchaseOrder.fulfilledBy,
    statusHistory: [...cloneHistory(purchaseOrder.statusHistory), historyEntry],
  }
}

export function MockAppDataProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)

  const value = useMemo<MockAppContextValue>(() => {
    const usersByDepartment = state.users.reduce<Record<string, UserRecord[]>>((accumulator, user) => {
      const department = state.departments.find((item) => item.id === user.departmentId)
      const key = department?.name ?? user.departmentId
      accumulator[key] = accumulator[key] ?? []
      accumulator[key].push(user)
      return accumulator
    }, {})

    const catalogBySupplier = state.catalogItems.reduce<Record<string, CatalogItemRecord[]>>(
      (accumulator, item) => {
        accumulator[item.supplierName] = accumulator[item.supplierName] ?? []
        accumulator[item.supplierName].push(item)
        return accumulator
      },
      {}
    )

    return {
      state,
      usersByDepartment,
      catalogBySupplier,
      createPurchaseOrder: (payload) => {
        const nextPurchaseOrder = createDraftPurchaseOrder(state, payload)
        assertSupplierIntegrity(nextPurchaseOrder.lineItems)
        dispatch({ type: "create_po", payload: nextPurchaseOrder })
        return nextPurchaseOrder
      },
      updatePurchaseOrder: (id, payload) => {
        const existing = state.purchaseOrders.find((purchaseOrder) => purchaseOrder.id === id)
        if (!existing) {
          throw new Error("Purchase order not found")
        }
        const nextPurchaseOrder = mergePurchaseOrder(existing, payload)
        assertSupplierIntegrity(nextPurchaseOrder.lineItems)
        dispatch({ type: "replace_po", payload: nextPurchaseOrder })
        return nextPurchaseOrder
      },
      getPurchaseOrder: (id) => {
        const purchaseOrder = state.purchaseOrders.find((entry) => entry.id === id)
        if (!purchaseOrder) {
          throw new Error("Purchase order not found")
        }
        return purchaseOrder
      },
      transitionPurchaseOrderStatus: (id, action) => {
        const purchaseOrder = state.purchaseOrders.find((entry) => entry.id === id)
        if (!purchaseOrder) {
          throw new Error("Purchase order not found")
        }
        const nextPurchaseOrder = buildStatusTransition(purchaseOrder, action)
        dispatch({ type: "replace_po", payload: nextPurchaseOrder })
        return nextPurchaseOrder
      },
      getCatalogItem: (id) => state.catalogItems.find((item) => item.id === id) ?? null,
      resetDemoData: () => dispatch({ type: "reset" }),
    }
  }, [state])

  setMockRuntimeApi({
    createPurchaseOrder: value.createPurchaseOrder,
    updatePurchaseOrder: value.updatePurchaseOrder,
    getPurchaseOrder: value.getPurchaseOrder,
    transitionPurchaseOrderStatus: value.transitionPurchaseOrderStatus,
    getCatalogItem: value.getCatalogItem,
  })

  return <MockAppContext.Provider value={value}>{children}</MockAppContext.Provider>
}

export function useMockAppData(): MockAppContextValue {
  const context = useContext(MockAppContext)
  if (!context) {
    throw new Error("useMockAppData must be used inside MockAppDataProvider")
  }

  return context
}
