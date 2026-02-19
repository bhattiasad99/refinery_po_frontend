export type CreatePurchaseOrderDepartment = {
  id: string
  name: string
}

export type CreatePurchaseOrderUser = {
  id: string
  email: string
  departmentId: string
  departmentName: string
}

export type CreatePurchaseOrderCatalogItem = {
  id: string
  name: string
  category: string
  supplier: string
  description: string
  priceUsd: number
  inStock: boolean
}

export type CreatePurchaseOrderReferenceData = {
  departments: CreatePurchaseOrderDepartment[]
  users: CreatePurchaseOrderUser[]
  usersByDepartment: Record<string, CreatePurchaseOrderUser[]>
  catalogItems: CreatePurchaseOrderCatalogItem[]
  catalogBySupplier: Record<string, CreatePurchaseOrderCatalogItem[]>
  errorMessage: string | null
}
