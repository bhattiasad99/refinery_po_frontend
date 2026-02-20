import { describe, expect, it } from "vitest"
import {
  createInitialStepTwoState,
  stepTwoStateReducer,
  SUPPLIER_MISMATCH_MESSAGE,
} from "@/components/use-case/CreatePurchaseOrderFlow/step-two-state"

describe("stepTwoStateReducer", () => {
  it("blocks saving item from a different supplier", () => {
    const initialState = createInitialStepTwoState({
      supplierName: "Supplier A",
      items: [],
    })

    const nextState = stepTwoStateReducer(initialState, {
      type: "save_item",
      payload: {
        id: "line-2",
        catalogItemId: "item-2",
        item: "Pump",
        supplier: "Supplier B",
        category: "Pumps",
        description: "Pump",
        quantity: 1,
        unitPrice: 20,
      },
    })

    expect(nextState.values.items).toHaveLength(0)
    expect(nextState.supplierWarning).toBe(SUPPLIER_MISMATCH_MESSAGE)
  })

  it("adds the first item and sets supplier automatically", () => {
    const nextState = stepTwoStateReducer(createInitialStepTwoState(), {
      type: "save_item",
      payload: {
        id: "line-1",
        catalogItemId: "item-1",
        item: "Valve",
        supplier: "Supplier A",
        category: "Valves",
        description: "Valve",
        quantity: 2,
        unitPrice: 100,
      },
    })

    expect(nextState.values.supplierName).toBe("Supplier A")
    expect(nextState.values.items).toHaveLength(1)
    expect(nextState.supplierWarning).toBeNull()
  })
})
