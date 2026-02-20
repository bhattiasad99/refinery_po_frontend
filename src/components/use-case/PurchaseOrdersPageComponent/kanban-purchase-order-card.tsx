"use client"

import { Draggable } from "@hello-pangea/dnd"
import { useRouter } from "next/navigation"

import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

import { KanbanPurchaseOrder } from "./types"

type KanbanPurchaseOrderCardProps = {
  purchaseOrder: KanbanPurchaseOrder
  index: number
  dragEnabled: boolean
}

export function KanbanPurchaseOrderCard({
  purchaseOrder,
  index,
  dragEnabled,
}: KanbanPurchaseOrderCardProps) {
  const router = useRouter()

  return (
    <Draggable
      draggableId={purchaseOrder.id}
      index={index}
      isDragDisabled={!dragEnabled}
    >
      {(provided, snapshot) => (
        <Card
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={cn(
            "gap-0 rounded-xl py-0 transition-colors cursor-pointer hover:bg-muted/70",
            snapshot.isDragging && "ring-2 ring-primary/20 shadow-md"
          )}
          onClick={() => router.push(`/purchase-orders/${purchaseOrder.id}`)}
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-base font-semibold leading-snug">
                  {purchaseOrder.supplierName}
                </h3>
                <p className="text-muted-foreground text-xs">
                  {purchaseOrder.id}
                </p>
                <p className="text-muted-foreground text-xs">
                  {purchaseOrder.numberOfItems} Items
                </p>
                <p className="text-sm">
                  Requested By: {purchaseOrder.requestedBy}
                </p>
              </div>
              <p className="text-sm font-medium">${purchaseOrder.totalPrice}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </Draggable>
  )
}
