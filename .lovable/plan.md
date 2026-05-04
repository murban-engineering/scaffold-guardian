## Goal
When a Tax Invoice in Accounting has 6 or fewer hire equipment items, fit the entire invoice (Hire Charges + Return Condition Charges + Summary + Policy box + Footer) onto a single A4 page so it prints as one page only. Multi-page layout remains for invoices with more than 6 items.

## Where
`src/pages/Accounting.tsx` → `openInvoicePrint()` (lines ~280–493).

Currently the function always emits two wrappers:
- `.page1-wrap`: header + "A. Weekly Hire Charges" + footer (Page 1 of 2)
- `.page2-wrap`: header (repeated) + "B. Return Condition Charges" + summary + policy box + footer (Page 2 of 2), forced via `page-break-before:always`

## Changes
1. Compute item count:
   ```ts
   const hireItemCount = hasBatches
     ? invoice.dispatchBatches.reduce((n, b) => n + b.lines.length, 0)
     : invoice.hireBreakdown.length;
   const isSinglePage = hireItemCount <= 6;
   ```
2. When `isSinglePage`:
   - Render ONE `.page1-wrap` containing: header (once), "A. Weekly Hire Charges" + `hireSection`, "B. Return Condition Charges" table, summary box, policy box, invoice-date footer, and the branded yellow footer.
   - Footer legal text shows `Page 1 of 1`.
   - Do NOT emit the `.page2-wrap` block (so no forced page break).
3. When more than 6 items: keep existing two-page structure unchanged (Page 1 of 2 / Page 2 of 2).
4. Keep `@media print` rules as-is; the absence of `.page2-wrap` naturally prevents a second page. Add `page-break-inside:avoid` on the summary/policy block for safety so they don't split awkwardly on Page 1.

## Acceptance
- Invoice with ≤ 6 hire items prints as exactly one page containing all sections.
- Invoice with > 6 hire items still prints as the existing two-page layout.
- No changes to data, calculations, headers, or styling beyond layout/page-break behavior.
