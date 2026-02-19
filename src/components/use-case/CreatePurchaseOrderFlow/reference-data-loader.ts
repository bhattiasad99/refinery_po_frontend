import "server-only"

import { apiFetch } from "@/lib/api-fetch"
import {
  type CreatePurchaseOrderCatalogItem,
  type CreatePurchaseOrderDepartment,
  type CreatePurchaseOrderReferenceData,
  type CreatePurchaseOrderUser,
} from "./reference-data.types"

type GatewayResponse<T> = {
  body?: T
  message?: string
}

type DepartmentApiItem = {
  id?: string | null
  name?: string | null
}

type UserApiItem = {
  id?: string | null
  email?: string | null
  departmentId?: string | null
}

type CatalogApiItem = {
  id?: string | null
  name?: string | null
  categoryName?: string | null
  supplierName?: string | null
  description?: string | null
  priceUsd?: number | null
  inStock?: boolean | null
}

type CatalogListResponse = {
  data?: CatalogApiItem[]
  total?: number
}

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : ""
}

function asNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0
}

function asBoolean(value: unknown): boolean {
  return value === true
}

async function parseGatewayResponse<T>(
  response: Response,
  fallbackMessage: string
): Promise<T> {
  const payload = (await response.json()) as GatewayResponse<T>

  if (!response.ok) {
    throw new Error(payload.message ?? fallbackMessage)
  }

  if (payload.body === undefined) {
    throw new Error(fallbackMessage)
  }

  return payload.body
}

async function loadDepartments(): Promise<CreatePurchaseOrderDepartment[]> {
  const response = await apiFetch("/departments")
  const body = await parseGatewayResponse<DepartmentApiItem[]>(
    response,
    "Failed to fetch departments"
  )

  return body
    .map((department) => ({
      id: asString(department.id),
      name: asString(department.name),
    }))
    .filter((department) => department.id.length > 0 && department.name.length > 0)
}

async function loadUsers(): Promise<UserApiItem[]> {
  const response = await apiFetch("/users?limit=200")
  return parseGatewayResponse<UserApiItem[]>(response, "Failed to fetch users")
}

async function loadCatalogPage(page: number, limit: number): Promise<CatalogListResponse> {
  const offset = (page - 1) * limit
  const response = await apiFetch(
    `/catalog?page=${page}&limit=${limit}&offset=${offset}`
  )
  return parseGatewayResponse<CatalogListResponse>(response, "Failed to fetch catalog items")
}

async function loadAllCatalogItems(): Promise<CreatePurchaseOrderCatalogItem[]> {
  const limit = 200
  const firstPage = await loadCatalogPage(1, limit)
  const initialItems = Array.isArray(firstPage.data) ? firstPage.data : []
  const total = typeof firstPage.total === "number" ? firstPage.total : initialItems.length
  const totalPages = Math.max(Math.ceil(total / limit), 1)

  const remainingPages =
    totalPages > 1
      ? await Promise.all(
          Array.from({ length: totalPages - 1 }, (_, index) => loadCatalogPage(index + 2, limit))
        )
      : []

  const allRawItems = [
    ...initialItems,
    ...remainingPages.flatMap((page) => (Array.isArray(page.data) ? page.data : [])),
  ]

  return allRawItems
    .map((catalogItem) => ({
      id: asString(catalogItem.id),
      name: asString(catalogItem.name),
      category: asString(catalogItem.categoryName),
      supplier: asString(catalogItem.supplierName),
      description: asString(catalogItem.description),
      priceUsd: asNumber(catalogItem.priceUsd),
      inStock: asBoolean(catalogItem.inStock),
    }))
    .filter(
      (catalogItem) =>
        catalogItem.id.length > 0 &&
        catalogItem.name.length > 0 &&
        catalogItem.supplier.length > 0
    )
}

function groupUsersByDepartment(
  users: CreatePurchaseOrderUser[]
): Record<string, CreatePurchaseOrderUser[]> {
  return users.reduce<Record<string, CreatePurchaseOrderUser[]>>((accumulator, user) => {
    if (!accumulator[user.departmentName]) {
      accumulator[user.departmentName] = []
    }
    accumulator[user.departmentName].push(user)
    return accumulator
  }, {})
}

function groupCatalogBySupplier(
  items: CreatePurchaseOrderCatalogItem[]
): Record<string, CreatePurchaseOrderCatalogItem[]> {
  return items.reduce<Record<string, CreatePurchaseOrderCatalogItem[]>>((accumulator, item) => {
    if (!accumulator[item.supplier]) {
      accumulator[item.supplier] = []
    }
    accumulator[item.supplier].push(item)
    return accumulator
  }, {})
}

export async function loadCreatePurchaseOrderReferenceData(): Promise<CreatePurchaseOrderReferenceData> {
  try {
    const [departments, rawUsers, catalogItems] = await Promise.all([
      loadDepartments(),
      loadUsers(),
      loadAllCatalogItems(),
    ])

    const departmentById = departments.reduce<Record<string, string>>((accumulator, department) => {
      accumulator[department.id] = department.name
      return accumulator
    }, {})

    const users: CreatePurchaseOrderUser[] = rawUsers
      .map((user) => {
        const id = asString(user.id)
        const email = asString(user.email)
        const departmentId = asString(user.departmentId)
        const departmentName = departmentById[departmentId] ?? ""

        return {
          id,
          email,
          departmentId,
          departmentName,
        }
      })
      .filter((user) => user.id && user.email && user.departmentName)

    return {
      departments,
      users,
      usersByDepartment: groupUsersByDepartment(users),
      catalogItems,
      catalogBySupplier: groupCatalogBySupplier(catalogItems),
      errorMessage: null,
    }
  } catch (error) {
    return {
      departments: [],
      users: [],
      usersByDepartment: {},
      catalogItems: [],
      catalogBySupplier: {},
      errorMessage:
        error instanceof Error ? error.message : "Failed to load create purchase order reference data",
    }
  }
}
