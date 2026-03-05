import { describe, expect, it } from "vitest";
import { getNextTestQuotationNumber, isTestQuotationNumber } from "@/lib/testQuotation";

describe("test quotation numbering", () => {
  it("starts at TST-0000001 when no test quotation exists", () => {
    expect(getNextTestQuotationNumber([])).toBe("TST-0000001");
  });

  it("increments from the highest existing test quotation number", () => {
    const quotations = [
      { quotation_number: "TST-0000002" },
      { quotation_number: "HSQ-0000100" },
      { quotation_number: "TST-0000010" },
    ];

    expect(getNextTestQuotationNumber(quotations)).toBe("TST-0000011");
  });

  it("recognizes test quotation numbers by TST prefix", () => {
    expect(isTestQuotationNumber("TST-0000009")).toBe(true);
    expect(isTestQuotationNumber("HSQ-0000009")).toBe(false);
  });
});
