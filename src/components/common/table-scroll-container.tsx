import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

type TableScrollContainerProps = {
  children: ReactNode
  className?: string
  innerClassName?: string
}

export default function TableScrollContainer({
  children,
  className,
  innerClassName,
}: TableScrollContainerProps) {
  return (
    <div className={cn("overflow-x-auto", className)}>
      <div className={cn("min-w-full", innerClassName)}>{children}</div>
    </div>
  )
}
