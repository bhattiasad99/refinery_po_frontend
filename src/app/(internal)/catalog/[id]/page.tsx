import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, CircleCheckBig, CircleX } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DUMMY_CATALOG } from "@/constants/DUMMY_CATALOG"

type CatalogDetailPageProps = {
  params: Promise<{ id: string }>
}

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
})

const formatSpecLabel = (key: string) =>
  key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (s) => s.toUpperCase())
    .trim()

export default async function CatalogDetailPage({ params }: CatalogDetailPageProps) {
  const { id } = await params
  const item = DUMMY_CATALOG.find((catalogItem) => catalogItem.id === id)

  if (!item) notFound()

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <Link
        href="/catalog"
        className="text-muted-foreground hover:text-foreground inline-flex w-fit items-center gap-2 text-sm"
      >
        <ArrowLeft className="size-4" />
        Back to catalog
      </Link>

      <Card className="overflow-hidden border-none bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
        <CardHeader className="gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-white/15 text-white hover:bg-white/15">{item.category}</Badge>
            <Badge variant="outline" className="border-white/25 text-white">
              {item.id}
            </Badge>
            {item.inStock ? (
              <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">
                <CircleCheckBig className="size-3.5" />
                In Stock
              </Badge>
            ) : (
              <Badge className="bg-rose-600 text-white hover:bg-rose-600">
                <CircleX className="size-3.5" />
                Backorder
              </Badge>
            )}
          </div>
          <CardTitle className="text-2xl leading-tight md:text-3xl">{item.name}</CardTitle>
          <p className="max-w-4xl text-sm text-slate-200">{item.description}</p>
        </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <p className="text-muted-foreground text-xs">Price</p>
            <CardTitle className="text-xl">{currencyFormatter.format(item.priceUsd)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <p className="text-muted-foreground text-xs">Lead Time</p>
            <CardTitle className="text-xl">{item.leadTimeDays} days</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <p className="text-muted-foreground text-xs">Supplier</p>
            <CardTitle className="text-xl">{item.supplier}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <p className="text-muted-foreground text-xs">Model</p>
            <CardTitle className="text-xl">{item.model}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-1">
          <CardHeader>
            <CardTitle>General Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">ID</span>
              <span className="font-medium">{item.id}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Category</span>
              <span className="font-medium">{item.category}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Supplier</span>
              <span className="font-medium">{item.supplier}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Manufacturer</span>
              <span className="font-medium">{item.manufacturer}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Model</span>
              <span className="font-medium">{item.model}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Availability</span>
              <span className="font-medium">{item.inStock ? "In Stock" : "Backorder"}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Technical Specifications</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {Object.entries(item.specs).map(([key, value]) => (
              <div key={key} className="bg-muted/35 rounded-lg border px-3 py-2">
                <p className="text-muted-foreground text-[11px] uppercase tracking-wide">
                  {formatSpecLabel(key)}
                </p>
                <p className="mt-1 text-sm font-medium">{String(value)}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {item.compatibleWith && item.compatibleWith.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Compatible Items</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {item.compatibleWith.map((compatibleId) => (
              <Link key={compatibleId} href={`/catalog/${compatibleId}`}>
                <Badge variant="outline" className="hover:bg-muted">
                  {compatibleId}
                </Badge>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
