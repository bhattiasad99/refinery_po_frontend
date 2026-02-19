"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { DragDropContext, DropResult } from "@hello-pangea/dnd"
import { PlusCircle, Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { handleGatewayUnavailableLogout } from "@/lib/client-session"

import { KanbanColumnComponent } from "./kanban-column"
import { KanbanBoardState, KanbanColumn, KanbanColumnId } from "./types"

const KANBAN_DRAG_ENABLED = false
const SEARCH_DEBOUNCE_MS = 250
const COLUMN_ORDER: KanbanColumnId[] = ["draft", "submitted", "approved", "rejected", "fulfilled"]

function createEmptyBoard(): KanbanBoardState {
  return {
    purchaseOrders: {},
    columns: {
      draft: { id: "draft", title: "Draft", purchaseOrderIds: [] },
      submitted: { id: "submitted", title: "Submitted", purchaseOrderIds: [] },
      approved: { id: "approved", title: "Approved", purchaseOrderIds: [] },
      rejected: { id: "rejected", title: "Rejected", purchaseOrderIds: [] },
      fulfilled: { id: "fulfilled", title: "Fulfilled", purchaseOrderIds: [] },
    },
    columnOrder: COLUMN_ORDER,
  }
}

type PurchaseOrderListRow = {
  id: string
  poNumber: string | null
  status: string | null
  supplierName: string | null
  requestedByUser: string | null
  lineItems?: Array<unknown> | null
}

const normalize = (value: string) => value.toLowerCase().trim()

const fuzzyIncludes = (source: string, query: string) => {
  if (!query) return true

  let queryIndex = 0
  const normalizedSource = normalize(source)
  const normalizedQuery = normalize(query)

  for (let sourceIndex = 0; sourceIndex < normalizedSource.length; sourceIndex += 1) {
    if (normalizedSource[sourceIndex] === normalizedQuery[queryIndex]) {
      queryIndex += 1
      if (queryIndex === normalizedQuery.length) return true
    }
  }

  return false
}

const purchaseOrderMatchesQuery = (purchaseOrder: KanbanBoardState["purchaseOrders"][string], query: string) => {
  if (!query.trim()) return true

  return [
    purchaseOrder.id,
    purchaseOrder.supplierName,
    purchaseOrder.requestedBy,
    String(purchaseOrder.numberOfItems),
    String(purchaseOrder.totalPrice),
  ].some((field) => fuzzyIncludes(field, query))
}

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

function mapStatusToColumnId(status: string | null): KanbanColumnId {
  const normalized = (status ?? "").toLowerCase()
  if (normalized === "submitted") return "submitted"
  if (normalized === "approved") return "approved"
  if (normalized === "rejected") return "rejected"
  if (normalized === "fulfilled") return "fulfilled"
  return "draft"
}

function toNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0
}

async function loadBoardFromApi(signal?: AbortSignal): Promise<KanbanBoardState> {
  const response = await fetch("/api/purchase-orders", { cache: "no-store", signal })
  let payload: unknown = null
  try {
    payload = await response.json()
  } catch {
    payload = null
  }

  if (handleGatewayUnavailableLogout(response.status, payload)) {
    throw new Error("Session ended because API gateway is unavailable.")
  }

  if (!response.ok) {
    throw new Error("Failed to load purchase orders")
  }

  const rows = payload as PurchaseOrderListRow[]
  const purchaseOrders: KanbanBoardState["purchaseOrders"] = {}
  const columnBuckets: Record<KanbanColumnId, string[]> = {
    draft: [],
    submitted: [],
    approved: [],
    rejected: [],
    fulfilled: [],
  }

  for (const row of rows) {
    const lineItems = Array.isArray(row.lineItems) ? row.lineItems : []
    const totalPrice = lineItems.reduce<number>((runningTotal, item) => {
      if (!item || typeof item !== "object") {
        return runningTotal
      }
      const lineItem = item as Record<string, unknown>
      return runningTotal + toNumber(lineItem.quantity) * toNumber(lineItem.unitPrice)
    }, 0)

    purchaseOrders[row.id] = {
      id: row.id,
      poNumber: row.poNumber,
      supplierName: row.supplierName ?? "Unknown Supplier",
      requestedBy: row.requestedByUser ?? "Unknown Requester",
      numberOfItems: lineItems.length,
      totalPrice,
    }

    const columnId = mapStatusToColumnId(row.status)
    columnBuckets[columnId].push(row.id)
  }

  return {
    purchaseOrders,
    columns: {
      draft: { id: "draft", title: "Draft", purchaseOrderIds: columnBuckets.draft },
      submitted: { id: "submitted", title: "Submitted", purchaseOrderIds: columnBuckets.submitted },
      approved: { id: "approved", title: "Approved", purchaseOrderIds: columnBuckets.approved },
      rejected: { id: "rejected", title: "Rejected", purchaseOrderIds: columnBuckets.rejected },
      fulfilled: { id: "fulfilled", title: "Fulfilled", purchaseOrderIds: columnBuckets.fulfilled },
    },
    columnOrder: COLUMN_ORDER,
  }
}

export default function PurchaseOrdersPageComponent() {
  const [board, setBoard] = useState<KanbanBoardState>(() => createEmptyBoard())
  const [isLoading, setIsLoading] = useState(true)
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false)
  const [searchDraft, setSearchDraft] = useState("")
  const [search, setSearch] = useState("")
  const isInitialLoad = isLoading && !hasLoadedOnce

  useEffect(() => {
    const controller = new AbortController()
    const hydrateBoard = async () => {
      setIsLoading(true)
      try {
        const nextBoard = await loadBoardFromApi(controller.signal)
        if (!controller.signal.aborted) {
          setBoard(nextBoard)
          setHasLoadedOnce(true)
        }
      } catch (error) {
        if ((error as Error).name === "AbortError") {
          return
        }
        if (!controller.signal.aborted) {
          setBoard(createEmptyBoard())
        }
      } finally {
        if (controller.signal.aborted) {
          return
        }
        setIsLoading(false)
      }
    }
    void hydrateBoard()
    return () => {
      controller.abort()
    }
  }, [])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setSearch(searchDraft)
    }, SEARCH_DEBOUNCE_MS)

    return () => window.clearTimeout(timeoutId)
  }, [searchDraft])

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

  const filteredColumnPurchaseOrderIds = useMemo(
    () =>
      Object.fromEntries(
        orderedColumns.map((column) => [
          column.id,
          column.purchaseOrderIds.filter((purchaseOrderId) =>
            purchaseOrderMatchesQuery(board.purchaseOrders[purchaseOrderId], search)
          ),
        ])
      ) as Record<KanbanColumnId, string[]>,
    [board.purchaseOrders, orderedColumns, search]
  )

  return (
    <div className="flex h-[calc(100svh-var(--header-height)-2rem)] w-full max-w-full min-w-0 flex-col gap-6 overflow-hidden lg:h-[calc(100svh-var(--header-height)-3rem)]">
      <div className="flex flex-wrap items-center md:justify-end w-full gap-4">
        <div className="flex w-full flex-wrap md:justify-end items-center gap-3 md:w-auto">
          <div className="relative w-full md:w-72">
            <Search className="text-muted-foreground pointer-events-none absolute left-3 top-2.5 size-4" />
            <Input
              placeholder="Search purchase orders..."
              className="h-10 pl-9"
              value={searchDraft}
              onChange={(event) => setSearchDraft(event.target.value)}
              disabled={isInitialLoad}
            />
          </div>
          {/* <Button variant="outline" className="h-10 px-4">
            <ListFilter />
            Filters
          </Button> */}
          <Button asChild className="h-10 px-4">
            <Link href="/purchase-orders/new">
              <PlusCircle />
              Create Purchase Order
            </Link>
          </Button>
        </div>
      </div>

      <div className="min-w-0 min-h-0 flex-1">
        <DragDropContext
          onDragEnd={
            KANBAN_DRAG_ENABLED ? onDragEnd : () => undefined
          }
        >
          <div className="h-full overflow-x-auto overflow-y-auto pb-2">
            <div className="flex min-h-full min-w-max gap-3">
              {isInitialLoad
                ? COLUMN_ORDER.map((columnId) => {
                  const column = board.columns[columnId]
                  return (
                    <div key={column.id} className="bg-muted/50 flex h-full min-h-[380px] w-[300px] shrink-0 flex-col rounded-2xl p-3">
                      <div className="mb-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <h2 className="text-base font-semibold">{column.title}</h2>
                          <Skeleton className="h-5 w-8 rounded-lg" />
                        </div>
                      </div>
                      <div className="flex flex-1 flex-col gap-3 rounded-xl">
                        <Skeleton className="h-24 w-full rounded-xl" />
                        <Skeleton className="h-24 w-full rounded-xl" />
                        <Skeleton className="h-24 w-full rounded-xl" />
                      </div>
                    </div>
                  )
                })
                : orderedColumns.map((column) => (
                <KanbanColumnComponent
                  key={column.id}
                  column={column}
                  purchaseOrders={filteredColumnPurchaseOrderIds[column.id].map((purchaseOrderId) => board.purchaseOrders[purchaseOrderId])}
                  dragEnabled={KANBAN_DRAG_ENABLED}
                />
                ))}
            </div>
          </div>
        </DragDropContext>
      </div>
    </div>
  )
}
