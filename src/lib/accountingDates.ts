import { format } from "date-fns";

type DeliveryHistoryEntry = {
  deliveryDate?: unknown;
  status?: unknown;
};

const parseAsDate = (value: unknown): Date | null => {
  if (typeof value !== "string" || value.trim().length === 0) return null;

  const trimmed = value.trim();
  const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (dateOnlyMatch) {
    const [_, year, month, day] = dateOnlyMatch;
    const parsed = new Date(Number(year), Number(month) - 1, Number(day));
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const asDateOrToday = (value?: string | null) => parseAsDate(value) ?? new Date();

export const toIsoDateOrToday = (value?: string | null) => format(asDateOrToday(value), "yyyy-MM-dd");

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
