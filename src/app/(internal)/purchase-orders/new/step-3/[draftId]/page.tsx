import CreatePurchaseOrderStepThree from "@/components/use-case/CreatePurchaseOrderFlow/step-three-payment-terms"

type CreatePurchaseOrderStepThreePageProps = {
  params: Promise<{
    draftId: string
  }>
}

const CreatePurchaseOrderStepThreePage = async ({
  params,
}: CreatePurchaseOrderStepThreePageProps) => {
  const { draftId } = await params

  return <CreatePurchaseOrderStepThree draftId={draftId} />
}

export default CreatePurchaseOrderStepThreePage
