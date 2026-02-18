"use client"

import { type ReactNode } from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

type StepShellProps = {
  title: string
  description: string
  children: ReactNode
}

export function StepShell({
  title,
  description,
  children,
}: StepShellProps) {
  return (
    <div className={cn("animate-in fade-in-0 duration-300")}>
      <Card>
        <CardHeader className="gap-2">
          <CardTitle>{title}</CardTitle>
          <p className="text-muted-foreground text-sm">{description}</p>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </div>
  )
}
