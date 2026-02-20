"use client"

import { useEffect, useMemo, useReducer, useState } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { ApiError } from "@/lib/api"
import { type PurchaseOrderLineItem, type StepTwoData } from "@/components/use-case/CreatePurchaseOrderFlow/draft-api"
import { ItemSelectionModal } from "@/components/use-case/CreatePurchaseOrderFlow/item-selection-modal"
import {
  buildStepTwoPayload,
  getPurchaseOrder,
  mapPurchaseOrderToStepTwo,
  updatePurchaseOrder,
} from "@/components/use-case/CreatePurchaseOrderFlow/purchase-order-client"
import { useCreatePurchaseOrderReferenceData } from "@/components/use-case/CreatePurchaseOrderFlow/reference-data-context"
import {
  createInitialStepTwoState,
  stepTwoStateReducer,
  SUPPLIER_MISMATCH_MESSAGE,
} from "@/components/use-case/CreatePurchaseOrderFlow/step-two-state"

import { StepShell } from "@/components/use-case/CreatePurchaseOrderFlow/step-shell"
import { StepTwoItemsTable } from "@/components/use-case/CreatePurchaseOrderFlow/step-two-items-table"

type CreatePurchaseOrderStepTwoProps = {
  draftId: string
}

const emptyStepTwoData = (): StepTwoData => ({
  supplierName: "",
  items: [],
})

export default function CreatePurchaseOrderStepTwo({
  draftId,
}: CreatePurchaseOrderStepTwoProps) {
  const router = useRouter()
  const referenceData = useCreatePurchaseOrderReferenceData()

  const [stepTwoState, dispatchStepTwo] = useReducer(
    stepTwoStateReducer,
    createInitialStepTwoState()
  )
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
        dispatchStepTwo({ type: "set_values", payload: stepTwo })
      } catch (error) {
        if (!isMounted) return
        dispatchStepTwo({ type: "set_values", payload: emptyStepTwoData() })
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

  const values = stepTwoState.values
  const hasItems = useMemo(() => values.items.length > 0, [values.items])

  const onBack = () => {
    router.push(`/purchase-orders/new?draftId=${encodeURIComponent(draftId)}`)
  }

  const onNext = async () => {
    if (isLoading || isSubmitting) {
      return
    }

    dispatchStepTwo({ type: "clear_warning" })
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
    dispatchStepTwo({ type: "save_item", payload: lineItem })
    setErrorMessage(null)
  }

  const onDeleteItem = (lineItemId: string) => {
    dispatchStepTwo({ type: "delete_item", payload: { lineItemId } })
  }

  const onEditItem = (lineItem: PurchaseOrderLineItem) => {
    setEditingItem(lineItem)
    setIsItemModalOpen(true)
  }

  const onReorderItems = (sourceIndex: number, destinationIndex: number) => {
    dispatchStepTwo({
      type: "reorder_items",
      payload: { sourceIndex, destinationIndex },
    })
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
            onReorderItems={onReorderItems}
          />
        ) : (
          <p className="text-muted-foreground rounded-lg border border-dashed p-4 text-sm">
            Add items to populate table
          </p>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <Button variant="outline" onClick={onBack} disabled={isSubmitting || isLoading}>
            Back
          </Button>
          <Button onClick={onNext} disabled={!hasItems || isSubmitting || isLoading}>
            {isSubmitting ? "Saving..." : "Next"}
          </Button>
        </div>

        {stepTwoState.supplierWarning ? (
          <p className="text-sm font-medium text-amber-700">{stepTwoState.supplierWarning}</p>
        ) : null}
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
