import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import CreatePurchaseOrderStepTwo from "./step-two"

const mocks = vi.hoisted(() => {
  class MockApiError extends Error {
    status: number
    body: unknown

    constructor(message: string, status: number, body: unknown) {
      super(message)
      this.name = "ApiError"
      this.status = status
      this.body = body
    }
  }

  return {
    pushMock: vi.fn(),
    getPurchaseOrderMock: vi.fn(),
    mapPurchaseOrderToStepTwoMock: vi.fn(),
    buildStepTwoPayloadMock: vi.fn(),
    updatePurchaseOrderMock: vi.fn(),
    MockApiError,
  }
})

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mocks.pushMock,
  }),
}))

vi.mock("./purchase-order-client", () => ({
  ApiError: mocks.MockApiError,
  getPurchaseOrder: mocks.getPurchaseOrderMock,
  mapPurchaseOrderToStepTwo: mocks.mapPurchaseOrderToStepTwoMock,
  buildStepTwoPayload: mocks.buildStepTwoPayloadMock,
  updatePurchaseOrder: mocks.updatePurchaseOrderMock,
}))

vi.mock("./reference-data-context", () => ({
  useCreatePurchaseOrderReferenceData: () => ({
    catalogItems: [],
    errorMessage: null,
  }),
}))

describe("CreatePurchaseOrderStepTwo", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getPurchaseOrderMock.mockResolvedValue({ id: "po-1" })
    mocks.mapPurchaseOrderToStepTwoMock.mockReturnValue({
      supplierName: "Supplier A",
      items: [
        {
          id: "line-1",
          catalogItemId: "item-1",
          item: "Valve",
          supplier: "Supplier A",
          category: "Valve",
          description: "Valve",
          quantity: 1,
          unitPrice: 100,
        },
      ],
    })
    mocks.buildStepTwoPayloadMock.mockReturnValue({ step2: { supplierName: "Supplier A", items: [] } })
    mocks.updatePurchaseOrderMock.mockRejectedValue(
      new mocks.MockApiError("All items in a PO must come from the same supplier", 409, null),
    )
  })

  it("shows supplier mismatch message when backend returns 409", async () => {
    render(<CreatePurchaseOrderStepTwo draftId="po-1" />)

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Next" })).toBeEnabled()
    })

    fireEvent.click(screen.getByRole("button", { name: "Next" }))

    expect(
      await screen.findByText("All items in a PO must come from the same supplier"),
    ).toBeInTheDocument()
  })
})
