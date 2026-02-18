import CreatePurchaseOrderGenericStep from "@/components/use-case/CreatePurchaseOrderFlow/step-page"

type CreatePurchaseOrderStepThreePageProps = {
  params: Promise<{
    draftId: string
  }>
}

const CreatePurchaseOrderStepThreePage = async ({
  params,
}: CreatePurchaseOrderStepThreePageProps) => {
  const { draftId } = await params

  return <CreatePurchaseOrderGenericStep draftId={draftId} step={3} />
}

export default CreatePurchaseOrderStepThreePage
