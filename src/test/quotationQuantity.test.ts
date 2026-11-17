import { describe, expect, it } from "vitest";
import { getQuotationQuantity } from "@/lib/quotationQuantity";

describe("quotation quantities", () => {
  it("allows the requested quantity when it exceeds available stock", () => {
    expect(getQuotationQuantity(12)).toBe(12);
  });

  it("allows a requested quantity when no stock is available", () => {
    expect(getQuotationQuantity(4)).toBe(4);
  });

  it("does not allow negative quotation quantities", () => {
    expect(getQuotationQuantity(-2)).toBe(0);
  });
});