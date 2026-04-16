import rawDepartments from "@/dataset/departments.json"
import rawItems from "@/dataset/refinery_items_50_5suppliers_strict.json"
import rawPurchaseOrders from "@/dataset/purchase-orders.json"
import rawUsers from "@/dataset/users.json"
import type {
  CatalogItemRecord,
  DepartmentRecord,
  PurchaseOrderRecord,
  UserRecord,
} from "@/lib/mock-data/types"

type RawDepartment = {
  id: number
  name: string
  description: string
}

type RawCatalogItem = {
  id: string
  name: string
  category: string
  supplier: string
  manufacturer: string
  model: string
  description: string
  leadTimeDays: number
  priceUsd: number
  inStock: boolean
  compatibleWith?: string[]
  specs?: Record<string, string | undefined>
}

function normalizeDepartments(): DepartmentRecord[] {
  return (rawDepartments as RawDepartment[]).map((department) => ({
    id: String(department.id),
    name: department.name,
    description: department.description,
  }))
}

function normalizeCatalogItems(): CatalogItemRecord[] {
  return (rawItems as RawCatalogItem[]).map((item) => {
    const specs = item.specs ?? {}

    return {
      id: item.id,
      name: item.name,
      categoryName: item.category,
      supplierName: item.supplier,
      manufacturer: item.manufacturer,
      model: item.model,
      description: item.description,
      leadTimeDays: item.leadTimeDays,
      priceUsd: item.priceUsd,
      inStock: item.inStock,
      compatibleWith: item.compatibleWith ?? null,
      createdBy: "demo@refinery.com",
      standard: specs.standard ?? null,
      specsSupplier: specs.supplier ?? null,
      nominalSize: specs.nominalSize ?? null,
      pressureClass: specs.pressureClass ?? null,
      face: specs.face ?? null,
      windingMaterial: specs.windingMaterial ?? null,
      fillerMaterial: specs.fillerMaterial ?? null,
      innerRing: specs.innerRing ?? null,
      outerRing: specs.outerRing ?? null,
      ringNumber: specs.ringNumber ?? null,
      profile: specs.profile ?? null,
      material: specs.material ?? null,
      thickness: specs.thickness ?? null,
      sheetSize: specs.sheetSize ?? null,
      maxTemperature: specs.maxTemperature ?? null,
      coreMaterial: specs.coreMaterial ?? null,
      facingMaterial: specs.facingMaterial ?? null,
      bodyMaterial: specs.bodyMaterial ?? null,
      endConnection: specs.endConnection ?? null,
      trimOrSeat: specs.trimOrSeat ?? null,
      nace: specs.nace ?? null,
      fireSafe: specs.fireSafe ?? null,
      hydraulicSize: specs.hydraulicSize ?? null,
      configuration: specs.configuration ?? null,
      casingMaterial: specs.casingMaterial ?? null,
      ratedFlow: specs.ratedFlow ?? null,
      ratedHead: specs.ratedHead ?? null,
      sealPlan: specs.sealPlan ?? null,
      driver: specs.driver ?? null,
      measurementType: specs.measurementType ?? null,
      range: specs.range ?? null,
      communication: specs.communication ?? null,
      accuracy: specs.accuracy ?? null,
      hazardousArea: specs.hazardousArea ?? null,
      processConnection: specs.processConnection ?? null,
      trim: specs.trim ?? null,
      actuation: specs.actuation ?? null,
      positioner: specs.positioner ?? null,
      designCode: specs.designCode ?? null,
      temaOrType: specs.temaOrType ?? null,
      surfaceArea: specs.surfaceArea ?? null,
      shellMaterial: specs.shellMaterial ?? null,
      tubeOrPlateMaterial: specs.tubeOrPlateMaterial ?? null,
      designPressure: specs.designPressure ?? null,
      designTemperature: specs.designTemperature ?? null,
      toolType: specs.toolType ?? null,
      voltage: specs.voltage ?? null,
      chuck: specs.chuck ?? null,
      maxTorque: specs.maxTorque ?? null,
      speed: specs.speed ?? null,
      warranty: specs.warranty ?? null,
      current: specs.current ?? null,
      headWeight: specs.headWeight ?? null,
      handle: specs.handle ?? null,
      overallLength: specs.overallLength ?? null,
      tips: specs.tips ?? null,
      count: specs.count ?? null,
      magnetic: specs.magnetic ?? null,
      tip: specs.tip ?? null,
      shaftLength: specs.shaftLength ?? null,
      length: specs.length ?? null,
      jawCapacity: specs.jawCapacity ?? null,
      finish: specs.finish ?? null,
      cuttingEdge: specs.cuttingEdge ?? null,
      bladeType: specs.bladeType ?? null,
      body: specs.body ?? null,
      quickChange: specs.quickChange ?? null,
    }
  })
}

export function createSeedState() {
  return {
    departments: normalizeDepartments(),
    users: rawUsers as UserRecord[],
    catalogItems: normalizeCatalogItems(),
    purchaseOrders: rawPurchaseOrders as PurchaseOrderRecord[],
  }
}
