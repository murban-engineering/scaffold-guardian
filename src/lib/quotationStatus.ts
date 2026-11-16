import { isTestQuotationNumber } from "@/lib/testQuotation";

export type ContinueQuotationCategory = "draft" | "dispatched" | "completed" | "other" | "test";

export const getContinueQuotationCategory = (
  status: string | null | undefined,
  quotationNumber: string | null | undefined,
): ContinueQuotationCategory => {
  if (isTestQuotationNumber(quotationNumber)) return "test";

  const normalizedStatus = (status || "draft").trim().toLowerCase();
  if (normalizedStatus === "draft") return "draft";
  if (normalizedStatus === "dispatched") return "dispatched";
  if (normalizedStatus === "completed") return "completed";
  return "other";
};

export const isDraftQuotationDeletable = (
  status: string | null | undefined,
  quotationNumber: string | null | undefined,
) => getContinueQuotationCategory(status, quotationNumber) === "draft";