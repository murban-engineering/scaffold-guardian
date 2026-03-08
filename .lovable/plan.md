
## Understanding the Current State

The current reports use a **manual page-based approach**:
- Each report has a "Page 1" div and "Page 2/3" div with the full header (`renderStandardReportLayout`) copy-pasted into each page div
- The yellow footer is manually placed at the bottom of each page div using flexbox (`margin-top: auto`)
- This is fragile — if content is short it sticks to the bottom, if content overflows it spills beyond the footer

## What the User Wants

A **CSS print-fixed layout** where:
- The full header (logo + company name, document details, company details, site details — exactly as shown in the uploaded image) is **fixed at the top of every printed page**
- The yellow footer (OTNO brand bar + legal text + processed by info — as shown in image 2) is **fixed at the bottom of every printed page**
- Content (tables, sections, signature blocks) flows freely between them — no manual page divs needed

## The CSS Technique

CSS `position: fixed` during `@media print` causes an element to appear on every page. Combined with spacer divs to push content below the header and above the footer:

```text
┌─────────────────────────────────┐  ← position:fixed top:0 (repeats every page)
│  HEADER: Logo | Doc Details     │
│          Company | Site Details │
├─────────────────────────────────┤
│  .header-spacer (pushes content)│
│                                 │
│  CONTENT FLOWS FREELY HERE      │
│  (tables, sections, signatures) │
│                                 │
│  .footer-spacer (pushes content)│
├─────────────────────────────────┤
│  FOOTER: Yellow bar + legal     │  ← position:fixed bottom:0 (repeats every page)
└─────────────────────────────────┘
```

## Affected Reports

All 5 report generators in `src/lib/pdfGenerator.ts`:
1. **Hire Delivery Note** (`generateDeliveryNotePDF`) — 2 pages
2. **Hire Loading Note** (`generateHireLoadingNotePDF`) — 2 pages
3. **Hire Quotation Report** (`generateHireQuotationReportPDF`) — 2 pages
4. **Quotation Calculation PDF** (`generateQuotationPDF`) — 1 page
5. **Hire Return Note** (`generateHireReturnNotePDF`) — 3 pages (Gate Pass page 1 stays pink/unchanged, pages 2–3 get fixed layout)

## Plan

### 1. Create new shared fixed-header & fixed-footer CSS utilities

In `SHARED_PRINT_STYLES`, add:
- `.print-fixed-header` — `position: fixed; top: 0; left: 0; right: 0;` only active `@media print`
- `.print-fixed-footer` — `position: fixed; bottom: 0; left: 0; right: 0;` only active `@media print`  
- `.print-header-spacer` — `height` matching the header block (approx 90–100px)
- `.print-footer-spacer` — `height` matching the footer block (approx 50px)
- On screen: header shows normally at top of document, footer shows at end

### 2. Create a new `renderFixedPageHeader` function

Returns the full 4-panel header (brand + client panel on left, document/company/site panels on right) wrapped in `.print-fixed-header` — matching exactly the format in the uploaded screenshot.

### 3. Create a new `renderFixedPageFooter` function

Returns the yellow footer band (OTNO branding + legal + processed by) wrapped in `.print-fixed-footer`.

### 4. Refactor each report generator

**For each report**, replace the current multi-page div approach with:
- One `renderFixedPageHeader(...)` call at the top
- One `renderFixedPageFooter(...)` call
- `.print-header-spacer` and `.print-footer-spacer` divs 
- All content (tables, sections, signatures) in a single flat flow — no manual page-break wrappers
- Remove duplicate `renderStandardReportLayout` calls from each "Page 2" div
- Remove manual `page-break-before: always` page divs
- The Hire Return Gate Pass (pink page 1) is kept as-is with a `page-break-after` before the main content

### 5. Update `SHARED_PRINT_STYLES`

- Remove old `.page-header` fixed-print styles (replaced by new approach)
- Add `@page { margin-top: 110px; margin-bottom: 60px; }` so browser leaves room for fixed header/footer on all pages
- Keep all existing table, panel, section, info-row styles untouched

## What is NOT changed

- No UI components are touched
- No database changes
- No content is deleted — all sections (signatures, terms, transport charges, etc.) remain
- The Gate Pass pink page in Hire Return stays exactly as-is
- All text, values, and branding remain identical
