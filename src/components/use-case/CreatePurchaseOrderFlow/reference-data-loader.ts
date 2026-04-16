import type { CreatePurchaseOrderReferenceData } from "./reference-data.types"
import { createSeedState } from "@/lib/mock-data/seed"

export async function loadCreatePurchaseOrderReferenceData(): Promise<CreatePurchaseOrderReferenceData> {
  const state = createSeedState()
  const departments = state.departments.map((department) => ({
    id: department.id,
    name: department.name,
  }))

  const departmentById = departments.reduce<Record<string, string>>((accumulator, department) => {
    accumulator[department.id] = department.name
    return accumulator
  }, {})

  const users = state.users.map((user) => ({
    id: user.id,
    email: user.email,
    departmentId: user.departmentId,
    departmentName: departmentById[user.departmentId] ?? user.departmentId,
  }))

  const usersByDepartment = users.reduce<Record<string, typeof users>>((accumulator, user) => {
    accumulator[user.departmentName] = accumulator[user.departmentName] ?? []
    accumulator[user.departmentName].push(user)
    return accumulator
  }, {})

  const catalogItems = state.catalogItems.map((item) => ({
    id: item.id,
    name: item.name,
    category: item.categoryName,
    supplier: item.supplierName,
    description: item.description,
    priceUsd: item.priceUsd,
    inStock: item.inStock,
  }))

  const catalogBySupplier = catalogItems.reduce<Record<string, typeof catalogItems>>((accumulator, item) => {
    accumulator[item.supplier] = accumulator[item.supplier] ?? []
    accumulator[item.supplier].push(item)
    return accumulator
  }, {})

  return {
    departments,
    users,
    usersByDepartment,
    catalogItems,
    catalogBySupplier,
    errorMessage: null,
  }
}
