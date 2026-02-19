"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

import SearchableDropdown, {
  type SearchableDropdownOption,
} from "@/components/common/SearchableDropdown"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import { StepShell } from "./step-shell"

export default function CreatePurchaseOrderStepOne() {
  const router = useRouter()

  const [requestedByDepartment, setRequestedByDepartment] = useState("")
  const [requestedByUser, setRequestedByUser] = useState("")
  const [budgetCode, setBudgetCode] = useState("")
  const [needByDate, setNeedByDate] = useState("")
  const [isLoadingDraft] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const departmentOptions: SearchableDropdownOption[] = [
    { label: "Procurement Dept", value: "procurement-dept" },
    { label: "Maintenance Dept", value: "maintenance-dept" },
    { label: "Electrical Team", value: "electrical-team" },
    { label: "Warehouse", value: "warehouse" },
    { label: "Finance Dept", value: "finance-dept" },
    { label: "Operations", value: "operations" },
  ]

  const userOptions: SearchableDropdownOption[] = [
    { label: "Ayesha Khan", value: "ayesha-khan" },
    { label: "Bilal Ahmed", value: "bilal-ahmed" },
    { label: "Hassan Raza", value: "hassan-raza" },
    { label: "Sana Malik", value: "sana-malik" },
    { label: "Manager Operations", value: "manager-operations" },
    { label: "Finance Dept", value: "finance-dept" },
  ]

  const budgetCodeOptions: SearchableDropdownOption[] = [
    { label: "CC-1234", value: "CC-1234" },
    { label: "CC-2314", value: "CC-2314" },
    { label: "CC-4420", value: "CC-4420" },
    { label: "CC-9901", value: "CC-9901" },
    { label: "CC-7603", value: "CC-7603" },
  ]

  const today = new Date()
  const minNeedByDate = `${today.getFullYear()}-${String(
    today.getMonth() + 1
  ).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`

  const onNext = async () => {
    setIsSubmitting(true)
    const mockDraftId =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : String(Date.now())
    router.push(`/purchase-orders/new/step-2/${mockDraftId}`)
  }

  const isFormValid =
    requestedByDepartment.trim().length > 0 &&
    requestedByUser.trim().length > 0 &&
    budgetCode.trim().length > 0

  return (
    <StepShell
      title="Basic Request Information"
      description="Step 1 captures who is requesting this purchase order."
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="requested-by-department">Requested By (Department)</Label>
          <SearchableDropdown
            id="requested-by-department"
            value={requestedByDepartment}
            onChange={setRequestedByDepartment}
            options={departmentOptions}
            placeholder="Select department"
            searchPlaceholder="Search department..."
            disabled={isLoadingDraft}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="requested-by-user">Requested By (User Name)</Label>
          <SearchableDropdown
            id="requested-by-user"
            value={requestedByUser}
            onChange={setRequestedByUser}
            options={userOptions}
            placeholder="Select user"
            searchPlaceholder="Search user..."
            disabled={isLoadingDraft}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="budget-code">Budget Code</Label>
          <SearchableDropdown
            id="budget-code"
            value={budgetCode}
            onChange={setBudgetCode}
            options={budgetCodeOptions}
            placeholder="Select budget code"
            searchPlaceholder="Search budget code..."
            disabled={isLoadingDraft}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="need-by-date">Need By Date (Optional)</Label>
          <Input
            id="need-by-date"
            type="date"
            min={minNeedByDate}
            value={needByDate}
            onChange={(event) => setNeedByDate(event.target.value)}
            disabled={isLoadingDraft}
          />
        </div>
      </div>

      <div className="mt-6 flex items-center justify-end gap-3">
        <Button onClick={onNext} disabled={!isFormValid || isSubmitting || isLoadingDraft}>
          {isSubmitting ? "Saving..." : "Next"}
        </Button>
      </div>
    </StepShell>
  )
}
