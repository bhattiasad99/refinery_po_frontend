import type { CatalogItemRecord, PurchaseOrderRecord } from "@/lib/mock-data/types"

type CatalogSortOption =
  | "price_asc"
  | "price_desc"
  | "lead_time_asc"
  | "lead_time_desc"
  | "supplier_asc"

function normalize(value: string): string {
  return value.trim().toLowerCase()
}

export function getCatalogFilterOptions(catalogItems: CatalogItemRecord[]) {
  return {
    categories: [...new Set(catalogItems.map((item) => item.categoryName))].sort(),
    suppliers: [...new Set(catalogItems.map((item) => item.supplierName))].sort(),
  }
}

export function getCatalogList(
  catalogItems: CatalogItemRecord[],
  options: {
    q?: string
    category?: string
    inStock?: boolean | null
    sort?: CatalogSortOption
    page?: number
    limit?: number
  }
) {
  const page = Math.max(options.page ?? 1, 1)
  const limit = Math.max(options.limit ?? 20, 1)
  const query = normalize(options.q ?? "")
  const category = normalize(options.category ?? "")

  let rows = [...catalogItems]

  if (query) {
    rows = rows.filter((item) =>
      [
        item.id,
        item.name,
        item.supplierName,
        item.manufacturer,
        item.model,
      ].some((value) => normalize(value).includes(query))
    )
  }

  if (category) {
    rows = rows.filter((item) => normalize(item.categoryName) === category)
  }

  if (options.inStock !== null && options.inStock !== undefined) {
    rows = rows.filter((item) => item.inStock === options.inStock)
  }

  const sort = options.sort ?? "price_asc"
  rows.sort((a, b) => {
    if (sort === "price_desc") return b.priceUsd - a.priceUsd
    if (sort === "lead_time_asc") return a.leadTimeDays - b.leadTimeDays
    if (sort === "lead_time_desc") return b.leadTimeDays - a.leadTimeDays
    if (sort === "supplier_asc") return a.supplierName.localeCompare(b.supplierName)
    return a.priceUsd - b.priceUsd
  })

  const total = rows.length
  const pagedRows = rows.slice((page - 1) * limit, page * limit)

  return {
    data: pagedRows,
    total,
    page,
    limit,
    averageLeadTime:
      rows.length > 0 ? rows.reduce((sum, item) => sum + item.leadTimeDays, 0) / rows.length : 0,
    averagePrice:
      rows.length > 0 ? rows.reduce((sum, item) => sum + item.priceUsd, 0) / rows.length : 0,
    inStockCount: rows.filter((item) => item.inStock).length,
  }
}

export function getSuppliersList(
  catalogItems: CatalogItemRecord[],
  options: { search?: string; page?: number; limit?: number }
) {
  const search = normalize(options.search ?? "")
  const page = Math.max(options.page ?? 1, 1)
  const limit = Math.max(options.limit ?? 10, 1)

  let suppliers = [...new Set(catalogItems.map((item) => item.supplierName))]
    .sort()
    .map((supplier) => ({
      supplier,
      items: catalogItems
        .filter((item) => item.supplierName === supplier)
        .map((item) => ({
          id: item.id,
          name: item.name,
          categoryName: item.categoryName,
          model: item.model,
          leadTimeDays: item.leadTimeDays,
          priceUsd: item.priceUsd,
          inStock: item.inStock,
        })),
    }))

  if (search) {
    suppliers = suppliers.filter((entry) => normalize(entry.supplier).includes(search))
  }

  const total = suppliers.length
  return {
    data: suppliers.slice((page - 1) * limit, page * limit),
    total,
    page,
    limit,
  }
}

export function getDashboardStats(purchaseOrders: PurchaseOrderRecord[]) {
  const totalPurchases = purchaseOrders.reduce((sum, purchaseOrder) => {
    return (
      sum +
      purchaseOrder.lineItems.reduce(
        (lineTotal, item) => lineTotal + (item.quantity ?? 0) * (item.unitPrice ?? 0),
        0
      )
    )
  }, 0)

  const totalItemsPurchased = purchaseOrders.reduce(
    (sum, purchaseOrder) =>
      sum + purchaseOrder.lineItems.reduce((lineTotal, item) => lineTotal + (item.quantity ?? 0), 0),
    0
  )

  const currentMonth = new Date().toISOString().slice(0, 7)
  const purchaseOrdersThisMonth = purchaseOrders.filter((purchaseOrder) =>
    purchaseOrder.createdAt.startsWith(currentMonth)
  ).length

  const counts = purchaseOrders.reduce<Record<string, number>>((accumulator, purchaseOrder) => {
    const day = purchaseOrder.createdAt.slice(0, 10)
    accumulator[day] = (accumulator[day] ?? 0) + 1
    return accumulator
  }, {})

  return {
    totalPurchases,
    totalPurchaseOrders: purchaseOrders.length,
    totalItemsPurchased,
    purchaseOrdersThisMonth,
    purchaseOrdersPerDay: Object.entries(counts)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([date, count]) => ({ date, count })),
  }
}

export function getPurchaseOrderListRows(purchaseOrders: PurchaseOrderRecord[]) {
  return purchaseOrders.map((purchaseOrder) => ({
    id: purchaseOrder.id,
    status: purchaseOrder.status,
    supplierName: purchaseOrder.supplierName,
    requestedByUser: purchaseOrder.requestedByUser,
    lineItems: purchaseOrder.lineItems,
  }))
}
