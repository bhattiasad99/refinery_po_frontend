import CreatePurchaseOrderGenericStep from "@/components/use-case/CreatePurchaseOrderFlow/step-page"

type CreatePurchaseOrderStepTwoPageProps = {
  params: Promise<{
    draftId: string
  }>
}

const CreatePurchaseOrderStepTwoPage = async ({
  params,
}: CreatePurchaseOrderStepTwoPageProps) => {
  const { draftId } = await params

  return <CreatePurchaseOrderGenericStep draftId={draftId} step={2} />
}

export default CreatePurchaseOrderStepTwoPage
