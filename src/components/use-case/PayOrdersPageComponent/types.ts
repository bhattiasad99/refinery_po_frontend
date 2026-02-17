export type KanbanColumnId =
  | "draft"
  | "submitted"
  | "approved"
  | "rejected"
  | "fulfilled"

export type TaskPriority = "High" | "Medium" | "Low"

export type KanbanTask = {
  id: string
  title: string
  description: string
  assignees: string[]
  progress: number
  priority: TaskPriority
  attachmentsCount: number
  commentsCount: number
}

export type KanbanColumn = {
  id: KanbanColumnId
  title: string
  taskIds: string[]
}

export type KanbanBoardState = {
  columns: Record<KanbanColumnId, KanbanColumn>
  tasks: Record<string, KanbanTask>
  columnOrder: KanbanColumnId[]
}
