import { KanbanBoardState } from "./types"

const mockPurchaseOrders: KanbanBoardState["purchaseOrders"] = {
  "1": {
    id: "1",
    supplierName: "Zoomzone",
    numberOfItems: 46,
    requestedBy: "Marketing",
    totalPrice: 722,
  },
  "2": {
    id: "2",
    supplierName: "Flashdog",
    numberOfItems: 9,
    requestedBy: "John Doe",
    totalPrice: 165,
  },
  "3": {
    id: "3",
    supplierName: "Plambee",
    numberOfItems: 4,
    requestedBy: "Sales",
    totalPrice: 980,
  },
  "4": {
    id: "4",
    supplierName: "Gigaclub",
    numberOfItems: 3,
    requestedBy: "Michael Johnson",
    totalPrice: 192,
  },
  "5": {
    id: "5",
    supplierName: "Abatz",
    numberOfItems: 49,
    requestedBy: "John Doe",
    totalPrice: 573,
  },
  "6": {
    id: "6",
    supplierName: "Bluezoom",
    numberOfItems: 37,
    requestedBy: "Emily Davis",
    totalPrice: 875,
  },
  "7": {
    id: "7",
    supplierName: "Yombu",
    numberOfItems: 20,
    requestedBy: "Sales",
    totalPrice: 194,
  },
  "8": {
    id: "8",
    supplierName: "Linkbuzz",
    numberOfItems: 47,
    requestedBy: "David Brown",
    totalPrice: 401,
  },
  "9": {
    id: "9",
    supplierName: "Realblab",
    numberOfItems: 43,
    requestedBy: "Michael Johnson",
    totalPrice: 773,
  },
  "10": {
    id: "10",
    supplierName: "Dablist",
    numberOfItems: 8,
    requestedBy: "Michael Johnson",
    totalPrice: 798,
  },
}

export const initialKanbanBoard: KanbanBoardState = {
  purchaseOrders: mockPurchaseOrders,
  columns: {
    draft: {
      id: "draft",
      title: "Draft",
      purchaseOrderIds: ["1", "2"],
    },
    submitted: {
      id: "submitted",
      title: "Submitted",
      purchaseOrderIds: ["3", "4"],
    },
    approved: {
      id: "approved",
      title: "Approved",
      purchaseOrderIds: ["5", "6", "7"],
    },
    rejected: {
      id: "rejected",
      title: "Rejected",
      purchaseOrderIds: ["8", "9", "10"],
    },
    fulfilled: {
      id: "fulfilled",
      title: "Fulfilled",
      purchaseOrderIds: [],
    },
  },
  columnOrder: ["draft", "submitted", "approved", "rejected", "fulfilled"],
}
