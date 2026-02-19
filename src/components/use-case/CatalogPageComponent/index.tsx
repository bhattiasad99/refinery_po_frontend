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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"

type CatalogApiItem = {
  id: string
  name: string
  categoryName: string
  supplierName: string
  leadTimeDays: number
  priceUsd: number
  inStock: boolean
}

type CatalogListResponse = {
  data: CatalogApiItem[]
  total: number
  page: number
  limit: number
  averageLeadTime: number
  averagePrice: number
  inStockCount: number
}

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
})

const ROWS_PER_PAGE_OPTIONS = [10, 20, 50, 100] as const

export default function CatalogPageComponent() {
  const [items, setItems] = useState<CatalogApiItem[]>([])
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [total, setTotal] = useState(0)
  const [avgLeadTime, setAvgLeadTime] = useState(0)
  const [avgPrice, setAvgPrice] = useState(0)
  const [inStockCount, setInStockCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const [searchDraft, setSearchDraft] = useState("")
  const [categoryDraft, setCategoryDraft] = useState("")
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("")

  const totalPages = useMemo(() => Math.max(Math.ceil(total / limit), 1), [total, limit])
  const isInitialLoad = isLoading && !hasLoadedOnce

  const fetchCatalog = useCallback(
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
        if (category.trim().length > 0) {
          params.set("category", category.trim())
        }

        const response = await fetch(`/api/catalog?${params.toString()}`, {
          method: "GET",
          cache: "no-store",
          signal,
        })

        const payload = (await response.json()) as CatalogListResponse | { message?: string }
        if (!response.ok) {
          const errorPayload = payload as { message?: string }
          setErrorMessage(errorPayload.message ?? "Failed to load catalog")
          setItems([])
          return
        }

        const catalogPayload = payload as CatalogListResponse
        setItems(Array.isArray(catalogPayload.data) ? catalogPayload.data : [])
        setTotal(Number.isFinite(catalogPayload.total) ? catalogPayload.total : 0)
        setAvgLeadTime(Number.isFinite(catalogPayload.averageLeadTime) ? catalogPayload.averageLeadTime : 0)
        setAvgPrice(Number.isFinite(catalogPayload.averagePrice) ? catalogPayload.averagePrice : 0)
        setInStockCount(Number.isFinite(catalogPayload.inStockCount) ? catalogPayload.inStockCount : 0)
        setHasLoadedOnce(true)
      } catch (error) {
        if ((error as Error).name === "AbortError") {
          return
        }
        setErrorMessage("Failed to load catalog")
        setItems([])
      } finally {
        if (signal?.aborted) {
          return
        }
        setIsLoading(false)
      }
    },
    [category, limit, page, search]
  )

  useEffect(() => {
    const controller = new AbortController()
    void fetchCatalog(controller.signal)
    return () => controller.abort()
  }, [fetchCatalog])

  function onApplyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPage(1)
    setSearch(searchDraft)
    setCategory(categoryDraft)
  }

  function clearFilters() {
    setSearchDraft("")
    setCategoryDraft("")
    setSearch("")
    setCategory("")
    setPage(1)
  }

  function goToPreviousPage() {
    setPage((current) => Math.max(current - 1, 1))
  }

  function goToNextPage() {
    setPage((current) => Math.min(current + 1, totalPages))
  }

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
            {isInitialLoad ? (
              <Skeleton className="mt-2 h-8 w-20" />
            ) : (
              <p className="mt-1 text-2xl font-semibold">{total}</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-xs">In Stock</p>
            {isInitialLoad ? (
              <Skeleton className="mt-2 h-8 w-20" />
            ) : (
              <p className="mt-1 text-2xl font-semibold">{inStockCount}</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-xs">Avg Lead Time</p>
            {isInitialLoad ? (
              <Skeleton className="mt-2 h-8 w-28" />
            ) : (
              <p className="mt-1 text-2xl font-semibold">{Math.round(avgLeadTime)} days</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-xs">Avg Price</p>
            {isInitialLoad ? (
              <Skeleton className="mt-2 h-8 w-28" />
            ) : (
              <p className="mt-1 text-2xl font-semibold">{currencyFormatter.format(avgPrice)}</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/70 overflow-hidden">
        <CardHeader className="flex flex-col gap-4 pb-1 md:flex-row md:items-end md:justify-between">
          <CardTitle className="text-lg">Catalog Items</CardTitle>
          <form onSubmit={onApplyFilters} className="flex w-full flex-col gap-3 md:w-auto md:flex-row">
            <div className="flex min-w-48 flex-col gap-2">
              <Label htmlFor="catalog-search">Search</Label>
              <Input
                id="catalog-search"
                placeholder="ID, name, supplier..."
                value={searchDraft}
                onChange={(event) => setSearchDraft(event.target.value)}
              />
            </div>
            <div className="flex min-w-40 flex-col gap-2">
              <Label htmlFor="catalog-category">Category</Label>
              <Input
                id="catalog-category"
                placeholder="Exact category"
                value={categoryDraft}
                onChange={(event) => setCategoryDraft(event.target.value)}
              />
            </div>
            <div className="flex items-end gap-2">
              <Button type="submit" disabled={isLoading}>Apply</Button>
              <Button type="button" variant="outline" onClick={clearFilters} disabled={isLoading}>
                Clear
              </Button>
            </div>
          </form>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading && hasLoadedOnce ? (
            <div className="h-1 w-full overflow-hidden rounded bg-slate-100">
              <div className="h-full w-1/3 animate-pulse rounded bg-slate-500" />
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
                  <TableHead>Catalog Item</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead className="text-right">Lead Time</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead>Stock</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isInitialLoad ? (
                  Array.from({ length: 8 }).map((_, index) => (
                    <TableRow key={`skeleton-${index}`}>
                      <TableCell>
                        <div className="space-y-2">
                          <Skeleton className="h-3 w-16" />
                          <Skeleton className="h-4 w-48" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-6 w-24 rounded-full" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-28" />
                      </TableCell>
                      <TableCell className="text-right">
                        <Skeleton className="ml-auto h-4 w-14" />
                      </TableCell>
                      <TableCell className="text-right">
                        <Skeleton className="ml-auto h-4 w-20" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-6 w-20 rounded-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">No catalog items found.</TableCell>
                  </TableRow>
                ) : (
                  items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <Link href={`/catalog/${item.id}`} className="text-primary text-xs font-semibold">
                            {item.id}
                          </Link>
                          <p className="line-clamp-2 font-medium">{item.name}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{item.categoryName}</Badge>
                      </TableCell>
                      <TableCell>{item.supplierName}</TableCell>
                      <TableCell className="text-right">{item.leadTimeDays} days</TableCell>
                      <TableCell className="text-right font-semibold">{currencyFormatter.format(item.priceUsd)}</TableCell>
                      <TableCell>
                        {item.inStock ? (
                          <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">In Stock</Badge>
                        ) : (
                          <Badge variant="secondary">Backorder</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            {isInitialLoad ? (
              <Skeleton className="h-4 w-64" />
            ) : (
              <p className="text-muted-foreground text-sm">
                Showing page {page} of {totalPages} ({total} total items)
              </p>
            )}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Label htmlFor="catalog-rows-per-page" className="text-sm">Rows per page</Label>
                <Select
                  value={String(limit)}
                  onValueChange={(value) => {
                    const nextLimit = Number(value)
                    setLimit(nextLimit)
                    setPage(1)
                  }}
                >
                  <SelectTrigger id="catalog-rows-per-page" className="w-24">
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
