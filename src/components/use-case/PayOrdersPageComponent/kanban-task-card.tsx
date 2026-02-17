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
}

const progressColorClassByValue = (progress: number) => {
  if (progress >= 100) return "text-emerald-600"
  if (progress >= 50) return "text-amber-600"
  return "text-muted-foreground"
}

export function KanbanTaskCard({ task, index }: KanbanTaskCardProps) {
  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <Card
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={cn(
            "gap-0 rounded-2xl py-0",
            snapshot.isDragging && "ring-2 ring-primary/20 shadow-md"
          )}
        >
          <CardContent className="space-y-4 p-5">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold leading-snug">{task.title}</h3>
              <p className="text-muted-foreground line-clamp-2 text-sm leading-relaxed">
                {task.description}
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex -space-x-2">
                {task.assignees.map((assignee) => (
                  <Badge
                    key={assignee}
                    variant="outline"
                    className="size-8 rounded-full bg-muted p-0 text-xs font-semibold"
                  >
                    {assignee}
                  </Badge>
                ))}
              </div>

              <Badge
                variant="outline"
                className={cn(
                  "rounded-xl px-2.5 py-1 text-sm font-medium",
                  progressColorClassByValue(task.progress)
                )}
              >
                <Circle className="size-3" />
                {task.progress}%
              </Badge>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <Badge variant="outline" className="rounded-lg px-3 py-1 text-sm">
                {task.priority}
              </Badge>

              <div className="text-muted-foreground flex items-center gap-3 text-sm">
                <span className="inline-flex items-center gap-1.5">
                  <Paperclip className="size-4" />
                  {task.attachmentsCount}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <MessageSquareText className="size-4" />
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
