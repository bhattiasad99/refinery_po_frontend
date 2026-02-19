"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import catalogItemsData from "./catalog_items.json"
import { type PurchaseOrderLineItem, type StepTwoData } from "./draft-api"
import { ItemSelectionModal } from "./item-selection-modal"

import { StepShell } from "./step-shell"
import { StepTwoItemsTable } from "./step-two-items-table"

type CreatePurchaseOrderStepTwoProps = {
  draftId: string
}

type CatalogItem = {
  id: string
  name: string
  category: string
  supplier: string
  description: string
  priceUsd: number
  inStock: boolean
}

const allCatalogItems = catalogItemsData as CatalogItem[]

const emptyStepTwoData = (): StepTwoData => ({
  supplierName: "",
  items: [],
})

export default function CreatePurchaseOrderStepTwo({
  draftId,
}: CreatePurchaseOrderStepTwoProps) {
  const router = useRouter()

  const [values, setValues] = useState<StepTwoData>(emptyStepTwoData())
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isItemModalOpen, setIsItemModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<PurchaseOrderLineItem | null>(null)

  useEffect(() => {
    const loadPageData = async () => {
      setIsLoading(true)
      setValues(emptyStepTwoData())
      setIsLoading(false)
    }

    loadPageData()
  }, [draftId])

  const hasItems = useMemo(() => values.items.length > 0, [values.items])
  const filteredCatalogItems = useMemo(() => {
    if (!values.supplierName) return allCatalogItems

    const supplierItems = allCatalogItems.filter(
      (catalogItem) => catalogItem.supplier === values.supplierName
    )
    return supplierItems.length > 0 ? supplierItems : allCatalogItems
  }, [values.supplierName])

  const onBack = () => {
    router.push("/purchase-orders/new")
  }

  const onNext = async () => {
    setIsSubmitting(true)
    router.push(`/purchase-orders/new/step-3/${draftId}`)
  }

  const onOpenAddItemModal = () => {
    setEditingItem(null)
    setIsItemModalOpen(true)
  }

  const onSaveItem = (lineItem: PurchaseOrderLineItem) => {
    setValues((previous) => {
      if (previous.supplierName && previous.supplierName !== lineItem.supplier) {
        return previous
      }

      const inferredSupplierName = previous.supplierName || lineItem.supplier

      const existingItemIndex = previous.items.findIndex(
        (existingItem) => existingItem.id === lineItem.id
      )
      if (existingItemIndex >= 0) {
        const updatedItems = [...previous.items]
        updatedItems[existingItemIndex] = lineItem

        return {
          supplierName: inferredSupplierName,
          items: updatedItems,
        }
      }

      return {
        supplierName: inferredSupplierName,
        items: [...previous.items, lineItem],
      }
    })
  }

  const onDeleteItem = (lineItemId: string) => {
    setValues((previous) => {
      const updatedItems = previous.items.filter((lineItem) => lineItem.id !== lineItemId)
      return {
        supplierName: updatedItems.length > 0 ? previous.supplierName : "",
        items: updatedItems,
      }
    })
  }

  const onEditItem = (lineItem: PurchaseOrderLineItem) => {
    setEditingItem(lineItem)
    setIsItemModalOpen(true)
  }

  const supplierDisplayText = values.supplierName || "No Supplier Added, please add items"
  const selectableCatalogItems = useMemo(
    () =>
      filteredCatalogItems.filter((catalogItem) => {
        if (editingItem?.catalogItemId === catalogItem.id) return true

        return !values.items.some(
          (lineItem) => lineItem.catalogItemId === catalogItem.id
        )
      }),
    [editingItem?.catalogItemId, filteredCatalogItems, values.items]
  )

  return (
    <StepShell
      title="Build Purchase Items"
      description="Set supplier name and prepare receipt-style purchase items."
    >
      <div className="space-y-5">
        <div className="rounded-lg border bg-slate-50 p-4">
          <p className="text-xs font-semibold tracking-[0.12em] text-slate-500 uppercase">
            Supplier Name
          </p>
          <p className="mt-1 text-base font-semibold text-slate-900">{supplierDisplayText}</p>
        </div>

        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium text-slate-700">Items</p>
          <Button type="button" variant="outline" onClick={onOpenAddItemModal}>
            Add Item
          </Button>
        </div>

        {hasItems ? (
          <StepTwoItemsTable
            items={values.items}
            onEditItem={onEditItem}
            onDeleteItem={onDeleteItem}
          />
        ) : (
          <p className="text-muted-foreground rounded-lg border border-dashed p-4 text-sm">
            Add items to populate table
          </p>
        )}

        <div className="flex items-center justify-between gap-3 pt-2">
          <Button variant="outline" onClick={onBack} disabled={isSubmitting || isLoading}>
            Back
          </Button>
          <Button onClick={onNext} disabled={!hasItems || isSubmitting || isLoading}>
            {isSubmitting ? "Saving..." : "Next"}
          </Button>
        </div>
      </div>

      {isItemModalOpen ? (
        <ItemSelectionModal
          open={isItemModalOpen}
          onOpenChange={setIsItemModalOpen}
          catalogItems={selectableCatalogItems}
          initialLineItem={editingItem}
          onSave={onSaveItem}
        />
      ) : null}
    </StepShell>
  )
}
