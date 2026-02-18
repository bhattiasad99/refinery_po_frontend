import CreatePurchaseOrderStepOne from "@/components/use-case/CreatePurchaseOrderFlow/step-one"

type CreatePurchaseOrderPageProps = {
  searchParams: Promise<{
    draftId?: string
  }>
}

const CreatePurchaseOrderPage = async ({
  searchParams,
}: CreatePurchaseOrderPageProps) => {
  const { draftId } = await searchParams

  return <CreatePurchaseOrderStepOne initialDraftId={draftId} />
}

export default CreatePurchaseOrderPage
