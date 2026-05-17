import type { ClientSite } from "@/hooks/useClientSites";
import type { HireQuotation } from "@/hooks/useHireQuotations";
import { formatReportDate, formatReportDateTime } from "@/lib/accountingDates";

export interface CombinedInventorySiteColumn {
  client: string;
  site: string;
}

export interface CombinedInventoryItemRow {
  itemDescription: string;
  quantities: Record<string, number>;
  total: number;
}

export interface CombinedInventoryMatrix {
  siteColumns: CombinedInventorySiteColumn[];
  clientColumnGroups: Array<{ client: string; span: number }>;
  itemRows: CombinedInventoryItemRow[];
}

interface InventoryBySiteRow {
  client: string;
  clientId: string;
  quotationNumber: string;
  siteNumber: string;
  siteName: string;
  siteAddress: string;
  siteContact: string;
  sitePhone: string;
  itemDescription: string;
  quantity: number;
}

const getDeliveredItemsFromHistory = (quotation: HireQuotation): Array<{ description: string; quantity: number }> => {
  const history = quotation.delivery_history;
  const batches: Array<{ items: Array<{ description?: string; itemCode?: string; quantityDelivered?: number }> }> =
    Array.isArray(history) ? history : [];
  const totals: Record<string, number> = {};

  for (const batch of batches) {
    for (const item of batch.items ?? []) {
      const desc = item.description || item.itemCode || "Unknown item";
      totals[desc] = (totals[desc] ?? 0) + (item.quantityDelivered ?? 0);
    }
  }

  if (Object.keys(totals).length === 0) {
    for (const lineItem of quotation.line_items ?? []) {
      if ((lineItem.delivered_quantity ?? 0) > 0) {
        const desc = lineItem.description || lineItem.part_number || "Unknown item";
        totals[desc] = (totals[desc] ?? 0) + (lineItem.delivered_quantity ?? 0);
      }
    }
  }

  return Object.entries(totals).map(([description, quantity]) => ({ description, quantity }));
};

const getRemovalReportQuotations = (hireQuotations: HireQuotation[]) =>
  hireQuotations.filter((quotation) => {
    const status = quotation.status?.toLowerCase?.() ?? "";
    const isEligibleStatus = status !== "completed";
    const hasDelivered = getDeliveredItemsFromHistory(quotation).length > 0;
    return isEligibleStatus && hasDelivered;
  });

const getInventoryBySiteRows = (hireQuotations: HireQuotation[], allClientSites: ClientSite[]): InventoryBySiteRow[] => {
  const rows: InventoryBySiteRow[] = [];

  getRemovalReportQuotations(hireQuotations).forEach((quotation) => {
    const client = quotation.company_name || quotation.site_manager_name || "Unknown client";
    const clientId = quotation.client_id || "";
    const deliveryHistory = Array.isArray(quotation.delivery_history) ? quotation.delivery_history : [];
    const sitesForQuotation = allClientSites.filter((site) => site.quotation_id === quotation.id);
    const siteMap = new Map(sitesForQuotation.map((site) => [site.site_number, site]));

    if (deliveryHistory.length > 0) {
      deliveryHistory.forEach((batch) => {
        const batchSiteNumber =
          (typeof batch === "object" && batch && "siteNumber" in batch ? String(batch.siteNumber ?? "") : "") || "";
        const fallbackSite = sitesForQuotation[0];
        const effectiveSiteNumber = batchSiteNumber || fallbackSite?.site_number || "";
        const matchedSite = effectiveSiteNumber ? siteMap.get(effectiveSiteNumber) : undefined;
        const siteNumber = effectiveSiteNumber;
        const siteName = matchedSite?.site_name || fallbackSite?.site_name || quotation.site_name || "";
        const siteAddress =
          matchedSite?.site_address ||
          matchedSite?.site_location ||
          quotation.site_address ||
          quotation.delivery_address ||
          "";
        const siteContact = matchedSite?.site_manager_name || quotation.site_manager_name || "";
        const sitePhone = matchedSite?.site_manager_phone || quotation.site_manager_phone || "";
        const batchItems =
          typeof batch === "object" && batch && "items" in batch && Array.isArray(batch.items) ? batch.items : [];

        batchItems.forEach((item) => {
          const itemDescription =
            (typeof item === "object" && item && "description" in item ? String(item.description ?? "") : "") ||
            (typeof item === "object" && item && "itemCode" in item ? String(item.itemCode ?? "") : "") ||
            "Unknown item";
          const quantity = Number(
            typeof item === "object" && item && "quantityDelivered" in item ? item.quantityDelivered : 0
          );
          if (quantity <= 0) return;
          rows.push({
            client,
            clientId,
            quotationNumber: quotation.quotation_number || "",
            siteNumber,
            siteName,
            siteAddress,
            siteContact,
            sitePhone,
            itemDescription,
            quantity,
          });
        });
      });
    } else {
      const fallbackSite = sitesForQuotation[0];
      const siteNumber = fallbackSite?.site_number || "";
      const siteName = fallbackSite?.site_name || quotation.site_name || "";
      const siteAddress =
        fallbackSite?.site_address || fallbackSite?.site_location || quotation.site_address || quotation.delivery_address || "";
      const siteContact = fallbackSite?.site_manager_name || quotation.site_manager_name || "";
      const sitePhone = fallbackSite?.site_manager_phone || quotation.site_manager_phone || "";

      (quotation.line_items ?? []).forEach((item) => {
        const quantity = item.delivered_quantity ?? 0;
        if (quantity <= 0) return;
        rows.push({
          client,
          clientId,
          quotationNumber: quotation.quotation_number || "",
          siteNumber,
          siteName,
          siteAddress,
          siteContact,
          sitePhone,
          itemDescription: item.description || item.part_number || "Unknown item",
          quantity,
        });
      });
    }
  });

  return rows;
};

const getSummarizedInventoryBySiteRows = (rows: InventoryBySiteRow[]) => {
  const groupedRows = rows.reduce<Record<string, InventoryBySiteRow>>((acc, row) => {
    const key = [
      row.client,
      row.clientId,
      row.quotationNumber,
      row.siteNumber,
      row.siteName,
      row.siteAddress,
      row.siteContact,
      row.sitePhone,
      row.itemDescription,
    ].join("::");

    if (!acc[key]) {
      acc[key] = { ...row };
    } else {
      acc[key].quantity += row.quantity;
    }
    return acc;
  }, {});

  return Object.values(groupedRows).sort((a, b) => {
    const clientCompare = a.client.localeCompare(b.client);
    if (clientCompare !== 0) return clientCompare;
    const siteCompare = (a.siteNumber || a.siteName).localeCompare(b.siteNumber || b.siteName);
    if (siteCompare !== 0) return siteCompare;
    return a.itemDescription.localeCompare(b.itemDescription);
  });
};

export const buildCombinedInventoryMatrix = (
  hireQuotations: HireQuotation[],
  allClientSites: ClientSite[]
): CombinedInventoryMatrix => {
  const summarizedRows = getSummarizedInventoryBySiteRows(getInventoryBySiteRows(hireQuotations, allClientSites));
  const siteColumns = Array.from(
    new Set(
      summarizedRows.map((row) =>
        JSON.stringify({
          client: row.client || "Unknown client",
          site: row.siteNumber || row.siteName || row.quotationNumber || "Unassigned site",
        })
      )
    )
  )
    .map((column) => JSON.parse(column) as CombinedInventorySiteColumn)
    .sort((a, b) => `${a.client} — ${a.site}`.localeCompare(`${b.client} — ${b.site}`));

  const clientColumnGroups = siteColumns.reduce<Array<{ client: string; span: number }>>((acc, column) => {
    const existing = acc.find((group) => group.client === column.client);
    if (existing) {
      existing.span += 1;
    } else {
      acc.push({ client: column.client, span: 1 });
    }
    return acc;
  }, []);

  const rowsByItem = summarizedRows.reduce<Record<string, Record<string, number>>>((acc, row) => {
    const itemKey = row.itemDescription || "Unknown item";
    const columnKey = JSON.stringify({
      client: row.client || "Unknown client",
      site: row.siteNumber || row.siteName || row.quotationNumber || "Unassigned site",
    });
    if (!acc[itemKey]) acc[itemKey] = {};
    acc[itemKey][columnKey] = (acc[itemKey][columnKey] ?? 0) + row.quantity;
    return acc;
  }, {});

  const itemRows = Object.entries(rowsByItem)
    .map(([itemDescription, quantities]) => ({
      itemDescription,
      quantities,
      total: Object.values(quantities).reduce((sum, value) => sum + value, 0),
    }))
    .sort((a, b) => a.itemDescription.localeCompare(b.itemDescription));

  return { siteColumns, clientColumnGroups, itemRows };
};

const escapeHtml = (value: string | number) =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");

export const openCombinedInventoryReport = (combinedInventoryMatrix: CombinedInventoryMatrix) => {
  if (!combinedInventoryMatrix.itemRows.length || !combinedInventoryMatrix.siteColumns.length) {
    window.alert("No inventory movement records available to print yet.");
    return;
  }

  const origin = window.location.origin;
  const printDate = formatReportDateTime(new Date());
  const docDate = formatReportDate(new Date());

  const combinedTable = `
    <table>
      <thead>
        <tr>
          <th rowspan="2">Item Description</th>
          ${combinedInventoryMatrix.clientColumnGroups
            .map((group) => `<th colspan="${group.span}">${escapeHtml(group.client)}</th>`)
            .join("")}
          <th rowspan="2">Total</th>
        </tr>
        <tr>
          ${combinedInventoryMatrix.siteColumns.map((column) => `<th>${escapeHtml(column.site)}</th>`).join("")}
        </tr>
      </thead>
      <tbody>
        ${combinedInventoryMatrix.itemRows
          .map(
            (item) => `
          <tr>
            <td>${escapeHtml(item.itemDescription)}</td>
            ${combinedInventoryMatrix.siteColumns
              .map((column) => `<td class="text-right">${item.quantities[JSON.stringify(column)] ?? ""}</td>`)
              .join("")}
            <td class="text-right">${item.total}</td>
          </tr>
        `
          )
          .join("")}
      </tbody>
    </table>
  `;

  const html = `<!DOCTYPE html><html><head><title>Inventory by Client & Site Report</title>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: "Arial Narrow", Arial, sans-serif; font-size: 9.5px; color: #1f2937; line-height: 1.3; padding: 12px; background: #fff; }
      a, a:visited, a:hover, a:active { color: #111827 !important; text-decoration: none !important; }
      .print-controls { position: fixed; top: 12px; right: 12px; z-index: 9999; display: flex; padding: 8px; background: rgba(255,255,255,0.97); border: 1px solid #ddd; border-radius: 8px; }
      .print-button { border: 1px solid #333; border-radius: 6px; background: #111; color: #fff; padding: 6px 14px; font-size: 11px; font-weight: 600; cursor: pointer; }
      .brand-block { padding: 8px 10px; margin-bottom: 10px; }
      .brand-top { display: flex; align-items: center; gap: 10px; margin-bottom: 5px; }
      .brand-logo { width: 120px; height: auto; }
      .brand-title { font-size: 20px; font-weight: 900; line-height: 1.15; color: #111827; letter-spacing: -0.3px; }
      .brand-meta { font-size: 9px; color: #374151; }
      .report-title { font-size: 22px; font-weight: 900; color: #111827; margin-bottom: 6px; letter-spacing: -0.2px; }
      .panel { border: 0.5px solid #aaa; border-radius: 8px; padding: 7px 9px; margin-bottom: 8px; background: #ffffff; }
      .info-row { display: flex; gap: 4px; margin-bottom: 2px; align-items: baseline; }
      .info-label { font-weight: 700; color: #111827; min-width: 80px; font-size: 8.5px; }
      .info-sep { color: #6b7280; }
      .info-value { color: #111827; word-break: break-word; flex: 1; font-size: 8.5px; font-weight: 700; }
      .text-right { text-align: right; }
      table { width: 100%; border-collapse: collapse; margin-bottom: 4px; }
      th, td { border: 1px solid #111827; padding: 4px 6px; font-size: 8.5px; vertical-align: top; }
      th { background: #f3f4f6; text-transform: uppercase; letter-spacing: 0.2px; font-weight: 800; }
      tr { page-break-inside: avoid; }
      thead { display: table-header-group; }
      .footer-wrap { margin-top: auto; }
      .footer-brand { background: #facc15; color: #1f2937; font-weight: 700; display: flex; justify-content: space-between; align-items: center; padding: 6px 10px; }
      .footer-legal { text-align: center; font-size: 7.5px; color: #4b5563; padding: 3px 8px 4px; border: 1px solid #e5e7eb; border-top: none; }
      .footer-processed { display: flex; justify-content: space-between; font-size: 7px; color: #6b7280; padding: 4px 0 0; }
      .page-wrapper { display: flex; flex-direction: column; min-height: 92vh; }
      .page-body { flex: 1; }
      @media print {
        body { padding: 0 !important; font-size: 8.5px; background: #ffffff; }
        .print-controls { display: none; }
        @page { size: A4 landscape; margin: 8mm; }
        .page-wrapper { min-height: 92vh; }
      }
    </style>
  </head><body>
    <div class="print-controls">
      <button type="button" class="print-button" onclick="window.print()">Print report</button>
    </div>
    <div class="page-wrapper">
      <div class="page-body">
        <div class="brand-block">
          <div class="brand-top">
            <img src="${origin}/otn-logo-red.png" alt="OTNO Logo" class="brand-logo" />
            <div class="brand-title">OTNO ACCESS SOLUTIONS LIMITED</div>
          </div>
          <div class="brand-meta">
            <div><strong>PIN No:</strong> P052199134H</div>
            <div><strong>Reg No:</strong> PVT-TYDZRM3</div>
          </div>
        </div>
        <h2 class="report-title">Inventory Movement by Client and Site</h2>
        <div class="panel">
          <div class="info-row"><span class="info-label">Document Type</span><span class="info-sep">:</span><span class="info-value">Inventory Movement by Client and Site</span></div>
          <div class="info-row"><span class="info-label">Document Date</span><span class="info-sep">:</span><span class="info-value">${docDate}</span></div>
          <div class="info-row"><span class="info-label">Company</span><span class="info-sep">:</span><span class="info-value">OTNO Access Solutions</span></div>
        </div>
        ${combinedTable}
      </div>
      <div class="footer-wrap">
        <div class="footer-brand">
          <span>OTNO Access Solutions — Your Trusted Scaffolding &amp; Access Partner.</span>
          <img src="${origin}/otn-logo-red.png" alt="OTNO" style="width:80px;height:auto;"/>
        </div>
        <div class="footer-legal">All transactions are subject to our standard Terms of Trade which can be found at: info@otno.ke</div>
        <div class="footer-processed">
          <div><div>Processed Date : ${docDate}</div></div>
          <div style="text-align:right;"><div>Print date : ${printDate}</div></div>
        </div>
      </div>
    </div>
  </body></html>`;

  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const printWindow = window.open(url, "_blank");
  if (!printWindow) {
    window.alert("Please allow popups to print the report.");
    URL.revokeObjectURL(url);
    return;
  }
  printWindow.addEventListener("unload", () => URL.revokeObjectURL(url), { once: true });
};
