import CreatePurchaseOrderGenericStep from "@/components/use-case/CreatePurchaseOrderFlow/step-page"

type CreatePurchaseOrderStepFivePageProps = {
  params: Promise<{
    draftId: string
  }>
}

const CreatePurchaseOrderStepFivePage = async ({
  params,
}: CreatePurchaseOrderStepFivePageProps) => {
  const { draftId } = await params

  return <CreatePurchaseOrderGenericStep draftId={draftId} step={5} />
}

export default CreatePurchaseOrderStepFivePage
