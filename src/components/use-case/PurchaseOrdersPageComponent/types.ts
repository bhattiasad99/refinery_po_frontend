export type KanbanColumnId =
  | "draft"
  | "submitted"
  | "approved"
  | "rejected"
  | "fulfilled"

export type KanbanPurchaseOrder = {
  id: string
  poNumber: string | null
  supplierName: string
  numberOfItems: number
  requestedBy: string
  totalPrice: number
}

export type KanbanColumn = {
  id: KanbanColumnId
  title: string
  purchaseOrderIds: string[]
}

export type KanbanBoardState = {
  columns: Record<KanbanColumnId, KanbanColumn>
  purchaseOrders: Record<string, KanbanPurchaseOrder>
  columnOrder: KanbanColumnId[]
}
