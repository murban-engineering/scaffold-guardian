import { describe, expect, it } from "vitest";

import { toClientIdFromQuotationNumber } from "@/lib/clientId";

describe("toClientIdFromQuotationNumber", () => {
  it("converts HSQ quotation numbers into client IDs", () => {
    expect(toClientIdFromQuotationNumber("HSQ-0000123")).toBe("CL-0000123");
  });

  it("converts test quotation numbers into client IDs", () => {
    expect(toClientIdFromQuotationNumber("TST-0000456")).toBe("CL-0000456");
  });

  it("returns an empty string when no quotation number is provided", () => {
    expect(toClientIdFromQuotationNumber(undefined)).toBe("");
  });
});
