"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Filter } from "lucide-react"

import ControlledSheet from "@/components/common/ControlledSheet"
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
import { handleGatewayUnavailableLogout } from "@/lib/client-session"
import { CreatePoFromCatalogModal, type CatalogRowForQuickPo } from "./create-po-modal"

type CatalogApiItem = {
  id: string
  name: string
  categoryName: string
  supplierName: string
  leadTimeDays: number
  priceUsd: number
  inStock: boolean
  description?: string | null
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

type CatalogFilterOptionsResponse = {
  categories: string[]
  suppliers: string[]
}

type CatalogSortOption =
  | "price_asc"
  | "price_desc"
  | "lead_time_asc"
  | "lead_time_desc"
  | "supplier_asc"

type InStockDraftOption = "all" | "true" | "false"

const SORT_OPTIONS: ReadonlyArray<{ value: CatalogSortOption; label: string }> = [
  { value: "price_asc", label: "Price Low to High" },
  { value: "price_desc", label: "Price High to Low" },
  { value: "lead_time_asc", label: "Lead Time Low to High" },
  { value: "lead_time_desc", label: "Lead Time High to Low" },
  { value: "supplier_asc", label: "Supplier A-Z" },
]

const SORT_OPTION_VALUES = new Set<CatalogSortOption>(SORT_OPTIONS.map((entry) => entry.value))
const ROWS_PER_PAGE_OPTIONS = [10, 20, 50, 100] as const
const CATEGORY_ALL_VALUE = "__all__"

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
})

function parseInStock(value: string | null): boolean | null {
  if (value === "true") {
    return true
  }
  if (value === "false") {
    return false
  }
  return null
}

function toInStockDraft(value: boolean | null): InStockDraftOption {
  if (value === true) {
    return "true"
  }
  if (value === false) {
    return "false"
  }
  return "all"
}

function parseSort(value: string | null): CatalogSortOption {
  if (value && SORT_OPTION_VALUES.has(value as CatalogSortOption)) {
    return value as CatalogSortOption
  }
  return "price_asc"
}

function buildStateUrl(
  pathname: string,
  state: {
    search: string
    category: string
    inStock: boolean | null
    sort: CatalogSortOption
  }
): string {
  const params = new URLSearchParams()
  if (state.search) {
    params.set("q", state.search)
  }
  if (state.category) {
    params.set("category", state.category)
  }
  if (state.inStock !== null) {
    params.set("inStock", String(state.inStock))
  }
  params.set("sort", state.sort)

  const queryString = params.toString()
  return queryString ? `${pathname}?${queryString}` : pathname
}

export default function CatalogPageComponent() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const searchParamsString = searchParams.toString()

  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false)

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

  const [searchInput, setSearchInput] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [sort, setSort] = useState<CatalogSortOption>("price_asc")
  const [categoryOptions, setCategoryOptions] = useState<string[]>([])
  const [supplierOptions, setSupplierOptions] = useState<string[]>([])

  const [appliedCategory, setAppliedCategory] = useState("")
  const [appliedInStock, setAppliedInStock] = useState<boolean | null>(null)
  const [categoryDraft, setCategoryDraft] = useState("")
  const [inStockDraft, setInStockDraft] = useState<InStockDraftOption>("all")
  const [createPoSourceItem, setCreatePoSourceItem] = useState<CatalogRowForQuickPo | null>(null)

  useEffect(() => {
    const urlParams = new URLSearchParams(searchParamsString)
    const qValue = urlParams.get("q")?.trim() ?? urlParams.get("search")?.trim() ?? ""
    const categoryValue = urlParams.get("category")?.trim() ?? ""
    const inStockValue = parseInStock(urlParams.get("inStock"))
    const sortValue = parseSort(urlParams.get("sort"))

    setSearchInput(qValue)
    setDebouncedSearch(qValue)
    setAppliedCategory(categoryValue)
    setAppliedInStock(inStockValue)
    setCategoryDraft(categoryValue)
    setInStockDraft(toInStockDraft(inStockValue))
    setSort(sortValue)
    setPage(1)
  }, [searchParamsString])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchInput.trim())
      setPage(1)
    }, 380)

    return () => window.clearTimeout(timer)
  }, [searchInput])

  useEffect(() => {
    const currentParams = new URLSearchParams(searchParamsString)
    const currentCanonicalUrl = buildStateUrl(pathname, {
      search: currentParams.get("q")?.trim() ?? currentParams.get("search")?.trim() ?? "",
      category: currentParams.get("category")?.trim() ?? "",
      inStock: parseInStock(currentParams.get("inStock")),
      sort: parseSort(currentParams.get("sort")),
    })
    const nextUrl = buildStateUrl(pathname, {
      search: debouncedSearch,
      category: appliedCategory.trim(),
      inStock: appliedInStock,
      sort,
    })

    if (nextUrl !== currentCanonicalUrl) {
      router.replace(nextUrl, { scroll: false })
    }
  }, [appliedCategory, appliedInStock, debouncedSearch, pathname, router, searchParamsString, sort])

  const totalPages = useMemo(() => Math.max(Math.ceil(total / limit), 1), [total, limit])
  const isInitialLoad = isLoading && !hasLoadedOnce
  const categorySelectValue = categoryDraft.length > 0 ? categoryDraft : CATEGORY_ALL_VALUE
  const hasDraftCategoryOption = categoryDraft.length > 0 && categoryOptions.includes(categoryDraft)

  const fetchCatalog = useCallback(
    async (signal?: AbortSignal) => {
      setIsLoading(true)
      setErrorMessage(null)

      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: String(limit),
          sort,
        })

        if (debouncedSearch.length > 0) {
          params.set("q", debouncedSearch)
        }
        if (appliedCategory.trim().length > 0) {
          params.set("category", appliedCategory.trim())
        }
        if (appliedInStock !== null) {
          params.set("inStock", String(appliedInStock))
        }

        const response = await fetch(`/api/catalog?${params.toString()}`, {
          method: "GET",
          cache: "no-store",
          signal,
        })

        const payload = (await response.json()) as CatalogListResponse | { message?: string }
        if (handleGatewayUnavailableLogout(response.status, payload)) {
          return
        }
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
    [appliedCategory, appliedInStock, debouncedSearch, limit, page, sort]
  )

  const fetchCatalogFilterOptions = useCallback(async (signal?: AbortSignal) => {
    try {
      const response = await fetch("/api/catalog/filters", {
        method: "GET",
        cache: "no-store",
        signal,
      })
      const payload = (await response.json()) as
        | CatalogFilterOptionsResponse
        | { message?: string }

      if (handleGatewayUnavailableLogout(response.status, payload)) {
        return
      }
      if (!response.ok) {
        return
      }

      const optionsPayload = payload as CatalogFilterOptionsResponse
      setCategoryOptions(Array.isArray(optionsPayload.categories) ? optionsPayload.categories : [])
      setSupplierOptions(Array.isArray(optionsPayload.suppliers) ? optionsPayload.suppliers : [])
    } catch (error) {
      if ((error as Error).name === "AbortError") {
        return
      }
      setCategoryOptions([])
      setSupplierOptions([])
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    void fetchCatalog(controller.signal)
    return () => controller.abort()
  }, [fetchCatalog])

  useEffect(() => {
    const controller = new AbortController()
    void fetchCatalogFilterOptions(controller.signal)
    return () => controller.abort()
  }, [fetchCatalogFilterOptions])

  function applyFilters() {
    setAppliedCategory(categoryDraft.trim())
    setAppliedInStock(parseInStock(inStockDraft))
    setPage(1)
    setIsFilterSheetOpen(false)
  }

  function clearFilterDraft() {
    setCategoryDraft("")
    setInStockDraft("all")
  }

  function goToPreviousPage() {
    setPage((current) => Math.max(current - 1, 1))
  }

  function goToNextPage() {
    setPage((current) => Math.min(current + 1, totalPages))
  }

  function openCreatePoModal(item: CatalogApiItem) {
    setCreatePoSourceItem({
      id: item.id,
      name: item.name,
      categoryName: item.categoryName,
      supplierName: item.supplierName,
      priceUsd: item.priceUsd,
      description: item.description ?? undefined,
    })
  }

  return (
    <div className="flex flex-1 flex-col gap-5">
      <Card className="border-none bg-gradient-to-r from-cyan-900 via-slate-900 to-emerald-900 text-white shadow-lg">
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
        <CardHeader className="flex flex-col gap-4 pb-1">
          <CardTitle className="text-lg">Catalog Items</CardTitle>
          <div className="flex w-full flex-col gap-3 md:flex-row md:items-end">
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Open filters"
              onClick={() => setIsFilterSheetOpen(true)}
            >
              <Filter className="h-4 w-4" />
            </Button>
            <div className="flex w-full min-w-72 flex-col gap-2 md:w-80">
              <Label htmlFor="catalog-search">Search Catalog</Label>
              <Input
                id="catalog-search"
                placeholder="Name, ID, supplier, manufacturer, model"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
              />
            </div>
            <div className="flex min-w-56 flex-col gap-2">
              <Label htmlFor="catalog-sort">Sort by</Label>
              <Select
                value={sort}
                onValueChange={(value) => {
                  setSort(value as CatalogSortOption)
                  setPage(1)
                }}
              >
                <SelectTrigger id="catalog-sort">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
            {appliedCategory ? <Badge variant="outline">Category: {appliedCategory}</Badge> : null}
            {appliedInStock === true ? <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">In Stock only</Badge> : null}
            {appliedInStock === false ? <Badge variant="secondary">Backorder only</Badge> : null}
            <Badge variant="outline">Categories: {categoryOptions.length}</Badge>
            <Badge variant="outline">Suppliers: {supplierOptions.length}</Badge>
          </div>
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
                  <TableHead className="text-right">Actions</TableHead>
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
                      <TableCell className="text-right">
                        <Skeleton className="ml-auto h-9 w-24 rounded-md" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">No catalog items found.</TableCell>
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
                      <TableCell className="text-right">
                        <Button type="button" size="sm" onClick={() => openCreatePoModal(item)}>
                          Create PO
                        </Button>
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

      <ControlledSheet
        open={isFilterSheetOpen}
        onOpenChange={setIsFilterSheetOpen}
        title="Catalog Filters"
        description="Adjust filters and apply when ready. Categories and suppliers are loaded from backend catalog data."
        footer={
          <div className="flex w-full items-center justify-between gap-2">
            <Button type="button" variant="outline" onClick={clearFilterDraft}>
              Clear
            </Button>
            <Button type="button" onClick={applyFilters}>
              Apply Filters
            </Button>
          </div>
        }
      >
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="catalog-category-filter">Category</Label>
            <Select
              value={categorySelectValue}
              onValueChange={(value) => {
                setCategoryDraft(value === CATEGORY_ALL_VALUE ? "" : value)
              }}
            >
              <SelectTrigger id="catalog-category-filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={CATEGORY_ALL_VALUE}>All Categories</SelectItem>
                {categoryOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
                {!hasDraftCategoryOption && categoryDraft ? (
                  <SelectItem value={categoryDraft}>{categoryDraft}</SelectItem>
                ) : null}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="catalog-stock-filter">Stock Status</Label>
            <Select value={inStockDraft} onValueChange={(value) => setInStockDraft(value as InStockDraftOption)}>
              <SelectTrigger id="catalog-stock-filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Items</SelectItem>
                <SelectItem value="true">In Stock Only</SelectItem>
                <SelectItem value="false">Backorder Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </ControlledSheet>

      <CreatePoFromCatalogModal
        open={createPoSourceItem !== null}
        onOpenChange={(open) => {
          if (!open) {
            setCreatePoSourceItem(null)
          }
        }}
        catalogItem={createPoSourceItem}
      />
    </div>
  )
}
