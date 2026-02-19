"use client"

import { createContext, useContext } from "react"

import { type CreatePurchaseOrderReferenceData } from "./reference-data.types"

const CreatePurchaseOrderReferenceDataContext = createContext<CreatePurchaseOrderReferenceData | null>(null)

type CreatePurchaseOrderReferenceDataProviderProps = {
  value: CreatePurchaseOrderReferenceData
  children: React.ReactNode
}

export function CreatePurchaseOrderReferenceDataProvider({
  value,
  children,
}: CreatePurchaseOrderReferenceDataProviderProps) {
  return (
    <CreatePurchaseOrderReferenceDataContext.Provider value={value}>
      {children}
    </CreatePurchaseOrderReferenceDataContext.Provider>
  )
}

export function useCreatePurchaseOrderReferenceData(): CreatePurchaseOrderReferenceData {
  const context = useContext(CreatePurchaseOrderReferenceDataContext)
  if (!context) {
    throw new Error("useCreatePurchaseOrderReferenceData must be used inside CreatePurchaseOrderReferenceDataProvider")
  }

  return context
}
