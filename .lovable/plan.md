# Tax Invoice: separate returned equipment from items still on hire

## Goal

On the Accounting tax invoice, clearly split equipment into two sections:

1. **Equipment On Hire** — items still on site, billed from dispatch through the billing date. This is the only section that feeds the invoice grand total.
2. **Returned Equipment** — items already returned, showing the return date and the period they were on hire, marked as billing ended. Shown for reference, excluded from the grand total.

Figures for items still on site stay exactly as they are today.

## What changes on the invoice

- Each dispatch batch keeps its current header (delivery note, dispatch date, hire period).
- Inside a batch, rows are grouped: on-hire rows first with a subtotal, then a "Returned Equipment (billing ended)" block with its own subtotal shown as a reference amount.
- Returned rows display: quantity returned, return date, and the hire period from dispatch up to the return date, with a "Billing ended" marker.
- Batch total, invoice subtotal, VAT and grand total are computed from on-hire rows only.
- If a batch has no returned rows, it looks exactly as it does now.
- If everything in a batch is returned, the batch shows the returned block plus a zero billing total.

## Technical notes

- All work is in `src/pages/Accounting.tsx`; no database or schema changes.
- The existing FIFO return allocation (returns matched per part number, oldest return first, billed dispatch → return date) is kept unchanged; only the classification and totalling change.
- `HireLineBreakdown` gains flags: `isReturned`, `returnDate`, and the returned rows keep their computed `lineTotal` as a reference figure.
- `batchHireTotal` sums only rows where `isReturned` is false; a separate `batchReturnedReference` sums the returned rows for display.
- Both the on-screen invoice view and the print/PDF markup render the two sections with matching styling; existing single-page rules (6 items or fewer) count on-hire plus returned rows so pagination stays correct.
