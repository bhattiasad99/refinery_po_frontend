"use client"

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

const moveTaskWithinColumn = (
  column: KanbanColumn,
  sourceIndex: number,
  destinationIndex: number
) => {
  const nextTaskIds = [...column.taskIds]
  const [movedTaskId] = nextTaskIds.splice(sourceIndex, 1)
  nextTaskIds.splice(destinationIndex, 0, movedTaskId)

  return {
    ...column,
    taskIds: nextTaskIds,
  }
}

export default function PayOrdersPageComponent() {
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
      const reorderedColumn = moveTaskWithinColumn(
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

    // Move a task from one column to another.
    const sourceTaskIds = [...sourceColumn.taskIds]
    const destinationTaskIds = [...destinationColumn.taskIds]
    const [movedTaskId] = sourceTaskIds.splice(source.index, 1)
    destinationTaskIds.splice(destination.index, 0, movedTaskId)

    setBoard((previousBoard) => ({
      ...previousBoard,
      columns: {
        ...previousBoard.columns,
        [sourceColumnId]: {
          ...sourceColumn,
          taskIds: sourceTaskIds,
        },
        [destinationColumnId]: {
          ...destinationColumn,
          taskIds: destinationTaskIds,
        },
      },
    }))
  }

  const orderedColumns = useMemo(
    () => board.columnOrder.map((columnId) => board.columns[columnId]),
    [board.columnOrder, board.columns]
  )

  return (
    <Tabs defaultValue="board" className="gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <TabsList>
          <TabsTrigger value="board">Board</TabsTrigger>
          <TabsTrigger value="list">List</TabsTrigger>
          <TabsTrigger value="table">Table</TabsTrigger>
        </TabsList>

        <div className="flex w-full flex-wrap items-center gap-3 md:w-auto">
          <div className="relative w-full md:w-72">
            <Search className="text-muted-foreground pointer-events-none absolute left-3 top-2.5 size-4" />
            <Input placeholder="Search tasks..." className="h-10 pl-9" />
          </div>
          <Button variant="outline" className="h-10 px-4">
            <ListFilter />
            Filters
          </Button>
          <Button className="h-10 px-4">
            <PlusCircle />
            Add Board
          </Button>
        </div>
      </div>

      <TabsContent value="board">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="overflow-x-auto pb-2">
            <div className="flex min-w-max gap-4">
              {orderedColumns.map((column) => (
                <KanbanColumnComponent
                  key={column.id}
                  column={column}
                  tasks={column.taskIds.map((taskId) => board.tasks[taskId])}
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
