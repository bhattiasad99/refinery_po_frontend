"use client"

const STORAGE_KEY = "po-kanban-optimistic-updates-v1"
export const OPTIMISTIC_KANBAN_EVENT = "po:kanban:optimistic-update"

export type OptimisticKanbanUpdate = {
  id: string
  status: string | null
  supplierName: string
  requestedByUser: string
  numberOfItems: number
  totalPrice: number
}

function readStoredUpdates(): OptimisticKanbanUpdate[] {
  if (typeof window === "undefined") {
    return []
  }

  const raw = window.sessionStorage.getItem(STORAGE_KEY)
  if (!raw) {
    return []
  }

  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed.filter((entry): entry is OptimisticKanbanUpdate => {
      if (!entry || typeof entry !== "object") {
        return false
      }
      const candidate = entry as Record<string, unknown>
      return typeof candidate.id === "string"
    })
  } catch {
    return []
  }
}

function writeStoredUpdates(updates: OptimisticKanbanUpdate[]): void {
  if (typeof window === "undefined") {
    return
  }

  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(updates))
}

export function enqueueOptimisticKanbanUpdate(update: OptimisticKanbanUpdate): void {
  if (typeof window === "undefined") {
    return
  }

  const current = readStoredUpdates()
  const next = [update, ...current.filter((entry) => entry.id !== update.id)]
  writeStoredUpdates(next)
  window.dispatchEvent(new CustomEvent<OptimisticKanbanUpdate>(OPTIMISTIC_KANBAN_EVENT, { detail: update }))
}

export function consumeOptimisticKanbanUpdates(): OptimisticKanbanUpdate[] {
  if (typeof window === "undefined") {
    return []
  }

  const updates = readStoredUpdates()
  window.sessionStorage.removeItem(STORAGE_KEY)
  return updates
}
