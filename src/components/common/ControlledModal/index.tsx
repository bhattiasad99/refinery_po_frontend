"use client"

import { type ReactNode } from "react"
import { Dialog } from "radix-ui"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

type ControlledModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: ReactNode
  title: string
  description?: string
  className?: string
}

export default function ControlledModal({
  open,
  onOpenChange,
  children,
  title,
  description,
  className,
}: ControlledModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[1px]" />
        <Dialog.Content
          className={cn(
            "bg-background fixed top-1/2 left-1/2 z-50 flex max-h-[90svh] w-[min(92vw,640px)] -translate-x-1/2 -translate-y-1/2 flex-col rounded-xl border p-0 shadow-2xl",
            className
          )}
        >
          <div className="border-b px-5 py-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <Dialog.Title className="text-base font-semibold">{title}</Dialog.Title>
                {description ? (
                  <Dialog.Description className="text-muted-foreground mt-1 text-sm">
                    {description}
                  </Dialog.Description>
                ) : null}
              </div>
              <Dialog.Close className="text-muted-foreground hover:text-foreground rounded-md p-1">
                <X className="size-4" />
              </Dialog.Close>
            </div>
          </div>

          <div className="overflow-y-auto p-5">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
