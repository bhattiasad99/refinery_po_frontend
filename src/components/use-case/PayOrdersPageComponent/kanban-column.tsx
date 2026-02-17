"use client"

import { Droppable } from "@hello-pangea/dnd"
import { CirclePlus, GripVertical } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import { KanbanTaskCard } from "./kanban-task-card"
import { KanbanColumn, KanbanTask } from "./types"

type KanbanColumnProps = {
  column: KanbanColumn
  tasks: KanbanTask[]
}

export function KanbanColumnComponent({ column, tasks }: KanbanColumnProps) {
  return (
    <div className="bg-muted/50 flex h-full min-h-[420px] w-[360px] shrink-0 flex-col rounded-2xl p-4">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold">{column.title}</h2>
          <Badge variant="outline" className="rounded-lg px-2 py-1 text-sm">
            {tasks.length}
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

      <Droppable droppableId={column.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              "flex flex-1 flex-col gap-4 rounded-xl transition-colors",
              snapshot.isDraggingOver && "bg-background/70"
            )}
          >
            {tasks.map((task, index) => (
              <KanbanTaskCard key={task.id} task={task} index={index} />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  )
}
