import type { ReactNode } from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

type InternalPageTemplateProps = {
  children: ReactNode
  className?: string
}

type InternalPageBackLinkProps = {
  href: string
  label: string
}

type InternalHeroProps = {
  eyebrow?: string
  title: string
  description?: string
  actions?: ReactNode
  meta?: ReactNode
  className?: string
  contentClassName?: string
}

export function InternalPageTemplate({
  children,
  className,
}: InternalPageTemplateProps) {
  return (
    <div className={cn("flex w-full max-w-full min-w-0 flex-col gap-6", className)}>
      {children}
    </div>
  )
}

export function InternalPageBackLink({
  href,
  label,
}: InternalPageBackLinkProps) {
  return (
    <Link
      href={href}
      className="text-muted-foreground hover:text-foreground inline-flex w-fit items-center gap-2 text-sm"
    >
      <ArrowLeft className="size-4" />
      {label}
    </Link>
  )
}

export function InternalHero({
  eyebrow,
  title,
  description,
  actions,
  meta,
  className,
  contentClassName,
}: InternalHeroProps) {
  return (
    <Card
      className={cn(
        "overflow-hidden border-none bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white shadow-lg",
        className
      )}
    >
      <CardHeader className={cn("gap-4", contentClassName)}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          {eyebrow ? (
            <Badge className="bg-white/15 text-white hover:bg-white/15">{eyebrow}</Badge>
          ) : (
            <div />
          )}
          {actions}
        </div>
        {meta ? <div className="flex flex-wrap items-center gap-2">{meta}</div> : null}
        <CardTitle className="text-2xl leading-tight md:text-3xl">{title}</CardTitle>
        {description ? <p className="text-sm text-slate-200">{description}</p> : null}
      </CardHeader>
    </Card>
  )
}
