// PDF Generation utilities using browser print
import { formatReportDate, formatReportDateTime } from "@/lib/accountingDates";

export interface DeliveryNoteData {
  quotationNumber: string;
  deliveryNoteNumber: string;
  dateCreated: string;
  deliveryDate: string;
  dispatchDate?: string;
  hireStartDate?: string;
  companyName: string;
  companyAddress?: string;
  companyCityTown?: string;
  companyTel?: string;
  companyFax?: string;
  companyEmail?: string;
  companyPinNumber?: string;
  companyRegNumber?: string;
  siteName: string;
  siteAddress: string;
  contactName: string;
  contactPhone: string;
  deliveredBy: string;
  receivedBy: string;
  vehicleNo: string;
  remarks: string;
  createdBy?: string;
  clientId?: string;
  siteId?: string;
  items: Array<{
    partNumber: string | null;
    description: string | null;
    balanceQuantity: number;
    quantity: number;
    massPerItem: number | null;
    totalMass: number | null;
  }>;
}

export interface QuotationCalculationData {
  quotationNumber: string;
  dateCreated: string;
  companyName: string;
  companyAddress?: string;
  companyCityTown?: string;
  companyTel?: string;
  companyFax?: string;
  companyEmail?: string;
  companyPinNumber?: string;
  companyRegNumber?: string;
  siteName: string;
  siteLocation?: string;
  siteAddress: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  createdBy?: string;
  clientId?: string;
  siteId?: string;
  items: Array<{
    partNumber: string | null;
    description: string | null;
    quantity: number;
    weeklyRate: number;
    weeklyTotal: number;
  }>;
  hireWeeks: number;
  weeklyTotal: number;
  totalForPeriod: number;
  vatRate: number;
  vatAmount: number;
  grandTotal: number;
  discountRate: number;
  discountAmount: number;
  paymentTotal: number;
  paymentTerms: string;
}

export interface HireQuotationReportData {
  quotationNumber: string;
  dateCreated: string;
  companyName: string;
  companyAddress?: string;
  companyCityTown?: string;
  companyTel?: string;
  companyFax?: string;
  companyEmail?: string;
  companyPinNumber?: string;
  companyRegNumber?: string;
  siteName: string;
  siteLocation: string;
  siteAddress: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  officeTel: string;
  officeEmail: string;
  createdBy: string;
  discountRate: number;
  comments?: string;
  clientId?: string;
  siteId?: string;
  items: Array<{
    partNumber: string | null;
    description: string | null;
    quantity: number;
    warehouseAvailableQty: number;
    massPerItem: number | null;
    weeklyRate: number;
    weeklyTotal: number;
    discountRate: number;
  }>;
}

export interface HireLoadingNoteData {
  quotationNumber: string;
  dateCreated: string;
  dispatchDate?: string;
  companyName: string;
  companyAddress?: string;
  companyCityTown?: string;
  companyTel?: string;
  companyFax?: string;
  companyEmail?: string;
  companyPinNumber?: string;
  companyRegNumber?: string;
  siteName: string;
  siteLocation: string;
  siteAddress: string;
  contactName: string;
  contactPhone: string;
  createdBy: string;
  noteTitle?: string;
  clientId?: string;
  siteId?: string;
  items: Array<{
    partNumber: string | null;
    description: string | null;
    quantity: number;
    massPerItem: number | null;
    totalMass: number | null;
  }>;
}

export interface HireReturnNoteData {
  quotationNumber: string;
  returnNoteNumber: string;
  dateCreated: string;
  returnDate: string;
  hireEndDate?: string;
  companyName: string;
  companyAddress?: string;
  companyCityTown?: string;
  companyTel?: string;
  companyFax?: string;
  companyEmail?: string;
  companyPinNumber?: string;
  companyRegNumber?: string;
  siteName: string;
  siteLocation: string;
  siteAddress: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  officeTel: string;
  officeEmail: string;
  returnedBy: string;
  receivedBy: string;
  vehicleNo: string;
  remarks: string;
  createdBy?: string;
  clientId?: string;
  siteId?: string;
  items: Array<{
    partNumber: string | null;
    description: string | null;
    totalDelivered: number;
    good: number;
    dirty: number;
    damaged: number;
    scrap: number;
    totalReturned: number;
    balanceAfter: number;
    massPerItem: number | null;
    totalMass: number | null;
  }>;
}

const COMPANY_NAME = "OTNO Access Solutions";
const PAYMENT_DETAILS_HTML = `<strong>Payment Details:</strong><br/>
      Account Name: OTNO ACCESS SOLUTIONS LIMITED<br/>
      KES Account Number: 02107773676350<br/>
      Bank Name: I&amp;M BANK LIMITED<br/>
      Branch Name: Changamwe<br/>
      Bank Code: 57<br/>
      Branch Code: 021<br/>
      Swift Code: IMBLKENA<br/>
      Mpesa Paybill Code: 542542`;
const COMPANY_ADDRESS = "P.O.BOX 142-00502 Nairobi Karen";
const COMPANY_LOCATION = "Embakasi, Old North Airport Rd";
const COMPANY_WEBSITE = "otno.ke";
const COMPANY_REG = "YQ192VDK";
const COMPANY_PIN = "P052471711M";

const formatTimestamp = () => {
  const now = new Date();
  return formatReportDateTime(now);
};

// ── Page-1 footer band (yellow brand bar + legal text + processed info) ────────
const renderPage1Footer = (createdBy: string, dateCreated: string) => `
  <div style="margin-top:auto;">
    <div style="background:#facc15;color:#1f2937;font-weight:700;display:flex;justify-content:space-between;align-items:center;padding:6px 10px;">
      <span>OTNO Access Solutions — Your Trusted Scaffolding &amp; Access Partner.</span>
      <img src="${window.location.origin}/otn-logo-red.png" alt="OTNO" style="width:80px;height:auto;"/>
    </div>
    <div style="text-align:center;font-size:7.5px;color:#4b5563;padding:3px 8px 4px;border:1px solid #e5e7eb;border-top:none;">
      All transactions are subject to our standard Terms of Trade which can be found at: otnoacess@gmail.com &nbsp;|&nbsp; Page 1 of 2
    </div>
    <div style="display:flex;justify-content:space-between;font-size:7px;color:#6b7280;padding:4px 0 0;">
      <div>
        <div>Processed By : ${createdBy || ""}</div>
        <div>Processed Date : ${formatReportDate(dateCreated) || ""}</div>
      </div>
      <div style="text-align:right;">
        <div>Print date : ${formatTimestamp()}</div>
      </div>
    </div>
  </div>
`;

const formatCurrency = (value: number) =>
  `Ksh ${value.toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatMass = (value: number | string | null | undefined) => {
  if (value == null) return "-";
  const parsed = typeof value === "string" ? Number(value) : value;
  return Number.isFinite(parsed) ? `${parsed.toFixed(2)} kg` : "-";
};

const withPrintOption = (html: string, buttonLabel = "Print report") => {
  const printControls = `
    <style>
      .print-controls {
        position: fixed;
        top: 12px;
        right: 12px;
        z-index: 9999;
        display: flex;
        justify-content: flex-end;
        padding: 8px;
        background: rgba(255, 255, 255, 0.97);
        border-bottom: 1px solid #ddd;
        border: 1px solid #ddd;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      }
      .print-button {
        border: 1px solid #333;
        border-radius: 6px;
        background: #111;
        color: #fff;
        padding: 6px 12px;
        font-size: 11px;
        font-weight: 600;
        cursor: pointer;
      }
      @media print {
        .print-controls { display: none; }
      }
    </style>
    <script>const triggerPrint = () => window.print();</script>
    <div class="print-controls">
      <button type="button" class="print-button" onclick="triggerPrint()">${buttonLabel}</button>
    </div>
  `;
  return html.replace(/<body([^>]*)>/i, `<body$1>${printControls}`);
};

// ── Shared print styles used in every report ──────────────────────────────────
// Key technique: .page-header is position:fixed at top during print so it
// repeats on every page. The .page-header-spacer pushes content below it.
const SHARED_PRINT_STYLES = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: "Arial Narrow", Arial, sans-serif; font-size: 9.5px; color: #1f2937; line-height: 1.3; }
  
  /* ── Screen layout ── */
  body { padding: 12px; }

  /* ── Repeating page header (print only) ── */
  .page-header {
    display: none; /* hidden on screen – only shown at print */
  }
  @media print {
    body { padding: 0; font-size: 8.5px; }
    .page-header {
      display: block;
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: white;
      border-bottom: 1.5px solid #111;
      padding: 5px 10px 4px;
      z-index: 9999;
    }
    /* push body content below the fixed header */
    .page-header-spacer { display: block; height: 56px; }
    /* avoid page break inside table rows */
    tr { page-break-inside: avoid; }
    /* table header repeats on every printed page */
    thead { display: table-header-group; }
    tfoot { display: table-footer-group; }
  }
  .page-header-spacer { display: none; }

  /* ── Report title ── */
  .report-title {
    font-size: 18px; font-weight: 900; letter-spacing: -0.2px;
    color: #111827; margin-bottom: 6px;
  }

  /* ── Standard two-column header (screen) ── */
  .standard-report-layout {
    display: grid; grid-template-columns: 1.5fr 1fr; gap: 12px; margin-bottom: 12px;
  }
  .standard-report-left { display: grid; gap: 8px; }
  .standard-report-right { display: grid; gap: 6px; }

  /* ── Branding block (no border) ── */
  .brand-block { padding: 8px 10px; }
  .brand-top { display: flex; align-items: center; gap: 10px; margin-bottom: 5px; }
  .brand-logo { width: 120px; height: auto; }
  .brand-title { font-size: 14px; font-weight: 800; line-height: 1.15; color: #111827; }
  .brand-meta { font-size: 9px; color: #374151; }

  /* ── Bordered panels ── */
  .panel { border: 1px solid #111827; border-radius: 6px; padding: 7px 9px; }
  .panel h3 { font-size: 11px; font-weight: 800; margin-bottom: 4px; color: #111827; }
  .client-panel { min-height: 150px; }

  /* ── Info rows ── */
  .info-row { display: flex; gap: 4px; margin-bottom: 2px; align-items: baseline; }
  .info-label { font-weight: 700; color: #111827; min-width: 110px; font-size: 9px; }
  .info-sep { color: #6b7280; }
  .info-value { color: #111827; word-break: break-word; flex: 1; font-size: 9px; }

  /* ── Hire quotation layout tuning to match legacy print format ── */
  .hire-quotation-layout {
    grid-template-columns: 1.52fr 1fr;
    gap: 12px;
    margin-bottom: 10px;
  }
  .hire-quotation-layout .standard-report-left { gap: 8px; }
  .hire-quotation-layout .standard-report-right { gap: 8px; }
  .hire-quotation-layout .brand-block { padding: 6px 8px 4px; }
  .hire-quotation-layout .brand-top { gap: 10px; margin-bottom: 4px; }
  .hire-quotation-layout .brand-logo { width: 116px; }
  .hire-quotation-layout .brand-title { font-size: 20px; font-weight: 900; letter-spacing: -0.3px; }
  .hire-quotation-layout .brand-meta { font-size: 8px; }
  .hire-quotation-layout .report-title {
    font-size: 22px;
    font-weight: 900;
    margin-bottom: 4px;
    line-height: 1;
    letter-spacing: -0.2px;
    text-transform: none;
  }
  .hire-quotation-layout .panel {
    border: 1px solid #5d636e;
    border-radius: 8px;
    padding: 6px 8px;
  }
  .hire-quotation-layout .panel h3 {
    font-size: 9px;
    font-weight: 800;
    margin-bottom: 3px;
    letter-spacing: 0;
  }
  .hire-quotation-layout .client-panel { min-height: 188px; }
  .hire-quotation-layout .client-and-site-panel {
    display: grid;
    gap: 6px;
  }
  .hire-quotation-layout .client-site-section {
    margin-top: 4px;
    padding-top: 4px;
    border-top: 0.5px solid #c9ced6;
  }
  .hire-quotation-layout .client-site-section h3 {
    margin-bottom: 3px;
  }
  .hire-quotation-layout .info-row { margin-bottom: 2px; }
  .hire-quotation-layout .info-label,
  .hire-quotation-layout .info-value,
  .hire-quotation-layout .info-sep { font-size: 8.5px; }
  .hire-quotation-layout .info-label { min-width: 80px; font-weight: 700; }

  .hire-quotation-page .page-header,
  .hire-quotation-page .page-header-spacer {
    display: none !important;
  }

  /* ── Page-1 flex wrapper so footer sticks to bottom ── */
  /* Only top-level (direct body child) gets min-height; nested page-2 headers must not stretch */
  .hire-quotation-page {
    display: flex;
    flex-direction: column;
  }
  body > .hire-quotation-page,
  body.hire-quotation-print > .hire-quotation-page {
    min-height: 92vh;
  }
  /* Nested header wrappers inside page-2 containers must never get min-height */
  .hq-page2 .hire-quotation-page,
  .hl-page2 .hire-quotation-page,
  .hd-page2 .hire-quotation-page {
    min-height: unset !important;
  }
  @media print {
    body > .hire-quotation-page,
    body.hire-quotation-print > .hire-quotation-page { min-height: 92vh; }
    .hq-page2 .hire-quotation-page,
    .hl-page2 .hire-quotation-page,
    .hd-page2 .hire-quotation-page { min-height: unset !important; }
  }

  /* ── Copy badge ── */
  .copy-label {
    display: inline-block; font-size: 9px; font-weight: 700;
    border: 1px solid #111827; padding: 1px 6px; border-radius: 999px; margin-bottom: 4px;
  }

  /* ── Tables ── */
  table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
  th, td { border: 1px solid #111827; padding: 4px 6px; font-size: 8.5px; vertical-align: top; }
  th { background: #f3f4f6; text-transform: uppercase; letter-spacing: 0.2px; font-weight: 800; }
  .total-row td { background: #f9fafb; font-weight: 800; }
  .text-right { text-align: right; }
  .text-center { text-align: center; }

  /* ── Section boxes ── */
  .section { border: 1px solid #333; border-radius: 4px; padding: 7px; margin-bottom: 8px; }
  .section h3 { font-size: 10px; font-weight: 700; margin-bottom: 4px; }
  .section h4 { margin-bottom: 4px; font-size: 9px; text-transform: uppercase; }
  .section p { margin-bottom: 3px; font-size: 9px; }

  /* ── Post-table grids ── */
  .post-total-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 8px; }
  .line-row { display: flex; align-items: center; gap: 6px; margin-bottom: 6px; font-size: 9px; }
  .line-fill { flex: 1; border-bottom: 1px solid #555; min-height: 12px; display: inline-block; }

  /* ── Signing grid ── */
  .signing-grid { display: grid; grid-template-columns: 1.5fr 1fr 1fr; gap: 4px 8px; }
  .split-row > span:nth-child(3) { margin-left: 10px; }

  /* ── Terms ── */
  .terms-section { font-size: 8.5px; line-height: 1.3; }
  .terms-section p { margin-bottom: 2px; }

  /* ── Signature blocks ── */
  .signature-section { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 16px; }
  .signature-box { border-top: 1px solid #111827; padding-top: 6px; }
  .signature-box p { margin-bottom: 4px; }

  /* ── Page break helper ── */
  .page { page-break-after: always; }
  .page:last-child { page-break-after: auto; }
`;

// ── Compact page-header HTML (shown only at print, fixed at top) ─────────────
const renderPageHeader = (docTitle: string, docNumber: string, clientName: string) => `
  <div class="page-header">
    <div style="display:flex;align-items:center;justify-content:space-between;">
      <div style="display:flex;align-items:center;gap:8px;">
        <img src="${window.location.origin}/otn-logo-red.png" alt="OTNO" style="width:72px;height:auto;"/>
        <div>
          <div style="font-size:10px;font-weight:800;">${COMPANY_NAME}</div>
          <div style="font-size:8px;color:#555;">${COMPANY_ADDRESS} &bull; PIN: ${COMPANY_PIN}</div>
        </div>
      </div>
      <div style="text-align:right;">
        <div style="font-size:11px;font-weight:800;text-transform:uppercase;">${docTitle}</div>
        <div style="font-size:8px;color:#555;">${docNumber} &bull; ${clientName}</div>
      </div>
    </div>
  </div>
  <div class="page-header-spacer"></div>
`;

// ── Standard two-column layout (screen heading + client/site panels) ─────────
interface StandardReportLayoutData {
  documentType: string;
  documentNumber: string;
  documentDate: string;
  dispatchDate?: string;
  clientName: string;
  clientAddress?: string;
  clientCityTown?: string;
  clientTel?: string;
  clientFax?: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  clientVat?: string;
  clientReg?: string;
  siteName?: string;
  siteId?: string;
  siteLocation?: string;
  siteAddress?: string;
  clientId?: string;
  orderNumber?: string;
  manualNumber?: string;
  hireQuoteNo?: string;
  hireStartDate?: string;
  hireEndDate?: string;
  depositRequired?: string;
  createdBy?: string;
  hidePanelHeaders?: boolean;
}

const renderStandardReportLayout = (data: StandardReportLayoutData) => {
  const layoutTypeClass = (data.documentType || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const panelHeadersHidden = Boolean(data.hidePanelHeaders);

  return `
  <div class="standard-report-layout ${layoutTypeClass ? `${layoutTypeClass}-layout` : ""}">
    <div class="standard-report-left">
      <div class="brand-block">
        <div class="brand-top">
          <img src="${window.location.origin}/otn-logo-red.png" alt="OTNO Logo" class="brand-logo" />
          <div class="brand-title">${COMPANY_NAME}</div>
        </div>
        <div class="brand-meta">
          <div><strong>PIN No:</strong> ${COMPANY_PIN}</div>
          <div><strong>Reg No:</strong> ${COMPANY_REG}</div>
        </div>
      </div>

      ${layoutTypeClass === "hire-quotation"
        ? `<div class="panel client-panel client-and-site-panel" style="border-width:0.5px;border-color:#aaa;">
            <div>
              <p style="font-weight:800;font-size:10px;margin-bottom:2px;">${data.clientName || "-"}</p>
              <p style="margin-bottom:1px;font-size:9px;">${data.clientAddress || ""}</p>
              <div style="margin-bottom:8px;"></div>
              <div style="margin-top:6px;">
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:2px;margin-bottom:2px;">
                  <div class="info-row"><span class="info-label">Tel No</span><span class="info-sep">:</span><span class="info-value">${data.clientTel || data.contactPhone || ""}</span></div>
                  <div class="info-row"><span class="info-label">VAT / PIN No</span><span class="info-sep">:</span><span class="info-value">${data.clientVat || ""}</span></div>
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:2px;margin-bottom:2px;">
                  <div class="info-row"><span class="info-label">Mobile No</span><span class="info-sep">:</span><span class="info-value">${data.clientFax || ""}</span></div>
                  <div class="info-row"><span class="info-label">Reg No</span><span class="info-sep">:</span><span class="info-value">${data.clientReg || ""}</span></div>
                </div>
                <div class="info-row" style="margin-bottom:2px;"><span class="info-label">City/Town</span><span class="info-sep">:</span><span class="info-value">${data.clientCityTown || ""}</span></div>
                <div class="info-row" style="margin-bottom:2px;"><span class="info-label">Email</span><span class="info-sep">:</span><span class="info-value">${data.contactEmail || ""}</span></div>
                <div class="info-row"><span class="info-label">Customer No</span><span class="info-sep">:</span><span class="info-value" style="font-weight:800;">${data.clientId || ""}</span></div>
              </div>
            </div>

            <div class="client-site-section">
              ${panelHeadersHidden ? "" : "<h3>Site Details</h3>"}
              <div class="info-row"><span class="info-label">Site No</span><span class="info-sep">:</span><span class="info-value" style="font-weight:800;">${data.siteId || ""}</span></div>
              <div class="info-row"><span class="info-label">Site Name</span><span class="info-sep">:</span><span class="info-value">${data.siteName || ""}</span></div>
              <div class="info-row"><span class="info-label">Site Address</span><span class="info-sep">:</span><span class="info-value">${data.siteAddress || data.siteLocation || ""}</span></div>
              <div style="margin-top:5px;">
                <div class="info-row"><span class="info-label">Contact</span><span class="info-sep">:</span><span class="info-value">${data.contactName || ""}</span></div>
                <div class="info-row"><span class="info-label">Tel No</span><span class="info-sep">:</span><span class="info-value">${data.contactPhone || ""}</span></div>
              </div>
            </div>
          </div>`
        : `<div class="panel client-panel" style="border-width:0.5px;border-color:#aaa;">
            <p style="font-weight:800;font-size:10px;margin-bottom:2px;">${data.clientName || "-"}</p>
            <p style="margin-bottom:1px;font-size:9px;">${data.clientAddress || ""}</p>
            <div style="margin-bottom:8px;"></div>
            <div style="margin-top:6px;">
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:2px;margin-bottom:2px;">
                <div class="info-row"><span class="info-label">Tel No</span><span class="info-sep">:</span><span class="info-value">${data.clientTel || data.contactPhone || ""}</span></div>
                <div class="info-row"><span class="info-label">VAT / PIN No</span><span class="info-sep">:</span><span class="info-value">${data.clientVat || ""}</span></div>
              </div>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:2px;margin-bottom:2px;">
                <div class="info-row"><span class="info-label">Mobile No</span><span class="info-sep">:</span><span class="info-value">${data.clientFax || ""}</span></div>
                <div class="info-row"><span class="info-label">Reg No</span><span class="info-sep">:</span><span class="info-value">${data.clientReg || ""}</span></div>
              </div>
              <div class="info-row" style="margin-bottom:2px;"><span class="info-label">City/Town</span><span class="info-sep">:</span><span class="info-value">${data.clientCityTown || ""}</span></div>
              <div class="info-row" style="margin-bottom:2px;"><span class="info-label">Email</span><span class="info-sep">:</span><span class="info-value">${data.contactEmail || ""}</span></div>
              <div class="info-row"><span class="info-label">Customer No</span><span class="info-sep">:</span><span class="info-value" style="font-weight:800;">${data.clientId || ""}</span></div>
            </div>
          </div>

          <div class="panel" style="border-width:0.5px;border-color:#aaa;">
            ${panelHeadersHidden ? "" : "<h3>Site Details</h3>"}
            <div class="info-row"><span class="info-label">Site No</span><span class="info-sep">:</span><span class="info-value" style="font-weight:800;">${data.siteId || ""}</span></div>
            <div class="info-row"><span class="info-label">Site Name</span><span class="info-sep">:</span><span class="info-value">${data.siteName || ""}</span></div>
            <div class="info-row"><span class="info-label">Site Address</span><span class="info-sep">:</span><span class="info-value">${data.siteAddress || ""}</span></div>
            <div style="margin-top:5px;">
              <div class="info-row"><span class="info-label">Contact</span><span class="info-sep">:</span><span class="info-value">${data.contactName || ""}</span></div>
              <div class="info-row"><span class="info-label">Tel No</span><span class="info-sep">:</span><span class="info-value">${data.contactPhone || ""}</span></div>
            </div>
          </div>`}
    </div>

    <div class="standard-report-right">
      <h2 class="report-title">${data.documentType}</h2>
      <div class="panel">
        ${panelHeadersHidden ? "" : "<h3>Document Details</h3>"}
        <div class="info-row"><span class="info-label">Document No</span><span class="info-sep">:</span><span class="info-value">${data.documentNumber || "-"}</span></div>
        <div class="info-row"><span class="info-label">Document Type</span><span class="info-sep">:</span><span class="info-value">${data.documentType}</span></div>
        <div class="info-row"><span class="info-label">Document Date</span><span class="info-sep">:</span><span class="info-value">${formatReportDate(data.documentDate) || "-"}</span></div>
        ${data.dispatchDate ? `<div class="info-row"><span class="info-label">Dispatch Date</span><span class="info-sep">:</span><span class="info-value">${formatReportDate(data.dispatchDate)}</span></div>` : ""}
        ${data.orderNumber ? `<div class="info-row"><span class="info-label">Your Order No</span><span class="info-sep">:</span><span class="info-value">${data.orderNumber}</span></div>` : ""}
        ${data.manualNumber ? `<div class="info-row"><span class="info-label">Manual No</span><span class="info-sep">:</span><span class="info-value">${data.manualNumber}</span></div>` : ""}
        ${data.hireQuoteNo ? `<div class="info-row"><span class="info-label">Hire Quote No</span><span class="info-sep">:</span><span class="info-value">${data.hireQuoteNo}</span></div>` : ""}
        ${data.hireStartDate ? `<div class="info-row"><span class="info-label">Hire Start Date</span><span class="info-sep">:</span><span class="info-value">${formatReportDate(data.hireStartDate)}</span></div>` : ""}
        ${data.hireEndDate ? `<div class="info-row"><span class="info-label">Hire End Date</span><span class="info-sep">:</span><span class="info-value">${formatReportDate(data.hireEndDate)}</span></div>` : ""}
        
      </div>

      <div class="panel">
        ${panelHeadersHidden ? "" : "<h3>Company Details</h3>"}
        <div class="info-row"><span class="info-label">Company</span><span class="info-sep">:</span><span class="info-value">${COMPANY_NAME}</span></div>
        <div class="info-row"><span class="info-label">Address</span><span class="info-sep">:</span><span class="info-value">${COMPANY_ADDRESS}</span></div>
        <div class="info-row"><span class="info-label">Location</span><span class="info-sep">:</span><span class="info-value">${COMPANY_LOCATION}</span></div>
        <div class="info-row"><span class="info-label">Website</span><span class="info-sep">:</span><span class="info-value">${COMPANY_WEBSITE}</span></div>
        <div class="info-row"><span class="info-label">Email</span><span class="info-sep">:</span><span class="info-value">otnoacess@gmail.com</span></div>
        ${data.createdBy ? `<div class="info-row"><span class="info-label">Salesman</span><span class="info-sep">:</span><span class="info-value">${data.createdBy}</span></div>` : ""}
      </div>
    </div>
  </div>
`;
};

// ═══════════════════════════════════════════════════════════════════════════════
// HIRE DELIVERY NOTE
// ═══════════════════════════════════════════════════════════════════════════════
export const generateDeliveryNotePDF = (data: DeliveryNoteData) => {
  const printWindow = window.open("", "_blank");
  if (!printWindow) { alert("Please allow popups for this site to generate PDFs"); return; }

  const sharedLayout = renderStandardReportLayout({
    documentType: "Hire Delivery Note",
    documentNumber: data.deliveryNoteNumber,
    documentDate: data.deliveryDate,
    dispatchDate: data.dispatchDate,
    hireStartDate: data.hireStartDate,
    clientName: data.companyName,
    clientAddress: data.companyAddress,
    clientCityTown: data.companyCityTown,
    clientTel: data.companyTel,
    clientFax: data.companyFax,
    contactName: data.contactName,
    contactPhone: data.contactPhone,
    contactEmail: data.companyEmail,
    clientVat: data.companyPinNumber,
    clientReg: data.companyRegNumber,
    siteName: data.siteName,
    siteId: data.siteId,
    siteAddress: data.siteAddress,
    clientId: data.clientId,
    hireQuoteNo: data.quotationNumber,
    createdBy: data.createdBy,
  });

  const html = `<!DOCTYPE html><html><head><title>Hire Delivery Note - ${data.deliveryNoteNumber}</title>
    <style>
      ${SHARED_PRINT_STYLES}

      /* ── Two-page layout ── */
      html, body { height: 100%; }
      .hd-page2 {
        page-break-before: always; break-before: page;
        font-size: 9px;
        display: flex; flex-direction: column;
        min-height: 92vh;
      }
      .hd-page2-body { flex: 1; display: flex; flex-direction: column; }
      .hd-page2-footer { margin-top: auto; }
      .hd-footer-brand {
        background: #facc15; color: #1f2937; font-weight: 700;
        display: flex; justify-content: space-between; align-items: center;
        padding: 6px 10px;
      }
      .hd-footer-legal { text-align: center; font-size: 7.5px; color: #4b5563; padding: 3px 8px 4px; border: 1px solid #e5e7eb; border-top: none; }
      .hd-footer-processed { display: flex; justify-content: space-between; font-size: 7px; color: #6b7280; padding: 4px 0 0; }

      @media print {
        @page { size: A4; margin: 8mm; }
        body { padding: 0 !important; }
        .hd-page2 { break-before: page; min-height: 92vh; }
      }
    </style></head><body>

    <!-- ═══ PAGE 1: Header + Items table ═══ -->
    <div class="hire-quotation-page">
      ${sharedLayout}

      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Part Number</th>
            <th>Description</th>
            <th class="text-right">Balance Qty</th>
            <th class="text-right">This Delivery</th>
            <th class="text-right">Mass/Item (kg)</th>
          </tr>
        </thead>
        <tbody>
          ${data.items.map((item, idx) => `
            <tr>
              <td>${idx + 1}</td>
              <td>${item.partNumber || "-"}</td>
              <td>${item.description || "-"}</td>
              <td class="text-right">${item.balanceQuantity}</td>
              <td class="text-right">${item.quantity}</td>
              <td class="text-right">${formatMass(item.massPerItem)}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>

      ${data.remarks ? `<div class="section" style="margin-top:6px;"><strong>Remarks:</strong> ${data.remarks}</div>` : ""}
      ${renderPage1Footer(data.createdBy || "", data.deliveryDate || "")}
    </div>

    <!-- ═══ PAGE 2: Header repeat + signature/verification sections ═══ -->
    <div class="hd-page2">
      <div class="hd-page2-body">
        <div class="hire-quotation-page">
          ${sharedLayout}
        </div>

        <div class="post-total-grid">
          <div class="section">
            <h3>Transport Charges</h3>
            <div class="line-row"><span>Internal Vehicle Charges:</span><span class="line-fill">Ksh</span></div>
            <div class="line-row"><span>External Vehicle Charges:</span><span class="line-fill">Ksh</span></div>
          </div>
          <div class="section">
            <h3>Safety Verification</h3>
            <p>Vehicle safely loaded as per palletizing &amp; loading procedure.</p>
            <div class="line-row" style="margin-top:5px;"><span>Checker:</span><span class="line-fill"></span></div>
            <div class="line-row"><span>Signature:</span><span class="line-fill"></span></div>
          </div>
        </div>

        <div class="section" style="margin-bottom:8px;">
          <div class="signing-grid">
            <div class="line-row"><span>${COMPANY_NAME} Rep's Name:</span><span class="line-fill"></span></div>
            <div class="line-row"><span>Signature:</span><span class="line-fill"></span></div>
            <div class="line-row"><span>Date:</span><span class="line-fill"></span></div>
            <div class="line-row"><span>Transporter/Customer/Driver:</span><span class="line-fill"></span></div>
            <div class="line-row"><span>Signature:</span><span class="line-fill"></span></div>
            <div class="line-row"><span>Date:</span><span class="line-fill"></span></div>
            <div class="line-row"><span>Customer Representative:</span><span class="line-fill"></span></div>
            <div class="line-row"><span>Signature:</span><span class="line-fill"></span></div>
            <div class="line-row"><span>Date:</span><span class="line-fill"></span></div>
          </div>
        </div>

        <div class="section" style="margin-bottom:8px;">
          <div class="line-row"><span>Vehicle Registration Number:</span><span class="line-fill">${data.vehicleNo || ""}</span></div>
          <div class="line-row"><span>Name of Transporter/Customer:</span><span class="line-fill"></span></div>
          <div class="line-row split-row">
            <span>Time Arrive:</span><span class="line-fill"></span>
            <span>Time Depart:</span><span class="line-fill"></span>
          </div>
        </div>

        <div class="section" style="margin-bottom:8px;min-height:40px;">
          <h3>Customer Comments:</h3>
        </div>

        <div class="section terms-section">
          <p><strong>Please check that the equipment count agrees with the above. All errors are to be clearly noted. Failure to do this assumes acceptance of the documentation.</strong></p>
          <p>* The Hirer undertakes to use the goods in accordance with the Occupational Health and Safety Act.</p>
          <p>* The Hirer shall approach the Owner for any advice or assistance in the event of inability to comply with the above.</p>
          <p><strong>Charges: </strong>Dirty: 2× list hire price &bull; Damaged: 4× list hire price &bull; Lost: selling price of item.</p>
        </div>
      </div>

      <!-- Yellow footer pinned at bottom of page 2 -->
      <div class="hd-page2-footer">
        <div class="hd-footer-brand">
          <span>OTNO Access Solutions — Your Trusted Scaffolding &amp; Access Partner.</span>
          <img src="${window.location.origin}/otn-logo-red.png" alt="OTNO" style="width:80px;height:auto;"/>
        </div>
        <div class="hd-footer-legal">All transactions are subject to our standard Terms of Trade which can be found at: otnoacess@gmail.com &nbsp;|&nbsp; Page 2 of 2</div>
        <div class="hd-footer-processed">
          <div>
            <div>Processed By : ${data.createdBy || ""}</div>
            <div>Processed Date : ${formatReportDate(data.deliveryDate) || ""}</div>
          </div>
          <div style="text-align:right;">
            <div>Print date : ${formatTimestamp()}</div>
          </div>
        </div>
      </div>
    </div>

  </body></html>`;

  printWindow.document.write(withPrintOption(html, "Print delivery note"));
  printWindow.document.close();
};

// ═══════════════════════════════════════════════════════════════════════════════
// HIRE LOADING NOTE
// ═══════════════════════════════════════════════════════════════════════════════
export const generateHireLoadingNotePDF = (data: HireLoadingNoteData) => {
  const printWindow = window.open("", "_blank");
  if (!printWindow) { alert("Please allow popups for this site to generate PDFs"); return; }

  const totalMass = data.items.reduce((sum, item) => sum + (item.totalMass || 0), 0);
  const noteTitle = data.noteTitle ?? "Hire Loading Report";

  const html = `<!DOCTYPE html><html><head><title>${noteTitle} - ${data.quotationNumber}</title>
    <style>
      ${SHARED_PRINT_STYLES}

      /* ── Two-page layout ── */
      html, body { height: 100%; }
      .hl-page2 {
        page-break-before: always; break-before: page;
        font-size: 9px;
        display: flex; flex-direction: column;
        min-height: 92vh;
      }
      .hl-page2-body { flex: 1; display: flex; flex-direction: column; }

      /* ── Page 2 footer (yellow band) ── */
      .hl-page2-footer { margin-top: auto; }
      .hl-footer-brand {
        background: #facc15; color: #1f2937; font-weight: 700;
        display: flex; justify-content: space-between; align-items: center;
        padding: 6px 10px;
      }
      .hl-footer-legal { text-align: center; font-size: 7.5px; color: #4b5563; padding: 3px 8px 4px; border: 1px solid #e5e7eb; border-top: none; }
      .hl-footer-processed { display: flex; justify-content: space-between; font-size: 7px; color: #6b7280; padding: 4px 0 0; }

      @media print {
        @page { size: A4; margin: 8mm; }
        body { padding: 0 !important; }
        .hl-page2 { break-before: page; min-height: 92vh; }
      }
    </style></head><body>

    <!-- ═══ PAGE 1: Header + Items table ═══ -->
    <div class="hire-quotation-page">
      ${renderStandardReportLayout({
        documentType: noteTitle,
        documentNumber: data.quotationNumber,
        documentDate: data.dateCreated,
        dispatchDate: data.dispatchDate,
        clientName: data.companyName,
        clientAddress: data.companyAddress,
        clientCityTown: data.companyCityTown,
        clientTel: data.companyTel,
        clientFax: data.companyFax,
        contactName: data.contactName,
        contactPhone: data.contactPhone,
        contactEmail: data.companyEmail,
        clientVat: data.companyPinNumber,
        clientReg: data.companyRegNumber,
        siteName: data.siteName,
        siteId: data.siteId,
        siteLocation: data.siteLocation,
        siteAddress: data.siteAddress,
        clientId: data.clientId,
        createdBy: data.createdBy,
      })}

      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Part Number</th>
            <th>Description</th>
            <th class="text-right">Qty</th>
            <th class="text-right">This Delivery</th>
            <th class="text-right">Mass/Item (kg)</th>
            <th class="text-right">Total Mass (kg)</th>
          </tr>
        </thead>
        <tbody>
          ${data.items.map((item, idx) => `
            <tr>
              <td>${idx + 1}</td>
              <td>${item.partNumber || "-"}</td>
              <td>${item.description || "-"}</td>
              <td class="text-right">${item.quantity}</td>
              <td class="text-right"></td>
              <td class="text-right">${formatMass(item.massPerItem)}</td>
              <td class="text-right">${formatMass(item.totalMass)}</td>
            </tr>
          `).join("")}
          <tr class="total-row">
            <td colspan="6">Total Mass</td>
            <td class="text-right">${formatMass(totalMass)}</td>
          </tr>
        </tbody>
      </table>
      ${renderPage1Footer(data.createdBy || "", data.dateCreated || "")}
    </div>

    <!-- ═══ PAGE 2: Header repeat + 4 signature/verification sections ═══ -->
    <div class="hl-page2">
      <div class="hl-page2-body">
        <div class="hire-quotation-page">
          ${renderStandardReportLayout({
            documentType: noteTitle,
            documentNumber: data.quotationNumber,
            documentDate: data.dateCreated,
            clientName: data.companyName,
            clientAddress: data.companyAddress,
            clientCityTown: data.companyCityTown,
            clientTel: data.companyTel,
            clientFax: data.companyFax,
            contactName: data.contactName,
            contactPhone: data.contactPhone,
            contactEmail: data.companyEmail,
            clientVat: data.companyPinNumber,
            clientReg: data.companyRegNumber,
            siteName: data.siteName,
            siteId: data.siteId,
            siteLocation: data.siteLocation,
            siteAddress: data.siteAddress,
            clientId: data.clientId,
            createdBy: data.createdBy,
          })}
        </div>

        <div class="section" style="margin-bottom:8px;">
          <h3>Comments</h3>
          <p>Quote Excludes Transport To And From Site</p>
          <p>Four Weeks Hire Deposit Required Upfront</p>
        </div>

        <div class="post-total-grid">
          <div class="section">
            <h3>Transport Charges</h3>
            <div class="line-row"><span>Internal Vehicle Charges:</span><span class="line-fill">Ksh</span></div>
            <div class="line-row"><span>External Vehicle Charges:</span><span class="line-fill">Ksh</span></div>
          </div>
          <div class="section">
            <h3>Safety Verification</h3>
            <p>Vehicle safely loaded as per palletizing &amp; loading procedure.</p>
            <div class="line-row"><span>Checker:</span><span class="line-fill"></span></div>
            <div class="line-row"><span>Signature:</span><span class="line-fill"></span></div>
          </div>
        </div>

        <div class="section" style="margin-bottom:8px;">
          <div class="signing-grid">
            <div class="line-row"><span>Checker's Name:</span><span class="line-fill"></span></div>
            <div class="line-row"><span>Signature:</span><span class="line-fill"></span></div>
            <div class="line-row"><span>Date:</span><span class="line-fill"></span></div>
            <div class="line-row"><span>Transporter/Customer/Driver:</span><span class="line-fill"></span></div>
            <div class="line-row"><span>Signature:</span><span class="line-fill"></span></div>
            <div class="line-row"><span>Date:</span><span class="line-fill"></span></div>
            <div class="line-row"><span>Customer Representative:</span><span class="line-fill"></span></div>
            <div class="line-row"><span>Signature:</span><span class="line-fill"></span></div>
            <div class="line-row"><span>Date:</span><span class="line-fill"></span></div>
          </div>
        </div>

        <div class="section" style="margin-bottom:8px;">
          <div class="line-row"><span>Vehicle Registration Number:</span><span class="line-fill"></span></div>
          <div class="line-row"><span>Name of Transporter/Customer:</span><span class="line-fill"></span></div>
          <div class="line-row split-row">
            <span>Time Arrive:</span><span class="line-fill"></span>
            <span>Time Depart:</span><span class="line-fill"></span>
          </div>
        </div>

        <div class="section terms-section">
          <p><strong>Please check that the equipment count agrees with the above. All errors are to be clearly noted.</strong></p>
          <p>* The Hirer undertakes to use the goods in accordance with the Occupational Health and Safety Act.</p>
          <p><strong>Charges: </strong>Dirty: 2× list hire price &bull; Damaged: 4× list hire price &bull; Lost: selling price of item.</p>
        </div>
      </div>

      <!-- Yellow footer pinned at bottom of page 2 -->
      <div class="hl-page2-footer">
        <div class="hl-footer-brand">
          <span>OTNO Access Solutions — Your Trusted Scaffolding &amp; Access Partner.</span>
          <img src="${window.location.origin}/otn-logo-red.png" alt="OTNO" style="width:80px;height:auto;"/>
        </div>
        <div class="hl-footer-legal">All transactions are subject to our standard Terms of Trade which can be found at: otnoacess@gmail.com &nbsp;|&nbsp; Page 2 of 2</div>
        <div class="hl-footer-processed">
          <div>
            <div>Processed By : ${data.createdBy || ""}</div>
            <div>Processed Date : ${formatReportDate(data.dateCreated) || ""}</div>
          </div>
          <div style="text-align:right;">
            <div>Print date : ${formatTimestamp()}</div>
          </div>
        </div>
      </div>
    </div>

  </body></html>`;

  printWindow.document.write(withPrintOption(html, "Print loading report"));
  printWindow.document.close();
};

// ═══════════════════════════════════════════════════════════════════════════════
// YARD VERIFICATION NOTE  (custom layout – no standard header repeat)
// ═══════════════════════════════════════════════════════════════════════════════
export const generateYardVerificationNotePDF = (data: DeliveryNoteData) => {
  const printWindow = window.open("", "_blank");
  if (!printWindow) { alert("Please allow popups for this site to generate PDFs"); return; }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Yard Verification Report - ${data.deliveryNoteNumber}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; padding: 16px; font-size: 11px; }
        .yard-note h1 { text-align: center; font-size: 16px; margin-bottom: 8px; letter-spacing: 0.6px; text-transform: uppercase; }
        .yard-note-header { display: flex; flex-direction: column; align-items: center; gap: 4px; margin-bottom: 8px; }
        .yard-note-header .brand-logo { width: 96px; height: auto; }
        .yard-note-table { width: 100%; border-collapse: collapse; font-size: 10px; }
        .yard-note-table th, .yard-note-table td { border: 1px solid #333; padding: 5px; }
        .yard-note-table th { background: #f5f5f5; text-align: center; }
        .yard-note-table .label { width: 20%; font-weight: bold; }
        .yard-note-table .value { width: 30%; }
        .yard-note-table .small { width: 12%; }
        .yard-note-table .notes { height: 24px; }
        .yard-note-footer { margin-top: 8px; }
        .yard-note-footer .row { display: flex; gap: 12px; margin-bottom: 5px; }
        .yard-note-footer .field { flex: 1; border: 1px solid #333; padding: 5px; min-height: 24px; }
        @media print { body { padding: 0; } }
      </style>
    </head>
    <body>
      <div class="yard-note">
        <div class="yard-note-header">
          <img src="${window.location.origin}/otn-logo-red.png" alt="OTNO Logo" class="brand-logo" />
          <h1>Yard Verification Report</h1>
        </div>
        <table class="yard-note-table">
          <tr>
            <td class="label">Customer/Branch Name:</td><td class="value">&nbsp;</td>
            <td class="label">ID no:</td><td class="value">&nbsp;</td>
          </tr>
          <tr>
            <td class="label">Client ID:</td><td class="value">&nbsp;</td>
            <td class="label">Site ID:</td><td class="value">&nbsp;</td>
          </tr>
          <tr>
            <td class="label">Site:</td><td class="value">&nbsp;</td>
            <td class="label">Date:</td><td class="value">&nbsp;</td>
          </tr>
          <tr>
            <td class="label">Vehicle Reg:</td><td class="value">&nbsp;</td>
            <td class="label">Created By:</td><td class="value">&nbsp;</td>
          </tr>
          <tr>
            <td class="label">Branch:</td><td class="value">&nbsp;</td>
            <td class="label"></td><td class="value"></td>
          </tr>
          <tr>
            <td class="label">Customer Return (Yes/No):</td><td class="value">&nbsp;</td>
            <td class="label">OTNO Return (Yes/No):</td><td class="value">&nbsp;</td>
          </tr>
          <tr>
            <td class="label">Request for collection:</td><td class="value" colspan="3">&nbsp;</td>
          </tr>
        </table>

        <table class="yard-note-table" style="margin-top:8px;">
          <tr>
            <th rowspan="2">Description</th>
            <th colspan="2">Deliveries</th>
            <th colspan="5">Returns/Tickets</th>
          </tr>
          <tr>
            <th class="small">Load 1</th>
            <th class="small">Load 2</th>
            <th class="small">Good</th>
            <th class="small">Dirty</th>
            <th class="small">Damaged</th>
            <th class="small">Scrap</th>
            <th class="small">Total</th>
          </tr>
          ${Array.from({ length: 12 }).map(() => `
            <tr>
              <td class="notes">&nbsp;</td><td class="notes">&nbsp;</td><td class="notes">&nbsp;</td>
              <td class="notes">&nbsp;</td><td class="notes">&nbsp;</td><td class="notes">&nbsp;</td>
              <td class="notes">&nbsp;</td><td class="notes">&nbsp;</td>
            </tr>
          `).join("")}
        </table>

        <div class="yard-note-footer">
          <div class="row">
            <div class="field"><strong>Gate Pass no:</strong></div>
            <div class="field"><strong>Customer site return slip no:</strong></div>
          </div>
          <div class="row">
            <div class="field"><strong>OTNO Checker Name:</strong></div>
            <div class="field"><strong>Customer/Driver Name:</strong></div>
          </div>
          <div class="row">
            <div class="field"><strong>Signature:</strong></div>
            <div class="field"><strong>Signature:</strong></div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  printWindow.document.write(withPrintOption(html));
  printWindow.document.close();
};

// ═══════════════════════════════════════════════════════════════════════════════
// HIRE QUOTATION REPORT
// ═══════════════════════════════════════════════════════════════════════════════
export const generateHireQuotationReportPDF = (data: HireQuotationReportData) => {
  const printWindow = window.open("", "_blank");
  if (!printWindow) { alert("Please allow popups for this site to generate PDFs"); return; }

  const totalQuantity = data.items.reduce((sum, item) => sum + item.quantity, 0);
  const totalMass = data.items.reduce((sum, item) => sum + (item.massPerItem ?? 0) * item.quantity, 0);
  const subtotal = data.items.reduce((sum, item) => {
    const discountRate = Math.min(Math.max(item.discountRate, 0), 100) / 100;
    return sum + item.weeklyRate * (1 - discountRate) * item.quantity;
  }, 0);
  const vatAmount = subtotal * 0.16;
  const totalWithVat = subtotal + vatAmount;
  const discountAmount = totalWithVat * (data.discountRate / 100);
  const statementTotal = totalWithVat - discountAmount;

  const html = `<!DOCTYPE html><html><head><title>Hire Quotation - ${data.quotationNumber}</title>
    <style>
      ${SHARED_PRINT_STYLES}
      .terms { margin-top: 14px; padding: 8px; background: #f9f9f9; border-left: 3px solid #333; font-size: 9px; line-height: 1.4; }

      /* ── Page 2 layout — fills the page with footer pinned at bottom ── */
      html, body { height: 100%; }
      .hq-page2 {
        page-break-before: always; break-before: page;
        font-size: 9px;
        display: flex; flex-direction: column;
        min-height: 92vh;
      }
      .hq-page2-body { flex: 1; display: flex; flex-direction: column; }
      .hq-pallets-note { text-align: center; font-size: 9.5px; line-height: 1.35; margin-bottom: 10px; font-weight: 700; }
      .hq-footer-grid { display: grid; grid-template-columns: 1.35fr 0.95fr; gap: 10px; margin-top: auto; margin-bottom: 0; align-items: end; }
      .hq-banking-box { border: 1px solid #4b5563; border-radius: 4px; padding: 6px 10px 9px; margin-bottom: 8px; }
      .hq-banking-box h4 { font-size: 11px; font-weight: 800; margin-bottom: 5px; }
      .hq-banking-row { display: grid; grid-template-columns: 140px 10px 1fr; margin-bottom: 3px; font-size: 10px; }
      .hq-acknowledge { border: 1px solid #4b5563; border-radius: 4px; padding: 8px 10px 9px; min-height: 130px; }
      .hq-acknowledge p { margin-bottom: 4px; font-size: 10px; }
      .hq-sig-line { display: inline-block; border-bottom: 1px solid #374151; min-width: 140px; height: 14px; margin-left: 6px; vertical-align: bottom; }
      .hq-sig-row { display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 5px; font-size: 10px; align-items: flex-end; }
      .hq-sig-row.customer { margin-top: 12px; gap: 12px; }
      .hq-sig-cell { display: flex; align-items: flex-end; gap: 4px; }
      .hq-sig-cell.name .hq-sig-line { min-width: 165px; }
      .hq-totals { padding: 0 0 2px; align-self: end; width: 100%; }
      .hq-totals-row {
        display: grid;
        grid-template-columns: 1fr 16px 118px;
        align-items: end;
        column-gap: 8px;
        margin-bottom: 6px;
        font-size: 12px;
        font-weight: 700;
      }
      .hq-totals-row strong { font-size: 12px; font-weight: 800; }
      .hq-totals-row.grand {
        border-bottom: 2px solid #374151;
        padding-bottom: 4px;
        margin-top: 4px;
        margin-bottom: 10px;
      }
      .hq-totals-add { margin-top: 10px; }
      /* Footer pinned to bottom on screen; naturally at bottom when page fills in print */
      .hq-page2-footer { margin-top: auto; }
      .hq-footer-brand {
        background: #facc15; color: #1f2937; font-weight: 700;
        display: flex; justify-content: space-between; align-items: center;
        padding: 6px 10px;
      }
      .hq-footer-legal { text-align: center; font-size: 7.5px; color: #4b5563; padding: 3px 8px 4px; border: 1px solid #e5e7eb; border-top: none; }
      .hq-footer-processed { display: flex; justify-content: space-between; font-size: 7px; color: #6b7280; padding: 4px 0 0; }
      @media print {
        @page {
          size: A4;
          margin: 8mm;
        }
        body.hire-quotation-print {
          padding: 0 !important;
        }
        .hq-page2 {
          break-before: page;
          page-break-inside: avoid;
          min-height: 92vh;
        }
        .hire-quotation-page,
        .hq-page2 {
          max-width: 100%;
          overflow: hidden;
        }
        /* Nested header wrapper on page 2 must NOT stretch to full page height */
        .hq-page2 .hire-quotation-page {
          min-height: unset !important;
        }
        .hq-acknowledge p:last-of-type { margin-bottom: 2px; }
      }
    </style></head><body class="hire-quotation-print">

    <!-- ═══ PAGE 1 ═══ -->
    <div class="hire-quotation-page">
    ${renderStandardReportLayout({
      documentType: "Hire Quotation",
      documentNumber: data.quotationNumber,
      documentDate: data.dateCreated,
      clientName: data.companyName,
      clientAddress: data.companyAddress,
      clientCityTown: data.companyCityTown,
      clientTel: data.companyTel,
      clientFax: data.companyFax,
      contactName: data.contactName,
      contactPhone: data.contactPhone,
      contactEmail: data.companyEmail || data.contactEmail,
      clientVat: data.companyPinNumber,
      clientReg: data.companyRegNumber,
      siteName: data.siteName,
      siteId: data.siteId,
      siteLocation: data.siteLocation,
      siteAddress: data.siteAddress,
      clientId: data.clientId,
      createdBy: data.createdBy,
      depositRequired: "0.00",
    })}

    <div style="margin-bottom:10px;font-size:9.5px;line-height:1.5;">
      <strong>Dear: ${data.companyName || data.contactName || "Valued Customer"}</strong><br/>
      We thank you for your valued enquiry and are pleased to submit our relevant quotation based on the terms detailed below.<br/>
      This Quote is valid for a period of 30 DAYS and is subject to confirmation thereafter.
    </div>

    <table>
      <thead>
        <tr>
          <th>Part Number</th>
          <th>Description</th>
          <th class="text-right">Qty</th>
          <th class="text-right">Mass</th>
          <th class="text-right">Rate</th>
          <th class="text-right">Hire/Week</th>
        </tr>
      </thead>
      <tbody>
        ${data.items.map((item) => {
          const discountRate = Math.min(Math.max(item.discountRate, 0), 100) / 100;
          const discountedRate = item.weeklyRate * (1 - discountRate);
          const discountedTotal = discountedRate * item.quantity;
          const massValue = item.massPerItem != null ? Number(item.massPerItem).toFixed(2) : "-";
          return `<tr>
            <td>${item.partNumber || "-"}</td>
            <td>${item.description || "-"}</td>
            <td class="text-right">${item.quantity}</td>
            <td class="text-right">${massValue}</td>
            <td class="text-right">${Number(discountedRate).toFixed(2)}</td>
            <td class="text-right">${Number(discountedTotal).toFixed(2)}</td>
          </tr>`;
        }).join("")}
        <tr class="total-row">
          <td colspan="2" style="font-weight:800;"></td>
          <td class="text-right" style="font-weight:800;">Mass (Ton)</td>
          <td class="text-right" style="font-weight:800;">${(totalMass / 1000).toFixed(3)}</td>
          <td colspan="2" class="text-right" style="font-weight:800;"></td>
        </tr>
      </tbody>
    </table>

    <div class="terms">
      <strong>Comments</strong><br/>
      ${(data.comments || "Quote Excludes Transport To And From Site\nFour Weeks Hire Deposit Required Upfront").split("\n").join("<br/>")}
    </div>
      ${renderPage1Footer(data.createdBy || "", data.dateCreated || "")}
    </div>

    <!-- ═══ PAGE 2 ═══ -->
    <div class="hq-page2">
      <div class="hq-page2-body">
        <div class="hire-quotation-page">
        ${renderStandardReportLayout({
          documentType: "Hire Quotation",
          documentNumber: data.quotationNumber,
          documentDate: data.dateCreated,
          clientName: data.companyName,
          clientAddress: data.companyAddress,
          clientCityTown: data.companyCityTown,
          clientTel: data.companyTel,
          clientFax: data.companyFax,
          contactName: data.contactName,
          contactPhone: data.contactPhone,
          contactEmail: data.companyEmail || data.contactEmail,
          clientVat: data.companyPinNumber,
          clientReg: data.companyRegNumber,
          siteName: data.siteName,
          siteId: data.siteId,
          siteLocation: data.siteLocation,
          siteAddress: data.siteAddress,
          clientId: data.clientId,
          createdBy: data.createdBy,
          depositRequired: "0.00",
        })}
        </div>


        <div class="hq-footer-grid">
          <div>
            <div class="hq-banking-box">
              <h4>Our Banking Details</h4>
              <div class="hq-banking-row"><span>Account Name</span><span>:</span><span>OTNO ACCESS SOLUTIONS LIMITED</span></div>
              <div class="hq-banking-row"><span>KES Account No</span><span>:</span><span>02107773676350</span></div>
              <div class="hq-banking-row"><span>Bank Name</span><span>:</span><span>I&amp;M BANK LIMITED</span></div>
              <div class="hq-banking-row"><span>Branch Name</span><span>:</span><span>Changamwe</span></div>
              <div class="hq-banking-row"><span>Bank Code</span><span>:</span><span>57</span></div>
              <div class="hq-banking-row"><span>Branch Code</span><span>:</span><span>021</span></div>
              <div class="hq-banking-row"><span>Swift Code</span><span>:</span><span>IMBLKENA</span></div>
              <div class="hq-banking-row"><span>Mpesa Paybill</span><span>:</span><span>542542</span></div>
            </div>

            <div class="hq-acknowledge">
              <p>We thank you for affording us the opportunity to quote and await your favourable response.</p>
              <p>Yours Sincerely</p>
              <p style="font-weight:800;">${data.createdBy || "Sales Representative"}</p>
              <div class="hq-sig-row" style="margin-top:10px;">
                <span class="hq-sig-cell">Signature :<span class="hq-sig-line" style="min-width:130px;"></span></span>
                <span class="hq-sig-cell">Date :<span class="hq-sig-line"></span></span>
              </div>
              <div class="hq-sig-row customer">
                <span class="hq-sig-cell name">Customer Representative's Name :<span class="hq-sig-line" style="min-width:140px;"></span></span>
                <span class="hq-sig-cell">Signature :<span class="hq-sig-line"></span></span>
                <span class="hq-sig-cell">Date :<span class="hq-sig-line"></span></span>
              </div>
            </div>
          </div>

          <div>
            <div class="hq-totals">
              <div class="hq-totals-row"><span>Net Value Per Week</span><span>:</span><strong style="text-align:right;">${Number(subtotal).toFixed(2)}</strong></div>
              <div class="hq-totals-row"><span>Vat Per Week 16%</span><span>:</span><strong style="text-align:right;">${Number(vatAmount).toFixed(2)}</strong></div>
              <div class="hq-totals-row grand"><span>Total Charge Per Week</span><span>: KES</span><strong style="text-align:right;">${Number(statementTotal).toFixed(2)}</strong></div>
              <div class="hq-totals-add">
                <div class="hq-totals-row"><span>Additional Charges</span><span>:</span><strong style="text-align:right;">0.00</strong></div>
                <div class="hq-totals-row"><span>Vat 16%</span><span>:</span><strong style="text-align:right;">0.00</strong></div>
                <div class="hq-totals-row grand"><span>Total Additional Charges</span><span>: KES</span><strong style="text-align:right;">0.00</strong></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Sticky footer pinned at bottom of page 2 -->
      <div class="hq-page2-footer">
        <div class="hq-footer-brand">
          <span>OTNO Access Solutions — Your Trusted Scaffolding &amp; Access Partner.</span>
          <img src="${window.location.origin}/otn-logo-red.png" alt="OTNO" style="width:80px;height:auto;"/>
        </div>
        <div class="hq-footer-legal">All transactions are subject to our standard Terms of Trade which can be found at: otnoacess@gmail.com &nbsp;|&nbsp; Page 2 of 2</div>
        <div class="hq-footer-processed">
          <div>
            <div>Processed By : ${data.createdBy || ""}</div>
            <div>Processed Date : ${formatReportDate(data.dateCreated) || ""}</div>
          </div>
          <div style="text-align:right;">
            <div>Print date : ${formatTimestamp()}</div>
          </div>
        </div>
      </div>
    </div>
  </body></html>`;

  printWindow.document.write(withPrintOption(html, "Print hire quotation report"));
  printWindow.document.close();
};

// ═══════════════════════════════════════════════════════════════════════════════
// QUOTATION CALCULATION PDF
// ═══════════════════════════════════════════════════════════════════════════════
export const generateQuotationPDF = (data: QuotationCalculationData) => {
  const printWindow = window.open("", "_blank");
  if (!printWindow) { alert("Please allow popups for this site to generate PDFs"); return; }

  const weeklyVatAmount = data.vatRate > 0 ? data.weeklyTotal * (data.vatRate / 100) : 0;
  const weeklyTotalWithVat = data.weeklyTotal + weeklyVatAmount;

  const html = `<!DOCTYPE html><html><head><title>Hire Quotation - ${data.quotationNumber}</title>
    <style>
      ${SHARED_PRINT_STYLES}
      .summary-box { background: #f5f5f5; padding: 10px; margin-bottom: 14px; }
      .summary-row { display: flex; justify-content: space-between; margin-bottom: 6px; padding-bottom: 6px; border-bottom: 1px solid #ddd; font-size: 9.5px; }
      .summary-row:last-child { border-bottom: none; }
      .terms { margin-top: 14px; padding: 8px; background: #f9f9f9; border-left: 3px solid #333; font-size: 9px; line-height: 1.4; }
    </style></head><body>
    ${renderPageHeader("Hire Quotation", data.quotationNumber, data.companyName)}
    ${renderStandardReportLayout({
      documentType: "Hire Quotation",
      documentNumber: data.quotationNumber,
      documentDate: data.dateCreated,
      clientName: data.companyName,
      clientAddress: data.companyAddress,
      clientCityTown: data.companyCityTown,
      clientTel: data.companyTel,
      clientFax: data.companyFax,
      contactName: data.contactName,
      contactPhone: data.contactPhone,
      contactEmail: data.companyEmail || data.contactEmail,
      clientVat: data.companyPinNumber,
      clientReg: data.companyRegNumber,
      siteName: data.siteName,
      siteId: data.siteId,
      siteLocation: data.siteLocation,
      siteAddress: data.siteAddress,
      clientId: data.clientId,
      createdBy: data.createdBy,
    })}

    <div style="margin-bottom:10px;font-size:9.5px;line-height:1.5;">
      <strong>Dear: ${data.companyName || data.contactName || "Valued Customer"}</strong><br/>
      We thank you for your valued enquiry and are pleased to submit our relevant quotation based on the terms detailed below.<br/>
      This quote is valid for a period of 30 DAYS and is subject to confirmation thereafter.
    </div>

    <table>
      <thead>
        <tr>
          <th>#</th><th>Part Number</th><th>Description</th>
          <th class="text-right">Qty</th><th class="text-right">Weekly Rate</th>
        </tr>
      </thead>
      <tbody>
        ${data.items.map((item, idx) => `
          <tr>
            <td>${idx + 1}</td>
            <td>${item.partNumber || "-"}</td>
            <td>${item.description || "-"}</td>
            <td class="text-right">${item.quantity}</td>
            <td class="text-right">${formatCurrency(item.weeklyRate)}</td>
          </tr>
        `).join("")}
        <tr class="total-row">
          <td colspan="3"><strong>TOTAL</strong></td>
          <td class="text-right"><strong>${data.items.reduce((sum, item) => sum + item.quantity, 0)}</strong></td>
          <td class="text-right">-</td>
        </tr>
      </tbody>
    </table>

    <div class="summary-box">
      <div class="summary-row"><span>Number of Weeks</span><span>× ${data.hireWeeks}</span></div>
      <div class="summary-row"><span>Hire per Week</span><span>${formatCurrency(data.weeklyTotal)}</span></div>
      <div class="summary-row"><span>VAT (${data.vatRate}%)</span><span>${formatCurrency(weeklyVatAmount)}</span></div>
      ${data.discountRate > 0 ? `<div class="summary-row"><span>Discount (${data.discountRate}%)</span><span>-${formatCurrency(data.discountAmount)}</span></div>` : ""}
      <div class="summary-row"><span>TOTAL (VAT + Hire/Week)</span><span>${formatCurrency(weeklyTotalWithVat)}</span></div>
    </div>

    <div class="terms">
      <strong>TERMS:</strong> Quote does not include transport. Order confirmation through deposit payment. One month deposit required upfront. We do not accept cash.<br/>
      ${PAYMENT_DETAILS_HTML}
    </div>

    <div class="signature-section">
      <div class="signature-box"><p><strong>For ${COMPANY_NAME}:</strong></p><p style="margin-bottom:14px;">Name: ___________________________</p><p style="margin-bottom:14px;">Signature: ___________________________</p><p>Date: ___________________________</p></div>
      <div class="signature-box"><p><strong>For Client:</strong></p><p style="margin-bottom:14px;">Name: ___________________________</p><p style="margin-bottom:14px;">Signature: ___________________________</p><p>Date: ___________________________</p></div>
    </div>
    <div style="text-align:right;font-size:8px;color:#999;margin-top:14px;">Print date: ${formatTimestamp()}</div>
  </body></html>`;

  printWindow.document.write(withPrintOption(html));
  printWindow.document.close();
};

// ═══════════════════════════════════════════════════════════════════════════════
// HIRE RETURN NOTE
// ═══════════════════════════════════════════════════════════════════════════════
export const generateHireReturnNotePDF = (data: HireReturnNoteData) => {
  const printWindow = window.open("", "_blank");
  if (!printWindow) { alert("Please allow popups for this site to generate PDFs"); return; }

  const totalReturned = data.items.reduce((sum, item) => sum + item.totalReturned, 0);
  const totalMass = data.items.reduce((sum, item) => sum + (item.totalMass || 0), 0);

  // Page 1: Gate Pass (pink)
  const gatePassItemRows = Array.from({ length: 20 }, () =>
    "<tr><td style='height:22px'>&nbsp;</td><td style='text-align:center'>&nbsp;</td><td style='text-align:center'>&nbsp;</td><td style='text-align:center'>&nbsp;</td><td style='text-align:center'>&nbsp;</td><td style='text-align:center'>&nbsp;</td><td style='text-align:center'>&nbsp;</td></tr>"
  ).join("");

  const gatePassPage = () => `
    <div class="rn-gate-pass page">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
        <img src="${window.location.origin}/otn-logo-red.png" alt="OTNO" style="width:90px;height:auto;"/>
        <div style="font-size:20px;font-weight:900;text-transform:uppercase;letter-spacing:0.5px;color:#7b1a2e;">Hire Return Form</div>
      </div>

      <div class="rn-gate-table-wrap">
        <table style="border-color:#8a5a6b;height:100%;margin-bottom:0;">
          <thead style="background:#f3b9cf;">
            <tr>
              <th>Product Description</th>
              <th class="text-center">Site Number</th>
              <th class="text-center">Good</th>
              <th class="text-center">Dirty</th>
              <th class="text-center">Damaged</th>
              <th class="text-center">Scrap</th>
              <th class="text-center">Total</th>
            </tr>
          </thead>
          <tbody>${gatePassItemRows}</tbody>
        </table>
      </div>

      <div style="border:1px solid #8a5a6b;padding:8px;border-radius:4px;margin-bottom:8px;background:#f9dce8;">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:8px;">
          <div class="line-row"><span>Size of Vehicle</span><span class="line-fill"></span></div>
          <div class="line-row"><span>Vehicle Reg. No</span><span class="line-fill"></span></div>
          <div class="line-row"><span>Time In</span><span class="line-fill"></span></div>
          <div class="line-row"><span>Time Out</span><span class="line-fill"></span></div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:8px;">
          <div><p><strong>OTNOS Checker</strong></p><p>Name: _______________</p><p>Signature: _______________</p></div>
          <div><p><strong>Customer / Driver</strong></p><p>Name: _______________</p><p>Signature: _______________</p></div>
        </div>
        <div style="font-size:9px;padding:4px 0;border-top:1px solid #8a5a6b;">
          Balance still on site: <strong>Yes / No</strong> &nbsp;&nbsp; Is site clear: <strong>Yes / No</strong> &nbsp;&nbsp; Collect again: <strong>Yes / No</strong>
        </div>
        <div class="line-row" style="margin-top:5px;"><span>Collection Date</span><span class="line-fill"></span></div>
      </div>

      <div style="text-align:center;font-size:8.5px;border-top:1px solid #8a5a6b;padding-top:6px;">
        <p>${COMPANY_NAME} &bull; ${COMPANY_LOCATION}</p>
        <p style="font-size:8px;margin-top:3px;">All transactions are subject to our terms of trade.</p>
      </div>
    </div>
  `;

  // Page 2: System Return Note rows
  const systemItemRows = data.items.map(item =>
    `<tr>
      <td>${item.partNumber || "-"}</td>
      <td>${item.description || "-"}</td>
      <td class="text-right">${item.good}</td>
      <td class="text-right">${item.dirty}</td>
      <td class="text-right">${item.damaged}</td>
      <td class="text-right">${item.scrap}</td>
      <td class="text-right">${item.totalReturned}</td>
      <td class="text-right">${item.balanceAfter}</td>
    </tr>`
  ).join("");

  const systemPage = (copyLabel: string) => `
    <div class="rn-page2">
      <div class="rn-page2-body">
        ${renderStandardReportLayout({
          documentType: "Hire Return Note",
          documentNumber: data.returnNoteNumber,
          documentDate: data.returnDate,
          clientName: data.companyName,
          clientAddress: data.companyAddress,
          clientCityTown: data.companyCityTown,
          clientTel: data.companyTel,
          clientFax: data.companyFax,
          contactName: data.contactName,
          contactPhone: data.contactPhone,
          contactEmail: data.companyEmail || data.contactEmail,
          clientVat: data.companyPinNumber,
          clientReg: data.companyRegNumber,
          siteName: data.siteName,
          siteId: data.siteId,
          siteLocation: data.siteLocation,
          siteAddress: data.siteAddress,
          clientId: data.clientId,
          orderNumber: data.quotationNumber,
          manualNumber: copyLabel,
          hireEndDate: data.hireEndDate,
          createdBy: data.createdBy,
        })}

        <table>
          <thead>
            <tr>
              <th>Part Number</th><th>Description</th>
              <th class="text-right">Good</th><th class="text-right">Dirty</th>
              <th class="text-right">Damaged</th><th class="text-right">Scrap</th>
              <th class="text-right">This Return</th><th class="text-right">Balance</th>
            </tr>
          </thead>
          <tbody>
            ${systemItemRows}
            <tr class="total-row">
              <td colspan="6"><strong>Total This Return</strong></td>
              <td class="text-right"><strong>${totalReturned}</strong></td>
              <td></td>
            </tr>
            <tr class="total-row">
              <td colspan="7"><strong>Mass (Ton)</strong></td>
              <td class="text-right"><strong>${(totalMass / 1000).toFixed(3)}</strong></td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Yellow footer pinned at bottom of page 2 -->
      <div class="rn-page2-footer">
        <div class="rn-footer-brand">
          <span>OTNO Access Solutions — Your Trusted Scaffolding &amp; Access Partner.</span>
          <img src="${window.location.origin}/otn-logo-red.png" alt="OTNO" style="width:80px;height:auto;"/>
        </div>
        <div class="rn-footer-legal">All transactions are subject to our standard Terms of Trade which can be found at: otnoacess@gmail.com &nbsp;|&nbsp; Page 2 of 3</div>
        <div class="rn-footer-processed">
          <div>
            <div>Processed By : ${data.createdBy || ""}</div>
            <div>Processed Date : ${formatReportDate(data.returnDate) || ""}</div>
          </div>
          <div style="text-align:right;">
            <div>Print date : ${formatTimestamp()}</div>
          </div>
        </div>
      </div>
    </div>
  `;

  const page3 = (copyLabel: string) => `
    <div class="rn-page3">
      <div class="rn-page3-body">
        ${renderStandardReportLayout({
          documentType: "Hire Return Note",
          documentNumber: data.returnNoteNumber,
          documentDate: data.returnDate,
          clientName: data.companyName,
          clientAddress: data.companyAddress,
          clientCityTown: data.companyCityTown,
          clientTel: data.companyTel,
          clientFax: data.companyFax,
          contactName: data.contactName,
          contactPhone: data.contactPhone,
          contactEmail: data.companyEmail || data.contactEmail,
          clientVat: data.companyPinNumber,
          clientReg: data.companyRegNumber,
          siteName: data.siteName,
          siteId: data.siteId,
          siteLocation: data.siteLocation,
          siteAddress: data.siteAddress,
          clientId: data.clientId,
          orderNumber: data.quotationNumber,
          manualNumber: copyLabel,
          hireEndDate: data.hireEndDate,
          createdBy: data.createdBy,
        })}

        <div class="post-total-grid">
          <div class="section">
            <h4>SAFETY VERIFICATION</h4>
            <p>Vehicle safely loaded as per palletizing &amp; loading procedure</p>
            <div class="line-row"><span>Checker:</span><span class="line-fill">${data.receivedBy || ""}</span></div>
            <div class="line-row"><span>Signature:</span><span class="line-fill"></span></div>
          </div>
          <div class="section">
            <p><strong>Transport Charges</strong></p>
            <div class="line-row"><span>Internal Vehicle:</span><span class="line-fill">Ksh</span></div>
            <div class="line-row"><span>External Vehicle:</span><span class="line-fill">Ksh</span></div>
          </div>
        </div>

        <div class="section" style="margin-bottom:8px;">
          <div class="signing-grid">
            <div class="line-row"><span>${COMPANY_NAME} Rep's Name:</span><span class="line-fill">${data.receivedBy || ""}</span></div>
            <div class="line-row"><span>Signature:</span><span class="line-fill"></span></div>
            <div class="line-row"><span>Date:</span><span class="line-fill"></span></div>
            <div class="line-row"><span>Transporter / Customer / Driver:</span><span class="line-fill">${data.returnedBy || ""}</span></div>
            <div class="line-row"><span>Signature:</span><span class="line-fill"></span></div>
            <div class="line-row"><span>Date:</span><span class="line-fill"></span></div>
            <div class="line-row"><span>Customer Representative:</span><span class="line-fill"></span></div>
            <div class="line-row"><span>Signature:</span><span class="line-fill"></span></div>
            <div class="line-row"><span>Date:</span><span class="line-fill"></span></div>
          </div>
        </div>

        <div class="section" style="margin-bottom:8px;">
          <div class="line-row"><span>Vehicle Registration Number:</span><span class="line-fill">${data.vehicleNo || ""}</span></div>
          <div class="line-row"><span>Name of Transporter / Customer:</span><span class="line-fill"></span></div>
          <div class="line-row split-row">
            <span>Time Arrive:</span><span class="line-fill"></span>
            <span>Time Depart:</span><span class="line-fill"></span>
          </div>
        </div>

        <div class="section" style="margin-bottom:8px;min-height:40px;">
          <h3>Customer Comments:</h3>
        </div>

        <div class="section terms-section">
          <p><strong>Please check that the equipment count agrees with the above. Hire charges after quantities returned as above will cease on ${formatReportDate(data.returnDate)}.</strong></p>
          <p>All errors are to be clearly noted. Failure to do this assumes acceptance of the documentation.</p>
          <p><strong>Charges:</strong> Dirty: 2× list hire price &bull; Damaged: 4× list hire price &bull; Lost / Scrap: selling price of item.</p>
        </div>

        ${data.remarks ? `<div class="section" style="margin-top:8px;"><strong>Remarks:</strong> ${data.remarks}</div>` : ""}
      </div>

      <div class="rn-page2-footer">
        <div class="rn-footer-brand">
          <span>${COMPANY_NAME} — Your Trusted Scaffolding &amp; Access Partner.</span>
          <img src="${typeof window !== 'undefined' ? window.location.origin : ''}/otn-logo-red.png" alt="OTN Logo" style="height:28px;width:auto;" />
        </div>
        <div class="rn-footer-legal">
          All transactions are subject to our standard Terms of Trade which can be found at: otnoaseas@gmail.com &nbsp;|&nbsp; Page 3 of 3
        </div>
        <div class="rn-footer-processed">
          <span>Processed By: &nbsp;${data.createdBy || "-"}</span>
          <span>Processed Date: ${formatTimestamp()}</span>
        </div>
      </div>
    </div>
  `;

  const html =
    "<!DOCTYPE html><html><head>" +
    "<title>Hire Return Note - " + data.returnNoteNumber + "</title>" +
    "<style>" + SHARED_PRINT_STYLES + `
      /* ── Return Note specific ── */
      .page-header { display: none !important; }
      .page-header-spacer { display: none !important; }

      /* Page 1: Pink gate pass fills the full page */
      .rn-gate-pass {
        background: #f8cddd;
        border: 1px solid #c58ea3;
        padding: 12px;
        display: flex;
        flex-direction: column;
        min-height: 96vh;
      }
      .rn-gate-table-wrap {
        flex: 1;
        display: flex;
        flex-direction: column;
        margin-bottom: 8px;
      }
      .rn-gate-table-wrap table { flex: 1; height: 100%; margin-bottom: 0; }
      .rn-gate-table-wrap tbody tr { height: 22px; }

      /* Page 2: items table + yellow footer */
      .rn-page2 {
        page-break-before: always;
        break-before: page;
        display: flex;
        flex-direction: column;
        min-height: 92vh;
        font-size: 9px;
      }
      .rn-page2-body { flex: 1; }
      .rn-page2-footer { margin-top: auto; }
      .rn-footer-brand {
        background: #facc15; color: #1f2937; font-weight: 700;
        display: flex; justify-content: space-between; align-items: center;
        padding: 6px 10px;
      }
      .rn-footer-legal { text-align: center; font-size: 7.5px; color: #4b5563; padding: 3px 8px 4px; border: 1px solid #e5e7eb; border-top: none; }
      .rn-footer-processed { display: flex; justify-content: space-between; font-size: 7px; color: #6b7280; padding: 4px 0 0; }

      /* Page 3: 4-panel headers + safety/signature section */
      .rn-page3 {
        page-break-before: always;
        break-before: page;
        font-size: 9px;
        display: flex;
        flex-direction: column;
        min-height: 92vh;
      }
      .rn-page3 .rn-page3-body { flex: 1; }
      .rn-page3 .rn-page2-footer { margin-top: auto; }

      @media print {
        @page { size: A4; margin: 8mm; }
        body { padding: 0 !important; }
        .rn-gate-pass { min-height: 96vh; }
        .rn-page2 { break-before: page; min-height: 92vh; }
        .rn-page3 { break-before: page; min-height: 92vh; }
      }
    ` + "</style>" +
    "</head><body>" +
    gatePassPage() +
    systemPage("Company Copy") +
    page3("Company Copy") +
    "</body></html>";

  printWindow.document.write(withPrintOption(html));
  printWindow.document.close();
};
