"use client"

import { Draggable } from "@hello-pangea/dnd"
import { Circle, MessageSquareText, Paperclip } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

import { KanbanTask } from "./types"

type KanbanTaskCardProps = {
  task: KanbanTask
  index: number
  dragEnabled: boolean
}

const progressColorClassByValue = (progress: number) => {
  if (progress >= 100) return "text-emerald-600"
  if (progress >= 50) return "text-amber-600"
  return "text-muted-foreground"
}

export function KanbanTaskCard({
  task,
  index,
  dragEnabled,
}: KanbanTaskCardProps) {
  return (
    <Draggable draggableId={task.id} index={index} isDragDisabled={!dragEnabled}>
      {(provided, snapshot) => (
        <Card
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={cn(
            "gap-0 rounded-xl py-0",
            snapshot.isDragging && "ring-2 ring-primary/20 shadow-md"
          )}
        >
          <CardContent className="space-y-3 p-4">
            <div className="space-y-1.5">
              <h3 className="text-base font-semibold leading-snug">{task.title}</h3>
              <p className="text-muted-foreground line-clamp-2 text-xs leading-relaxed">
                {task.description}
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex -space-x-2">
                {task.assignees.map((assignee) => (
                  <Badge
                    key={assignee}
                    variant="outline"
                    className="size-7 rounded-full bg-muted p-0 text-[10px] font-semibold"
                  >
                    {assignee}
                  </Badge>
                ))}
              </div>

              <Badge
                variant="outline"
                className={cn(
                  "rounded-xl px-2 py-0.5 text-xs font-medium",
                  progressColorClassByValue(task.progress)
                )}
              >
                <Circle className="size-3" />
                {task.progress}%
              </Badge>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <Badge variant="outline" className="rounded-lg px-2.5 py-0.5 text-xs">
                {task.priority}
              </Badge>

              <div className="text-muted-foreground flex items-center gap-2.5 text-xs">
                <span className="inline-flex items-center gap-1.5">
                  <Paperclip className="size-3.5" />
                  {task.attachmentsCount}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <MessageSquareText className="size-3.5" />
                  {task.commentsCount}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </Draggable>
  )
}
