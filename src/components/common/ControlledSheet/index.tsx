"use client"

import { ReactNode } from "react"

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

type ControlledSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
  side?: "top" | "right" | "bottom" | "left"
}

export default function ControlledSheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  side = "right",
}: ControlledSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side={side} className="flex h-full flex-col gap-0 sm:max-w-md">
        <SheetHeader className="border-b pb-4">
          <SheetTitle>{title}</SheetTitle>
          {description ? <SheetDescription>{description}</SheetDescription> : null}
        </SheetHeader>
        <div className="flex-1 overflow-y-auto p-4">{children}</div>
        {footer ? <SheetFooter className="border-t bg-background/95">{footer}</SheetFooter> : null}
      </SheetContent>
    </Sheet>
  )
}
