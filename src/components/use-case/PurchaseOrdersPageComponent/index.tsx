"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { DragDropContext, DropResult } from "@hello-pangea/dnd"
import { ListFilter, PlusCircle, Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { KanbanColumnComponent } from "./kanban-column"
import { initialKanbanBoard } from "./mock-data"
import { KanbanBoardState, KanbanColumn, KanbanColumnId } from "./types"

const KANBAN_DRAG_ENABLED = false

const movePurchaseOrderWithinColumn = (
  column: KanbanColumn,
  sourceIndex: number,
  destinationIndex: number
) => {
  const nextPurchaseOrderIds = [...column.purchaseOrderIds]
  const [movedPurchaseOrderId] = nextPurchaseOrderIds.splice(sourceIndex, 1)
  nextPurchaseOrderIds.splice(destinationIndex, 0, movedPurchaseOrderId)

  return {
    ...column,
    purchaseOrderIds: nextPurchaseOrderIds,
  }
}

export default function PurchaseOrdersPageComponent() {
  const [board, setBoard] = useState<KanbanBoardState>(initialKanbanBoard)

  const onDragEnd = (result: DropResult) => {
    const { destination, source } = result

    if (!destination) return

    const sourceColumnId = source.droppableId as KanbanColumnId
    const destinationColumnId = destination.droppableId as KanbanColumnId

    if (
      sourceColumnId === destinationColumnId &&
      source.index === destination.index
    ) {
      return
    }

    const sourceColumn = board.columns[sourceColumnId]
    const destinationColumn = board.columns[destinationColumnId]

    if (!sourceColumn || !destinationColumn) return

    if (sourceColumnId === destinationColumnId) {
      const reorderedColumn = movePurchaseOrderWithinColumn(
        sourceColumn,
        source.index,
        destination.index
      )

      setBoard((previousBoard) => ({
        ...previousBoard,
        columns: {
          ...previousBoard.columns,
          [reorderedColumn.id]: reorderedColumn,
        },
      }))
      return
    }

    // Move a purchase order from one column to another.
    const sourcePurchaseOrderIds = [...sourceColumn.purchaseOrderIds]
    const destinationPurchaseOrderIds = [...destinationColumn.purchaseOrderIds]
    const [movedPurchaseOrderId] = sourcePurchaseOrderIds.splice(source.index, 1)
    destinationPurchaseOrderIds.splice(destination.index, 0, movedPurchaseOrderId)

    setBoard((previousBoard) => ({
      ...previousBoard,
      columns: {
        ...previousBoard.columns,
        [sourceColumnId]: {
          ...sourceColumn,
          purchaseOrderIds: sourcePurchaseOrderIds,
        },
        [destinationColumnId]: {
          ...destinationColumn,
          purchaseOrderIds: destinationPurchaseOrderIds,
        },
      },
    }))
  }

  const orderedColumns = useMemo(
    () => board.columnOrder.map((columnId) => board.columns[columnId]),
    [board.columnOrder, board.columns]
  )

  return (
    <Tabs defaultValue="board" className="flex w-full max-w-full flex-col gap-6 min-w-0">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <TabsList>
          <TabsTrigger value="board">Board</TabsTrigger>
          <TabsTrigger value="list">List</TabsTrigger>
          <TabsTrigger value="table">Table</TabsTrigger>
        </TabsList>

        <div className="flex w-full flex-wrap items-center gap-3 md:w-auto">
          <div className="relative w-full md:w-72">
            <Search className="text-muted-foreground pointer-events-none absolute left-3 top-2.5 size-4" />
            <Input placeholder="Search purchase orders..." className="h-10 pl-9" />
          </div>
          <Button variant="outline" className="h-10 px-4">
            <ListFilter />
            Filters
          </Button>
          <Button asChild className="h-10 px-4">
            <Link href="/purchase-orders/new">
              <PlusCircle />
              Create Purchase Order
            </Link>
          </Button>
        </div>
      </div>

      <TabsContent value="board" className="min-w-0">
        <DragDropContext
          onDragEnd={
            KANBAN_DRAG_ENABLED ? onDragEnd : () => undefined
          }
        >
          <div className="overflow-x-auto pb-2">
            <div className="flex min-w-max gap-3">
              {orderedColumns.map((column) => (
                <KanbanColumnComponent
                  key={column.id}
                  column={column}
                  purchaseOrders={column.purchaseOrderIds.map((purchaseOrderId) => board.purchaseOrders[purchaseOrderId])}
                  dragEnabled={KANBAN_DRAG_ENABLED}
                />
              ))}
            </div>
          </div>
        </DragDropContext>
      </TabsContent>

      <TabsContent value="list">
        <Card className="rounded-2xl">
          <CardContent className="p-6 text-sm text-muted-foreground">
            List view placeholder. Switch back to Board to use drag and drop.
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="table">
        <Card className="rounded-2xl">
          <CardContent className="p-6 text-sm text-muted-foreground">
            Table view placeholder. Switch back to Board to use drag and drop.
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
