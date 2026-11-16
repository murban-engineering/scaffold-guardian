import { describe, expect, it } from "vitest";
import { isDraftQuotationDeletable } from "@/lib/quotationStatus";

describe("draft quotation deletion eligibility", () => {
  it("allows deleting drafts", () => {
    expect(isDraftQuotationDeletable("draft", "HSQ-000057")).toBe(true);
  });

  it("treats an unset status as a draft", () => {
    expect(isDraftQuotationDeletable(null, "HSQ-000057")).toBe(true);
  });

  it("does not allow deleting dispatched quotations", () => {
    expect(isDraftQuotationDeletable("dispatched", "HSQ-000057")).toBe(false);
  });

  it("does not allow deleting completed quotations", () => {
    expect(isDraftQuotationDeletable("completed", "HSQ-000057")).toBe(false);
  });

  it("does not allow deleting test quotations from the draft action", () => {
    expect(isDraftQuotationDeletable("draft", "TST-0000001")).toBe(false);
  });

  it("does not allow deleting other quotation statuses", () => {
    expect(isDraftQuotationDeletable("pending", "HSQ-000057")).toBe(false);
  });
});