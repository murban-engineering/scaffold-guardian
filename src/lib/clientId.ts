const QUOTATION_PREFIXES = ["HSQ-", "HQ-", "TST-"] as const;

export const toClientIdFromQuotationNumber = (quotationNumber: string | null | undefined) => {
  if (!quotationNumber) return "";

  const normalizedQuotationNumber = quotationNumber.trim();
  const upperCasedQuotationNumber = normalizedQuotationNumber.toUpperCase();

  const matchingPrefix = QUOTATION_PREFIXES.find((prefix) =>
    upperCasedQuotationNumber.startsWith(prefix),
  );

  if (!matchingPrefix) return normalizedQuotationNumber;

  return `CL-${normalizedQuotationNumber.slice(matchingPrefix.length)}`;
};
