/* eslint-disable @typescript-eslint/no-explicit-any */
import Link from "next/link"
import { ArrowLeft, CalendarClock, CircleCheckBig, CircleDashed, CircleX } from "lucide-react"

import { MOCK_PURCHASE_ORDERS } from "./mock-data"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type IProps = {
    id: string
}

type PurchaseOrder = (typeof MOCK_PURCHASE_ORDERS)[number]

const currencyFormatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
})

const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
})

const getStatusBadge = (status: PurchaseOrder["status"]) => {
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

const getHeaderActions = (status: PurchaseOrder["status"]) => {
    if (status === "draft") return ["Edit", "Submit"]
    if (status === "submitted") return ["Approve", "Reject"]
    if (status === "approved") return ["Fulfill"]
    return []
}

const timelineOrder = ["created", "submitted", "approved", "rejected", "fulfilled"] as const

const getTimelineIcon = (key: (typeof timelineOrder)[number], active: boolean) => {
    if (!active) return <CircleDashed className="size-4 text-muted-foreground" />
    if (key === "rejected") return <CircleX className="size-4 text-rose-600" />
    return <CircleCheckBig className="size-4 text-emerald-600" />
}

const getTimelineMeta = (
    key: (typeof timelineOrder)[number],
    entry: PurchaseOrder["timeline"][typeof key]
) => {
    if (!entry) return "Pending"

    if (key === "created") return `By ${(entry as any).createdBy}`
    if (key === "submitted") return `By ${(entry as any).submittedBy}`
    if (key === "approved") return `By ${(entry as any).approvedBy}`
    if (key === "rejected") return `By ${(entry as any).rejectedBy}`
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return `By ${(entry as any).fulfilledBy}`
}

const SinglePurchaseOrderPageComponent = ({ id }: IProps) => {
    const purchaseOrder = MOCK_PURCHASE_ORDERS.find(
        (order) => String(order.id) === id
    )

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

    const headerActions = getHeaderActions(purchaseOrder.status)

    return (
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
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
                            <Badge className="bg-white/15 text-white hover:bg-white/15">
                                PO #{purchaseOrder.id}
                            </Badge>
                            {getStatusBadge(purchaseOrder.status)}
                        </div>
                        {headerActions.length > 0 && (
                            <div className="flex flex-wrap items-center gap-2">
                                {headerActions.map((action) => (
                                    action === "Edit" ? (
                                        <Button
                                            key={action}
                                            asChild
                                            size="sm"
                                            variant="secondary"
                                            className="bg-white/15 text-white hover:bg-white/25"
                                        >
                                            <Link href={`/purchase-orders/${purchaseOrder.id}/edit`}>{action}</Link>
                                        </Button>
                                    ) : (
                                        <Button
                                            key={action}
                                            size="sm"
                                            variant={action === "Reject" ? "destructive" : "secondary"}
                                            className={
                                                action === "Reject"
                                                    ? ""
                                                    : action === "Submit" || action === "Approve" || action === "Fulfill"
                                                        ? "bg-emerald-600 text-white hover:bg-emerald-700"
                                                        : "bg-white/15 text-white hover:bg-white/25"
                                            }
                                        >
                                            {action}
                                        </Button>
                                    )
                                ))}
                            </div>
                        )}
                    </div>
                    <CardTitle className="text-2xl leading-tight md:text-3xl">
                        {purchaseOrder.supplier_name}
                    </CardTitle>
                    <p className="text-sm text-slate-200">
                        Requested by {purchaseOrder.requested_by}
                    </p>
                </CardHeader>
            </Card>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardContent className="pt-6">
                        <p className="text-muted-foreground text-xs">Order Total</p>
                        <p className="mt-1 text-2xl font-semibold">
                            {currencyFormatter.format(purchaseOrder.total_price_of_order)}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <p className="text-muted-foreground text-xs">Line Items</p>
                        <p className="mt-1 text-2xl font-semibold">
                            {purchaseOrder.purchase_order_details.length}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <p className="text-muted-foreground text-xs">Created At</p>
                        <p className="mt-1 text-sm font-semibold">
                            {dateTimeFormatter.format(new Date(purchaseOrder.created_at))}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <p className="text-muted-foreground text-xs">Requested By</p>
                        <p className="mt-1 text-sm font-semibold">{purchaseOrder.requested_by}</p>
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
                                    {purchaseOrder.purchase_order_details.map((item) => (
                                        <tr key={item.id} className="border-b last:border-b-0">
                                            <td className="px-6 py-4 font-medium">{item.id}</td>
                                            <td className="px-6 py-4">{item.item_name}</td>
                                            <td className="px-6 py-4 text-right">{item.quantity}</td>
                                            <td className="px-6 py-4 text-right">{currencyFormatter.format(item.rate)}</td>
                                            <td className="px-6 py-4 text-right font-semibold">
                                                {currencyFormatter.format(item.total_cost)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr>
                                        <td className="px-6 py-4" colSpan={3} />
                                        <td className="px-6 py-4 text-right text-sm font-semibold">Grand Total</td>
                                        <td className="px-6 py-4 text-right text-lg font-bold">
                                            {currencyFormatter.format(purchaseOrder.total_price_of_order)}
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
                                            {isActive ? dateTimeFormatter.format(new Date((entry as any).time)) : "Not yet"}
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
