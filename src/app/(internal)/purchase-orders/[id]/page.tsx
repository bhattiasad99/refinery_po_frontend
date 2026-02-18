import SinglePurchaseOrderPageComponent from "@/components/use-case/SinglePurchaseOrderPageComponent"

type PurchaseOrderDetailsPageProps = {
  params: Promise<{
    id: string
  }>
}

const PurchaseOrderDetailsPage = async ({
  params,
}: PurchaseOrderDetailsPageProps) => {
  const { id } = await params

  return <SinglePurchaseOrderPageComponent id={id} />
}

export default PurchaseOrderDetailsPage
