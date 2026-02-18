export type StepOneData = {
  requestedByDepartment: string
  requestedByUser: string
  budgetCode: string
  needByDate?: string
}

export type GenericStepData = {
  primary: string
  secondary: string
  tertiary: string
}

export type PurchaseOrderDraft = {
  id: string
  createdAt: string
  updatedAt: string
  step1: StepOneData
  step2: GenericStepData
  step3: GenericStepData
  step4: GenericStepData
  step5: GenericStepData
}

const DRAFTS_STORAGE_KEY = "po-create-drafts"
const ACTIVE_DRAFT_STORAGE_KEY = "po-create-active-draft"

const delay = (ms = 180) => new Promise((resolve) => setTimeout(resolve, ms))

const getStorage = () => {
  if (typeof window === "undefined") return null
  return window.localStorage
}

const readDrafts = (): Record<string, PurchaseOrderDraft> => {
  const storage = getStorage()
  if (!storage) return {}

  const rawValue = storage.getItem(DRAFTS_STORAGE_KEY)
  if (!rawValue) return {}

  try {
    return JSON.parse(rawValue) as Record<string, PurchaseOrderDraft>
  } catch {
    return {}
  }
}

const writeDrafts = (drafts: Record<string, PurchaseOrderDraft>) => {
  const storage = getStorage()
  if (!storage) return

  storage.setItem(DRAFTS_STORAGE_KEY, JSON.stringify(drafts))
}

const createDraftId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }

  return String(Date.now())
}

const emptyGenericStep = (): GenericStepData => ({
  primary: "",
  secondary: "",
  tertiary: "",
})

export const setActiveDraftId = (draftId: string) => {
  const storage = getStorage()
  if (!storage) return

  storage.setItem(ACTIVE_DRAFT_STORAGE_KEY, draftId)
}

export const getActiveDraftId = () => {
  const storage = getStorage()
  if (!storage) return null

  return storage.getItem(ACTIVE_DRAFT_STORAGE_KEY)
}

export const clearActiveDraftId = () => {
  const storage = getStorage()
  if (!storage) return

  storage.removeItem(ACTIVE_DRAFT_STORAGE_KEY)
}

export const createDraft = async (step1: StepOneData) => {
  await delay()

  const id = createDraftId()
  const now = new Date().toISOString()

  const draft: PurchaseOrderDraft = {
    id,
    createdAt: now,
    updatedAt: now,
    step1,
    step2: emptyGenericStep(),
    step3: emptyGenericStep(),
    step4: emptyGenericStep(),
    step5: emptyGenericStep(),
  }

  const drafts = readDrafts()
  drafts[id] = draft
  writeDrafts(drafts)
  setActiveDraftId(id)

  return draft
}

export const getDraft = async (id: string) => {
  await delay(100)

  const drafts = readDrafts()
  return drafts[id] ?? null
}

export const updateDraftStep = async <K extends keyof Pick<PurchaseOrderDraft, "step1" | "step2" | "step3" | "step4" | "step5">>(
  id: string,
  stepKey: K,
  stepValue: PurchaseOrderDraft[K]
) => {
  await delay()

  const drafts = readDrafts()
  const draft = drafts[id]

  if (!draft) return null

  const updatedDraft: PurchaseOrderDraft = {
    ...draft,
    [stepKey]: stepValue,
    updatedAt: new Date().toISOString(),
  }

  drafts[id] = updatedDraft
  writeDrafts(drafts)
  setActiveDraftId(id)

  return updatedDraft
}

export const submitDraft = async (id: string) => {
  await delay(250)

  const drafts = readDrafts()
  if (!drafts[id]) return false

  delete drafts[id]
  writeDrafts(drafts)
  clearActiveDraftId()

  return true
}
