# Inventory permissions
- [x] Restrict Add Scaffold page Add and Deduct actions to Angela with server enforcement.
- [x] Verify Angela adds/deducts through the page and another signed-in user is denied by the server; confirm delivery/return callers and functions are unchanged.

# Existing client quotation search
- [x] Add a searchable client dialog for Client ID, company name, and HSQ number; selecting or pressing Enter on an exact CL ID opens a pre-filled quotation.
- [x] Run the requested typecheck.

# Draft quotation deletion
- [x] Add a delete action only for draft quotations in Continue Quotation and require confirmation.
- [ ] Verify draft-only eligibility in tests and the preview.

# Quotation quantities beyond current stock
- [x] Remove current-stock caps when adding or editing equipment in new and continued quotations; retain dispatch stock checks.
- [x] Run the quantity tests and typecheck; verify stock checks remain on dispatch.