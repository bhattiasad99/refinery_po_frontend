"use client"

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

type SupplierCatalogItem = {
  id: string
  name: string
  categoryName: string
  model: string
  leadTimeDays: number
  priceUsd: number
  inStock: boolean
}

type SupplierWithItems = {
  supplier: string
  items: SupplierCatalogItem[]
}

type SuppliersListResponse = {
  data: SupplierWithItems[]
  total: number
  page: number
  limit: number
}

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
})

const ROWS_PER_PAGE_OPTIONS = [5, 10, 20, 50] as const

export default function SuppliersPageComponent() {
  const [suppliers, setSuppliers] = useState<SupplierWithItems[]>([])
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const [searchDraft, setSearchDraft] = useState("")
  const [search, setSearch] = useState("")
  const [expandedSuppliers, setExpandedSuppliers] = useState<Record<string, boolean>>({})

  const totalPages = useMemo(() => Math.max(Math.ceil(total / limit), 1), [total, limit])
  const isInitialLoad = isLoading && !hasLoadedOnce
  const totalVisibleItems = useMemo(
    () => suppliers.reduce((sum, supplier) => sum + supplier.items.length, 0),
    [suppliers]
  )
  const totalInStockItems = useMemo(
    () =>
      suppliers.reduce(
        (sum, supplier) => sum + supplier.items.filter((item) => item.inStock).length,
        0
      ),
    [suppliers]
  )

  const fetchSuppliers = useCallback(
    async (signal?: AbortSignal) => {
      setIsLoading(true)
      setErrorMessage(null)

      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: String(limit),
        })

        if (search.trim().length > 0) {
          params.set("search", search.trim())
        }

        const response = await fetch(`/api/suppliers?${params.toString()}`, {
          method: "GET",
          cache: "no-store",
          signal,
        })

        const payload = (await response.json()) as SuppliersListResponse | { message?: string }
        if (!response.ok) {
          const errorPayload = payload as { message?: string }
          setErrorMessage(errorPayload.message ?? "Failed to load suppliers")
          setSuppliers([])
          return
        }

        const suppliersPayload = payload as SuppliersListResponse
        setSuppliers(Array.isArray(suppliersPayload.data) ? suppliersPayload.data : [])
        setTotal(Number.isFinite(suppliersPayload.total) ? suppliersPayload.total : 0)
        setHasLoadedOnce(true)
      } catch (error) {
        if ((error as Error).name === "AbortError") {
          return
        }
        setErrorMessage("Failed to load suppliers")
        setSuppliers([])
      } finally {
        setIsLoading(false)
      }
    },
    [limit, page, search]
  )

  useEffect(() => {
    const controller = new AbortController()
    void fetchSuppliers(controller.signal)
    return () => controller.abort()
  }, [fetchSuppliers])

  useEffect(() => {
    setExpandedSuppliers({})
  }, [page, limit, search])

  function onApplyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPage(1)
    setSearch(searchDraft)
  }

  function clearFilters() {
    setSearchDraft("")
    setSearch("")
    setPage(1)
  }

  function goToPreviousPage() {
    setPage((current) => Math.max(current - 1, 1))
  }

  function goToNextPage() {
    setPage((current) => Math.min(current + 1, totalPages))
  }

  function toggleSupplierItems(supplierName: string) {
    setExpandedSuppliers((current) => ({
      ...current,
      [supplierName]: !current[supplierName],
    }))
  }

  return (
    <div className="flex flex-1 flex-col gap-5">
      <Card className="border-none bg-gradient-to-r from-cyan-900 via-slate-900 to-emerald-900 text-white shadow-lg">
        <CardHeader className="space-y-3">
          <Badge className="w-fit bg-white/15 text-white hover:bg-white/15">Suppliers</Badge>
          <CardTitle className="text-2xl md:text-3xl">Supplier Portfolio Overview</CardTitle>
          <p className="max-w-3xl text-sm text-cyan-50/90">
            Compare suppliers at a glance, then expand each row to inspect nested catalog items
            with full commercial and stock context.
          </p>
        </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-xs">Suppliers (Filtered)</p>
            {isInitialLoad ? (
              <Skeleton className="mt-2 h-8 w-20" />
            ) : (
              <p className="mt-1 text-2xl font-semibold">{total}</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-xs">Items in Current Page</p>
            {isInitialLoad ? (
              <Skeleton className="mt-2 h-8 w-24" />
            ) : (
              <p className="mt-1 text-2xl font-semibold">{totalVisibleItems}</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-xs">In Stock (Current Page)</p>
            {isInitialLoad ? (
              <Skeleton className="mt-2 h-8 w-24" />
            ) : (
              <p className="mt-1 text-2xl font-semibold">{totalInStockItems}</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden border-border/70">
        <CardHeader className="flex flex-col gap-4 pb-1 md:flex-row md:items-end md:justify-between">
          <CardTitle className="text-lg">Suppliers & Nested Items</CardTitle>
          <form onSubmit={onApplyFilters} className="flex w-full flex-col gap-3 md:w-auto md:flex-row">
            <div className="flex min-w-56 flex-col gap-2">
              <Label htmlFor="supplier-search">Search Supplier</Label>
              <Input
                id="supplier-search"
                placeholder="Supplier name..."
                value={searchDraft}
                onChange={(event) => setSearchDraft(event.target.value)}
              />
            </div>
            <div className="flex items-end gap-2">
              <Button type="submit" disabled={isLoading}>
                Apply
              </Button>
              <Button type="button" variant="outline" onClick={clearFilters} disabled={isLoading}>
                Clear
              </Button>
            </div>
          </form>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading && hasLoadedOnce ? (
            <div className="h-1 w-full overflow-hidden rounded bg-cyan-100">
              <div className="h-full w-1/3 animate-pulse rounded bg-cyan-700" />
            </div>
          ) : null}
          {errorMessage ? (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {errorMessage}
            </div>
          ) : null}

          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Supplier</TableHead>
                  <TableHead className="text-right">Items</TableHead>
                  <TableHead className="text-right">In Stock</TableHead>
                  <TableHead className="text-right">Avg Price</TableHead>
                  <TableHead className="w-[120px] text-right">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isInitialLoad ? (
                  Array.from({ length: 6 }).map((_, index) => (
                    <TableRow key={`skeleton-${index}`}>
                      <TableCell>
                        <Skeleton className="h-4 w-48" />
                      </TableCell>
                      <TableCell className="text-right">
                        <Skeleton className="ml-auto h-4 w-8" />
                      </TableCell>
                      <TableCell className="text-right">
                        <Skeleton className="ml-auto h-4 w-8" />
                      </TableCell>
                      <TableCell className="text-right">
                        <Skeleton className="ml-auto h-4 w-20" />
                      </TableCell>
                      <TableCell className="text-right">
                        <Skeleton className="ml-auto h-8 w-20" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : suppliers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      No suppliers found.
                    </TableCell>
                  </TableRow>
                ) : (
                  suppliers.flatMap((supplierRow) => {
                    const inStockCount = supplierRow.items.filter((item) => item.inStock).length
                    const avgPrice =
                      supplierRow.items.length > 0
                        ? supplierRow.items.reduce((sum, item) => sum + item.priceUsd, 0) /
                        supplierRow.items.length
                        : 0
                    const isExpanded = expandedSuppliers[supplierRow.supplier] ?? false

                    return [
                      <TableRow key={supplierRow.supplier}>
                        <TableCell className="font-medium">{supplierRow.supplier}</TableCell>
                        <TableCell className="text-right">{supplierRow.items.length}</TableCell>
                        <TableCell className="text-right">{inStockCount}</TableCell>
                        <TableCell className="text-right">{currencyFormatter.format(avgPrice)}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleSupplierItems(supplierRow.supplier)}
                          >
                            {isExpanded ? "Hide Items" : "View Items"}
                          </Button>
                        </TableCell>
                      </TableRow>,
                      ...(isExpanded
                        ? [
                          <TableRow key={`${supplierRow.supplier}-items`}>
                            <TableCell colSpan={5} className="bg-muted/20 p-0">
                              <div className="space-y-3 p-4">
                                <p className="text-sm font-medium">
                                  Items supplied by {supplierRow.supplier}
                                </p>
                                <div className="overflow-x-auto rounded-md border bg-background">
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead>Item</TableHead>
                                        <TableHead>Category</TableHead>
                                        <TableHead>Model</TableHead>
                                        <TableHead className="text-right">Lead Time</TableHead>
                                        <TableHead className="text-right">Price</TableHead>
                                        <TableHead>Stock</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {supplierRow.items.map((item) => (
                                        <TableRow key={item.id}>
                                          <TableCell>
                                            <div className="space-y-1">
                                              <Link
                                                href={`/catalog/${item.id}`}
                                                className="text-primary text-xs font-semibold"
                                              >
                                                {item.id}
                                              </Link>
                                              <p className="line-clamp-2 font-medium">{item.name}</p>
                                            </div>
                                          </TableCell>
                                          <TableCell>
                                            <Badge variant="outline">{item.categoryName}</Badge>
                                          </TableCell>
                                          <TableCell>{item.model}</TableCell>
                                          <TableCell className="text-right">
                                            {item.leadTimeDays} days
                                          </TableCell>
                                          <TableCell className="text-right font-semibold">
                                            {currencyFormatter.format(item.priceUsd)}
                                          </TableCell>
                                          <TableCell>
                                            {item.inStock ? (
                                              <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">
                                                In Stock
                                              </Badge>
                                            ) : (
                                              <Badge variant="secondary">Backorder</Badge>
                                            )}
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>,
                        ]
                        : []),
                    ]
                  })
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <p className="text-muted-foreground text-sm">
              Showing page {page} of {totalPages} ({total} total suppliers)
            </p>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Label htmlFor="supplier-rows-per-page" className="text-sm">
                  Rows per page
                </Label>
                <Select
                  value={String(limit)}
                  onValueChange={(value) => {
                    setLimit(Number(value))
                    setPage(1)
                  }}
                >
                  <SelectTrigger id="supplier-rows-per-page" className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROWS_PER_PAGE_OPTIONS.map((value) => (
                      <SelectItem key={value} value={String(value)}>
                        {value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button variant="outline" onClick={goToPreviousPage} disabled={isLoading || page <= 1}>
                Previous
              </Button>
              <Button variant="outline" onClick={goToNextPage} disabled={isLoading || page >= totalPages}>
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
