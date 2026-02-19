import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { ItemSelectionModal, isCatalogItemSupplierCompatible } from "./item-selection-modal"

describe("ItemSelectionModal supplier constraints", () => {
  it("shows mismatch guidance when supplier is locked", async () => {
    render(
      <ItemSelectionModal
        open
        onOpenChange={vi.fn()}
        lockedSupplierName="Supplier A"
        catalogItems={[
          {
            id: "a1",
            name: "Valve A",
            category: "Valve",
            supplier: "Supplier A",
            description: "compatible",
            priceUsd: 100,
            inStock: true,
          },
          {
            id: "b1",
            name: "Valve B",
            category: "Valve",
            supplier: "Supplier B",
            description: "incompatible",
            priceUsd: 120,
            inStock: true,
          },
        ]}
        onSave={vi.fn()}
      />,
    )

    expect(
      screen.getByText("All items in a PO must come from the same supplier Current supplier: Supplier A"),
    ).toBeInTheDocument()
  })

  it("marks different supplier items as incompatible", () => {
    expect(isCatalogItemSupplierCompatible("Supplier A", "Supplier A")).toBe(true)
    expect(isCatalogItemSupplierCompatible("Supplier B", "Supplier A")).toBe(false)
    expect(isCatalogItemSupplierCompatible("Supplier B", "Supplier A", "b1", "b1")).toBe(true)
  })
})
