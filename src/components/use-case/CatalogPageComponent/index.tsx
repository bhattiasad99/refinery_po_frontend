"use client"

import Link from "next/link"
import { ColumnDef } from "@tanstack/react-table"

import { DataTable } from "@/components/use-case/DashboardPageComponent/data-table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DUMMY_CATALOG } from "@/constants/DUMMY_CATALOG"

type CatalogItem = (typeof DUMMY_CATALOG)[number]

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
})

const catalogColumns: ColumnDef<CatalogItem>[] = [
  {
    accessorKey: "id",
    header: "Catalog Item",
    cell: ({ row }) => {
      const item = row.original
      return (
        <div className="space-y-1">
          <Link href={`/catalog/${item.id}`} className="text-primary text-xs font-semibold">
            {item.id}
          </Link>
          <p className="line-clamp-2 font-medium">{item.name}</p>
        </div>
      )
    },
  },
  {
    accessorKey: "category",
    header: "Category",
    cell: ({ row }) => <Badge variant="outline">{row.original.category}</Badge>,
  },
  {
    accessorKey: "supplier",
    header: "Supplier",
    cell: ({ row }) => row.original.supplier,
  },
  {
    accessorKey: "leadTimeDays",
    header: () => <div className="w-full text-right">Lead Time</div>,
    cell: ({ row }) => <div className="text-right">{row.original.leadTimeDays} days</div>,
  },
  {
    accessorKey: "priceUsd",
    header: () => <div className="w-full text-right">Price</div>,
    cell: ({ row }) => (
      <div className="text-right font-semibold">{currencyFormatter.format(row.original.priceUsd)}</div>
    ),
  },
  {
    accessorKey: "inStock",
    header: "Stock",
    cell: ({ row }) =>
      row.original.inStock ? (
        <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">In Stock</Badge>
      ) : (
        <Badge variant="secondary">Backorder</Badge>
      ),
  },
]

export default function CatalogPageComponent() {
  const totalItems = DUMMY_CATALOG.length
  const inStockCount = DUMMY_CATALOG.filter((item) => item.inStock).length
  const avgLeadTime = Math.round(
    DUMMY_CATALOG.reduce((acc, item) => acc + item.leadTimeDays, 0) / totalItems
  )
  const avgPrice = Math.round(
    DUMMY_CATALOG.reduce((acc, item) => acc + item.priceUsd, 0) / totalItems
  )

  return (
    <div className="flex flex-1 flex-col gap-5">
      <Card className="border-none bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white shadow-lg">
        <CardHeader className="space-y-3">
          <Badge className="w-fit bg-white/15 text-white hover:bg-white/15">Catalog</Badge>
          <CardTitle className="text-2xl md:text-3xl">
            Industrial Catalog Intelligence
          </CardTitle>
          <p className="max-w-3xl text-sm text-slate-200">
            Explore standardized catalog items, compare supplier options, and open each item for complete technical details.
          </p>
        </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-xs">Total Items</p>
            <p className="mt-1 text-2xl font-semibold">{totalItems}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-xs">In Stock</p>
            <p className="mt-1 text-2xl font-semibold">{inStockCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-xs">Avg Lead Time</p>
            <p className="mt-1 text-2xl font-semibold">{avgLeadTime} days</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-xs">Avg Price</p>
            <p className="mt-1 text-2xl font-semibold">{currencyFormatter.format(avgPrice)}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/70 overflow-hidden">
        <CardHeader className="pb-1">
          <CardTitle className="text-lg">Catalog Items</CardTitle>
        </CardHeader>
        <CardContent className="px-0 pb-2">
          <DataTable data={DUMMY_CATALOG} columns={catalogColumns} showViewTabs={false} showAddAction={false} />
        </CardContent>
      </Card>
    </div>
  )
}
