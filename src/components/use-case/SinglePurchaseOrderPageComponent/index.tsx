import Link from "next/link"
import { ArrowLeft, CalendarClock, CircleCheckBig, CircleDashed, CircleX } from "lucide-react"

import { apiFetch } from "@/lib/api-fetch"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import StatusActionButtons from "./status-action-buttons"

type IProps = {
  id: string
}

type GatewayResponse<T> = {
  body?: T
  message?: string
}

type PurchaseOrderLineItem = {
  id: string
  item: string | null
  quantity: number | null
  unitPrice: number | null
  category: string | null
}

type PurchaseOrderApiRow = {
  id: string
  status: string
  submittedAt: string | null
  submittedBy: string | null
  approvedAt: string | null
  approvedBy: string | null
  rejectedAt: string | null
  rejectedBy: string | null
  fulfilledAt: string | null
  fulfilledBy: string | null
  supplierName: string | null
  requestedByDepartment: string | null
  requestedByUser: string | null
  createdAt: string
  updatedAt: string
  lineItems: PurchaseOrderLineItem[]
}

type PurchaseOrderTimelineKey = "created" | "submitted" | "approved" | "rejected" | "fulfilled"

type TimelineEntry = {
  time: string
  actor: string
} | null

type PurchaseOrderViewModel = {
  id: string
  status: "draft" | "submitted" | "approved" | "rejected" | "fulfilled"
  supplierName: string
  requestedBy: string
  createdAt: string
  updatedAt: string
  lineItems: PurchaseOrderLineItem[]
  totalPrice: number
  timeline: Record<PurchaseOrderTimelineKey, TimelineEntry>
}

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
})

const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
})

const timelineOrder: PurchaseOrderTimelineKey[] = [
  "created",
  "submitted",
  "approved",
  "rejected",
  "fulfilled",
]

function normalizeStatus(
  status: string | null | undefined
): "draft" | "submitted" | "approved" | "rejected" | "fulfilled" {
  const normalized = (status ?? "").toLowerCase()
  if (normalized === "submitted") return "submitted"
  if (normalized === "approved") return "approved"
  if (normalized === "rejected") return "rejected"
  if (normalized === "fulfilled") return "fulfilled"
  return "draft"
}

function sumOrderTotal(lineItems: PurchaseOrderLineItem[]): number {
  return lineItems.reduce(
    (runningTotal, item) =>
      runningTotal +
      (typeof item.quantity === "number" ? item.quantity : 0) *
        (typeof item.unitPrice === "number" ? item.unitPrice : 0),
    0
  )
}

function buildTimeline(viewModel: {
  status: PurchaseOrderViewModel["status"]
  createdAt: string
  updatedAt: string
  createdBy: string
  submittedAt: string | null
  submittedBy: string | null
  approvedAt: string | null
  approvedBy: string | null
  rejectedAt: string | null
  rejectedBy: string | null
  fulfilledAt: string | null
  fulfilledBy: string | null
}): Record<PurchaseOrderTimelineKey, TimelineEntry> {
  const created = { time: viewModel.createdAt, actor: viewModel.createdBy }
  const submitted =
    viewModel.submittedAt ||
    viewModel.status === "submitted" ||
    viewModel.status === "approved" ||
    viewModel.status === "rejected" ||
    viewModel.status === "fulfilled"
      ? {
          time: viewModel.submittedAt ?? viewModel.updatedAt,
          actor: viewModel.submittedBy ?? "Unknown User",
        }
      : null
  const approved =
    viewModel.approvedAt || viewModel.status === "approved" || viewModel.status === "fulfilled"
      ? {
          time: viewModel.approvedAt ?? viewModel.updatedAt,
          actor: viewModel.approvedBy ?? "Unknown User",
        }
      : null
  const rejected =
    viewModel.rejectedAt || viewModel.status === "rejected"
      ? {
          time: viewModel.rejectedAt ?? viewModel.updatedAt,
          actor: viewModel.rejectedBy ?? "Unknown User",
        }
      : null
  const fulfilled =
    viewModel.fulfilledAt || viewModel.status === "fulfilled"
      ? {
          time: viewModel.fulfilledAt ?? viewModel.updatedAt,
          actor: viewModel.fulfilledBy ?? "Unknown User",
        }
      : null

  return {
    created,
    submitted,
    approved,
    rejected,
    fulfilled,
  }
}

function mapPurchaseOrderToViewModel(purchaseOrder: PurchaseOrderApiRow): PurchaseOrderViewModel {
  const status = normalizeStatus(purchaseOrder.status)
  const createdBy = purchaseOrder.requestedByUser ?? "Unknown User"

  return {
    id: purchaseOrder.id,
    status,
    supplierName: purchaseOrder.supplierName ?? "Unknown Supplier",
    requestedBy: purchaseOrder.requestedByDepartment ?? createdBy,
    createdAt: purchaseOrder.createdAt,
    updatedAt: purchaseOrder.updatedAt,
    lineItems: purchaseOrder.lineItems ?? [],
    totalPrice: sumOrderTotal(purchaseOrder.lineItems ?? []),
    timeline: buildTimeline({
      status,
      createdAt: purchaseOrder.createdAt,
      updatedAt: purchaseOrder.updatedAt,
      createdBy,
      submittedAt: purchaseOrder.submittedAt,
      submittedBy: purchaseOrder.submittedBy,
      approvedAt: purchaseOrder.approvedAt,
      approvedBy: purchaseOrder.approvedBy,
      rejectedAt: purchaseOrder.rejectedAt,
      rejectedBy: purchaseOrder.rejectedBy,
      fulfilledAt: purchaseOrder.fulfilledAt,
      fulfilledBy: purchaseOrder.fulfilledBy,
    }),
  }
}

async function getPurchaseOrder(id: string): Promise<PurchaseOrderViewModel | null> {
  const response = await apiFetch(`/purchase-orders/${encodeURIComponent(id)}`)
  if (response.status === 404) {
    return null
  }
  if (!response.ok) {
    throw new Error("Failed to fetch purchase order")
  }

  const payload = (await response.json()) as GatewayResponse<PurchaseOrderApiRow>
  if (!payload.body) {
    return null
  }

  return mapPurchaseOrderToViewModel(payload.body)
}

const getStatusBadge = (status: PurchaseOrderViewModel["status"]) => {
  if (status === "fulfilled") {
    return <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">Fulfilled</Badge>
  }
  if (status === "rejected") {
    return <Badge className="bg-rose-600 text-white hover:bg-rose-600">Rejected</Badge>
  }
  if (status === "approved") {
    return <Badge className="bg-sky-600 text-white hover:bg-sky-600">Approved</Badge>
  }
  if (status === "submitted") {
    return <Badge className="bg-amber-500 text-black hover:bg-amber-500">Submitted</Badge>
  }

  return <Badge variant="secondary">Draft</Badge>
}

const getTimelineIcon = (key: PurchaseOrderTimelineKey, active: boolean) => {
  if (!active) return <CircleDashed className="size-4 text-muted-foreground" />
  if (key === "rejected") return <CircleX className="size-4 text-rose-600" />
  return <CircleCheckBig className="size-4 text-emerald-600" />
}

const getTimelineMeta = (key: PurchaseOrderTimelineKey, entry: TimelineEntry) => {
  if (!entry) return "Pending"
  if (key === "created") return `By ${entry.actor}`
  if (key === "submitted") return `By ${entry.actor}`
  if (key === "approved") return `By ${entry.actor}`
  if (key === "rejected") return `By ${entry.actor}`
  return `By ${entry.actor}`
}

const SinglePurchaseOrderPageComponent = async ({ id }: IProps) => {
  const purchaseOrder = await getPurchaseOrder(id)

  if (!purchaseOrder) {
    return (
      <div className="flex w-full max-w-full min-w-0 flex-col gap-4">
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
    <div className="flex w-full max-w-full min-w-0 flex-col gap-6">
      <Link
        href="/purchase-orders"
        className="text-muted-foreground hover:text-foreground inline-flex w-fit items-center gap-2 text-sm"
      >
        <ArrowLeft className="size-4" />
        Back to purchase orders
      </Link>

      <Card className="overflow-hidden border-none bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white shadow-lg">
        <CardHeader className="gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-white/15 text-white hover:bg-white/15">PO #{purchaseOrder.id}</Badge>
              {getStatusBadge(purchaseOrder.status)}
            </div>
            <StatusActionButtons
              purchaseOrderId={purchaseOrder.id}
              status={purchaseOrder.status}
            />
          </div>
          <CardTitle className="text-2xl leading-tight md:text-3xl">{purchaseOrder.supplierName}</CardTitle>
          <p className="text-sm text-slate-200">Requested by {purchaseOrder.requestedBy}</p>
        </CardHeader>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-xs">Order Total</p>
            <p className="mt-1 text-2xl font-semibold">{currencyFormatter.format(purchaseOrder.totalPrice)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-xs">Line Items</p>
            <p className="mt-1 text-2xl font-semibold">{purchaseOrder.lineItems.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-xs">Created At</p>
            <p className="mt-1 text-sm font-semibold">
              {dateTimeFormatter.format(new Date(purchaseOrder.createdAt))}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-xs">Requested By</p>
            <p className="mt-1 text-sm font-semibold">{purchaseOrder.requestedBy}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Purchase Order Items</CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-muted-foreground border-b text-left">
                    <th className="px-6 py-3 font-medium">Item ID</th>
                    <th className="px-6 py-3 font-medium">Item Name</th>
                    <th className="px-6 py-3 font-medium text-right">Qty</th>
                    <th className="px-6 py-3 font-medium text-right">Rate</th>
                    <th className="px-6 py-3 font-medium text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {purchaseOrder.lineItems.map((item) => {
                    const quantity = typeof item.quantity === "number" ? item.quantity : 0
                    const rate = typeof item.unitPrice === "number" ? item.unitPrice : 0
                    const total = quantity * rate
                    return (
                      <tr key={item.id} className="border-b last:border-b-0">
                        <td className="px-6 py-4 font-medium">{item.id}</td>
                        <td className="px-6 py-4">{item.item ?? "-"}</td>
                        <td className="px-6 py-4 text-right">{quantity}</td>
                        <td className="px-6 py-4 text-right">{currencyFormatter.format(rate)}</td>
                        <td className="px-6 py-4 text-right font-semibold">{currencyFormatter.format(total)}</td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr>
                    <td className="px-6 py-4" colSpan={3} />
                    <td className="px-6 py-4 text-right text-sm font-semibold">Grand Total</td>
                    <td className="px-6 py-4 text-right text-lg font-bold">
                      {currencyFormatter.format(purchaseOrder.totalPrice)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Timeline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {timelineOrder.map((step) => {
              const entry = purchaseOrder.timeline[step]
              const isActive = Boolean(entry)
              return (
                <div key={step} className="flex items-start gap-3">
                  <div className="mt-0.5">{getTimelineIcon(step, isActive)}</div>
                  <div>
                    <p className="text-sm font-semibold capitalize">{step}</p>
                    <p className="text-muted-foreground text-xs">
                      {isActive && entry ? dateTimeFormatter.format(new Date(entry.time)) : "Not yet"}
                    </p>
                    <p className="text-muted-foreground text-xs">{getTimelineMeta(step, entry)}</p>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>

      <div className="text-muted-foreground inline-flex items-center gap-2 text-sm">
        <CalendarClock className="size-4" />
        Last updated from timeline data
      </div>
    </div>
  )
}

export default SinglePurchaseOrderPageComponent
