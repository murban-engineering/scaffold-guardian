

# Hire Return: Multi-Batch Returns with Persistent Report

## Overview
Enhance the Hire Return step to support multi-round returns with proper validation, return note details capture, return history tracking, and a persistent printable report section that always remains visible at the bottom of the page.

## Current State
- Multi-batch return logic already exists in code (`handleReturnBalance`, `returnSequence`, `returnHistory`)
- Validation preventing over-returning already exists in `handleReturnQuantityChange`
- `ReturnHistorySection` component exists but is **not rendered** in the return step UI
- Return note details (returned by, received by, vehicle number) are tracked in state but **no form fields** are shown to capture them
- Return history is not persisted to localStorage (unlike delivery history)

## Changes

### 1. Add Return Note Details Form (HireQuotationWorkflow.tsx - Return Step)
Add input fields for:
- Return Note Number (read-only, auto-generated)
- Return Date
- Returned By
- Received By
- Vehicle Number
- Batch indicator badge (e.g., "Batch 2")

### 2. Add ReturnHistorySection to the Return Step
Render the existing `ReturnHistorySection` component below the return items table. This shows:
- Return progress (total delivered vs total returned vs balance remaining)
- Full return history with per-batch item breakdowns
- Print button for each return note
- "Return Remaining Balance" button to start the next batch

### 3. Persist Return History to localStorage
Mirror the delivery history persistence pattern:
- Create a `returnStorageKey` based on quotation ID
- Save `returnHistory`, `returnProcessed`, `returnSequence`, and `returnItems` state to localStorage
- Restore on component mount so the report survives page refreshes

### 4. Add Persistent Hire Return Report Section
Add a card at the very bottom of the return step that is always visible (even after processing). This section:
- Shows a cumulative summary of all returned items with their conditions (Good, Dirty, Damaged, Scrap)
- Includes a "Print Hire Return Note" button for the current/latest return
- Remains accessible regardless of whether the return has been processed

### 5. Strengthen Validation
- Ensure the "Previously Returned" and "Return Balance" columns are visible in the items table for multi-batch context
- Show clear indicators when items are fully returned
- Prevent negative quantities

## Technical Details

**Files to modify:**
- `src/components/dashboard/HireQuotationWorkflow.tsx` - Main changes:
  - Add return note form fields to the return step (around line 2912)
  - Render `ReturnHistorySection` in the return step (before the navigation buttons)
  - Add localStorage persistence for return history (new `useEffect` hooks mirroring delivery history pattern at lines 428-479)
  - Add "Previously Returned" and "Balance" columns to the return items table
  - Add persistent report card at the bottom with print button
  - Add "Print Return Note" button that calls `handlePrintCurrentReturnNote` (already implemented but not wired to any button in the UI)

**No new files or database changes required** -- all the backend logic (inventory updates, maintenance log creation, return quantity tracking in `quotation_line_items`) is already implemented.

