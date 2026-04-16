export type DepartmentRecord = {
  id: string
  name: string
  description: string
}

export type UserRecord = {
  id: string
  email: string
  departmentId: string
}

export type CatalogItemRecord = {
  id: string
  name: string
  categoryName: string
  supplierName: string
  manufacturer: string
  model: string
  description: string
  leadTimeDays: number
  priceUsd: number
  inStock: boolean
  compatibleWith: string[] | null
  createdBy: string
  [key: string]: string | number | boolean | string[] | null
}

export type PurchaseOrderLineItemRecord = {
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

export type PurchaseOrderMilestoneRecord = {
  id: string
  label: string | null
  percentage: number | null
  dueInDays: number | null
  sortOrder: number
}

export type PurchaseOrderStatusHistoryRecord = {
  id: string
  fromStatus: string | null
  toStatus: string
  changedBy: string | null
  changedAt: string
}

export type PurchaseOrderRecord = {
  id: string
  status: string
  createdAt: string
  updatedAt: string
  submittedAt: string | null
  submittedBy: string | null
  approvedAt: string | null
  approvedBy: string | null
  rejectedAt: string | null
  rejectedBy: string | null
  fulfilledAt: string | null
  fulfilledBy: string | null
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
  lineItems: PurchaseOrderLineItemRecord[]
  milestones: PurchaseOrderMilestoneRecord[]
  statusHistory: PurchaseOrderStatusHistoryRecord[]
}
