# Organize Continue Quotation by status

## User-facing changes
- Add a clear status chooser to the Continue Quotation dialog: All, Drafts, Dispatched, Completed, Other, and Test Quotations.
- Show only quotations in the selected category, with a count on each choice; keep the existing search, client filter, and date sorting working within the selection.
- Keep dispatched and completed records separate from drafts, and retain the existing actions for continuing or converting test quotations.
- Preserve the existing quotation-opening behavior and the separate site/report quotation selection flows.

## Technical details
- Update the Continue Quotation view and filtering state in `src/pages/Index.tsx` only.
- Normalize quotation statuses for matching; classify unknown non-test statuses under Other.
- Verify with the project typecheck and inspect the preview to confirm status switching, search, and opening actions remain intact.
