import type { HireQuotation } from "@/hooks/useHireQuotations";

const TEST_QUOTATION_PREFIX = "TST-";
const TEST_QUOTATION_DIGITS = 7;

export const isTestQuotationNumber = (quotationNumber: string | null | undefined) =>
  Boolean(quotationNumber?.toUpperCase().startsWith(TEST_QUOTATION_PREFIX));

export const getNextTestQuotationNumber = (quotations: Pick<HireQuotation, "quotation_number">[]) => {
  const highest = quotations.reduce((max, quotation) => {
    const quotationNumber = quotation.quotation_number?.toUpperCase() ?? "";
    if (!quotationNumber.startsWith(TEST_QUOTATION_PREFIX)) return max;

    const numericPart = Number.parseInt(quotationNumber.slice(TEST_QUOTATION_PREFIX.length), 10);
    if (Number.isNaN(numericPart)) return max;

    return Math.max(max, numericPart);
  }, 0);

  return `${TEST_QUOTATION_PREFIX}${String(highest + 1).padStart(TEST_QUOTATION_DIGITS, "0")}`;
};
