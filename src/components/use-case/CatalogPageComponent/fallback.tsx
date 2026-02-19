import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function CatalogPageFallback() {
  return (
    <div className="flex flex-1 flex-col gap-5">
      <Card className="border-none bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white shadow-lg">
        <CardHeader className="space-y-3">
          <Skeleton className="h-6 w-20 bg-white/20" />
          <Skeleton className="h-9 w-80 bg-white/20" />
          <Skeleton className="h-4 w-full max-w-3xl bg-white/20" />
        </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={`metric-${index}`}>
            <CardContent className="pt-6">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="mt-2 h-8 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border/70 overflow-hidden">
        <CardHeader className="flex flex-col gap-4 pb-1 md:flex-row md:items-end md:justify-between">
          <Skeleton className="h-7 w-36" />
          <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row">
            <Skeleton className="h-10 w-60" />
            <Skeleton className="h-10 w-40" />
            <Skeleton className="h-10 w-28" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="overflow-x-auto rounded-lg border">
            <div className="space-y-2 p-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <Skeleton key={`row-${index}`} className="h-11 w-full" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
