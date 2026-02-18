"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { ArrowLeft, CircleCheckBig, CircleDashed, Plus, Trash2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MOCK_PURCHASE_ORDERS } from "@/components/use-case/SinglePurchaseOrderPageComponent/mock-data"

type EditPurchaseOrderPageComponentProps = {
  id: string
}

type PurchaseOrder = (typeof MOCK_PURCHASE_ORDERS)[number]
type PurchaseOrderLine = PurchaseOrder["purchase_order_details"][number]

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
})

const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
})

export default function EditPurchaseOrderPageComponent({
  id,
}: EditPurchaseOrderPageComponentProps) {
  const purchaseOrder = useMemo(
    () => MOCK_PURCHASE_ORDERS.find((order) => String(order.id) === id),
    [id]
  )

  const [supplierName, setSupplierName] = useState(purchaseOrder?.supplier_name ?? "")
  const [requestedBy, setRequestedBy] = useState(purchaseOrder?.requested_by ?? "")
  const [notes, setNotes] = useState("")
  const [lines, setLines] = useState<PurchaseOrderLine[]>(
    purchaseOrder?.purchase_order_details ?? []
  )

  const lineTotals = useMemo(
    () =>
      lines.map((line) => ({
        ...line,
        total_cost: Number((line.quantity * line.rate).toFixed(2)),
      })),
    [lines]
  )

  const grandTotal = useMemo(
    () => lineTotals.reduce((acc, line) => acc + line.total_cost, 0),
    [lineTotals]
  )

  const initialSnapshot = useMemo(
    () =>
      JSON.stringify({
        supplierName: purchaseOrder?.supplier_name ?? "",
        requestedBy: purchaseOrder?.requested_by ?? "",
        notes: "",
        lines: purchaseOrder?.purchase_order_details ?? [],
      }),
    [purchaseOrder]
  )

  const currentSnapshot = useMemo(
    () =>
      JSON.stringify({
        supplierName,
        requestedBy,
        notes,
        lines,
      }),
    [supplierName, requestedBy, notes, lines]
  )

  const hasUnsavedChanges = initialSnapshot !== currentSnapshot
  const validLineItems = lines.length > 0 && lines.every((line) => line.item_name.trim().length > 0)
  const validQuantities = lines.every((line) => line.quantity > 0)
  const validRates = lines.every((line) => line.rate > 0)
  const canSubmit =
    supplierName.trim().length > 0 &&
    requestedBy.trim().length > 0 &&
    validLineItems &&
    validQuantities &&
    validRates

  const updateLine = <K extends keyof PurchaseOrderLine>(
    index: number,
    key: K,
    value: PurchaseOrderLine[K]
  ) => {
    setLines((previousLines) =>
      previousLines.map((line, currentIndex) =>
        currentIndex === index ? { ...line, [key]: value } : line
      )
    )
  }

  const addLine = () => {
    if (!purchaseOrder) return

    setLines((previousLines) => [
      ...previousLines,
      {
        id: `PO${purchaseOrder.id}-${String(previousLines.length + 1).padStart(3, "0")}`,
        item_name: "",
        quantity: 1,
        rate: 0,
        total_cost: 0,
      },
    ])
  }

  const removeLine = (index: number) => {
    setLines((previousLines) => previousLines.filter((_, currentIndex) => currentIndex !== index))
  }

  if (!purchaseOrder) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
        <Link
          href="/purchase-orders"
          className="text-muted-foreground hover:text-foreground inline-flex w-fit items-center gap-2 text-sm"
        >
          <ArrowLeft className="size-4" />
          Back to purchase orders
        </Link>
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-lg font-semibold">Purchase order not found</p>
            <p className="text-muted-foreground mt-1 text-sm">
              No purchase order exists for id {id}.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <Link
        href={`/purchase-orders/${id}`}
        className="text-muted-foreground hover:text-foreground inline-flex w-fit items-center gap-2 text-sm"
      >
        <ArrowLeft className="size-4" />
        Back to purchase order
      </Link>

      <Card className="overflow-hidden border-none bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white shadow-lg">
        <CardHeader className="gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-white/15 text-white hover:bg-white/15">PO #{purchaseOrder.id}</Badge>
              <Badge variant="secondary" className="bg-white text-slate-900 hover:bg-white">
                Edit Mode
              </Badge>
              {hasUnsavedChanges && (
                <Badge className="bg-amber-500 text-black hover:bg-amber-500">Unsaved Changes</Badge>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" variant="secondary" className="bg-white/15 text-white hover:bg-white/25">
                Save Draft
              </Button>
              <Button
                size="sm"
                className="bg-emerald-600 text-white hover:bg-emerald-700"
                disabled={!canSubmit}
              >
                Submit
              </Button>
              <Button asChild size="sm" variant="outline" className="border-white/30 bg-transparent text-white hover:bg-white/10">
                <Link href={`/purchase-orders/${id}`}>Cancel</Link>
              </Button>
            </div>
          </div>
          <CardTitle className="text-2xl leading-tight md:text-3xl">
            Edit Purchase Order
          </CardTitle>
          <p className="text-sm text-slate-200">
            Update supplier details, item quantities, and pricing before submitting.
          </p>
        </CardHeader>
      </Card>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Order Information</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="supplier-name">Supplier</Label>
                <Input
                  id="supplier-name"
                  value={supplierName}
                  onChange={(event) => setSupplierName(event.target.value)}
                  placeholder="Enter supplier name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="requested-by">Requested By</Label>
                <Input
                  id="requested-by"
                  value={requestedBy}
                  onChange={(event) => setRequestedBy(event.target.value)}
                  placeholder="Enter department or requester"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="notes">Notes</Label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Optional notes for approvers"
                  className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring/50 min-h-24 w-full rounded-md border px-3 py-2 text-sm shadow-xs focus-visible:ring-[3px] focus-visible:outline-none"
                />
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground text-xs">Created At</p>
                <p className="text-sm font-medium">
                  {dateTimeFormatter.format(new Date(purchaseOrder.created_at))}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground text-xs">Current Status</p>
                <p className="text-sm font-medium capitalize">{purchaseOrder.status}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle>Line Items</CardTitle>
                <Button size="sm" variant="outline" onClick={addLine}>
                  <Plus className="size-4" />
                  Add Item
                </Button>
              </div>
            </CardHeader>
            <CardContent className="px-0">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-sm">
                  <thead>
                    <tr className="text-muted-foreground border-b text-left">
                      <th className="px-6 py-3 font-medium">Item ID</th>
                      <th className="px-6 py-3 font-medium">Item</th>
                      <th className="px-6 py-3 font-medium text-right">Qty</th>
                      <th className="px-6 py-3 font-medium text-right">Rate</th>
                      <th className="px-6 py-3 font-medium text-right">Total</th>
                      <th className="px-6 py-3 font-medium text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lineTotals.map((line, index) => (
                      <tr key={line.id} className="border-b last:border-b-0">
                        <td className="px-6 py-4 font-medium">{line.id}</td>
                        <td className="px-6 py-4">
                          <Input
                            value={line.item_name}
                            onChange={(event) => updateLine(index, "item_name", event.target.value)}
                            placeholder="Item name"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <Input
                            type="number"
                            min={1}
                            value={line.quantity}
                            onChange={(event) =>
                              updateLine(index, "quantity", Number(event.target.value || 0))
                            }
                            className="text-right"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <Input
                            type="number"
                            min={0}
                            step="0.01"
                            value={line.rate}
                            onChange={(event) =>
                              updateLine(index, "rate", Number(event.target.value || 0))
                            }
                            className="text-right"
                          />
                        </td>
                        <td className="px-6 py-4 text-right font-semibold">
                          {currencyFormatter.format(line.total_cost)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            onClick={() => removeLine(index)}
                            disabled={lines.length === 1}
                          >
                            <Trash2 className="size-4 text-rose-600" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td className="px-6 py-4" colSpan={3} />
                      <td className="px-6 py-4 text-right text-sm font-semibold">Grand Total</td>
                      <td className="px-6 py-4 text-right text-lg font-bold">
                        {currencyFormatter.format(grandTotal)}
                      </td>
                      <td className="px-6 py-4" />
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="xl:sticky xl:top-4">
            <CardHeader>
              <CardTitle>Validation & Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">{currencyFormatter.format(grandTotal)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Fees/Tax</span>
                  <span className="font-medium">{currencyFormatter.format(0)}</span>
                </div>
                <div className="flex items-center justify-between text-base font-semibold">
                  <span>Grand Total</span>
                  <span>{currencyFormatter.format(grandTotal)}</span>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-semibold">Checklist</p>
                <div className="space-y-2">
                  {[
                    { label: "Supplier selected", valid: supplierName.trim().length > 0 },
                    { label: "Requester set", valid: requestedBy.trim().length > 0 },
                    { label: "Line items are filled", valid: validLineItems },
                    { label: "Quantities are valid", valid: validQuantities },
                    { label: "Rates are valid", valid: validRates },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-2 text-sm">
                      {item.valid ? (
                        <CircleCheckBig className="size-4 text-emerald-600" />
                      ) : (
                        <CircleDashed className="text-muted-foreground size-4" />
                      )}
                      <span className={item.valid ? "text-foreground" : "text-muted-foreground"}>
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
