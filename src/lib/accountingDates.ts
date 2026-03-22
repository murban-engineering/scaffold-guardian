import { format } from "date-fns";

type DeliveryHistoryEntry = {
  deliveryDate?: unknown;
  status?: unknown;
};

export const parseAsDate = (value: unknown): Date | null => {
  if (typeof value !== "string" || value.trim().length === 0) return null;

  const trimmed = value.trim();
  const isoDateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (isoDateMatch) {
    const [_, year, month, day] = isoDateMatch;
    const parsed = new Date(Number(year), Number(month) - 1, Number(day));
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const reportDateMatch = /^(\d{2})-(\d{2})-(\d{4})$/.exec(trimmed);
  if (reportDateMatch) {
    const [_, day, month, year] = reportDateMatch;
    const parsed = new Date(Number(year), Number(month) - 1, Number(day));
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const asDateOrToday = (value?: string | null) => parseAsDate(value) ?? new Date();

export const toIsoDateOrToday = (value?: string | null) => format(asDateOrToday(value), "yyyy-MM-dd");

export const formatReportDate = (value?: string | Date | null) => {
  const parsed = value instanceof Date ? value : parseAsDate(value);
  return parsed ? format(parsed, "dd-MM-yyyy") : "—";
};

export const formatReportDateTime = (value?: string | Date | null) => {
  const parsed = value instanceof Date ? value : parseAsDate(value);
  return parsed ? format(parsed, "dd-MM-yyyy HH:mm") : "—";
};

const normalizeDeliveryHistory = (payload: unknown): DeliveryHistoryEntry[] => {
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === "object" && Array.isArray((payload as { deliveryHistory?: unknown }).deliveryHistory)) {
    return (payload as { deliveryHistory: DeliveryHistoryEntry[] }).deliveryHistory;
  }
  return [];
};

export const resolveDispatchDateFromHistoryPayload = (payload: unknown) => {
  const entries = normalizeDeliveryHistory(payload)
    .filter((entry) => {
      const status = String(entry?.status ?? "").toLowerCase();
      return status === "" || status === "dispatched" || status === "completed";
    })
    .map((entry) => parseAsDate(entry?.deliveryDate))
    .filter((date): date is Date => Boolean(date))
    .sort((a, b) => a.getTime() - b.getTime());

  if (entries.length === 0) return null;
  return format(entries[0], "yyyy-MM-dd");
};
