# Frontend Idempotency Sanity Checklist

Use this checklist to confirm the UI and BFF layer always pass idempotency keys for purchase-order mutations.

## 1) Static wiring checks

- Confirm key generator exists:
  - `src/lib/idempotency/purchase-order-idempotency.ts`
- Confirm write client auto-applies `Idempotency-Key`:
  - `src/components/use-case/CreatePurchaseOrderFlow/purchase-order-client.ts`
- Confirm PO status actions go through the write client:
  - `src/components/use-case/SinglePurchaseOrderPageComponent/status-action-buttons.tsx`
- Confirm API routes forward `Idempotency-Key` to gateway:
  - `src/app/api/purchase-orders/**/route.ts`

## 2) Automated checks

Run these from `refinery_po_frontend`:

```bash
npm run lint
npm run test
npm run build
```

Expected:

- Lint passes.
- Tests pass, including `purchase-order-idempotency.test.ts`.
- Build succeeds.

## 3) Runtime behavior checks (manual)

1. Open the app and create a draft PO from step 1.
2. In browser devtools network tab, inspect `POST /api/purchase-orders` request headers.
3. Verify `Idempotency-Key` is present.
4. Submit/approve/reject/fulfill from PO pages and verify each mutation request includes `Idempotency-Key`.
5. Confirm normal user flow still works (no new validation errors, no stuck loading states).
