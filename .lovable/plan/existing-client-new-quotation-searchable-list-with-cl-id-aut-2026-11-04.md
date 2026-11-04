# Existing Client New Quotation — searchable list with CL-ID autofill

## Scope (only this change)
Fix the dashboard "Existing Client New Quotation" entry point. Nothing else changes — no workflow edits, no data cleanup in this round.

## The problem
The dashboard's "Existing Client New Quotation" dropdown lists only the 10 most recent clients with no search, so most clients can't be found and their details get re-keyed, creating a new client ID each time (Linsas, Hascons, Patronics, Shaeez and others are duplicated in the data as a result).

## The fix — `src/pages/Index.tsx`
1. Replace the capped dropdown with a searchable picker, the same pattern as "Continue Quotation":
   - Search box matches Client ID (CL-…), company name, or HSQ number (case-insensitive).
   - Full client list, most recent first, no 10-item cap; each client shown once as "Company • CL-…".
2. Typing a CL ID and selecting it proceeds straight into the quotation workflow with that client's details auto-filled (company, address, contacts, PIN, email) and that client's existing client ID — only the quotation number and site number are new. This reuses the existing client-prefill path; no new save logic.
3. Keep the same "New Quotation" and "Continue Quotation" buttons as they are.

## Verification
- Search "CL-000006" or "linsas" from the dashboard finds Linsas Scaffolding; selecting it opens the quotation with details filled and client ID CL-000006 kept.
- A client outside the latest 10 is findable.
- New Quotation and Continue Quotation still work unchanged.
