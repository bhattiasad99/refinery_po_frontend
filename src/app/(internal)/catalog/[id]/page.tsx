import Link from "next/link"
import { notFound } from "next/navigation"
import {
  ArrowLeft,
  CircleCheckBig,
  CircleX,
  PackageCheck,
  PackageX,
  Truck,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { apiFetch } from "@/lib/api-fetch"

type CatalogDetailPageProps = {
  params: Promise<{ id: string }>
}

type GatewayResponse<T> = {
  body?: T
  message?: string
}

type CatalogDetail = {
  id: string
  name: string
  categoryName: string
  supplierName: string
  createdBy: string
  manufacturer: string | null
  model: string
  description: string | null
  leadTimeDays: number
  priceUsd: number
  inStock: boolean
  compatibleWith: string[] | null
  [key: string]: unknown
}

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
})

function formatLabel(key: string): string {
  if (key === "id") return "ID"
  if (key === "priceUsd") return "Price (USD)"
  if (key === "leadTimeDays") return "Lead Time (Days)"
  if (key === "inStock") return "In Stock"

  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (s) => s.toUpperCase())
    .trim()
}

function normalizeCatalogDetail(payload: unknown): CatalogDetail | null {
  if (!payload || typeof payload !== "object") {
    return null
  }
  return payload as CatalogDetail
}

function isVisibleValue(value: unknown): boolean {
  if (value === null || value === undefined) {
    return false
  }
  if (typeof value === "string") {
    return value.trim().length > 0
  }
  if (Array.isArray(value)) {
    return value.length > 0
  }
  return true
}

function renderValue(value: unknown): string {
  if (Array.isArray(value)) {
    return value.join(", ")
  }
  if (typeof value === "boolean") {
    return value ? "Yes" : "No"
  }
  if (typeof value === "number") {
    return Number.isFinite(value) ? String(value) : "-"
  }
  if (value === null || value === undefined) {
    return "-"
  }
  return String(value)
}

async function loadCatalogItem(id: string): Promise<CatalogDetail | null> {
  const response = await apiFetch(`/catalog/${encodeURIComponent(id)}`)
  const payload = (await response.json()) as GatewayResponse<unknown>

  if (response.status === 404) {
    return null
  }
  if (!response.ok) {
    throw new Error(payload.message ?? "Failed to load catalog item")
  }

  return normalizeCatalogDetail(payload.body)
}

export default async function CatalogDetailPage({ params }: CatalogDetailPageProps) {
  const { id } = await params
  const item = await loadCatalogItem(id)

  if (!item) notFound()

  const coreFieldKeys = new Set([
    "id",
    "name",
    "categoryName",
    "supplierName",
    "createdBy",
    "manufacturer",
    "model",
    "description",
    "leadTimeDays",
    "priceUsd",
    "inStock",
    "compatibleWith",
  ])

  const specEntries = Object.entries(item)
    .filter(([key, value]) => !coreFieldKeys.has(key) && isVisibleValue(value))
    .sort(([a], [b]) => a.localeCompare(b))

  const generalEntries: Array<{ label: string; value: string }> = [
    { label: "ID", value: item.id },
    { label: "Category", value: item.categoryName },
    { label: "Supplier", value: item.supplierName },
    { label: "Manufacturer", value: item.manufacturer || "-" },
    { label: "Model", value: item.model || "-" },
    { label: "Created By", value: item.createdBy || "-" },
  ]

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 pb-6">
      <Link
        href="/catalog"
        className="text-muted-foreground hover:text-foreground inline-flex w-fit items-center gap-2 text-sm"
      >
        <ArrowLeft className="size-4" />
        Back to catalog
      </Link>

      <Card className="overflow-hidden border-none bg-gradient-to-r from-cyan-950 via-slate-900 to-blue-950 text-white shadow-lg">
        <CardHeader className="gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-white/15 text-white hover:bg-white/15">{item.categoryName}</Badge>
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
          <p className="max-w-4xl text-sm text-slate-200">
            {item.description || "No description provided for this catalog item."}
          </p>
        </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="border-slate-200/80">
          <CardHeader className="pb-2">
            <p className="text-muted-foreground text-xs">Price</p>
            <CardTitle className="text-xl">{currencyFormatter.format(item.priceUsd)}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-slate-200/80">
          <CardHeader className="pb-2">
            <p className="text-muted-foreground text-xs">Lead Time</p>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Truck className="h-4 w-4 text-cyan-600" />
              {item.leadTimeDays} days
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-slate-200/80">
          <CardHeader className="pb-2">
            <p className="text-muted-foreground text-xs">Supplier</p>
            <CardTitle className="text-xl">{item.supplierName}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-slate-200/80">
          <CardHeader className="pb-2">
            <p className="text-muted-foreground text-xs">Availability</p>
            <CardTitle className="flex items-center gap-2 text-xl">
              {item.inStock ? (
                <>
                  <PackageCheck className="h-4 w-4 text-emerald-600" />
                  In Stock
                </>
              ) : (
                <>
                  <PackageX className="h-4 w-4 text-rose-600" />
                  Backorder
                </>
              )}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-1 border-slate-200/80">
          <CardHeader>
            <CardTitle>General Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {generalEntries.map((entry) => (
              <div key={entry.label} className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">{entry.label}</span>
                <span className="max-w-[68%] text-right font-medium">{entry.value}</span>
              </div>
            ))}
            <Separator />
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Price (USD)</span>
              <span className="font-medium">{currencyFormatter.format(item.priceUsd)}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Lead Time</span>
              <span className="font-medium">{item.leadTimeDays} days</span>
            </div>
          </CardContent>
        </Card>

        <Card className="xl:col-span-2 border-slate-200/80">
          <CardHeader>
            <CardTitle>Technical Specifications (Complete)</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {specEntries.length > 0 ? (
              specEntries.map(([key, value]) => (
                <div key={key} className="bg-muted/35 rounded-lg border px-3 py-2">
                  <p className="text-muted-foreground text-[11px] uppercase tracking-wide">
                    {formatLabel(key)}
                  </p>
                  <p className="mt-1 text-sm font-medium break-words">{renderValue(value)}</p>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground rounded-lg border border-dashed p-4 text-sm">
                No technical specification fields are available for this item.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-200/80">
        <CardHeader>
          <CardTitle>All Available Attributes</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Object.entries(item)
            .filter(([, value]) => isVisibleValue(value))
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([key, value]) => (
              <div key={key} className="bg-muted/30 rounded-lg border px-3 py-2">
                <p className="text-muted-foreground text-[11px] uppercase tracking-wide">
                  {formatLabel(key)}
                </p>
                <p className="mt-1 text-sm font-medium break-words">{renderValue(value)}</p>
              </div>
            ))}
        </CardContent>
      </Card>

      {item.compatibleWith && item.compatibleWith.length > 0 ? (
        <Card className="border-slate-200/80">
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
      ) : null}
    </div>
  )
}
