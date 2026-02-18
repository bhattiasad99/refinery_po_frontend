import CreatePurchaseOrderPreview from "@/components/use-case/CreatePurchaseOrderFlow/preview-page"

type CreatePurchaseOrderPreviewPageProps = {
  params: Promise<{
    draftId: string
  }>
}

const CreatePurchaseOrderPreviewPage = async ({
  params,
}: CreatePurchaseOrderPreviewPageProps) => {
  const { draftId } = await params

  return <CreatePurchaseOrderPreview draftId={draftId} />
}

export default CreatePurchaseOrderPreviewPage
