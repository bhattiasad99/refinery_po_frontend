import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function CatalogDetailLoading() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <Skeleton className="h-5 w-40" />

      <Card className="overflow-hidden border-none bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <CardHeader className="gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <Skeleton className="h-6 w-24 bg-white/20" />
            <Skeleton className="h-6 w-20 bg-white/20" />
            <Skeleton className="h-6 w-24 bg-white/20" />
          </div>
          <Skeleton className="h-9 w-3/4 bg-white/20" />
          <Skeleton className="h-4 w-full bg-white/20" />
        </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={`metric-${index}`}>
            <CardHeader className="pb-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-7 w-24" />
            </CardHeader>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-1">
          <CardHeader>
            <Skeleton className="h-7 w-28" />
          </CardHeader>
          <CardContent className="space-y-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={`general-${index}`} className="h-5 w-full" />
            ))}
          </CardContent>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader>
            <Skeleton className="h-7 w-52" />
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {Array.from({ length: 8 }).map((_, index) => (
              <Skeleton key={`spec-${index}`} className="h-16 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
