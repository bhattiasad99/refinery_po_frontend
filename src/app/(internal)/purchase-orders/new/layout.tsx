import CreatePurchaseOrderFlowLayoutShell from "@/components/use-case/CreatePurchaseOrderFlow/layout-shell"
import { CreatePurchaseOrderReferenceDataProvider } from "@/components/use-case/CreatePurchaseOrderFlow/reference-data-context"
import { loadCreatePurchaseOrderReferenceData } from "@/components/use-case/CreatePurchaseOrderFlow/reference-data-loader"

type CreatePurchaseOrderLayoutProps = {
  children: React.ReactNode
}

const CreatePurchaseOrderLayout = async ({ children }: CreatePurchaseOrderLayoutProps) => {
  const referenceData = await loadCreatePurchaseOrderReferenceData()

  return (
    <CreatePurchaseOrderReferenceDataProvider value={referenceData}>
      <CreatePurchaseOrderFlowLayoutShell>{children}</CreatePurchaseOrderFlowLayoutShell>
    </CreatePurchaseOrderReferenceDataProvider>
  )
}

export default CreatePurchaseOrderLayout
