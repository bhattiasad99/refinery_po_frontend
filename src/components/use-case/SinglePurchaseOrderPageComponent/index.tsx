import { CalendarClock, CircleCheckBig, CircleDashed, CircleX } from "lucide-react"

import TableScrollContainer from "@/components/common/table-scroll-container"
import {
  InternalHero,
  InternalPageBackLink,
  InternalPageTemplate,
} from "@/components/templates/internal-page-template"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { apiFetch } from "@/lib/api-fetch"
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
  statusHistory: PurchaseOrderStatusHistoryApiRow[]
}

type PurchaseOrderStatusHistoryApiRow = {
  id: string
  fromStatus: string | null
  toStatus: string
  changedBy: string | null
  changedAt: string
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
  statusHistory: PurchaseOrderStatusHistoryApiRow[]
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

function normalizeHistoryRows(rows: PurchaseOrderStatusHistoryApiRow[]): PurchaseOrderStatusHistoryApiRow[] {
  return [...rows].sort(
    (a, b) => new Date(a.changedAt).getTime() - new Date(b.changedAt).getTime()
  )
}

function getLatestHistoryForStatus(
  rows: PurchaseOrderStatusHistoryApiRow[],
  status: PurchaseOrderTimelineKey
): PurchaseOrderStatusHistoryApiRow | null {
  const targetStatus = status.toUpperCase()
  for (let index = rows.length - 1; index >= 0; index -= 1) {
    const row = rows[index]
    if ((row.toStatus ?? "").toUpperCase() === targetStatus) {
      return row
    }
  }
  return null
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
  statusHistory: PurchaseOrderStatusHistoryApiRow[]
}): Record<PurchaseOrderTimelineKey, TimelineEntry> {
  const submittedHistory = getLatestHistoryForStatus(viewModel.statusHistory, "submitted")
  const approvedHistory = getLatestHistoryForStatus(viewModel.statusHistory, "approved")
  const rejectedHistory = getLatestHistoryForStatus(viewModel.statusHistory, "rejected")
  const fulfilledHistory = getLatestHistoryForStatus(viewModel.statusHistory, "fulfilled")

  const created = { time: viewModel.createdAt, actor: viewModel.createdBy }
  const submitted =
    submittedHistory ||
    viewModel.submittedAt ||
    viewModel.status === "submitted" ||
    viewModel.status === "approved" ||
    viewModel.status === "rejected" ||
    viewModel.status === "fulfilled"
      ? {
          time: submittedHistory?.changedAt ?? viewModel.submittedAt ?? viewModel.updatedAt,
          actor: submittedHistory?.changedBy ?? viewModel.submittedBy ?? "Unknown User",
        }
      : null
  const approved =
    approvedHistory || viewModel.approvedAt || viewModel.status === "approved" || viewModel.status === "fulfilled"
      ? {
          time: approvedHistory?.changedAt ?? viewModel.approvedAt ?? viewModel.updatedAt,
          actor: approvedHistory?.changedBy ?? viewModel.approvedBy ?? "Unknown User",
        }
      : null
  const rejected =
    rejectedHistory || viewModel.rejectedAt || viewModel.status === "rejected"
      ? {
          time: rejectedHistory?.changedAt ?? viewModel.rejectedAt ?? viewModel.updatedAt,
          actor: rejectedHistory?.changedBy ?? viewModel.rejectedBy ?? "Unknown User",
        }
      : null
  const fulfilled =
    fulfilledHistory || viewModel.fulfilledAt || viewModel.status === "fulfilled"
      ? {
          time: fulfilledHistory?.changedAt ?? viewModel.fulfilledAt ?? viewModel.updatedAt,
          actor: fulfilledHistory?.changedBy ?? viewModel.fulfilledBy ?? "Unknown User",
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
  const normalizedStatusHistory = normalizeHistoryRows(purchaseOrder.statusHistory ?? [])

  return {
    id: purchaseOrder.id,
    status,
    supplierName: purchaseOrder.supplierName ?? "Unknown Supplier",
    requestedBy: purchaseOrder.requestedByDepartment ?? createdBy,
    createdAt: purchaseOrder.createdAt,
    updatedAt: purchaseOrder.updatedAt,
    lineItems: purchaseOrder.lineItems ?? [],
    totalPrice: sumOrderTotal(purchaseOrder.lineItems ?? []),
    statusHistory: normalizedStatusHistory,
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
      statusHistory: normalizedStatusHistory,
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

const getTimelineMeta = (_key: PurchaseOrderTimelineKey, entry: TimelineEntry) => {
  if (!entry) return "Pending"
  return `By ${entry.actor}`
}

const SinglePurchaseOrderPageComponent = async ({ id }: IProps) => {
  const purchaseOrder = await getPurchaseOrder(id)

  if (!purchaseOrder) {
    return (
      <InternalPageTemplate className="gap-4">
        <InternalPageBackLink href="/purchase-orders" label="Back to purchase orders" />
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-lg font-semibold">Purchase order not found</p>
            <p className="text-muted-foreground mt-1 text-sm">
              No purchase order exists for id {id}.
            </p>
          </CardContent>
        </Card>
      </InternalPageTemplate>
    )
  }

  return (
    <InternalPageTemplate>
      <InternalPageBackLink href="/purchase-orders" label="Back to purchase orders" />

      <InternalHero
        title={purchaseOrder.supplierName}
        description={`Requested by ${purchaseOrder.requestedBy}`}
        actions={
          <StatusActionButtons
            purchaseOrderId={purchaseOrder.id}
            status={purchaseOrder.status}
          />
        }
        meta={
          <>
            <Badge className="bg-white/15 text-white hover:bg-white/15">PO #{purchaseOrder.id}</Badge>
            {getStatusBadge(purchaseOrder.status)}
          </>
        }
      />

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
            <TableScrollContainer innerClassName="min-w-[760px]">
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
            </TableScrollContainer>
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

      <Card>
        <CardHeader>
          <CardTitle>Status Audit Trail</CardTitle>
        </CardHeader>
        <CardContent>
          {purchaseOrder.statusHistory.length === 0 ? (
            <p className="text-muted-foreground text-sm">No status transitions recorded yet.</p>
          ) : (
            <TableScrollContainer innerClassName="min-w-[560px]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-muted-foreground border-b text-left">
                    <th className="px-3 py-2 font-medium">Changed At</th>
                    <th className="px-3 py-2 font-medium">From</th>
                    <th className="px-3 py-2 font-medium">To</th>
                    <th className="px-3 py-2 font-medium">Changed By</th>
                  </tr>
                </thead>
                <tbody>
                  {[...purchaseOrder.statusHistory].reverse().map((entry) => (
                    <tr key={entry.id} className="border-b last:border-b-0">
                      <td className="px-3 py-2">{dateTimeFormatter.format(new Date(entry.changedAt))}</td>
                      <td className="px-3 py-2">{entry.fromStatus ?? "-"}</td>
                      <td className="px-3 py-2">{entry.toStatus}</td>
                      <td className="px-3 py-2">{entry.changedBy ?? "Unknown User"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableScrollContainer>
          )}
        </CardContent>
      </Card>

      <div className="text-muted-foreground inline-flex items-center gap-2 text-sm">
        <CalendarClock className="size-4" />
        Last updated from timeline data
      </div>
    </InternalPageTemplate>
  )
}

export default SinglePurchaseOrderPageComponent
