import CreatePurchaseOrderStepTwo from "@/components/use-case/CreatePurchaseOrderFlow/step-two"

type CreatePurchaseOrderStepTwoPageProps = {
  params: Promise<{
    draftId: string
  }>
}

const CreatePurchaseOrderStepTwoPage = async ({
  params,
}: CreatePurchaseOrderStepTwoPageProps) => {
  const { draftId } = await params

  return <CreatePurchaseOrderStepTwo draftId={draftId} />
}

export default CreatePurchaseOrderStepTwoPage
