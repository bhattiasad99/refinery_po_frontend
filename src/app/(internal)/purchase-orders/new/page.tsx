import CreatePurchaseOrderStepOne from "@/components/use-case/CreatePurchaseOrderFlow/step-one"

type CreatePurchaseOrderPageProps = {
  searchParams: Promise<{
    draftId?: string
  }>
}

const CreatePurchaseOrderPage = async ({
  searchParams,
}: CreatePurchaseOrderPageProps) => {
  const resolvedSearchParams = await searchParams
  const draftId = resolvedSearchParams.draftId?.trim() || null

  return <CreatePurchaseOrderStepOne initialDraftId={draftId} />
}

export default CreatePurchaseOrderPage
