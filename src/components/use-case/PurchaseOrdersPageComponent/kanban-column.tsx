"use client"

import { Droppable } from "@hello-pangea/dnd"
import { CirclePlus, GripVertical } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import { KanbanPurchaseOrderCard } from "./kanban-purchase-order-card"
import { KanbanColumn, KanbanPurchaseOrder } from "./types"

type KanbanColumnProps = {
  column: KanbanColumn
  purchaseOrders: KanbanPurchaseOrder[]
  dragEnabled: boolean
}

export function KanbanColumnComponent({
  column,
  purchaseOrders,
  dragEnabled,
}: KanbanColumnProps) {
  return (
    <div className="bg-muted/50 flex h-full min-h-[380px] w-[300px] shrink-0 flex-col rounded-2xl p-3">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold">{column.title}</h2>
          <Badge variant="outline" className="rounded-lg px-2 py-0.5 text-xs">
            {purchaseOrders.length}
          </Badge>
        </div>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon-sm" className="text-muted-foreground rounded-full">
            <GripVertical />
          </Button>
          <Button variant="ghost" size="icon-sm" className="text-muted-foreground rounded-full">
            <CirclePlus />
          </Button>
        </div>
      </div>

      <Droppable droppableId={column.id} isDropDisabled={!dragEnabled}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              "flex flex-1 flex-col gap-3 rounded-xl transition-colors",
              snapshot.isDraggingOver && "bg-background/70"
            )}
          >
            {purchaseOrders.map((purchaseOrder, index) => (
              <KanbanPurchaseOrderCard
                key={purchaseOrder.id}
                purchaseOrder={purchaseOrder}
                index={index}
                dragEnabled={dragEnabled}
              />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  )
}
