import CreatePurchaseOrderGenericStep from "@/components/use-case/CreatePurchaseOrderFlow/step-page"

type CreatePurchaseOrderStepFourPageProps = {
  params: Promise<{
    draftId: string
  }>
}

const CreatePurchaseOrderStepFourPage = async ({
  params,
}: CreatePurchaseOrderStepFourPageProps) => {
  const { draftId } = await params

  return <CreatePurchaseOrderGenericStep draftId={draftId} step={4} />
}

export default CreatePurchaseOrderStepFourPage
