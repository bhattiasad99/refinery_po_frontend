"use client"

import { useRouter } from "next/navigation"
import { FocusEvent, useEffect, useMemo, useReducer, useState } from "react"
import { toast } from "sonner"

import ControlledModal from "@/components/common/ControlledModal"
import SearchableDropdown, {
  type SearchableDropdownOption,
} from "@/components/common/SearchableDropdown"
import TableScrollContainer from "@/components/common/table-scroll-container"
import {
  InternalHero,
  InternalPageBackLink,
  InternalPageTemplate,
} from "@/components/templates/internal-page-template"
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
import { ItemSelectionModal } from "@/components/use-case/CreatePurchaseOrderFlow/item-selection-modal"
import { StepTwoItemsTable } from "@/components/use-case/CreatePurchaseOrderFlow/step-two-items-table"
import { useCreatePurchaseOrderReferenceData } from "@/components/use-case/CreatePurchaseOrderFlow/reference-data-context"
import {
  createInitialStepTwoState,
  stepTwoStateReducer,
} from "@/components/use-case/CreatePurchaseOrderFlow/step-two-state"
import {
  PAYMENT_TERM_OPTIONS,
  type PaymentMilestone,
  type PaymentTermOption,
  type PurchaseOrderLineItem,
  type StepOneData,
  type StepThreeData,
  type StepTwoData,
} from "@/components/use-case/CreatePurchaseOrderFlow/draft-api"
import {
  buildStepOnePayload,
  buildStepThreePayload,
  buildStepTwoPayload,
  getPurchaseOrder,
  mapPurchaseOrderToStepOne,
  mapPurchaseOrderToStepThree,
  mapPurchaseOrderToStepTwo,
  updatePurchaseOrder,
  type PurchaseOrderApiResponse,
} from "@/components/use-case/CreatePurchaseOrderFlow/purchase-order-client"

type EditPurchaseOrderPageComponentProps = {
  id: string
}

type EditablePurchaseOrder = {
  id: string
  status: "draft" | "submitted" | "approved" | "rejected" | "fulfilled"
  step1: StepOneData
  step2: StepTwoData
  step3: StepThreeData
}

type PurchaseOrderChanges = {
  step1?: Partial<StepOneData>
  step2?: {
    supplierName?: string
    items?: PurchaseOrderLineItem[]
  }
  step3?: {
    paymentTerm?: PaymentTermOption
    taxIncluded?: boolean
    advancePercentage?: number | null
    balanceDueInDays?: number | null
    customTerms?: string
    milestones?: PaymentMilestone[]
  }
}

const budgetCodeOptions: SearchableDropdownOption[] = [
  { label: "CC-1234", value: "CC-1234" },
  { label: "CC-2314", value: "CC-2314" },
  { label: "CC-4420", value: "CC-4420" },
  { label: "CC-9901", value: "CC-9901" },
  { label: "CC-7603", value: "CC-7603" },
]

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
})

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
})

function cloneValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function normalizeStatus(
  status: string | null | undefined
): EditablePurchaseOrder["status"] {
  const normalized = (status ?? "").toLowerCase()
  if (normalized === "submitted") return "submitted"
  if (normalized === "approved") return "approved"
  if (normalized === "rejected") return "rejected"
  if (normalized === "fulfilled") return "fulfilled"
  return "draft"
}

function createEmptyEditablePurchaseOrder(id: string): EditablePurchaseOrder {
  return {
    id,
    status: "draft",
    step1: {
      requestedByDepartment: "",
      requestedByUser: "",
      budgetCode: "",
      needByDate: undefined,
    },
    step2: {
      supplierName: "",
      items: [],
    },
    step3: {
      paymentTerm: PAYMENT_TERM_OPTIONS.find((option) => option.id === "NET_30") ?? PAYMENT_TERM_OPTIONS[0],
      taxIncluded: false,
      advancePercentage: null,
      balanceDueInDays: null,
      customTerms: "",
      milestones: [],
    },
  }
}

function mapPurchaseOrderResponseToEditableOrder(response: PurchaseOrderApiResponse): EditablePurchaseOrder {
  return {
    id: response.id,
    status: normalizeStatus(response.status),
    step1: mapPurchaseOrderToStepOne(response),
    step2: mapPurchaseOrderToStepTwo(response),
    step3: mapPurchaseOrderToStepThree(response),
  }
}

function isEqual(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}

function sanitizeChanges(changes: PurchaseOrderChanges): PurchaseOrderChanges {
  const next: PurchaseOrderChanges = {}
  if (changes.step1 && Object.keys(changes.step1).length > 0) next.step1 = changes.step1
  if (changes.step2 && Object.keys(changes.step2).length > 0) next.step2 = changes.step2
  if (changes.step3 && Object.keys(changes.step3).length > 0) next.step3 = changes.step3
  return next
}

function applyChanges(base: EditablePurchaseOrder, changes: PurchaseOrderChanges): EditablePurchaseOrder {
  return {
    ...base,
    step1: { ...base.step1, ...(changes.step1 ?? {}) },
    step2: {
      ...base.step2,
      ...(changes.step2 ?? {}),
      items: changes.step2?.items ?? base.step2.items,
    },
    step3: {
      ...base.step3,
      ...(changes.step3 ?? {}),
      paymentTerm: changes.step3?.paymentTerm ?? base.step3.paymentTerm,
      milestones: changes.step3?.milestones ?? base.step3.milestones,
    },
  }
}

function buildStepOneDiff(base: StepOneData, draft: StepOneData): Partial<StepOneData> {
  const diff: Partial<StepOneData> = {}
  if (base.requestedByDepartment !== draft.requestedByDepartment) diff.requestedByDepartment = draft.requestedByDepartment
  if (base.requestedByUser !== draft.requestedByUser) diff.requestedByUser = draft.requestedByUser
  if (base.budgetCode !== draft.budgetCode) diff.budgetCode = draft.budgetCode
  if ((base.needByDate ?? "") !== (draft.needByDate ?? "")) diff.needByDate = draft.needByDate
  return diff
}

function buildStepTwoDiff(base: StepTwoData, draft: StepTwoData): PurchaseOrderChanges["step2"] {
  const diff: NonNullable<PurchaseOrderChanges["step2"]> = {}
  if (base.supplierName !== draft.supplierName) diff.supplierName = draft.supplierName
  if (!isEqual(base.items, draft.items)) diff.items = draft.items
  return Object.keys(diff).length > 0 ? diff : undefined
}

function buildStepThreeDiff(base: StepThreeData, draft: StepThreeData): PurchaseOrderChanges["step3"] {
  const diff: NonNullable<PurchaseOrderChanges["step3"]> = {}
  if (!isEqual(base.paymentTerm, draft.paymentTerm)) diff.paymentTerm = draft.paymentTerm
  if (base.taxIncluded !== draft.taxIncluded) diff.taxIncluded = draft.taxIncluded
  if (base.advancePercentage !== draft.advancePercentage) diff.advancePercentage = draft.advancePercentage
  if (base.balanceDueInDays !== draft.balanceDueInDays) diff.balanceDueInDays = draft.balanceDueInDays
  if (base.customTerms !== draft.customTerms) diff.customTerms = draft.customTerms
  if (!isEqual(base.milestones, draft.milestones)) diff.milestones = draft.milestones
  return Object.keys(diff).length > 0 ? diff : undefined
}

const createMilestone = (index: number): PaymentMilestone => ({
  id: crypto.randomUUID(),
  label: `Milestone ${index + 1}`,
  percentage: 0,
  dueInDays: 0,
})

const selectAllOnFocus = (event: FocusEvent<HTMLInputElement>) => {
  event.currentTarget.select()
}

export default function EditPurchaseOrderPageComponent({ id }: EditPurchaseOrderPageComponentProps) {
  const router = useRouter()
  const referenceData = useCreatePurchaseOrderReferenceData()
  const [isLoadingOrder, setIsLoadingOrder] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [loadErrorMessage, setLoadErrorMessage] = useState<string | null>(null)
  const [baseOrder, setBaseOrder] = useState<EditablePurchaseOrder>(() => createEmptyEditablePurchaseOrder(id))
  const [pendingChanges, setPendingChanges] = useState<PurchaseOrderChanges>({})

  const [isStepOneModalOpen, setIsStepOneModalOpen] = useState(false)
  const [isStepTwoModalOpen, setIsStepTwoModalOpen] = useState(false)
  const [isStepThreeModalOpen, setIsStepThreeModalOpen] = useState(false)

  const [stepOneDraft, setStepOneDraft] = useState<StepOneData>(baseOrder.step1)
  const [stepTwoState, dispatchStepTwo] = useReducer(
    stepTwoStateReducer,
    createInitialStepTwoState(baseOrder.step2)
  )
  const stepTwoDraft = stepTwoState.values
  const [stepThreeDraft, setStepThreeDraft] = useState<StepThreeData>(baseOrder.step3)

  const [isItemModalOpen, setIsItemModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<PurchaseOrderLineItem | null>(null)

  const displayOrder = useMemo(() => applyChanges(baseOrder, pendingChanges), [baseOrder, pendingChanges])
  const hasPendingChanges = useMemo(() => Object.keys(sanitizeChanges(pendingChanges)).length > 0, [pendingChanges])
  const itemSubtotal = useMemo(
    () => displayOrder.step2.items.reduce((runningTotal, item) => runningTotal + item.quantity * item.unitPrice, 0),
    [displayOrder.step2.items]
  )
  const stepThreeMilestoneTotal = useMemo(
    () => stepThreeDraft.milestones.reduce((runningTotal, milestone) => runningTotal + milestone.percentage, 0),
    [stepThreeDraft.milestones]
  )
  const stepThreeValidationMessage = useMemo(() => {
    const paymentTermType = stepThreeDraft.paymentTerm.id
    if (paymentTermType === "ADVANCE") {
      if (stepThreeDraft.advancePercentage === null) return "Advance percentage is required."
      if (stepThreeDraft.advancePercentage <= 0 || stepThreeDraft.advancePercentage >= 100) {
        return "Advance percentage must be between 1 and 99."
      }
      if (stepThreeDraft.balanceDueInDays === null || stepThreeDraft.balanceDueInDays < 0) {
        return "Balance due days must be 0 or greater."
      }
    }
    if (paymentTermType === "MILESTONE") {
      if (stepThreeDraft.milestones.length === 0) return "Add at least one milestone."
      const hasInvalidMilestone = stepThreeDraft.milestones.some(
        (milestone) => milestone.label.trim().length === 0 || milestone.percentage <= 0 || milestone.dueInDays < 0
      )
      if (hasInvalidMilestone) return "All milestones must have valid values."
      if (stepThreeMilestoneTotal !== 100) return "Milestone percentages must total 100%."
    }
    if (paymentTermType === "CUSTOM" && stepThreeDraft.customTerms.trim().length === 0) {
      return "Custom terms are required."
    }
    return null
  }, [stepThreeDraft, stepThreeMilestoneTotal])

  useEffect(() => {
    let isActive = true

    const loadOrder = async () => {
      setIsLoadingOrder(true)
      setLoadErrorMessage(null)

      try {
        const purchaseOrder = await getPurchaseOrder(id)
        if (!isActive) {
          return
        }

        const mappedOrder = mapPurchaseOrderResponseToEditableOrder(purchaseOrder)
        setBaseOrder(mappedOrder)
        setPendingChanges({})
        setStepOneDraft(cloneValue(mappedOrder.step1))
        dispatchStepTwo({ type: "set_values", payload: cloneValue(mappedOrder.step2) })
        setStepThreeDraft(cloneValue(mappedOrder.step3))
      } catch (error) {
        if (!isActive) {
          return
        }
        setBaseOrder(createEmptyEditablePurchaseOrder(id))
        setPendingChanges({})
        dispatchStepTwo({ type: "set_values", payload: createEmptyEditablePurchaseOrder(id).step2 })
        setLoadErrorMessage(error instanceof Error ? error.message : "Failed to load purchase order")
      } finally {
        if (isActive) {
          setIsLoadingOrder(false)
        }
      }
    }

    void loadOrder()

    return () => {
      isActive = false
    }
  }, [id])

  const openStepOneModal = () => {
    setStepOneDraft(displayOrder.step1)
    setIsStepOneModalOpen(true)
  }

  const openStepTwoModal = () => {
    dispatchStepTwo({ type: "set_values", payload: displayOrder.step2 })
    setEditingItem(null)
    setIsStepTwoModalOpen(true)
  }

  const openStepThreeModal = () => {
    setStepThreeDraft(displayOrder.step3)
    setIsStepThreeModalOpen(true)
  }

  const onUpdateStepOne = () => {
    const diff = buildStepOneDiff(baseOrder.step1, stepOneDraft)
    setPendingChanges((previous) =>
      sanitizeChanges({
        ...previous,
        step1: Object.keys(diff).length > 0 ? diff : undefined,
      })
    )
    setIsStepOneModalOpen(false)
  }

  const onUpdateStepTwo = () => {
    const diff = buildStepTwoDiff(baseOrder.step2, stepTwoDraft)
    setPendingChanges((previous) =>
      sanitizeChanges({
        ...previous,
        step2: diff,
      })
    )
    setIsStepTwoModalOpen(false)
  }

  const onUpdateStepThree = () => {
    if (stepThreeValidationMessage) return
    const diff = buildStepThreeDiff(baseOrder.step3, stepThreeDraft)
    setPendingChanges((previous) =>
      sanitizeChanges({
        ...previous,
        step3: diff,
      })
    )
    setIsStepThreeModalOpen(false)
  }

  const onPageSaveChanges = async () => {
    if (!hasPendingChanges) {
      toast.info("No changes to save")
      return
    }

    try {
      setIsSaving(true)
      const nextOrder = applyChanges(baseOrder, pendingChanges)
      const sanitizedChanges = sanitizeChanges(pendingChanges)
      const payload: Parameters<typeof updatePurchaseOrder>[1] = {}

      if (sanitizedChanges.step1) {
        payload.step1 = buildStepOnePayload(nextOrder.step1).step1
      }
      if (sanitizedChanges.step2) {
        payload.step2 = buildStepTwoPayload(nextOrder.step2).step2
      }
      if (sanitizedChanges.step3) {
        payload.step3 = buildStepThreePayload(nextOrder.step3).step3
      }

      const updatedPurchaseOrder = await updatePurchaseOrder(displayOrder.id, payload)
      const mappedOrder = mapPurchaseOrderResponseToEditableOrder(updatedPurchaseOrder)

      setBaseOrder(mappedOrder)
      setPendingChanges({})
      setStepOneDraft(cloneValue(mappedOrder.step1))
      dispatchStepTwo({ type: "set_values", payload: cloneValue(mappedOrder.step2) })
      setStepThreeDraft(cloneValue(mappedOrder.step3))
      toast.success("Changes saved")
      router.push(`/purchase-orders/${displayOrder.id}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save changes")
    } finally {
      setIsSaving(false)
    }
  }

  const onPageCancelChanges = () => {
    setPendingChanges({})
    toast.info("Pending changes discarded")
  }

  const departmentOptions: SearchableDropdownOption[] = useMemo(
    () =>
      referenceData.departments.map((department) => ({
        label: department.name,
        value: department.name,
      })),
    [referenceData.departments]
  )

  const userOptions: SearchableDropdownOption[] = useMemo(() => {
    const selectedDepartment = stepOneDraft.requestedByDepartment
    const usersInDepartment = selectedDepartment
      ? referenceData.usersByDepartment[selectedDepartment] ?? []
      : referenceData.users

    const options = usersInDepartment.map((user) => ({
      label: user.email,
      value: user.email,
    }))

    const selectedUser = stepOneDraft.requestedByUser
    if (!selectedUser) {
      return options
    }
    if (options.some((option) => option.value === selectedUser)) {
      return options
    }

    return [{ label: selectedUser, value: selectedUser }, ...options]
  }, [
    referenceData.users,
    referenceData.usersByDepartment,
    stepOneDraft.requestedByDepartment,
    stepOneDraft.requestedByUser,
  ])

  const selectableCatalogItems = useMemo(
    () => {
      const allCatalogItems = referenceData.catalogItems
      const supplierScopedCatalogItems = stepTwoDraft.supplierName
        ? referenceData.catalogBySupplier[stepTwoDraft.supplierName] ?? allCatalogItems
        : allCatalogItems
      const catalogItems = supplierScopedCatalogItems.length > 0 ? supplierScopedCatalogItems : allCatalogItems

      return catalogItems.filter((catalogItem) => {
        if (editingItem?.catalogItemId === catalogItem.id) return true
        return !stepTwoDraft.items.some((lineItem) => lineItem.catalogItemId === catalogItem.id)
      })
    },
    [
      editingItem?.catalogItemId,
      referenceData.catalogBySupplier,
      referenceData.catalogItems,
      stepTwoDraft.items,
      stepTwoDraft.supplierName,
    ]
  )

  const onSaveItem = (lineItem: PurchaseOrderLineItem) => {
    dispatchStepTwo({ type: "save_item", payload: lineItem })
  }

  const onDeleteItem = (lineItemId: string) => {
    dispatchStepTwo({ type: "delete_item", payload: { lineItemId } })
  }

  const onEditItem = (lineItem: PurchaseOrderLineItem) => {
    setEditingItem(lineItem)
    setIsItemModalOpen(true)
  }

  const onReorderItems = (sourceIndex: number, destinationIndex: number) => {
    dispatchStepTwo({
      type: "reorder_items",
      payload: { sourceIndex, destinationIndex },
    })
  }

  const onAddMilestone = () => {
    setStepThreeDraft((previous) => ({
      ...previous,
      milestones: [...previous.milestones, createMilestone(previous.milestones.length)],
    }))
  }

  const onRemoveMilestone = (milestoneId: string) => {
    setStepThreeDraft((previous) => ({
      ...previous,
      milestones: previous.milestones.filter((milestone) => milestone.id !== milestoneId),
    }))
  }

  const onUpdateMilestone = (
    milestoneId: string,
    key: "label" | "percentage" | "dueInDays",
    value: string
  ) => {
    setStepThreeDraft((previous) => ({
      ...previous,
      milestones: previous.milestones.map((milestone) => {
        if (milestone.id !== milestoneId) return milestone
        if (key === "label") return { ...milestone, label: value }
        if (key === "percentage") return { ...milestone, percentage: Number(value) }
        return { ...milestone, dueInDays: Number(value) }
      }),
    }))
  }

  return (
    <InternalPageTemplate>
      <InternalPageBackLink href="/purchase-orders" label="Back to purchase orders" />

      <InternalHero
        title="Edit Purchase Order"
        description="Review and update this purchase order. Changes are saved through the purchase-order API."
        meta={
          <>
            <Badge className="bg-white/15 text-white hover:bg-white/15">PO #{displayOrder.id}</Badge>
            <Badge variant="secondary" className="bg-white text-slate-900 hover:bg-white">
              Edit Mode
            </Badge>
            <Badge className="bg-white/15 text-white capitalize hover:bg-white/15">
              {displayOrder.status}
            </Badge>
            {hasPendingChanges ? (
              <Badge className="bg-amber-500 text-black hover:bg-amber-500">Unsaved Changes</Badge>
            ) : null}
          </>
        }
        actions={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button
              size="sm"
              variant="secondary"
              className="bg-white/15 text-white hover:bg-white/25"
              disabled={!hasPendingChanges || isSaving || isLoadingOrder}
              onClick={onPageSaveChanges}
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-white/30 bg-transparent text-white hover:bg-white/10"
              disabled={!hasPendingChanges || isSaving || isLoadingOrder}
              onClick={onPageCancelChanges}
            >
              Cancel
            </Button>
          </div>
        }
      />

      {isLoadingOrder ? (
        <Card>
          <CardContent className="p-6 text-sm text-slate-600">Loading purchase order...</CardContent>
        </Card>
      ) : null}

      {loadErrorMessage ? (
        <Card>
          <CardContent className="p-6 text-sm font-medium text-red-600">{loadErrorMessage}</CardContent>
        </Card>
      ) : null}

      {referenceData.errorMessage ? (
        <p className="text-sm font-medium text-red-600">{referenceData.errorMessage}</p>
      ) : null}

      {loadErrorMessage || isLoadingOrder ? null : (
      <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle>Basic Request Information</CardTitle>
          <Button type="button" variant="outline" size="sm" onClick={openStepOneModal}>
            Edit
          </Button>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <p className="text-muted-foreground text-xs">Requested By (Department)</p>
            <p className="text-sm font-medium">{displayOrder.step1.requestedByDepartment || "-"}</p>
          </div>
          <div className="space-y-1">
            <p className="text-muted-foreground text-xs">Requested By (User Name)</p>
            <p className="text-sm font-medium">{displayOrder.step1.requestedByUser || "-"}</p>
          </div>
          <div className="space-y-1">
            <p className="text-muted-foreground text-xs">Budget Code</p>
            <p className="text-sm font-medium">{displayOrder.step1.budgetCode || "-"}</p>
          </div>
          <div className="space-y-1">
            <p className="text-muted-foreground text-xs">Need By Date</p>
            <p className="text-sm font-medium">
              {displayOrder.step1.needByDate
                ? dateFormatter.format(new Date(displayOrder.step1.needByDate))
                : "-"}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle>Items</CardTitle>
          <Button type="button" variant="outline" size="sm" onClick={openStepTwoModal}>
            Edit
          </Button>
        </CardHeader>
        <CardContent className="space-y-4 px-0">
          <div className="px-6">
            <p className="text-muted-foreground text-xs">Supplier Name</p>
            <p className="text-sm font-medium">{displayOrder.step2.supplierName || "-"}</p>
          </div>
          <TableScrollContainer innerClassName="min-w-[820px]">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted-foreground border-b text-left">
                  <th className="px-6 py-3 font-medium">Item ID</th>
                  <th className="px-6 py-3 font-medium">Item Name</th>
                  <th className="px-6 py-3 font-medium">Category</th>
                  <th className="px-6 py-3 font-medium">Description</th>
                  <th className="px-6 py-3 font-medium text-right">Qty</th>
                  <th className="px-6 py-3 font-medium text-right">Unit Price</th>
                  <th className="px-6 py-3 font-medium text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {displayOrder.step2.items.map((item) => {
                  const lineTotal = item.quantity * item.unitPrice
                  return (
                    <tr key={item.id} className="border-b last:border-b-0">
                      <td className="px-6 py-4 font-medium">{item.id}</td>
                      <td className="px-6 py-4">{item.item}</td>
                      <td className="px-6 py-4">{item.category}</td>
                      <td className="px-6 py-4">{item.description}</td>
                      <td className="px-6 py-4 text-right">{item.quantity}</td>
                      <td className="px-6 py-4 text-right">{currencyFormatter.format(item.unitPrice)}</td>
                      <td className="px-6 py-4 text-right font-semibold">
                        {currencyFormatter.format(lineTotal)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr>
                  <td className="px-6 py-4" colSpan={5} />
                  <td className="px-6 py-4 text-right text-sm font-semibold">Subtotal</td>
                  <td className="px-6 py-4 text-right text-lg font-bold">
                    {currencyFormatter.format(itemSubtotal)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </TableScrollContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle>Payment Terms</CardTitle>
          <Button type="button" variant="outline" size="sm" onClick={openStepThreeModal}>
            Edit
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <p className="text-muted-foreground text-xs">Payment Term Type</p>
              <p className="text-sm font-medium">{displayOrder.step3.paymentTerm.label}</p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground text-xs">Tax Included</p>
              <p className="text-sm font-medium">{displayOrder.step3.taxIncluded ? "Yes" : "No"}</p>
            </div>
          </div>

          {displayOrder.step3.paymentTerm.id === "ADVANCE" ? (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <p className="text-muted-foreground text-xs">Advance Percentage</p>
                <p className="text-sm font-medium">{displayOrder.step3.advancePercentage ?? 0}%</p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground text-xs">Balance Due In (Days)</p>
                <p className="text-sm font-medium">{displayOrder.step3.balanceDueInDays ?? 0}</p>
              </div>
            </div>
          ) : null}

          {displayOrder.step3.paymentTerm.id === "MILESTONE" ? (
            <div className="space-y-3 rounded-lg border p-4">
              <p className="text-sm font-semibold">Milestones</p>
              {displayOrder.step3.milestones.map((milestone) => (
                <div key={milestone.id} className="grid gap-2 rounded-md border p-3 md:grid-cols-3">
                  <div>
                    <p className="text-muted-foreground text-xs">Label</p>
                    <p className="text-sm font-medium">{milestone.label}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Percentage</p>
                    <p className="text-sm font-medium">{milestone.percentage}%</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Due In</p>
                    <p className="text-sm font-medium">{milestone.dueInDays} days</p>
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          {displayOrder.step3.paymentTerm.id === "CUSTOM" ? (
            <div className="space-y-1">
              <p className="text-muted-foreground text-xs">Custom Terms</p>
              <p className="text-sm font-medium">{displayOrder.step3.customTerms || "-"}</p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center justify-end gap-3">
        <Button variant="outline" disabled={!hasPendingChanges || isSaving || isLoadingOrder} onClick={onPageCancelChanges}>
          Cancel
        </Button>
        <Button disabled={!hasPendingChanges || isSaving || isLoadingOrder} onClick={onPageSaveChanges}>
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
      </>
      )}

      <ControlledModal
        open={isStepOneModalOpen}
        onOpenChange={setIsStepOneModalOpen}
        title="Basic Request Information"
        description="Update the requester and budget details for this purchase order."
      >
        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="edit-requested-by-department">Requested By (Department)</Label>
              <SearchableDropdown
                id="edit-requested-by-department"
                value={stepOneDraft.requestedByDepartment}
                onChange={(value) => setStepOneDraft((previous) => ({ ...previous, requestedByDepartment: value }))}
                options={departmentOptions}
                placeholder="Select department"
                searchPlaceholder="Search department..."
                disabled={departmentOptions.length === 0}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-requested-by-user">Requested By (User Name)</Label>
              <SearchableDropdown
                id="edit-requested-by-user"
                value={stepOneDraft.requestedByUser}
                onChange={(value) => setStepOneDraft((previous) => ({ ...previous, requestedByUser: value }))}
                options={userOptions}
                placeholder="Select user"
                searchPlaceholder="Search user..."
                disabled={userOptions.length === 0}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-budget-code">Budget Code</Label>
              <SearchableDropdown
                id="edit-budget-code"
                value={stepOneDraft.budgetCode}
                onChange={(value) => setStepOneDraft((previous) => ({ ...previous, budgetCode: value }))}
                options={budgetCodeOptions}
                placeholder="Select budget code"
                searchPlaceholder="Search budget code..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-need-by-date">Need By Date (Optional)</Label>
              <Input
                id="edit-need-by-date"
                type="date"
                value={stepOneDraft.needByDate ?? ""}
                onChange={(event) => setStepOneDraft((previous) => ({ ...previous, needByDate: event.target.value }))}
              />
            </div>
          </div>
          <div className="flex items-center justify-end gap-3">
            <Button variant="outline" onClick={() => setIsStepOneModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={onUpdateStepOne}>Update</Button>
          </div>
        </div>
      </ControlledModal>

      <ControlledModal
        open={isStepTwoModalOpen}
        onOpenChange={setIsStepTwoModalOpen}
        title="Build Purchase Items"
        description="Set supplier name and prepare receipt-style purchase items."
        className="w-[min(94vw,1000px)]"
      >
        <div className="space-y-5">
          <div className="rounded-lg border bg-slate-50 p-4">
            <p className="text-xs font-semibold tracking-[0.12em] text-slate-500 uppercase">
              Supplier Name
            </p>
            <p className="mt-1 text-base font-semibold text-slate-900">
              {stepTwoDraft.supplierName || "No Supplier Added, please add items"}
            </p>
          </div>

          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-slate-700">Items</p>
            <Button
              type="button"
              variant="outline"
              disabled={referenceData.catalogItems.length === 0}
              onClick={() => {
                setEditingItem(null)
                setIsItemModalOpen(true)
              }}
            >
              Add Item
            </Button>
          </div>

          {stepTwoDraft.items.length > 0 ? (
            <StepTwoItemsTable
              items={stepTwoDraft.items}
              onEditItem={onEditItem}
              onDeleteItem={onDeleteItem}
              onReorderItems={onReorderItems}
            />
          ) : (
            <p className="text-muted-foreground rounded-lg border border-dashed p-4 text-sm">
              Add items to populate table
            </p>
          )}

          {stepTwoState.supplierWarning ? (
            <p className="text-sm font-medium text-amber-700">{stepTwoState.supplierWarning}</p>
          ) : null}

          <div className="flex items-center justify-end gap-3">
            <Button variant="outline" onClick={() => setIsStepTwoModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={onUpdateStepTwo}>Update</Button>
          </div>
        </div>
      </ControlledModal>

      <ControlledModal
        open={isStepThreeModalOpen}
        onOpenChange={setIsStepThreeModalOpen}
        title="Payment Terms"
        description="Define how this purchase order will be settled."
        className="w-[min(94vw,900px)]"
      >
        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-4 md:col-span-2">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="edit-payment-term-type">Payment Term Type</Label>
                  <Select
                    value={stepThreeDraft.paymentTerm.id}
                    onValueChange={(value) =>
                      setStepThreeDraft((previous) => ({
                        ...previous,
                        paymentTerm:
                          PAYMENT_TERM_OPTIONS.find((option) => option.id === value) ??
                          PAYMENT_TERM_OPTIONS[0],
                      }))
                    }
                  >
                    <SelectTrigger id="edit-payment-term-type" className="w-full">
                      <SelectValue placeholder="Select payment term" />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYMENT_TERM_OPTIONS.map((option) => (
                        <SelectItem key={option.id} value={option.id}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-muted-foreground text-xs">
                    {stepThreeDraft.paymentTerm.description}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-tax-included">Tax Included</Label>
                <Select
                  value={stepThreeDraft.taxIncluded ? "YES" : "NO"}
                  onValueChange={(value) =>
                    setStepThreeDraft((previous) => ({
                      ...previous,
                      taxIncluded: value === "YES",
                    }))
                  }
                >
                  <SelectTrigger id="edit-tax-included" className="w-full md:w-[220px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="YES">Yes</SelectItem>
                    <SelectItem value="NO">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {stepThreeDraft.paymentTerm.id === "ADVANCE" ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="edit-advance-percentage">Advance Percentage</Label>
                    <Input
                      id="edit-advance-percentage"
                      type="number"
                      min={1}
                      max={99}
                      value={stepThreeDraft.advancePercentage ?? ""}
                      onFocus={selectAllOnFocus}
                      onChange={(event) =>
                        setStepThreeDraft((previous) => ({
                          ...previous,
                          advancePercentage:
                            event.target.value === "" ? null : Number(event.target.value),
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-balance-due-days">Balance Due In (Days)</Label>
                    <Input
                      id="edit-balance-due-days"
                      type="number"
                      min={0}
                      value={stepThreeDraft.balanceDueInDays ?? ""}
                      onFocus={selectAllOnFocus}
                      onChange={(event) =>
                        setStepThreeDraft((previous) => ({
                          ...previous,
                          balanceDueInDays:
                            event.target.value === "" ? null : Number(event.target.value),
                        }))
                      }
                    />
                  </div>
                </div>
              ) : null}

              {stepThreeDraft.paymentTerm.id === "MILESTONE" ? (
                <div className="space-y-3 rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">Milestones</p>
                    <Button type="button" variant="outline" onClick={onAddMilestone}>
                      Add Milestone
                    </Button>
                  </div>
                  {stepThreeDraft.milestones.map((milestone) => (
                    <div key={milestone.id} className="grid gap-2 rounded-md border p-3 md:grid-cols-4">
                      <div className="space-y-1">
                        <Label htmlFor={`edit-milestone-label-${milestone.id}`}>Milestone Label</Label>
                        <Input
                          id={`edit-milestone-label-${milestone.id}`}
                          value={milestone.label}
                          onChange={(event) =>
                            onUpdateMilestone(milestone.id, "label", event.target.value)
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor={`edit-milestone-percentage-${milestone.id}`}>
                          Percentage (%)
                        </Label>
                        <Input
                          id={`edit-milestone-percentage-${milestone.id}`}
                          type="number"
                          min={1}
                          max={100}
                          value={milestone.percentage}
                          onFocus={selectAllOnFocus}
                          onChange={(event) =>
                            onUpdateMilestone(milestone.id, "percentage", event.target.value)
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor={`edit-milestone-days-${milestone.id}`}>Due In (Days)</Label>
                        <Input
                          id={`edit-milestone-days-${milestone.id}`}
                          type="number"
                          min={0}
                          value={milestone.dueInDays}
                          onFocus={selectAllOnFocus}
                          onChange={(event) =>
                            onUpdateMilestone(milestone.id, "dueInDays", event.target.value)
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor={`edit-milestone-remove-${milestone.id}`}>Actions</Label>
                        <Button
                          id={`edit-milestone-remove-${milestone.id}`}
                          type="button"
                          variant="outline"
                          onClick={() => onRemoveMilestone(milestone.id)}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                  <p className="text-muted-foreground text-sm">
                    Milestone Total: {stepThreeMilestoneTotal}%
                  </p>
                </div>
              ) : null}

              {stepThreeDraft.paymentTerm.id === "CUSTOM" ? (
                <div className="space-y-2">
                  <Label htmlFor="edit-custom-terms">Custom Terms</Label>
                  <textarea
                    id="edit-custom-terms"
                    rows={4}
                    value={stepThreeDraft.customTerms}
                    onChange={(event) =>
                      setStepThreeDraft((previous) => ({
                        ...previous,
                        customTerms: event.target.value,
                      }))
                    }
                    className="border-input w-full rounded-md border p-3 text-sm"
                  />
                </div>
              ) : null}

              {stepThreeValidationMessage ? (
                <p className="text-sm font-medium text-red-600">{stepThreeValidationMessage}</p>
              ) : null}
            </div>

            <Card className="h-fit">
              <CardContent className="space-y-2 p-4 text-sm">
                <p className="font-semibold">Payment Summary</p>
                <p>
                  Item Subtotal:{" "}
                  <span className="font-semibold">
                    {currencyFormatter.format(
                      stepTwoDraft.items.reduce(
                        (runningTotal, item) => runningTotal + item.quantity * item.unitPrice,
                        0
                      )
                    )}
                  </span>
                </p>
                <p>Payment Type: {stepThreeDraft.paymentTerm.label}</p>
                <p>Tax Included: {stepThreeDraft.taxIncluded ? "Yes" : "No"}</p>
                {stepThreeDraft.paymentTerm.id === "MILESTONE" ? (
                  <p>Milestone Total: {stepThreeMilestoneTotal}%</p>
                ) : null}
              </CardContent>
            </Card>
          </div>

          <div className="flex items-center justify-end gap-3">
            <Button variant="outline" onClick={() => setIsStepThreeModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={onUpdateStepThree} disabled={Boolean(stepThreeValidationMessage)}>
              Update
            </Button>
          </div>
        </div>
      </ControlledModal>

      {isItemModalOpen ? (
        <ItemSelectionModal
          open={isItemModalOpen}
          onOpenChange={setIsItemModalOpen}
          catalogItems={selectableCatalogItems}
          lockedSupplierName={stepTwoDraft.supplierName}
          initialLineItem={editingItem}
          onSave={onSaveItem}
        />
      ) : null}
    </InternalPageTemplate>
  )
}
