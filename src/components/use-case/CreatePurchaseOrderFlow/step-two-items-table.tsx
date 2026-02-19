"use client"

import { Pencil, Trash2 } from "lucide-react"

import TableScrollContainer from "@/components/common/table-scroll-container"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { type PurchaseOrderLineItem } from "./draft-api"

type StepTwoItemsTableProps = {
  items: PurchaseOrderLineItem[]
  onEditItem: (lineItem: PurchaseOrderLineItem) => void
  onDeleteItem: (lineItemId: string) => void
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
}: StepTwoItemsTableProps) {
  const grandTotal = items.reduce(
    (runningTotal, lineItem) => runningTotal + lineItem.quantity * lineItem.unitPrice,
    0
  )

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 border-b border-dashed border-slate-300 pb-3">
        <p className="text-xs font-semibold tracking-[0.2em] text-slate-500 uppercase">
          Receipt Items
        </p>
      </div>

      <TableScrollContainer innerClassName="min-w-[720px]">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
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
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((lineItem) => {
              const lineTotal = lineItem.quantity * lineItem.unitPrice

              return (
                <TableRow key={lineItem.id}>
                  <TableCell className="font-medium text-slate-800">
                    <p>{lineItem.item}</p>
                    <p className="text-muted-foreground text-xs">{lineItem.category}</p>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{lineItem.quantity}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {currencyFormatter.format(lineItem.unitPrice)}
                  </TableCell>
                  <TableCell className="text-right font-semibold tabular-nums">
                    {currencyFormatter.format(lineTotal)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => onEditItem(lineItem)}
                      >
                        <Pencil className="size-3.5" />
                        Edit
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => onDeleteItem(lineItem.id)}
                      >
                        <Trash2 className="size-3.5" />
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </TableScrollContainer>

      <div className="mt-4 border-t border-dashed border-slate-300 pt-3 text-right">
        <p className="text-xs font-semibold tracking-[0.15em] text-slate-500 uppercase">
          Grand Total
        </p>
        <p className="text-lg font-bold text-slate-900 tabular-nums">
          {currencyFormatter.format(grandTotal)}
        </p>
      </div>
    </div>
  )
}
