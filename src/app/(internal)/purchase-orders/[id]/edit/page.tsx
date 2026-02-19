import EditPurchaseOrderPageComponent from "@/components/use-case/EditPurchaseOrderPageComponent"
import { CreatePurchaseOrderReferenceDataProvider } from "@/components/use-case/CreatePurchaseOrderFlow/reference-data-context"
import { loadCreatePurchaseOrderReferenceData } from "@/components/use-case/CreatePurchaseOrderFlow/reference-data-loader"

type EditPurchaseOrderPageProps = {
  params: Promise<{
    id: string
  }>
}

const EditPurchaseOrderPage = async ({ params }: EditPurchaseOrderPageProps) => {
  const { id } = await params
  const referenceData = await loadCreatePurchaseOrderReferenceData()

  return (
    <CreatePurchaseOrderReferenceDataProvider value={referenceData}>
      <EditPurchaseOrderPageComponent key={id} id={id} />
    </CreatePurchaseOrderReferenceDataProvider>
  )
}

export default EditPurchaseOrderPage
