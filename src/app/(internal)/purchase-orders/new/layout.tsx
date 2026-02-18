import CreatePurchaseOrderFlowLayoutShell from "@/components/use-case/CreatePurchaseOrderFlow/layout-shell"

type CreatePurchaseOrderLayoutProps = {
  children: React.ReactNode
}

const CreatePurchaseOrderLayout = ({ children }: CreatePurchaseOrderLayoutProps) => {
  return <CreatePurchaseOrderFlowLayoutShell>{children}</CreatePurchaseOrderFlowLayoutShell>
}

export default CreatePurchaseOrderLayout
