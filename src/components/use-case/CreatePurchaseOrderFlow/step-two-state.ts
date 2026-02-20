"use client"

import { type PurchaseOrderLineItem, type StepTwoData } from "@/components/use-case/CreatePurchaseOrderFlow/draft-api"

export const SUPPLIER_MISMATCH_MESSAGE = "All items in a PO must come from the same supplier"

export type StepTwoState = {
  values: StepTwoData
  supplierWarning: string | null
}

type StepTwoAction =
  | { type: "set_values"; payload: StepTwoData }
  | { type: "save_item"; payload: PurchaseOrderLineItem }
  | { type: "delete_item"; payload: { lineItemId: string } }
  | { type: "reorder_items"; payload: { sourceIndex: number; destinationIndex: number } }
  | { type: "clear_warning" }

const emptyStepTwoData = (): StepTwoData => ({
  supplierName: "",
  items: [],
})

export const createInitialStepTwoState = (values?: StepTwoData): StepTwoState => ({
  values: values ?? emptyStepTwoData(),
  supplierWarning: null,
})

export function stepTwoStateReducer(state: StepTwoState, action: StepTwoAction): StepTwoState {
  if (action.type === "set_values") {
    return {
      values: action.payload,
      supplierWarning: null,
    }
  }

  if (action.type === "save_item") {
    const lineItem = action.payload

    if (state.values.supplierName && state.values.supplierName !== lineItem.supplier) {
      return {
        ...state,
        supplierWarning: SUPPLIER_MISMATCH_MESSAGE,
      }
    }

    const inferredSupplierName = state.values.supplierName || lineItem.supplier
    const existingItemIndex = state.values.items.findIndex(
      (existingItem) => existingItem.id === lineItem.id
    )

    if (existingItemIndex >= 0) {
      const updatedItems = [...state.values.items]
      updatedItems[existingItemIndex] = lineItem

      return {
        values: {
          supplierName: inferredSupplierName,
          items: updatedItems,
        },
        supplierWarning: null,
      }
    }

    return {
      values: {
        supplierName: inferredSupplierName,
        items: [...state.values.items, lineItem],
      },
      supplierWarning: null,
    }
  }

  if (action.type === "delete_item") {
    const updatedItems = state.values.items.filter(
      (lineItem) => lineItem.id !== action.payload.lineItemId
    )
    return {
      values: {
        supplierName: updatedItems.length > 0 ? state.values.supplierName : "",
        items: updatedItems,
      },
      supplierWarning: null,
    }
  }

  if (action.type === "reorder_items") {
    const { sourceIndex, destinationIndex } = action.payload
    if (sourceIndex === destinationIndex) {
      return state
    }
    if (
      sourceIndex < 0 ||
      destinationIndex < 0 ||
      sourceIndex >= state.values.items.length ||
      destinationIndex >= state.values.items.length
    ) {
      return state
    }

    const updatedItems = [...state.values.items]
    const [movedItem] = updatedItems.splice(sourceIndex, 1)
    updatedItems.splice(destinationIndex, 0, movedItem)

    return {
      ...state,
      values: {
        ...state.values,
        items: updatedItems,
      },
    }
  }

  if (action.type === "clear_warning") {
    return {
      ...state,
      supplierWarning: null,
    }
  }

  return state
}
