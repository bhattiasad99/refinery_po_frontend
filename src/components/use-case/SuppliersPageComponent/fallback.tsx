import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function SuppliersPageFallback() {
  return (
    <div className="flex flex-1 flex-col gap-5">
      <Card className="border-none bg-gradient-to-r from-cyan-900 via-slate-900 to-emerald-900 text-white shadow-lg">
        <CardHeader className="space-y-3">
          <Skeleton className="h-6 w-24 bg-white/20" />
          <Skeleton className="h-9 w-80 bg-white/20" />
          <Skeleton className="h-4 w-full max-w-3xl bg-white/20" />
        </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={`metric-${index}`}>
            <CardContent className="pt-6">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="mt-2 h-8 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden border-border/70">
        <CardHeader className="flex flex-col gap-4 pb-1 md:flex-row md:items-end md:justify-between">
          <Skeleton className="h-7 w-44" />
          <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row">
            <Skeleton className="h-10 w-56" />
            <Skeleton className="h-10 w-28" />
            <Skeleton className="h-10 w-28" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="overflow-x-auto rounded-lg border">
            <div className="space-y-2 p-4">
              {Array.from({ length: 7 }).map((_, index) => (
                <Skeleton key={`row-${index}`} className="h-11 w-full" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
