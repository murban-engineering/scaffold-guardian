import { describe, expect, it } from "vitest";
import { buildOnSiteInventoryReport } from "@/lib/siteInventoryReport";
import type { HireQuotation } from "@/hooks/useHireQuotations";

const quotation = (overrides: Partial<HireQuotation>): HireQuotation => ({
  id: "quote-1", quotation_number: "HSQ-001", invoice_number: null, client_id: "CL-001",
  created_by: "user", status: "active", company_name: "Acme", company_address: null,
  company_tel: null, company_fax: null, pin_number: null, company_reg_number: null, city_town: null,
  company_email: null, site_name: "Main Site", site_address: null, site_manager_name: null,
  site_manager_phone: null, site_manager_email: null, official_order_required: false,
  bulk_order_required: false, telephonic_order_acceptable: false, transport_arrangement: null,
  tonnage_discount: 0, basket_discount: 0, tube_clamp_discount: 0, other_discount: 0,
  project_type: null, market_segment: null, account_number: null, payment_method: null,
  credit_limit: null, delivery_address: null, hire_weeks: 0, notes: null,
  created_at: "2026-01-01", updated_at: "2026-01-01", dispatch_date: null,
  delivery_history: [], return_history: [], line_items: [], ...overrides,
});

describe("buildOnSiteInventoryReport", () => {
  it("combines a client's quotations into one site column and subtracts returns", () => {
    const report = buildOnSiteInventoryReport([
      quotation({ delivery_history: [{ siteNumber: "A", items: [{ itemCode: "TUBE", description: "Tube", quantityDelivered: 10 }] }] } as HireQuotation),
      quotation({ id: "quote-2", quotation_number: "HSQ-002", delivery_history: [{ siteNumber: "A", items: [{ itemCode: "TUBE", description: "Tube", quantityDelivered: 5 }] }], return_history: [{ siteNumber: "A", items: [{ itemCode: "TUBE", description: "Tube", totalReturned: 6 }] }] } as HireQuotation),
    ], [
      { quotation_id: "quote-1", site_number: "A", site_name: "Main Site" },
      { quotation_id: "quote-2", site_number: "A", site_name: "Main Site" },
    ]);

    expect(report.siteColumns).toHaveLength(1);
    expect(report.siteColumns[0]).toMatchObject({ client: "Acme", clientId: "CL-001", site: "A" });
    expect(report.itemRows).toEqual([{ itemDescription: "Tube", quantities: { [report.siteColumns[0].key]: 9 }, total: 9 }]);
  });

  it("does not include items that have been fully returned", () => {
    const report = buildOnSiteInventoryReport([
      quotation({ delivery_history: [{ items: [{ itemCode: "BOARD", description: "Board", quantityDelivered: 3 }] }], return_history: [{ items: [{ itemCode: "BOARD", description: "Board", totalReturned: 3 }] }] } as HireQuotation),
    ], []);

    expect(report).toEqual({ siteColumns: [], itemRows: [] });
  });
});
