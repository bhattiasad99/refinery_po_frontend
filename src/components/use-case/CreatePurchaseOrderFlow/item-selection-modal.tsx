"use client"

import { useMemo, useState } from "react"

import ControlledModal from "@/components/common/ControlledModal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { type PurchaseOrderLineItem } from "@/components/use-case/CreatePurchaseOrderFlow/draft-api"

type CatalogItem = {
  id: string
  name: string
  category: string
  supplier: string
  description: string
  priceUsd: number
  inStock: boolean
}

type ItemSelectionModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  catalogItems: CatalogItem[]
  lockedSupplierName?: string
  initialLineItem?: PurchaseOrderLineItem | null
  onSave: (lineItem: PurchaseOrderLineItem) => void
}
const SUPPLIER_MISMATCH_MESSAGE = "All items in a PO must come from the same supplier"

const priceFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
})

const createLineItemFromCatalog = (
  catalogItem: CatalogItem,
  quantity: number,
  lineItemId?: string
): PurchaseOrderLineItem => ({
  id: lineItemId ?? crypto.randomUUID(),
  catalogItemId: catalogItem.id,
  item: catalogItem.name,
  supplier: catalogItem.supplier,
  category: catalogItem.category,
  description: catalogItem.description,
  quantity,
  unitPrice: catalogItem.priceUsd,
})

export function isCatalogItemSupplierCompatible(
  catalogSupplier: string,
  lockedSupplierName?: string,
  editingCatalogItemId?: string,
  catalogItemId?: string,
): boolean {
  if (!lockedSupplierName) return true
  if (editingCatalogItemId && catalogItemId === editingCatalogItemId) return true
  return catalogSupplier === lockedSupplierName
}

export function isValidLineItemQuantity(quantity: string): boolean {
  const parsedQuantity = Number(quantity)
  return Number.isFinite(parsedQuantity) && parsedQuantity > 0
}

export function ItemSelectionModal({
  open,
  onOpenChange,
  catalogItems,
  lockedSupplierName,
  initialLineItem,
  onSave,
}: ItemSelectionModalProps) {
  const initialCatalogItemId = initialLineItem?.catalogItemId ?? ""
  const initialQuantity = String(initialLineItem?.quantity ?? 1)

  const [selectedCatalogItemId, setSelectedCatalogItemId] = useState(initialCatalogItemId)
  const [quantity, setQuantity] = useState(initialQuantity)

  const selectedCatalogItem = useMemo(
    () => catalogItems.find((catalogItem) => catalogItem.id === selectedCatalogItemId) ?? null,
    [catalogItems, selectedCatalogItemId]
  )
  const hasLockedSupplier = Boolean(lockedSupplierName)

  const parsedQuantity = Number(quantity)
  const validQuantity = isValidLineItemQuantity(quantity)
  const totalPrice = selectedCatalogItem ? selectedCatalogItem.priceUsd * (validQuantity ? parsedQuantity : 0) : 0
  const hasCatalogItems = catalogItems.length > 0
  const canSave = Boolean(selectedCatalogItem) && validQuantity

  const onConfirmSave = () => {
    if (!selectedCatalogItem || !validQuantity) return

    const lineItem = createLineItemFromCatalog(
      selectedCatalogItem,
      parsedQuantity,
      initialLineItem?.id
    )

    onSave(lineItem)
    onOpenChange(false)
  }

  return (
    <ControlledModal
      open={open}
      onOpenChange={onOpenChange}
      title={initialLineItem ? "Edit Item" : "Add Catalog Item"}
      description="Select a catalog item and quantity, then save it to this purchase order."
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="catalog-item-select">Catalog Item</Label>
          <Select
            value={selectedCatalogItemId}
            onValueChange={setSelectedCatalogItemId}
            disabled={!hasCatalogItems}
          >
            <SelectTrigger id="catalog-item-select" className="w-full">
              <SelectValue placeholder="Select Item" />
            </SelectTrigger>
            <SelectContent>
              {catalogItems.length > 0 ? (
                catalogItems.map((catalogItem) => {
                  const supplierMismatch = !isCatalogItemSupplierCompatible(
                    catalogItem.supplier,
                    lockedSupplierName,
                    initialLineItem?.catalogItemId,
                    catalogItem.id
                  )

                  return (
                    <SelectItem
                      key={catalogItem.id}
                      value={catalogItem.id}
                      disabled={supplierMismatch}
                    >
                      {catalogItem.name} ({catalogItem.supplier}
                      {supplierMismatch ? " - incompatible" : ""})
                    </SelectItem>
                  )
                })
              ) : (
                <div className="text-muted-foreground px-2 py-1.5 text-sm">
                  No catalog items available.
                </div>
              )}
            </SelectContent>
          </Select>
          {hasLockedSupplier ? (
            <p className="text-sm text-amber-700">
              {SUPPLIER_MISMATCH_MESSAGE} Current supplier: {lockedSupplierName}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="item-quantity">Quantity</Label>
          <Input
            id="item-quantity"
            type="number"
            min={1}
            step={1}
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
          />
        </div>

        <div className="rounded-lg border border-dashed p-4">
          <p className="text-xs font-semibold tracking-[0.15em] text-slate-500 uppercase">
            Selection Summary
          </p>
          {selectedCatalogItem ? (
            <div className="mt-2 space-y-1 text-sm">
              <p className="font-semibold text-slate-900">{selectedCatalogItem.name}</p>
              <p className="text-slate-600">Supplier: {selectedCatalogItem.supplier}</p>
              <p className="text-slate-600">Category: {selectedCatalogItem.category}</p>
              <p className="text-slate-600">
                Unit Price: {priceFormatter.format(selectedCatalogItem.priceUsd)}
              </p>
              <p className="pt-1 font-semibold text-slate-900">
                Total Price: {priceFormatter.format(totalPrice)}
              </p>
              <p className="text-muted-foreground text-xs">{selectedCatalogItem.description}</p>
            </div>
          ) : (
            <p className="text-muted-foreground mt-2 text-sm">Select an item to view details.</p>
          )}
        </div>

        <div className="flex items-center justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onConfirmSave} disabled={!canSave}>
            Save
          </Button>
        </div>
      </div>
    </ControlledModal>
  )
}
