

# Multi-Feature Update Plan

## Overview
This plan addresses 7 distinct improvements to the scaffold management system, covering inventory, quotation workflow, and PDF report changes.

---

## 1. Add Total Tonnage to Inventory Overview

**Current state:** The inventory page shows quantity totals (Opening Stock, Available, On Hire) but no tonnage/mass totals.

**Changes in `src/components/dashboard/InventoryOverview.tsx`:**
- Extend the `totals` computation to calculate total mass for each category (opening stock tonnage, available tonnage, on-hire tonnage) by multiplying each item's `mass_per_item` by the respective quantity.
- Add 3 new summary cards below the existing ones showing "Total Tonnage", "Available Tonnage", and "On Hire Tonnage" formatted in kg/tonnes.
- Add a "Total Mass" column to the inventory table showing `mass_per_item * quantity` per row, plus a footer row summing all masses.

---

## 2. Multiple Site Numbers per Client (based on materials supplied)

**Current state:** Client sites can already be created via `useClientSites` hook with site numbers derived from the quotation number. The system supports multiple sites per quotation.

**Changes in `src/components/dashboard/HireQuotationWorkflow.tsx`:**
- In the Hire Loading / Delivery step, add a site selector dropdown so each delivery can be linked to a specific client site.
- When generating delivery notes and loading notes, include the selected site number in the printed documents.
- Make site creation more prominent -- show existing sites for the client across all their quotations, and allow creating new sites with auto-incremented suffixes (e.g., CL-001001-A, CL-001001-B).

This already partially exists; the enhancement ensures it's clearly accessible from the delivery workflow.

---

## 3. Manual Date Entry on Yard Verification Report

**Current state:** The Yard Verification PDF includes a "Printed:" row with `formatTimestamp()` showing the auto-generated print timestamp.

**Changes in `src/lib/pdfGenerator.ts` (generateYardVerificationNotePDF):**
- Remove the "Printed:" row that shows `formatTimestamp()`.
- Change the "Date:" field to accept and display the manually entered date from the delivery form (already passed as `data.deliveryDate`).

**Changes in `src/components/dashboard/HireQuotationWorkflow.tsx`:**
- Ensure the Yard Verification button passes the user-entered date rather than the auto-generated timestamp.

---

## 4. Allow Quotation Without Available Inventory

**Current state:** The system blocks adding items when `totalRequested > availableQty` and caps the quantity input to `remainingSelectedQty`.

**Changes in `src/components/dashboard/HireQuotationWorkflow.tsx`:**
- Remove the inventory availability check in `handleAddFromInventory` that blocks adding items exceeding available stock.
- Remove the `addDisabled` condition that checks `remainingSelectedQty <= 0`.
- Remove the quantity capping effect that limits input to `remainingSelectedQty`.
- Keep showing "Available in yard: X" as an informational label during quotation entry (equipment step) so the user can see availability.
- In the printed quotation PDF (`generateHireQuotationReportPDF`), hide the "Warehouse Available Qty" column so it does not appear on printed output.

**Changes in `src/lib/pdfGenerator.ts`:**
- Remove the "Warehouse Available Qty" column from the Hire Quotation PDF table.
- Adjust column spans in the subtotal/total rows accordingly.

---

## 5. Allow Quotation Without Customer Number

**Current state:** A quotation number (HSQ-XXXXXX) is auto-generated on save, and a Client ID (CL-XXXXXX) is derived from it. Both are created together.

**Changes in `src/components/dashboard/HireQuotationWorkflow.tsx`:**
- Keep the current flow: quotation number is always generated, client ID is always derived. This is the quotation number, not the customer/account number.
- Make the "Account Number" field in the client details section clearly optional with placeholder text: "For account holders only".
- Add a label/note near the Client ID field explaining: "Customer Number is assigned only for clients with an active account."
- The `account_number` field in the database already exists and is optional. No database changes needed.

---

## 6. Allow Subtracting Quantities on Equipment Items

**Current state:** When an item already exists in the equipment list and the user adds the same item again, it only adds to the quantity. There's no way to reduce quantities.

**Changes in `src/components/dashboard/HireQuotationWorkflow.tsx`:**
- Make the quantity column in the equipment table editable (add an input field) so users can directly type a new quantity (including reducing it).
- Change the quantity display from static text `{qty}` to an editable `<Input>` field.
- Allow the quantity to go down to 0 (which effectively means the user can remove the item or set it to any value).

---

## 7. Default Equipment Quantity to 0 Instead of 1

**Current state:** `equipmentQuantity` is initialized to `"1"` and reset to `"1"` after adding an item.

**Changes in `src/components/dashboard/HireQuotationWorkflow.tsx`:**
- Change the initial state from `"1"` to `"0"`.
- Change the reset after adding from `"1"` to `"0"`.
- Remove the effect that auto-sets quantity to `"1"` when it's `<= 0`.
- Update the add button disabled logic: disable when quantity is 0 or no item selected (keep `parseNumber(equipmentQuantity) <= 0` check).

---

## Technical Summary of Files to Modify

| File | Changes |
|------|---------|
| `src/components/dashboard/InventoryOverview.tsx` | Add tonnage totals (cards + table column) |
| `src/components/dashboard/HireQuotationWorkflow.tsx` | Remove inventory cap on quotations, editable qty column, default qty to 0, optional account number |
| `src/lib/pdfGenerator.ts` | Remove "Printed" row from Yard Verification, remove "Warehouse Available Qty" from Hire Quotation PDF |

No database migrations are required -- all changes are frontend/UI only.

