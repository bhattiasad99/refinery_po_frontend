"use client"

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Eye, Filter } from "lucide-react"

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
import { ApiError, apiGet } from "@/lib/api"
import { InternalHero, InternalPageTemplate } from "@/components/templates/internal-page-template"
import { useDebounce } from "@/hooks/use-debounce"
import { CreatePoFromCatalogModal, type CatalogRowForQuickPo } from "@/components/use-case/CatalogPageComponent/create-po-modal"

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
const ROWS_PER_PAGE_OPTIONS = [10, 20, 50, 100, 200, 500] as const
const CATEGORY_ALL_VALUE = "__all__"
const DELAY_MIN_MS = 0
const DELAY_MAX_MS = 3000
const VIRTUALIZATION_THRESHOLD = 200
const VIRTUAL_ROW_HEIGHT = 70
const VIRTUAL_OVERSCAN = 8
const VIRTUAL_TABLE_MAX_HEIGHT = 520

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

function parsePositiveInteger(value: string | null, fallback: number): number {
  if (!value) {
    return fallback
  }

  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback
  }

  return Math.floor(parsed)
}

function clampDelayMs(value: number): number {
  if (!Number.isFinite(value)) {
    return DELAY_MIN_MS
  }
  if (value < DELAY_MIN_MS) {
    return DELAY_MIN_MS
  }
  if (value > DELAY_MAX_MS) {
    return DELAY_MAX_MS
  }
  return Math.round(value)
}

type CatalogViewState = {
  page: number
  limit: number
  searchInput: string
  debouncedSearch: string
  simulateDelayMs: number
  sort: CatalogSortOption
  appliedCategory: string
  appliedInStock: boolean | null
  categoryDraft: string
  inStockDraft: InStockDraftOption
}

type CatalogViewAction =
  | {
      type: "syncFromUrl"
      payload: {
        qValue: string
        categoryValue: string
        inStockValue: boolean | null
        sortValue: CatalogSortOption
        pageValue: number
      }
    }
  | { type: "setSearchInput"; payload: string }
  | { type: "setDebouncedSearch"; payload: string }
  | { type: "setSort"; payload: CatalogSortOption }
  | { type: "setLimit"; payload: number }
  | { type: "setPage"; payload: number }
  | { type: "setCategoryDraft"; payload: string }
  | { type: "setInStockDraft"; payload: InStockDraftOption }
  | { type: "applyFilters" }
  | { type: "clearFilterDraft" }
  | { type: "setSimulateDelayMs"; payload: number }

const initialCatalogViewState: CatalogViewState = {
  page: 1,
  limit: 20,
  searchInput: "",
  debouncedSearch: "",
  simulateDelayMs: 800,
  sort: "price_asc",
  appliedCategory: "",
  appliedInStock: null,
  categoryDraft: "",
  inStockDraft: "all",
}

function catalogViewReducer(state: CatalogViewState, action: CatalogViewAction): CatalogViewState {
  switch (action.type) {
    case "syncFromUrl":
      return {
        ...state,
        searchInput: action.payload.qValue,
        debouncedSearch: action.payload.qValue,
        appliedCategory: action.payload.categoryValue,
        appliedInStock: action.payload.inStockValue,
        categoryDraft: action.payload.categoryValue,
        inStockDraft: toInStockDraft(action.payload.inStockValue),
        sort: action.payload.sortValue,
        page: action.payload.pageValue,
      }
    case "setSearchInput":
      return {
        ...state,
        searchInput: action.payload,
      }
    case "setDebouncedSearch":
      return {
        ...state,
        debouncedSearch: action.payload,
        page: 1,
      }
    case "setSort":
      return {
        ...state,
        sort: action.payload,
        page: 1,
      }
    case "setLimit":
      return {
        ...state,
        limit: action.payload,
        page: 1,
      }
    case "setPage":
      return {
        ...state,
        page: Math.max(action.payload, 1),
      }
    case "setCategoryDraft":
      return {
        ...state,
        categoryDraft: action.payload,
      }
    case "setInStockDraft":
      return {
        ...state,
        inStockDraft: action.payload,
      }
    case "applyFilters":
      return {
        ...state,
        appliedCategory: state.categoryDraft.trim(),
        appliedInStock: parseInStock(state.inStockDraft),
        page: 1,
      }
    case "clearFilterDraft":
      return {
        ...state,
        categoryDraft: "",
        inStockDraft: "all",
      }
    case "setSimulateDelayMs":
      return {
        ...state,
        simulateDelayMs: clampDelayMs(action.payload),
      }
    default:
      return state
  }
}

function buildStateUrl(
  pathname: string,
  state: {
    search: string
    category: string
    inStock: boolean | null
    sort: CatalogSortOption
    page: number
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
  if (state.page > 1) {
    params.set("page", String(state.page))
  }

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
  const [total, setTotal] = useState(0)
  const [avgLeadTime, setAvgLeadTime] = useState(0)
  const [avgPrice, setAvgPrice] = useState(0)
  const [inStockCount, setInStockCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const [viewState, dispatchViewState] = useReducer(catalogViewReducer, initialCatalogViewState)
  const debouncedSearchInput = useDebounce(viewState.searchInput.trim(), 380)
  const [categoryOptions, setCategoryOptions] = useState<string[]>([])
  const [supplierOptions, setSupplierOptions] = useState<string[]>([])
  const [isLoadingFilterOptions, setIsLoadingFilterOptions] = useState(true)
  const [filterOptionsError, setFilterOptionsError] = useState<string | null>(null)
  const [tableScrollTop, setTableScrollTop] = useState(0)
  const [createPoSourceItem, setCreatePoSourceItem] = useState<CatalogRowForQuickPo | null>(null)
  const shouldSimulateDelayOnNextFetchRef = useRef(false)

  useEffect(() => {
    const urlParams = new URLSearchParams(searchParamsString)
    const qValue = urlParams.get("q")?.trim() ?? urlParams.get("search")?.trim() ?? ""
    const categoryValue = urlParams.get("category")?.trim() ?? ""
    const inStockValue = parseInStock(urlParams.get("inStock"))
    const sortValue = parseSort(urlParams.get("sort"))
    const pageValue = parsePositiveInteger(urlParams.get("page"), 1)

    dispatchViewState({
      type: "syncFromUrl",
      payload: { qValue, categoryValue, inStockValue, sortValue, pageValue },
    })
  }, [searchParamsString])

  useEffect(() => {
    if (debouncedSearchInput !== viewState.debouncedSearch) {
      shouldSimulateDelayOnNextFetchRef.current = true
      dispatchViewState({ type: "setDebouncedSearch", payload: debouncedSearchInput })
    }
  }, [debouncedSearchInput, viewState.debouncedSearch])

  useEffect(() => {
    const currentParams = new URLSearchParams(searchParamsString)
    const currentCanonicalUrl = buildStateUrl(pathname, {
      search: currentParams.get("q")?.trim() ?? currentParams.get("search")?.trim() ?? "",
      category: currentParams.get("category")?.trim() ?? "",
      inStock: parseInStock(currentParams.get("inStock")),
      sort: parseSort(currentParams.get("sort")),
      page: parsePositiveInteger(currentParams.get("page"), 1),
    })
    const nextUrl = buildStateUrl(pathname, {
      search: viewState.debouncedSearch,
      category: viewState.appliedCategory.trim(),
      inStock: viewState.appliedInStock,
      sort: viewState.sort,
      page: viewState.page,
    })

    if (nextUrl !== currentCanonicalUrl) {
      router.replace(nextUrl, { scroll: false })
    }
  }, [
    pathname,
    router,
    searchParamsString,
    viewState.appliedCategory,
    viewState.appliedInStock,
    viewState.debouncedSearch,
    viewState.page,
    viewState.sort,
  ])

  const totalPages = useMemo(
    () => Math.max(Math.ceil(total / viewState.limit), 1),
    [total, viewState.limit]
  )
  const isInitialLoad = isLoading && !hasLoadedOnce
  const categorySelectValue =
    viewState.categoryDraft.length > 0 ? viewState.categoryDraft : CATEGORY_ALL_VALUE
  const hasDraftCategoryOption =
    viewState.categoryDraft.length > 0 && categoryOptions.includes(viewState.categoryDraft)
  const shouldVirtualize = items.length > VIRTUALIZATION_THRESHOLD
  const virtualStartIndex = shouldVirtualize
    ? Math.max(Math.floor(tableScrollTop / VIRTUAL_ROW_HEIGHT) - VIRTUAL_OVERSCAN, 0)
    : 0
  const virtualVisibleCount = shouldVirtualize
    ? Math.ceil(VIRTUAL_TABLE_MAX_HEIGHT / VIRTUAL_ROW_HEIGHT) + VIRTUAL_OVERSCAN * 2
    : items.length
  const virtualEndIndex = shouldVirtualize
    ? Math.min(virtualStartIndex + virtualVisibleCount, items.length)
    : items.length
  const visibleItems = shouldVirtualize ? items.slice(virtualStartIndex, virtualEndIndex) : items
  const topSpacerHeight = shouldVirtualize ? virtualStartIndex * VIRTUAL_ROW_HEIGHT : 0
  const bottomSpacerHeight = shouldVirtualize
    ? Math.max((items.length - virtualEndIndex) * VIRTUAL_ROW_HEIGHT, 0)
    : 0

  const fetchCatalog = useCallback(
    async (signal?: AbortSignal) => {
      setIsLoading(true)
      setErrorMessage(null)

      try {
        const shouldSimulateDelay = shouldSimulateDelayOnNextFetchRef.current
        shouldSimulateDelayOnNextFetchRef.current = false

        const params = new URLSearchParams({
          page: String(viewState.page),
          limit: String(viewState.limit),
          sort: viewState.sort,
        })

        if (viewState.debouncedSearch.length > 0) {
          params.set("q", viewState.debouncedSearch)
        }
        if (viewState.appliedCategory.trim().length > 0) {
          params.set("category", viewState.appliedCategory.trim())
        }
        if (viewState.appliedInStock !== null) {
          params.set("inStock", String(viewState.appliedInStock))
        }
        if (shouldSimulateDelay && viewState.simulateDelayMs > 0) {
          params.set("simulateDelayMs", String(viewState.simulateDelayMs))
        }

        const catalogPayload = await apiGet<CatalogListResponse>(`/api/catalog?${params.toString()}`, {
          cache: "no-store",
          signal,
          fallbackErrorMessage: "Failed to load catalog",
        })
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
        if (error instanceof ApiError) {
          setErrorMessage(error.message)
          setItems([])
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
    [
      viewState.appliedCategory,
      viewState.appliedInStock,
      viewState.debouncedSearch,
      viewState.limit,
      viewState.page,
      viewState.simulateDelayMs,
      viewState.sort,
    ]
  )

  const fetchCatalogFilterOptions = useCallback(async (signal?: AbortSignal) => {
    setIsLoadingFilterOptions(true)
    setFilterOptionsError(null)

    try {
      const optionsPayload = await apiGet<CatalogFilterOptionsResponse>("/api/catalog/filters", {
        cache: "no-store",
        signal,
        fallbackErrorMessage: "Failed to load filter options",
      })
      setCategoryOptions(Array.isArray(optionsPayload.categories) ? optionsPayload.categories : [])
      setSupplierOptions(Array.isArray(optionsPayload.suppliers) ? optionsPayload.suppliers : [])
    } catch (error) {
      if ((error as Error).name === "AbortError") {
        return
      }
      if (error instanceof ApiError) {
        setFilterOptionsError(error.message)
      } else {
        setFilterOptionsError("Failed to load filter options")
      }
      setCategoryOptions([])
      setSupplierOptions([])
    } finally {
      if (signal?.aborted) {
        return
      }
      setIsLoadingFilterOptions(false)
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
    dispatchViewState({ type: "applyFilters" })
    setIsFilterSheetOpen(false)
  }

  function clearFilterDraft() {
    dispatchViewState({ type: "clearFilterDraft" })
  }

  function goToPreviousPage() {
    dispatchViewState({ type: "setPage", payload: viewState.page - 1 })
  }

  function goToNextPage() {
    dispatchViewState({ type: "setPage", payload: Math.min(viewState.page + 1, totalPages) })
  }

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (
        target?.isContentEditable ||
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.tagName === "SELECT"
      ) {
        return
      }

      if (event.key === "ArrowLeft" && viewState.page > 1 && !isLoading) {
        event.preventDefault()
        dispatchViewState({ type: "setPage", payload: viewState.page - 1 })
      }

      if (event.key === "ArrowRight" && viewState.page < totalPages && !isLoading) {
        event.preventDefault()
        dispatchViewState({ type: "setPage", payload: viewState.page + 1 })
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [isLoading, totalPages, viewState.page])

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
    <InternalPageTemplate className="gap-5">
      <InternalHero
        eyebrow="Catalog"
        title="Industrial Catalog Intelligence"
        description="Explore standardized catalog items, compare supplier options, and open each item for complete technical details."
        className="from-cyan-900 via-slate-900 to-emerald-900"
        contentClassName="space-y-3"
      />

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
            <div className="flex w-full flex-col gap-2 md:w-80">
              <Label htmlFor="catalog-search">Search Catalog</Label>
              <Input
                id="catalog-search"
                placeholder="Name, ID, supplier, manufacturer, model"
                value={viewState.searchInput}
                onChange={(event) =>
                  dispatchViewState({ type: "setSearchInput", payload: event.target.value })
                }
              />
            </div>
            <div className="flex w-full flex-col gap-2 md:w-56">
              <Label htmlFor="catalog-sort">Sort by</Label>
              <Select
                value={viewState.sort}
                onValueChange={(value) => {
                  dispatchViewState({ type: "setSort", payload: value as CatalogSortOption })
                }}
              >
                <SelectTrigger id="catalog-sort" aria-label="Sort catalog items">
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
            <div className="flex w-full flex-col gap-2 md:w-56">
              <Label htmlFor="catalog-simulate-delay">Search Delay ({viewState.simulateDelayMs}ms)</Label>
              <Input
                id="catalog-simulate-delay"
                type="range"
                min={DELAY_MIN_MS}
                max={DELAY_MAX_MS}
                step={100}
                value={viewState.simulateDelayMs}
                aria-label="Simulated network delay in milliseconds for debounced catalog search"
                title="Adds a test-only delay to debounced search requests to mimic slower networks."
                onChange={(event) =>
                  dispatchViewState({
                    type: "setSimulateDelayMs",
                    payload: clampDelayMs(Number(event.target.value)),
                  })
                }
              />
              <p className="text-muted-foreground text-xs">
                Applied only for debounced search requests. Range: {DELAY_MIN_MS} to {DELAY_MAX_MS} ms.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
            {viewState.appliedCategory ? (
              <Badge variant="outline">Category: {viewState.appliedCategory}</Badge>
            ) : null}
            {viewState.appliedInStock === true ? (
              <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">In Stock only</Badge>
            ) : null}
            {viewState.appliedInStock === false ? <Badge variant="secondary">Backorder only</Badge> : null}
            <Badge variant="outline">Categories: {categoryOptions.length}</Badge>
            <Badge variant="outline">Suppliers: {supplierOptions.length}</Badge>
            {isLoadingFilterOptions ? <Badge variant="outline">Loading filters...</Badge> : null}
            {filterOptionsError ? <Badge variant="destructive">Filter options unavailable</Badge> : null}
            {shouldVirtualize ? <Badge variant="outline">Virtualized rows enabled</Badge> : null}
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

          <div
            className="overflow-x-auto rounded-lg border"
            style={shouldVirtualize ? { maxHeight: VIRTUAL_TABLE_MAX_HEIGHT, overflowY: "auto" } : undefined}
            onScroll={shouldVirtualize ? (event) => setTableScrollTop(event.currentTarget.scrollTop) : undefined}
          >
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
                  <>
                    {shouldVirtualize && topSpacerHeight > 0 ? (
                      <TableRow aria-hidden="true">
                        <TableCell colSpan={7} style={{ height: topSpacerHeight, padding: 0 }} />
                      </TableRow>
                    ) : null}
                    {visibleItems.map((item) => (
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
                          <div className="flex justify-end gap-2">
                            <Button asChild type="button" variant="outline" size="icon" aria-label={`View ${item.name}`}>
                              <Link href={`/catalog/${item.id}`}>
                                <Eye className="h-4 w-4" />
                              </Link>
                            </Button>
                            <Button type="button" size="sm" onClick={() => openCreatePoModal(item)}>
                              Create PO
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {shouldVirtualize && bottomSpacerHeight > 0 ? (
                      <TableRow aria-hidden="true">
                        <TableCell colSpan={7} style={{ height: bottomSpacerHeight, padding: 0 }} />
                      </TableRow>
                    ) : null}
                  </>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            {isInitialLoad ? (
              <Skeleton className="h-4 w-64" />
            ) : (
              <p className="text-muted-foreground text-sm">
                Showing page {viewState.page} of {totalPages} ({total} total items)
              </p>
            )}
            <div className="flex w-full flex-wrap items-center gap-3 md:w-auto md:justify-end">
              <div className="flex items-center gap-2">
                <Label htmlFor="catalog-rows-per-page" className="text-sm">Rows per page</Label>
                <Select
                  value={String(viewState.limit)}
                  onValueChange={(value) => {
                    const nextLimit = Number(value)
                    dispatchViewState({ type: "setLimit", payload: nextLimit })
                  }}
                >
                  <SelectTrigger id="catalog-rows-per-page" className="w-24" aria-label="Rows per page">
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
              <Button
                variant="outline"
                onClick={goToPreviousPage}
                disabled={isLoading || viewState.page <= 1}
                aria-label="Previous page"
                aria-keyshortcuts="ArrowLeft"
              >
                Previous
              </Button>
              <Button
                variant="outline"
                onClick={goToNextPage}
                disabled={isLoading || viewState.page >= totalPages}
                aria-label="Next page"
                aria-keyshortcuts="ArrowRight"
              >
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
                dispatchViewState({
                  type: "setCategoryDraft",
                  payload: value === CATEGORY_ALL_VALUE ? "" : value,
                })
              }}
            >
              <SelectTrigger id="catalog-category-filter" aria-label="Catalog category filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={CATEGORY_ALL_VALUE}>All Categories</SelectItem>
                {categoryOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
                {!hasDraftCategoryOption && viewState.categoryDraft ? (
                  <SelectItem value={viewState.categoryDraft}>{viewState.categoryDraft}</SelectItem>
                ) : null}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="catalog-stock-filter">Stock Status</Label>
            <Select
              value={viewState.inStockDraft}
              onValueChange={(value) =>
                dispatchViewState({ type: "setInStockDraft", payload: value as InStockDraftOption })
              }
            >
              <SelectTrigger id="catalog-stock-filter" aria-label="Catalog stock status filter">
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
    </InternalPageTemplate>
  )
}
