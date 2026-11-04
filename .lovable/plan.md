# Fix "Existing Client New Quotation" — one client ID per customer

## The problem (verified)

**1. Client details don't auto-fill, and searching fails to find clients.**
- On the dashboard, "Existing Client New Quotation" is a dropdown capped at the 10 most recent clients with no search — most clients are simply not listed.
- Inside the quotation workflow the "Existing Client New Site" picker searches only what was typed and shows at most 8 results, and each company appears multiple times because duplicates split them up.

**2. Every re-keyed quotation creates a brand-new client ID.**
The database confirms heavy duplication — same company saved under different client IDs:

- Linsas Scaffolding → CL-000006, CL-000086, CL-000103, CL-000104
- Hascons Company Limited → CL-000013, CL-000106, CL-000107
- Patronics Services Ltd → CL-000063…066 (four IDs)
- Shaeez enterprise → CL-000019, CL-000072, CL-000097
- Murban, Orton, Remiven, TATU CITY, Wilman, Unity homes, Chennai — all duplicated

Root cause in the workflow: when a repeat client's details are keyed manually instead of picked from the list, the client ID field is empty, so save generates a fresh ID from the sequence. Nothing stops it, and nothing warns that the company already exists.

## The fix

### 1. Dashboard entry point
- Replace the capped dropdown with a searchable list (same pattern as "Continue Quotation"): search by client ID, company name or HSQ number, no 10-item cap, most recent first.

### 2. Workflow — reuse the client ID, never regenerate
- Picking an existing client keeps that client's ID locked and read-only; only the quotation number (auto) and site number/details are new.
- Add a duplicate guard in Section 1: when the company name typed matches an existing client (ignoring case/spacing), warn and offer to load that client's details and ID with one click instead of saving a duplicate.

### 3. One-time data cleanup — one client ID per customer
- Merge every duplicate to one canonical client ID per real company (same approach used for Mevon → CL-000002), picking the ID with the most quotations as the survivor.
- Canonical picks (ID with the most history keeps; others point to it):
  - Linsas Scaffolding → CL-000006 (also unify the name spelling)
  - Hascons → CL-000013; Patronics → CL-000063; Shaeez → CL-000019
  - Murban → CL-000037; Orton → CL-000046; Remiven → CL-000028
  - TATU CITY → CL-000053; Wilman → CL-000078; Chennai → CL-000095
  - Unity homes / "Unity homes - Tatu City" / Unity West Sez → CL-000088
- Name variants (e.g. "Linsas scaffolding" vs "Linsas Scaffolding") are normalised to one spelling so search and reports match.
- New-client sequence is unaffected — only existing records change.

## What stays untouched
- Quotation numbering (HSQ), site numbering (NK), the CL sequence for genuinely new clients, billing/reports logic.

## Verification
- Search finds any client from the dashboard and in the workflow.
- Creating a quotation for a repeat client keeps their client ID; a new site number is created.
- Typing an existing company name triggers the duplicate warning.
- Reports (Sites entry/removal, Client Report) now show each merged client under one ID.
