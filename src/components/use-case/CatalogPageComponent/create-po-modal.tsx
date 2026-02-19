"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"

import ControlledModal from "@/components/common/ControlledModal"
import SearchableDropdown, {
  type SearchableDropdownOption,
} from "@/components/common/SearchableDropdown"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { handleGatewayUnavailableLogout } from "@/lib/client-session"
import { buildStepOnePayload, createPurchaseOrder } from "@/components/use-case/CreatePurchaseOrderFlow/purchase-order-client"

export type CatalogRowForQuickPo = {
  id: string
  name: string
  categoryName: string
  supplierName: string
  priceUsd: number
  description?: string
}

type DepartmentApiItem = {
  id?: string | null
  name?: string | null
}

type UserApiItem = {
  id?: string | null
  email?: string | null
  departmentId?: string | null
}

type CreatePoFromCatalogModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  catalogItem: CatalogRowForQuickPo | null
}

function normalizeString(value: unknown): string {
  return typeof value === "string" ? value.trim() : ""
}

export function CreatePoFromCatalogModal({
  open,
  onOpenChange,
  catalogItem,
}: CreatePoFromCatalogModalProps) {
  const router = useRouter()

  const [departments, setDepartments] = useState<Array<{ id: string; name: string }>>([])
  const [users, setUsers] = useState<Array<{ id: string; email: string; departmentId: string }>>([])
  const [isLoadingReferenceData, setIsLoadingReferenceData] = useState(false)
  const [referenceDataError, setReferenceDataError] = useState<string | null>(null)

  const [requestedByDepartment, setRequestedByDepartment] = useState("")
  const [requestedByUser, setRequestedByUser] = useState("")
  const [budgetCode, setBudgetCode] = useState("")
  const [needByDate, setNeedByDate] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) {
      return
    }

    let isMounted = true
    const controller = new AbortController()

    const loadReferenceData = async () => {
      setIsLoadingReferenceData(true)
      setReferenceDataError(null)

      try {
        const [departmentsResponse, usersResponse] = await Promise.all([
          fetch("/api/departments", {
            method: "GET",
            cache: "no-store",
            signal: controller.signal,
          }),
          fetch("/api/users?limit=200", {
            method: "GET",
            cache: "no-store",
            signal: controller.signal,
          }),
        ])

        const departmentsPayload = (await departmentsResponse.json()) as
          | DepartmentApiItem[]
          | { message?: string }
        const usersPayload = (await usersResponse.json()) as
          | UserApiItem[]
          | { message?: string }

        if (handleGatewayUnavailableLogout(departmentsResponse.status, departmentsPayload)) {
          return
        }
        if (handleGatewayUnavailableLogout(usersResponse.status, usersPayload)) {
          return
        }

        if (!departmentsResponse.ok) {
          const message =
            departmentsPayload &&
            typeof departmentsPayload === "object" &&
            "message" in departmentsPayload &&
            typeof departmentsPayload.message === "string"
              ? departmentsPayload.message
              : "Failed to fetch departments"
          throw new Error(message)
        }

        if (!usersResponse.ok) {
          const message =
            usersPayload &&
            typeof usersPayload === "object" &&
            "message" in usersPayload &&
            typeof usersPayload.message === "string"
              ? usersPayload.message
              : "Failed to fetch users"
          throw new Error(message)
        }

        if (!isMounted) {
          return
        }

        const nextDepartments = (Array.isArray(departmentsPayload) ? departmentsPayload : [])
          .map((department) => ({
            id: normalizeString(department.id),
            name: normalizeString(department.name),
          }))
          .filter((department) => department.id.length > 0 && department.name.length > 0)

        const nextUsers = (Array.isArray(usersPayload) ? usersPayload : [])
          .map((user) => ({
            id: normalizeString(user.id),
            email: normalizeString(user.email),
            departmentId: normalizeString(user.departmentId),
          }))
          .filter((user) => user.id.length > 0 && user.email.length > 0 && user.departmentId.length > 0)

        setDepartments(nextDepartments)
        setUsers(nextUsers)
      } catch (error) {
        if ((error as Error).name === "AbortError") {
          return
        }

        if (!isMounted) {
          return
        }

        setDepartments([])
        setUsers([])
        setReferenceDataError(error instanceof Error ? error.message : "Failed to load form options")
      } finally {
        if (isMounted) {
          setIsLoadingReferenceData(false)
        }
      }
    }

    loadReferenceData()

    return () => {
      isMounted = false
      controller.abort()
    }
  }, [open])

  useEffect(() => {
    if (!open) {
      setRequestedByDepartment("")
      setRequestedByUser("")
      setBudgetCode("")
      setNeedByDate("")
      setIsSubmitting(false)
      setSubmitError(null)
    }
  }, [open])

  const departmentById = useMemo(
    () =>
      departments.reduce<Record<string, string>>((accumulator, department) => {
        accumulator[department.id] = department.name
        return accumulator
      }, {}),
    [departments]
  )

  const departmentOptions: SearchableDropdownOption[] = useMemo(
    () =>
      departments.map((department) => ({
        label: department.name,
        value: department.name,
      })),
    [departments]
  )

  const usersInDepartment = useMemo(() => {
    if (!requestedByDepartment) {
      return users
    }
    return users.filter((user) => departmentById[user.departmentId] === requestedByDepartment)
  }, [departmentById, requestedByDepartment, users])

  const userOptions: SearchableDropdownOption[] = useMemo(
    () =>
      usersInDepartment.map((user) => ({
        label: user.email,
        value: user.email,
      })),
    [usersInDepartment]
  )

  useEffect(() => {
    if (!requestedByUser) {
      return
    }

    const userIsValid = userOptions.some((option) => option.value === requestedByUser)
    if (!userIsValid) {
      setRequestedByUser("")
    }
  }, [requestedByUser, userOptions])

  const budgetCodeOptions: SearchableDropdownOption[] = [
    { label: "CC-1234", value: "CC-1234" },
    { label: "CC-2314", value: "CC-2314" },
    { label: "CC-4420", value: "CC-4420" },
    { label: "CC-9901", value: "CC-9901" },
    { label: "CC-7603", value: "CC-7603" },
  ]

  const today = new Date()
  const minNeedByDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(today.getDate()).padStart(2, "0")}`

  const isFormValid =
    requestedByDepartment.trim().length > 0 &&
    requestedByUser.trim().length > 0 &&
    budgetCode.trim().length > 0 &&
    catalogItem !== null

  const onNext = async () => {
    if (!catalogItem || isSubmitting) {
      return
    }

    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const stepOnePayload = buildStepOnePayload({
        requestedByDepartment,
        requestedByUser,
        budgetCode,
        needByDate: needByDate || undefined,
      })

      const createdPurchaseOrder = await createPurchaseOrder({
        ...stepOnePayload,
        step2: {
          supplierName: catalogItem.supplierName,
          items: [
            {
              catalogItemId: catalogItem.id,
              item: catalogItem.name,
              supplier: catalogItem.supplierName,
              category: catalogItem.categoryName,
              description: catalogItem.description || catalogItem.name,
              quantity: 1,
              unitPrice: catalogItem.priceUsd,
            },
          ],
        },
      })

      onOpenChange(false)
      router.push(`/purchase-orders/new/step-2/${createdPurchaseOrder.id}`)
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Failed to create purchase order")
      setIsSubmitting(false)
    }
  }

  return (
    <ControlledModal
      open={open}
      onOpenChange={(nextOpen) => {
        if (isSubmitting) {
          return
        }
        onOpenChange(nextOpen)
      }}
      title="Create Purchase Order"
      description="Step 1 details for a new draft purchase order. The selected catalog item will be added as the first line item."
      className="w-[min(96vw,760px)]"
    >
      <div className="space-y-5">
        {catalogItem ? (
          <div className="rounded-lg border bg-slate-50 p-3">
            <p className="text-xs font-semibold tracking-[0.12em] text-slate-500 uppercase">
              Selected Item
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-900">{catalogItem.name}</p>
            <p className="mt-1 text-xs text-slate-600">
              {catalogItem.id} | {catalogItem.supplierName}
            </p>
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="catalog-create-po-requested-by-department">Requested By (Department)</Label>
            <SearchableDropdown
              id="catalog-create-po-requested-by-department"
              value={requestedByDepartment}
              onChange={setRequestedByDepartment}
              options={departmentOptions}
              placeholder="Select department"
              searchPlaceholder="Search department..."
              disabled={isLoadingReferenceData || departmentOptions.length === 0}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="catalog-create-po-requested-by-user">Requested By (User Name)</Label>
            <SearchableDropdown
              id="catalog-create-po-requested-by-user"
              value={requestedByUser}
              onChange={setRequestedByUser}
              options={userOptions}
              placeholder="Select user"
              searchPlaceholder="Search user..."
              disabled={isLoadingReferenceData || userOptions.length === 0}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="catalog-create-po-budget-code">Budget Code</Label>
            <SearchableDropdown
              id="catalog-create-po-budget-code"
              value={budgetCode}
              onChange={setBudgetCode}
              options={budgetCodeOptions}
              placeholder="Select budget code"
              searchPlaceholder="Search budget code..."
              disabled={isLoadingReferenceData}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="catalog-create-po-need-by-date">Need By Date (Optional)</Label>
            <Input
              id="catalog-create-po-need-by-date"
              type="date"
              min={minNeedByDate}
              value={needByDate}
              onChange={(event) => setNeedByDate(event.target.value)}
              disabled={isLoadingReferenceData}
            />
          </div>
        </div>

        {referenceDataError ? <p className="text-sm font-medium text-red-600">{referenceDataError}</p> : null}
        {submitError ? <p className="text-sm font-medium text-red-600">{submitError}</p> : null}

        <div className="flex items-center justify-end gap-3 border-t pt-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="button" onClick={onNext} disabled={!isFormValid || isSubmitting || isLoadingReferenceData}>
            {isSubmitting ? "Creating..." : "Next"}
          </Button>
        </div>
      </div>
    </ControlledModal>
  )
}
