type FeatureFlagsConfig = {
  enableKanbanDragDrop: boolean
}

export function getFeatureFlags(): FeatureFlagsConfig {
  return {
    enableKanbanDragDrop: process.env.NEXT_PUBLIC_ENABLE_KANBAN_DND === "true",
  }
}
