"use client"

import {
  PAYMENT_TERM_OPTIONS,
  type PaymentMilestone,
  type PaymentTermOption,
  type PurchaseOrderLineItem,
  type StepOneData,
  type StepThreeData,
  type StepTwoData,
} from "./draft-api"

type PurchaseOrderLineItemApi = {
  id: string
  catalogItemId: string | null
  item: string | null
  supplier: string | null
  category: string | null
  description: string | null
  quantity: number | null
  unitPrice: number | null
  sortOrder: number
}

type PurchaseOrderMilestoneApi = {
  id: string
  label: string | null
  percentage: number | null
  dueInDays: number | null
  sortOrder: number
}

export type PurchaseOrderApiResponse = {
  id: string
  status: string
  requestedByDepartment: string | null
  requestedByUser: string | null
  budgetCode: string | null
  needByDate: string | null
  supplierName: string | null
  paymentTermId: string | null
  paymentTermLabel: string | null
  paymentTermDescription: string | null
  taxIncluded: boolean | null
  advancePercentage: number | null
  balanceDueInDays: number | null
  customTerms: string | null
  lineItems: PurchaseOrderLineItemApi[]
  milestones: PurchaseOrderMilestoneApi[]
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

function normalizeString(value: string | null | undefined): string {
  return typeof value === "string" ? value : ""
}

function normalizeNumber(value: number | null | undefined, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback
}

async function parseResponse<T>(response: Response, fallbackMessage: string): Promise<T> {
  let body: unknown
  try {
    body = await response.json()
  } catch {
    body = null
  }

  if (!response.ok) {
    const message =
      body && typeof body === "object" && "message" in body && typeof body.message === "string"
        ? body.message
        : fallbackMessage
    throw new Error(message)
  }

  return body as T
}

export async function createPurchaseOrder(payload: PurchaseOrderWritePayload): Promise<PurchaseOrderApiResponse> {
  const response = await fetch("/api/purchase-orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })
  return parseResponse<PurchaseOrderApiResponse>(response, "Failed to create purchase order")
}

export async function updatePurchaseOrder(
  purchaseOrderId: string,
  payload: PurchaseOrderWritePayload
): Promise<PurchaseOrderApiResponse> {
  const response = await fetch(`/api/purchase-orders/${encodeURIComponent(purchaseOrderId)}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })
  return parseResponse<PurchaseOrderApiResponse>(response, "Failed to update purchase order")
}

export async function getPurchaseOrder(purchaseOrderId: string): Promise<PurchaseOrderApiResponse> {
  const response = await fetch(`/api/purchase-orders/${encodeURIComponent(purchaseOrderId)}`)
  return parseResponse<PurchaseOrderApiResponse>(response, "Failed to fetch purchase order")
}

function resolvePaymentTermOption(purchaseOrder: PurchaseOrderApiResponse): PaymentTermOption {
  const paymentTermId = normalizeString(purchaseOrder.paymentTermId)
  const knownOption = PAYMENT_TERM_OPTIONS.find((option) => option.id === paymentTermId)
  if (knownOption) {
    return {
      ...knownOption,
      label: normalizeString(purchaseOrder.paymentTermLabel) || knownOption.label,
      description: normalizeString(purchaseOrder.paymentTermDescription) || knownOption.description,
    }
  }

  if ((purchaseOrder.milestones ?? []).length > 0) {
    return PAYMENT_TERM_OPTIONS.find((option) => option.id === "MILESTONE") ?? PAYMENT_TERM_OPTIONS[0]
  }
  if (normalizeString(purchaseOrder.customTerms)) {
    return PAYMENT_TERM_OPTIONS.find((option) => option.id === "CUSTOM") ?? PAYMENT_TERM_OPTIONS[0]
  }
  if (
    purchaseOrder.advancePercentage !== null ||
    purchaseOrder.balanceDueInDays !== null
  ) {
    return PAYMENT_TERM_OPTIONS.find((option) => option.id === "ADVANCE") ?? PAYMENT_TERM_OPTIONS[0]
  }

  return PAYMENT_TERM_OPTIONS.find((option) => option.id === "NET_30") ?? PAYMENT_TERM_OPTIONS[0]
}

export function mapPurchaseOrderToStepOne(purchaseOrder: PurchaseOrderApiResponse): StepOneData {
  return {
    requestedByDepartment: normalizeString(purchaseOrder.requestedByDepartment),
    requestedByUser: normalizeString(purchaseOrder.requestedByUser),
    budgetCode: normalizeString(purchaseOrder.budgetCode),
    needByDate: normalizeString(purchaseOrder.needByDate) || undefined,
  }
}

export function mapPurchaseOrderToStepTwo(purchaseOrder: PurchaseOrderApiResponse): StepTwoData {
  const items: PurchaseOrderLineItem[] = (purchaseOrder.lineItems ?? [])
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((item) => ({
      id: item.id,
      catalogItemId: normalizeString(item.catalogItemId),
      item: normalizeString(item.item),
      supplier: normalizeString(item.supplier),
      category: normalizeString(item.category),
      description: normalizeString(item.description),
      quantity: normalizeNumber(item.quantity),
      unitPrice: normalizeNumber(item.unitPrice),
    }))

  return {
    supplierName: normalizeString(purchaseOrder.supplierName),
    items,
  }
}

export function mapPurchaseOrderToStepThree(purchaseOrder: PurchaseOrderApiResponse): StepThreeData {
  const milestones: PaymentMilestone[] = (purchaseOrder.milestones ?? [])
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((milestone) => ({
      id: milestone.id,
      label: normalizeString(milestone.label),
      percentage: normalizeNumber(milestone.percentage),
      dueInDays: normalizeNumber(milestone.dueInDays),
    }))

  return {
    paymentTerm: resolvePaymentTermOption(purchaseOrder),
    taxIncluded: purchaseOrder.taxIncluded === true,
    advancePercentage: purchaseOrder.advancePercentage,
    balanceDueInDays: purchaseOrder.balanceDueInDays,
    customTerms: normalizeString(purchaseOrder.customTerms),
    milestones,
  }
}

export function buildStepOnePayload(values: StepOneData): PurchaseOrderWritePayload {
  return {
    step1: {
      requestedByDepartment: values.requestedByDepartment,
      requestedByUser: values.requestedByUser,
      budgetCode: values.budgetCode,
      needByDate: values.needByDate || null,
    },
  }
}

export function buildStepTwoPayload(values: StepTwoData): PurchaseOrderWritePayload {
  return {
    step2: {
      supplierName: values.supplierName || null,
      items: values.items.map((item) => ({
        id: item.id,
        catalogItemId: item.catalogItemId || null,
        item: item.item || null,
        supplier: item.supplier || null,
        category: item.category || null,
        description: item.description || null,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
    },
  }
}

export function buildStepThreePayload(values: StepThreeData): PurchaseOrderWritePayload {
  return {
    step3: {
      paymentTerm: {
        id: values.paymentTerm.id,
        label: values.paymentTerm.label,
        description: values.paymentTerm.description,
      },
      taxIncluded: values.taxIncluded,
      advancePercentage: values.advancePercentage,
      balanceDueInDays: values.balanceDueInDays,
      customTerms: values.customTerms || null,
      milestones: values.milestones.map((milestone) => ({
        id: milestone.id,
        label: milestone.label,
        percentage: milestone.percentage,
        dueInDays: milestone.dueInDays,
      })),
    },
  }
}
