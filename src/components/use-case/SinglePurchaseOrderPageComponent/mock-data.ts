export const MOCK_PURCHASE_ORDERS = [
    {
        "id": 1,
        "supplier_name": "Alpha Industrial Supplies",
        "created_at": "2026-02-18T08:15:00.000Z",
        "requested_by": "Procurement Dept",
        "status": "draft",
        "timeline": {
            "created": { "time": "2026-02-18T08:15:00.000Z", "createdBy": "Ayesha Khan" },
            "submitted": null,
            "approved": null,
            "rejected": null,
            "fulfilled": null
        },
        "purchase_order_details": [
            { "id": "PO1-001", "item_name": "Safety Gloves (Box)", "quantity": 10, "rate": 12.5, "total_cost": 125 },
            { "id": "PO1-002", "item_name": "Protective Goggles", "quantity": 15, "rate": 8, "total_cost": 120 },
            { "id": "PO1-003", "item_name": "High-Vis Vest", "quantity": 8, "rate": 18.75, "total_cost": 150 }
        ],
        "total_price_of_order": 395
    },
    {
        "id": 2,
        "supplier_name": "Pak Lubricants Co.",
        "created_at": "2026-02-16T10:40:00.000Z",
        "requested_by": "Maintenance Dept",
        "status": "submitted",
        "timeline": {
            "created": { "time": "2026-02-16T10:40:00.000Z", "createdBy": "Bilal Ahmed" },
            "submitted": { "time": "2026-02-16T12:10:00.000Z", "submittedBy": "Bilal Ahmed" },
            "approved": null,
            "rejected": null,
            "fulfilled": null
        },
        "purchase_order_details": [
            { "id": "PO2-001", "item_name": "Hydraulic Oil (20L)", "quantity": 6, "rate": 95, "total_cost": 570 },
            { "id": "PO2-002", "item_name": "Grease Cartridge", "quantity": 40, "rate": 4.25, "total_cost": 170 },
            { "id": "PO2-003", "item_name": "Oil Filter", "quantity": 25, "rate": 6.8, "total_cost": 170 }
        ],
        "total_price_of_order": 910
    },
    {
        "id": 3,
        "supplier_name": "Sigma Electrical Traders",
        "created_at": "2026-02-12T09:05:00.000Z",
        "requested_by": "Electrical Team",
        "status": "approved",
        "timeline": {
            "created": { "time": "2026-02-12T09:05:00.000Z", "createdBy": "Hassan Raza" },
            "submitted": { "time": "2026-02-12T09:45:00.000Z", "submittedBy": "Hassan Raza" },
            "approved": { "time": "2026-02-12T11:20:00.000Z", "approvedBy": "Manager Operations" },
            "rejected": null,
            "fulfilled": null
        },
        "purchase_order_details": [
            { "id": "PO3-001", "item_name": "Circuit Breaker 32A", "quantity": 12, "rate": 22.5, "total_cost": 270 },
            { "id": "PO3-002", "item_name": "Copper Cable (meter)", "quantity": 200, "rate": 2.15, "total_cost": 430 },
            { "id": "PO3-003", "item_name": "Cable Lugs Pack", "quantity": 25, "rate": 3.2, "total_cost": 80 }
        ],
        "total_price_of_order": 780
    },
    {
        "id": 4,
        "supplier_name": "Delta Packaging Works",
        "created_at": "2026-02-05T07:30:00.000Z",
        "requested_by": "Warehouse",
        "status": "fulfilled",
        "timeline": {
            "created": { "time": "2026-02-05T07:30:00.000Z", "createdBy": "Sana Malik" },
            "submitted": { "time": "2026-02-05T08:10:00.000Z", "submittedBy": "Sana Malik" },
            "approved": { "time": "2026-02-05T10:00:00.000Z", "approvedBy": "Finance Dept" },
            "rejected": null,
            "fulfilled": { "time": "2026-02-07T15:25:00.000Z", "fulfilledBy": "Receiving Team" }
        },
        "purchase_order_details": [
            { "id": "PO4-001", "item_name": "Corrugated Boxes (Large)", "quantity": 300, "rate": 1.1, "total_cost": 330 },
            { "id": "PO4-002", "item_name": "Packing Tape رول", "quantity": 60, "rate": 1.95, "total_cost": 117 },
            { "id": "PO4-003", "item_name": "Bubble Wrap (meter)", "quantity": 150, "rate": 0.85, "total_cost": 127.5 }
        ],
        "total_price_of_order": 574.5
    }
]
