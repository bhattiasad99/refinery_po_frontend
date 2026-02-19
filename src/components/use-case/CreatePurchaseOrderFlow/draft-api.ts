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

export type PurchaseOrderLineItem = {
  id: string
  catalogItemId: string
  item: string
  supplier: string
  category: string
  description: string
  quantity: number
  unitPrice: number
}

export type StepTwoData = {
  supplierName: string
  items: PurchaseOrderLineItem[]
}

export type PaymentTermType =
  | "NET_15"
  | "NET_30"
  | "NET_45"
  | "NET_60"
  | "ADVANCE"
  | "MILESTONE"
  | "CUSTOM"

export type PaymentMilestone = {
  id: string
  label: string
  percentage: number
  dueInDays: number
}

export type PaymentTermOption = {
  id: PaymentTermType
  label: string
  description: string
}

export const PAYMENT_TERM_OPTIONS: PaymentTermOption[] = [
  {
    id: "NET_15",
    label: "Net 15",
    description: "Full payment is due within 15 days after invoice date.",
  },
  {
    id: "NET_30",
    label: "Net 30",
    description: "Full payment is due within 30 days after invoice date.",
  },
  {
    id: "NET_45",
    label: "Net 45",
    description: "Full payment is due within 45 days after invoice date.",
  },
  {
    id: "NET_60",
    label: "Net 60",
    description: "Full payment is due within 60 days after invoice date.",
  },
  {
    id: "ADVANCE",
    label: "Advance",
    description: "A percentage is paid upfront and the balance later.",
  },
  {
    id: "MILESTONE",
    label: "Milestone-based",
    description: "Payments are split against defined delivery milestones.",
  },
  {
    id: "CUSTOM",
    label: "Custom",
    description: "Use custom free-text payment terms for special cases.",
  },
]

export type StepThreeData = {
  paymentTerm: PaymentTermOption
  taxIncluded: boolean
  advancePercentage: number | null
  balanceDueInDays: number | null
  customTerms: string
  milestones: PaymentMilestone[]
}

export type PurchaseOrderDraft = {
  id: string
  createdAt: string
  updatedAt: string
  step1: StepOneData
  step2: StepTwoData
  step3: StepThreeData
  step4: GenericStepData
  step5: GenericStepData
}
