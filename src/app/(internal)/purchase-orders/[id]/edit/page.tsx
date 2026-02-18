import EditPurchaseOrderPageComponent from "@/components/use-case/EditPurchaseOrderPageComponent"

type EditPurchaseOrderPageProps = {
  params: Promise<{
    id: string
  }>
}

const EditPurchaseOrderPage = async ({ params }: EditPurchaseOrderPageProps) => {
  const { id } = await params

  return <EditPurchaseOrderPageComponent id={id} />
}

export default EditPurchaseOrderPage
