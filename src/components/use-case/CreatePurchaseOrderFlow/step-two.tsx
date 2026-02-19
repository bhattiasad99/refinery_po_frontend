"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { type PurchaseOrderLineItem, type StepTwoData } from "./draft-api"
import { ItemSelectionModal } from "./item-selection-modal"
import {
  ApiError,
  buildStepTwoPayload,
  getPurchaseOrder,
  mapPurchaseOrderToStepTwo,
  updatePurchaseOrder,
} from "./purchase-order-client"
import { useCreatePurchaseOrderReferenceData } from "./reference-data-context"

import { StepShell } from "./step-shell"
import { StepTwoItemsTable } from "./step-two-items-table"

type CreatePurchaseOrderStepTwoProps = {
  draftId: string
}

const emptyStepTwoData = (): StepTwoData => ({
  supplierName: "",
  items: [],
})
const SUPPLIER_MISMATCH_MESSAGE = "All items in a PO must come from the same supplier"

export default function CreatePurchaseOrderStepTwo({
  draftId,
}: CreatePurchaseOrderStepTwoProps) {
  const router = useRouter()
  const referenceData = useCreatePurchaseOrderReferenceData()

  const [values, setValues] = useState<StepTwoData>(emptyStepTwoData())
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isItemModalOpen, setIsItemModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<PurchaseOrderLineItem | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    const loadPageData = async () => {
      setIsLoading(true)
      setErrorMessage(null)

      try {
        const purchaseOrder = await getPurchaseOrder(draftId)
        const stepTwo = mapPurchaseOrderToStepTwo(purchaseOrder)
        if (!isMounted) return
        setValues(stepTwo)
      } catch (error) {
        if (!isMounted) return
        setValues(emptyStepTwoData())
        setErrorMessage(error instanceof Error ? error.message : "Failed to load step 2")
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadPageData()
    return () => {
      isMounted = false
    }
  }, [draftId])

  const hasItems = useMemo(() => values.items.length > 0, [values.items])

  const onBack = () => {
    router.push(`/purchase-orders/new?draftId=${encodeURIComponent(draftId)}`)
  }

  const onNext = async () => {
    if (isLoading || isSubmitting) {
      return
    }

    setIsSubmitting(true)
    setErrorMessage(null)

    try {
      await updatePurchaseOrder(draftId, buildStepTwoPayload(values))
      router.push(`/purchase-orders/new/step-3/${draftId}`)
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        setErrorMessage(SUPPLIER_MISMATCH_MESSAGE)
      } else {
        setErrorMessage(error instanceof Error ? error.message : "Failed to save step 2")
      }
      setIsSubmitting(false)
    }
  }

  const onOpenAddItemModal = () => {
    setEditingItem(null)
    setIsItemModalOpen(true)
  }

  const onSaveItem = (lineItem: PurchaseOrderLineItem) => {
    let hasSupplierMismatch = false

    setValues((previous) => {
      if (previous.supplierName && previous.supplierName !== lineItem.supplier) {
        hasSupplierMismatch = true
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

    if (hasSupplierMismatch) {
      setErrorMessage(SUPPLIER_MISMATCH_MESSAGE)
      toast.error(SUPPLIER_MISMATCH_MESSAGE)
      return
    }

    setErrorMessage(null)
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
      referenceData.catalogItems.filter((catalogItem) => {
        if (editingItem?.catalogItemId === catalogItem.id) return true

        return !values.items.some(
          (lineItem) => lineItem.catalogItemId === catalogItem.id
        )
      }),
    [editingItem?.catalogItemId, referenceData.catalogItems, values.items]
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
          <Button
            type="button"
            variant="outline"
            onClick={onOpenAddItemModal}
            disabled={referenceData.catalogItems.length === 0}
          >
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

        {errorMessage ? <p className="text-sm font-medium text-red-600">{errorMessage}</p> : null}
        {referenceData.errorMessage ? (
          <p className="text-sm font-medium text-red-600">{referenceData.errorMessage}</p>
        ) : null}
      </div>

      {isItemModalOpen ? (
        <ItemSelectionModal
          open={isItemModalOpen}
          onOpenChange={setIsItemModalOpen}
          catalogItems={selectableCatalogItems}
          lockedSupplierName={values.supplierName}
          initialLineItem={editingItem}
          onSave={onSaveItem}
        />
      ) : null}
    </StepShell>
  )
}
