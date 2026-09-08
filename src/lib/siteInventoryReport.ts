import type { HireQuotation } from "@/hooks/useHireQuotations";

export interface ClientSite {
  quotation_id: string;
  site_number: string;
  site_name: string;
}

export interface OnSiteInventoryColumn {
  key: string;
  client: string;
  clientId: string;
  site: string;
}

export interface OnSiteInventoryRow {
  itemDescription: string;
  quantities: Record<string, number>;
  total: number;
}

const text = (value: unknown) => typeof value === "string" ? value.trim() : "";
const normalized = (value: unknown) => text(value).toLocaleLowerCase();
const quantity = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};

/**
 * Produces the current equipment balance at each client site.
 * Delivery batches add to a site; return batches subtract from that same site.
 * Fully returned equipment is omitted so the report is a true on-site view.
 */
export const buildOnSiteInventoryReport = (
  quotations: HireQuotation[],
  clientSites: ClientSite[],
): { siteColumns: OnSiteInventoryColumn[]; itemRows: OnSiteInventoryRow[] } => {
  const balances = new Map<string, { column: OnSiteInventoryColumn; itemDescription: string; quantity: number }>();

  quotations.forEach((quotation) => {
    const sites = clientSites.filter((site) => site.quotation_id === quotation.id);
    const siteByNumber = new Map(sites.map((site) => [site.site_number, site]));
    const fallbackSite = sites[0];
    const client = text(quotation.company_name) || text(quotation.site_manager_name) || "Unknown client";
    const clientId = text(quotation.client_id);
    const clientKey = clientId ? `id:${normalized(clientId)}` : `name:${normalized(client)}`;

    const resolveSite = (siteNumber: unknown) => {
      const number = text(siteNumber) || fallbackSite?.site_number || "";
      const matchedSite = siteByNumber.get(number);
      const name = matchedSite?.site_name || fallbackSite?.site_name || text(quotation.site_name);
      const site = number || name || "Unassigned site";
      return { site, key: `${clientKey}::${normalized(number || name || "unassigned site")}` };
    };

    const updateBalance = (siteNumber: unknown, itemCode: unknown, description: unknown, amount: number) => {
      if (!amount) return;
      const resolvedSite = resolveSite(siteNumber);
      const displayDescription = text(description) || text(itemCode) || "Unknown item";
      const itemKey = normalized(itemCode) || normalized(description) || "unknown item";
      const key = `${resolvedSite.key}::${itemKey}`;
      const existing = balances.get(key);
      if (existing) {
        existing.quantity += amount;
        return;
      }
      balances.set(key, {
        column: { key: resolvedSite.key, client, clientId, site: resolvedSite.site },
        itemDescription: displayDescription,
        quantity: amount,
      });
    };

    const deliveries = Array.isArray(quotation.delivery_history) ? quotation.delivery_history : [];
    if (deliveries.length) {
      deliveries.forEach((batch) => {
        if (!batch || typeof batch !== "object") return;
        const record = batch as { siteNumber?: unknown; items?: unknown };
        if (!Array.isArray(record.items)) return;
        record.items.forEach((item) => {
          if (!item || typeof item !== "object") return;
          const entry = item as { itemCode?: unknown; description?: unknown; quantityDelivered?: unknown };
          updateBalance(record.siteNumber, entry.itemCode, entry.description, quantity(entry.quantityDelivered));
        });
      });
    } else {
      (quotation.line_items ?? []).forEach((item) => {
        updateBalance(undefined, item.part_number, item.description, quantity(item.delivered_quantity));
      });
    }

    const returns = Array.isArray(quotation.return_history) ? quotation.return_history : [];
    returns.forEach((batch) => {
      if (!batch || typeof batch !== "object") return;
      const record = batch as { siteNumber?: unknown; items?: unknown };
      if (!Array.isArray(record.items)) return;
      record.items.forEach((item) => {
        if (!item || typeof item !== "object") return;
        const entry = item as { itemCode?: unknown; description?: unknown; totalReturned?: unknown; quantityReturned?: unknown };
        updateBalance(record.siteNumber, entry.itemCode, entry.description, -quantity(entry.totalReturned ?? entry.quantityReturned));
      });
    });
  });

  const columnMap = new Map<string, OnSiteInventoryColumn>();
  const items = new Map<string, OnSiteInventoryRow>();
  balances.forEach(({ column, itemDescription, quantity: onSiteQuantity }) => {
    if (onSiteQuantity <= 0) return;
    columnMap.set(column.key, column);
    const item = items.get(itemDescription) ?? { itemDescription, quantities: {}, total: 0 };
    item.quantities[column.key] = (item.quantities[column.key] ?? 0) + onSiteQuantity;
    item.total += onSiteQuantity;
    items.set(itemDescription, item);
  });

  const siteColumns = [...columnMap.values()].sort((a, b) =>
    `${a.client} ${a.clientId} ${a.site}`.localeCompare(`${b.client} ${b.clientId} ${b.site}`),
  );
  const itemRows = [...items.values()].sort((a, b) => a.itemDescription.localeCompare(b.itemDescription));
  return { siteColumns, itemRows };
};
