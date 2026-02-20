"use client"

import { useState } from "react"
import { DragDropContext, Draggable, Droppable, type DropResult } from "@hello-pangea/dnd"
import { GripVertical, Pencil, Trash2 } from "lucide-react"

import ControlledModal from "@/components/common/ControlledModal"
import TableScrollContainer from "@/components/common/table-scroll-container"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableHead,
  TableHeader,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { type PurchaseOrderLineItem } from "@/components/use-case/CreatePurchaseOrderFlow/draft-api"

type StepTwoItemsTableProps = {
  items: PurchaseOrderLineItem[]
  onEditItem: (lineItem: PurchaseOrderLineItem) => void
  onDeleteItem: (lineItemId: string) => void
  onReorderItems: (sourceIndex: number, destinationIndex: number) => void
}

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
})

export function StepTwoItemsTable({
  items,
  onEditItem,
  onDeleteItem,
  onReorderItems,
}: StepTwoItemsTableProps) {
  const [pendingDeleteItem, setPendingDeleteItem] = useState<PurchaseOrderLineItem | null>(null)
  const grandTotal = items.reduce(
    (runningTotal, lineItem) => runningTotal + lineItem.quantity * lineItem.unitPrice,
    0
  )

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return
    if (result.destination.index === result.source.index) return
    onReorderItems(result.source.index, result.destination.index)
  }

  const onConfirmDelete = () => {
    if (!pendingDeleteItem) return
    onDeleteItem(pendingDeleteItem.id)
    setPendingDeleteItem(null)
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 border-b border-dashed border-slate-300 pb-3">
        <p className="text-xs font-semibold tracking-[0.2em] text-slate-500 uppercase">
          Receipt Items
        </p>
      </div>

      <TableScrollContainer innerClassName="min-w-[720px]">
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="step-two-items">
            {(provided, snapshot) => (
              <Table>
                <TableHeader>
                  <tr className="border-b hover:bg-transparent">
                    <TableHead className="w-12 font-semibold text-slate-700 uppercase">
                      Order
                    </TableHead>
                    <TableHead className="font-semibold text-slate-700 uppercase">Item</TableHead>
                    <TableHead className="text-right font-semibold text-slate-700 uppercase">
                      Quantity
                    </TableHead>
                    <TableHead className="text-right font-semibold text-slate-700 uppercase">
                      Price
                    </TableHead>
                    <TableHead className="text-right font-semibold text-slate-700 uppercase">
                      Total Price
                    </TableHead>
                    <TableHead className="text-right font-semibold text-slate-700 uppercase">
                      Actions
                    </TableHead>
                  </tr>
                </TableHeader>
                <tbody
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={cn("[&_tr:last-child]:border-0", snapshot.isDraggingOver && "bg-slate-50/50")}
                >
                  {items.map((lineItem, index) => {
                    const lineTotal = lineItem.quantity * lineItem.unitPrice

                    return (
                      <Draggable key={lineItem.id} draggableId={lineItem.id} index={index}>
                        {(dragProvided, dragSnapshot) => (
                          <tr
                            ref={dragProvided.innerRef}
                            {...dragProvided.draggableProps}
                            className={cn(
                              "border-b transition-colors hover:bg-muted/50",
                              dragSnapshot.isDragging && "bg-white shadow-md"
                            )}
                          >
                            <td className="p-2 align-middle whitespace-nowrap">
                              <Button
                                type="button"
                                size="icon-sm"
                                variant="ghost"
                                {...dragProvided.dragHandleProps}
                                aria-label={`Reorder ${lineItem.item}`}
                                title="Drag to reorder"
                              >
                                <GripVertical className="size-4" />
                              </Button>
                            </td>
                            <td className="p-2 align-middle whitespace-nowrap font-medium text-slate-800">
                              <p>{lineItem.item}</p>
                              <p className="text-muted-foreground text-xs">{lineItem.category}</p>
                            </td>
                            <td className="p-2 text-right align-middle whitespace-nowrap tabular-nums">
                              {lineItem.quantity}
                            </td>
                            <td className="p-2 text-right align-middle whitespace-nowrap tabular-nums">
                              {currencyFormatter.format(lineItem.unitPrice)}
                            </td>
                            <td className="p-2 text-right align-middle whitespace-nowrap font-semibold tabular-nums">
                              {currencyFormatter.format(lineTotal)}
                            </td>
                            <td className="p-2 text-right align-middle whitespace-nowrap">
                              <div className="flex justify-end gap-2">
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() => onEditItem(lineItem)}
                                  aria-label={`Edit ${lineItem.item}`}
                                >
                                  <Pencil className="size-3.5" />
                                  Edit
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setPendingDeleteItem(lineItem)}
                                  aria-label={`Delete ${lineItem.item}`}
                                >
                                  <Trash2 className="size-3.5" />
                                  Delete
                                </Button>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Draggable>
                    )
                  })}
                  {provided.placeholder}
                </tbody>
              </Table>
            )}
          </Droppable>
        </DragDropContext>
      </TableScrollContainer>

      <div className="mt-4 border-t border-dashed border-slate-300 pt-3 text-right">
        <p className="text-xs font-semibold tracking-[0.15em] text-slate-500 uppercase">
          Grand Total
        </p>
        <p className="text-lg font-bold text-slate-900 tabular-nums">
          {currencyFormatter.format(grandTotal)}
        </p>
      </div>

      <ControlledModal
        open={Boolean(pendingDeleteItem)}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setPendingDeleteItem(null)
          }
        }}
        title="Delete line item?"
        description="This action removes the item from the purchase order."
      >
        <div className="space-y-4">
          {pendingDeleteItem ? (
            <p className="text-sm text-slate-700">
              Remove <span className="font-semibold">{pendingDeleteItem.item}</span> from this
              purchase order?
            </p>
          ) : null}
          <div className="flex items-center justify-end gap-3">
            <Button variant="outline" onClick={() => setPendingDeleteItem(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={onConfirmDelete}>
              Delete
            </Button>
          </div>
        </div>
      </ControlledModal>
    </div>
  )
}
