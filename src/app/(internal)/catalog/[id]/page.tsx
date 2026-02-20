import { Suspense } from "react"
import Link from "next/link"
import {
  CircleCheckBig,
  CircleX,
  PackageCheck,
  PackageX,
  Truck,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  InternalHero,
  InternalPageTemplate,
} from "@/components/templates/internal-page-template"
import { apiFetch } from "@/lib/api-fetch"
import CatalogDetailLoading from "./loading"
import { BackToResultsButton } from "./back-to-results-button"

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
  standard: string | null
  specsSupplier: string | null
  nominalSize: string | null
  pressureClass: string | null
  face: string | null
  windingMaterial: string | null
  fillerMaterial: string | null
  innerRing: string | null
  outerRing: string | null
  ringNumber: string | null
  profile: string | null
  material: string | null
  thickness: string | null
  sheetSize: string | null
  maxTemperature: string | null
  coreMaterial: string | null
  facingMaterial: string | null
  bodyMaterial: string | null
  endConnection: string | null
  trimOrSeat: string | null
  nace: string | null
  fireSafe: string | null
  hydraulicSize: string | null
  configuration: string | null
  casingMaterial: string | null
  ratedFlow: string | null
  ratedHead: string | null
  sealPlan: string | null
  driver: string | null
  measurementType: string | null
  range: string | null
  communication: string | null
  accuracy: string | null
  hazardousArea: string | null
  processConnection: string | null
  trim: string | null
  actuation: string | null
  positioner: string | null
  designCode: string | null
  temaOrType: string | null
  surfaceArea: string | null
  shellMaterial: string | null
  tubeOrPlateMaterial: string | null
  designPressure: string | null
  designTemperature: string | null
  toolType: string | null
  voltage: string | null
  chuck: string | null
  maxTorque: string | null
  speed: string | null
  warranty: string | null
  current: string | null
  headWeight: string | null
  handle: string | null
  overallLength: string | null
  tips: string | null
  count: string | null
  magnetic: string | null
  tip: string | null
  shaftLength: string | null
  length: string | null
  jawCapacity: string | null
  finish: string | null
  cuttingEdge: string | null
  bladeType: string | null
  body: string | null
  quickChange: string | null
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

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null
  }
  return value as Record<string, unknown>
}

function asString(value: unknown): string | null {
  if (typeof value !== "string") return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function asNumber(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null
  return value
}

function asBoolean(value: unknown): boolean | null {
  return typeof value === "boolean" ? value : null
}

function asStringArrayOrNull(value: unknown): string[] | null {
  if (value === null || value === undefined) return null
  if (!Array.isArray(value)) return null
  const values = value
    .map((item) => asString(item))
    .filter((item): item is string => Boolean(item))
  return values.length > 0 ? values : null
}

function asOptionalString(value: unknown): string | null {
  if (value === null || value === undefined) return null
  return asString(value)
}

function normalizeCatalogDetail(payload: unknown): CatalogDetail | null {
  const record = asRecord(payload)
  if (!record) {
    return null
  }

  const id = asString(record.id)
  const name = asString(record.name)
  const categoryName = asString(record.categoryName)
  const supplierName = asString(record.supplierName)
  const createdBy = asString(record.createdBy)
  const model = asString(record.model)
  const leadTimeDays = asNumber(record.leadTimeDays)
  const priceUsd = asNumber(record.priceUsd)
  const inStock = asBoolean(record.inStock)

  if (
    !id ||
    !name ||
    !categoryName ||
    !supplierName ||
    !createdBy ||
    !model ||
    leadTimeDays === null ||
    priceUsd === null ||
    inStock === null
  ) {
    return null
  }

  return {
    id,
    name,
    categoryName,
    supplierName,
    createdBy,
    manufacturer: asOptionalString(record.manufacturer),
    model,
    description: asOptionalString(record.description),
    leadTimeDays,
    priceUsd,
    inStock,
    compatibleWith: asStringArrayOrNull(record.compatibleWith),
    standard: asOptionalString(record.standard),
    specsSupplier: asOptionalString(record.specsSupplier),
    nominalSize: asOptionalString(record.nominalSize),
    pressureClass: asOptionalString(record.pressureClass),
    face: asOptionalString(record.face),
    windingMaterial: asOptionalString(record.windingMaterial),
    fillerMaterial: asOptionalString(record.fillerMaterial),
    innerRing: asOptionalString(record.innerRing),
    outerRing: asOptionalString(record.outerRing),
    ringNumber: asOptionalString(record.ringNumber),
    profile: asOptionalString(record.profile),
    material: asOptionalString(record.material),
    thickness: asOptionalString(record.thickness),
    sheetSize: asOptionalString(record.sheetSize),
    maxTemperature: asOptionalString(record.maxTemperature),
    coreMaterial: asOptionalString(record.coreMaterial),
    facingMaterial: asOptionalString(record.facingMaterial),
    bodyMaterial: asOptionalString(record.bodyMaterial),
    endConnection: asOptionalString(record.endConnection),
    trimOrSeat: asOptionalString(record.trimOrSeat),
    nace: asOptionalString(record.nace),
    fireSafe: asOptionalString(record.fireSafe),
    hydraulicSize: asOptionalString(record.hydraulicSize),
    configuration: asOptionalString(record.configuration),
    casingMaterial: asOptionalString(record.casingMaterial),
    ratedFlow: asOptionalString(record.ratedFlow),
    ratedHead: asOptionalString(record.ratedHead),
    sealPlan: asOptionalString(record.sealPlan),
    driver: asOptionalString(record.driver),
    measurementType: asOptionalString(record.measurementType),
    range: asOptionalString(record.range),
    communication: asOptionalString(record.communication),
    accuracy: asOptionalString(record.accuracy),
    hazardousArea: asOptionalString(record.hazardousArea),
    processConnection: asOptionalString(record.processConnection),
    trim: asOptionalString(record.trim),
    actuation: asOptionalString(record.actuation),
    positioner: asOptionalString(record.positioner),
    designCode: asOptionalString(record.designCode),
    temaOrType: asOptionalString(record.temaOrType),
    surfaceArea: asOptionalString(record.surfaceArea),
    shellMaterial: asOptionalString(record.shellMaterial),
    tubeOrPlateMaterial: asOptionalString(record.tubeOrPlateMaterial),
    designPressure: asOptionalString(record.designPressure),
    designTemperature: asOptionalString(record.designTemperature),
    toolType: asOptionalString(record.toolType),
    voltage: asOptionalString(record.voltage),
    chuck: asOptionalString(record.chuck),
    maxTorque: asOptionalString(record.maxTorque),
    speed: asOptionalString(record.speed),
    warranty: asOptionalString(record.warranty),
    current: asOptionalString(record.current),
    headWeight: asOptionalString(record.headWeight),
    handle: asOptionalString(record.handle),
    overallLength: asOptionalString(record.overallLength),
    tips: asOptionalString(record.tips),
    count: asOptionalString(record.count),
    magnetic: asOptionalString(record.magnetic),
    tip: asOptionalString(record.tip),
    shaftLength: asOptionalString(record.shaftLength),
    length: asOptionalString(record.length),
    jawCapacity: asOptionalString(record.jawCapacity),
    finish: asOptionalString(record.finish),
    cuttingEdge: asOptionalString(record.cuttingEdge),
    bladeType: asOptionalString(record.bladeType),
    body: asOptionalString(record.body),
    quickChange: asOptionalString(record.quickChange),
  }
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

  return (
    <Suspense fallback={<CatalogDetailLoading />}>
      <CatalogDetailContent id={id} />
    </Suspense>
  )
}

type CatalogDetailContentProps = {
  id: string
}

type SpecEntryValue = string | null
type VisibleSpecEntryValue = string

async function CatalogDetailContent({ id }: CatalogDetailContentProps) {
  const item = await loadCatalogItem(id)

  if (!item) {
    return (
      <InternalPageTemplate className="mx-auto max-w-7xl pb-6">
        <BackToResultsButton fallbackHref="/catalog" />

        <Card className="border-dashed border-slate-300">
          <CardHeader>
            <CardTitle>Catalog Item Not Found</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="text-muted-foreground">
              The catalog item you requested does not exist or may have been removed.
            </p>
            <p className="text-muted-foreground">Item ID: {id}</p>
            <Link href="/catalog" className="text-primary inline-flex w-fit text-sm font-medium underline">
              Browse catalog results
            </Link>
          </CardContent>
        </Card>
      </InternalPageTemplate>
    )
  }

  const specEntries: Array<{ key: string; value: SpecEntryValue }> = [
    { key: "standard", value: item.standard },
    { key: "specsSupplier", value: item.specsSupplier },
    { key: "nominalSize", value: item.nominalSize },
    { key: "pressureClass", value: item.pressureClass },
    { key: "face", value: item.face },
    { key: "windingMaterial", value: item.windingMaterial },
    { key: "fillerMaterial", value: item.fillerMaterial },
    { key: "innerRing", value: item.innerRing },
    { key: "outerRing", value: item.outerRing },
    { key: "ringNumber", value: item.ringNumber },
    { key: "profile", value: item.profile },
    { key: "material", value: item.material },
    { key: "thickness", value: item.thickness },
    { key: "sheetSize", value: item.sheetSize },
    { key: "maxTemperature", value: item.maxTemperature },
    { key: "coreMaterial", value: item.coreMaterial },
    { key: "facingMaterial", value: item.facingMaterial },
    { key: "bodyMaterial", value: item.bodyMaterial },
    { key: "endConnection", value: item.endConnection },
    { key: "trimOrSeat", value: item.trimOrSeat },
    { key: "nace", value: item.nace },
    { key: "fireSafe", value: item.fireSafe },
    { key: "hydraulicSize", value: item.hydraulicSize },
    { key: "configuration", value: item.configuration },
    { key: "casingMaterial", value: item.casingMaterial },
    { key: "ratedFlow", value: item.ratedFlow },
    { key: "ratedHead", value: item.ratedHead },
    { key: "sealPlan", value: item.sealPlan },
    { key: "driver", value: item.driver },
    { key: "measurementType", value: item.measurementType },
    { key: "range", value: item.range },
    { key: "communication", value: item.communication },
    { key: "accuracy", value: item.accuracy },
    { key: "hazardousArea", value: item.hazardousArea },
    { key: "processConnection", value: item.processConnection },
    { key: "trim", value: item.trim },
    { key: "actuation", value: item.actuation },
    { key: "positioner", value: item.positioner },
    { key: "designCode", value: item.designCode },
    { key: "temaOrType", value: item.temaOrType },
    { key: "surfaceArea", value: item.surfaceArea },
    { key: "shellMaterial", value: item.shellMaterial },
    { key: "tubeOrPlateMaterial", value: item.tubeOrPlateMaterial },
    { key: "designPressure", value: item.designPressure },
    { key: "designTemperature", value: item.designTemperature },
    { key: "toolType", value: item.toolType },
    { key: "voltage", value: item.voltage },
    { key: "chuck", value: item.chuck },
    { key: "maxTorque", value: item.maxTorque },
    { key: "speed", value: item.speed },
    { key: "warranty", value: item.warranty },
    { key: "current", value: item.current },
    { key: "headWeight", value: item.headWeight },
    { key: "handle", value: item.handle },
    { key: "overallLength", value: item.overallLength },
    { key: "tips", value: item.tips },
    { key: "count", value: item.count },
    { key: "magnetic", value: item.magnetic },
    { key: "tip", value: item.tip },
    { key: "shaftLength", value: item.shaftLength },
    { key: "length", value: item.length },
    { key: "jawCapacity", value: item.jawCapacity },
    { key: "finish", value: item.finish },
    { key: "cuttingEdge", value: item.cuttingEdge },
    { key: "bladeType", value: item.bladeType },
    { key: "body", value: item.body },
    { key: "quickChange", value: item.quickChange },
  ]
    .filter((entry): entry is { key: string; value: VisibleSpecEntryValue } => isVisibleValue(entry.value))
    .sort((a, b) => a.key.localeCompare(b.key))

  const generalEntries: Array<{ label: string; value: string }> = [
    { label: "ID", value: item.id },
    { label: "Category", value: item.categoryName },
    { label: "Supplier", value: item.supplierName },
    { label: "Manufacturer", value: item.manufacturer || "-" },
    { label: "Model", value: item.model || "-" },
    { label: "Created By", value: item.createdBy || "-" },
  ]

  return (
    <InternalPageTemplate className="mx-auto max-w-7xl pb-6">
      <BackToResultsButton fallbackHref="/catalog" />

      <InternalHero
        title={item.name}
        description={item.description || "No description provided for this catalog item."}
        className="from-cyan-950 via-slate-900 to-blue-950"
        meta={
          <>
            <Badge className="bg-white/15 text-white hover:bg-white/15">{item.categoryName}</Badge>
            <Badge variant="outline" className="border-white/25 text-white">
              {item.id}
            </Badge>
            {item.inStock ? (
              <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">
                <CircleCheckBig className="size-3.5" role="img" aria-label="In stock" />
                In Stock
              </Badge>
            ) : (
              <Badge className="bg-rose-600 text-white hover:bg-rose-600">
                <CircleX className="size-3.5" role="img" aria-label="Backorder" />
                Backorder
              </Badge>
            )}
          </>
        }
      />

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
                  <PackageCheck className="h-4 w-4 text-emerald-600" role="img" aria-label="In stock" />
                  In Stock
                </>
              ) : (
                <>
                  <PackageX className="h-4 w-4 text-rose-600" role="img" aria-label="Backorder" />
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
              specEntries.map((entry) => (
                <div key={entry.key} className="bg-muted/35 rounded-lg border px-3 py-2">
                  <p className="text-muted-foreground text-[11px] uppercase tracking-wide">
                    {formatLabel(entry.key)}
                  </p>
                  <p className="mt-1 text-sm font-medium break-words">{renderValue(entry.value)}</p>
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
    </InternalPageTemplate>
  )
}
