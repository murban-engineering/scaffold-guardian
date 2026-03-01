// PDF Generation utilities using browser print

export interface DeliveryNoteData {
  quotationNumber: string;
  deliveryNoteNumber: string;
  dateCreated: string;
  deliveryDate: string;
  hireStartDate?: string;
  companyName: string;
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
  companyName: string;
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
const COMPANY_ADDRESS = "99215-80107 Mombasa, Kenya";
const COMPANY_LOCATION = "Embakasi, Old North Airport Rd, next to Naivas Embakasi";
const COMPANY_PIN = "P052471711M";

const formatTimestamp = () => {
  const now = new Date();
  return now.toLocaleString("en-KE", { dateStyle: "medium", timeStyle: "short" });
};

const formatCurrency = (value: number) =>
  `Ksh ${value.toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatMass = (value: number | string | null | undefined) => {
  if (value == null) return "-";
  const parsed = typeof value === "string" ? Number(value) : value;
  return Number.isFinite(parsed) ? `${parsed.toFixed(2)} kg` : "-";
};

const withPrintOption = (html: string) => {
  const printControls = `
    <style>
      .print-controls {
        position: sticky;
        top: 0;
        z-index: 9999;
        display: flex;
        justify-content: flex-end;
        padding: 8px 16px;
        background: rgba(255, 255, 255, 0.97);
        border-bottom: 1px solid #ddd;
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
      <button type="button" class="print-button" onclick="triggerPrint()">Print report</button>
    </div>
  `;
  return html.replace("<body>", `<body>${printControls}`);
};

// ── Shared print styles used in every report ──────────────────────────────────
// Key technique: wrap entire body in a single <table>. The <thead> holds the
// compact page-header and browser automatically repeats it on every printed page.
const SHARED_PRINT_STYLES = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, sans-serif; font-size: 9.5px; color: #1f2937; line-height: 1.3; }
  
  /* ── Screen layout ── */
  body { padding: 12px; }

  /* ── Repeating page header (print only) ── */
  /* Hidden on screen — the full report header is shown instead */
  .page-header { display: none; }

  @media print {
    body { padding: 0; margin: 0; font-size: 8.5px; }

    /* The outer wrapper table drives header repetition */
    .print-wrapper-table {
      width: 100%;
      border-collapse: collapse;
    }
    /* thead repeats on every page automatically */
    .print-wrapper-table > thead {
      display: table-header-group;
    }
    .print-wrapper-table > tbody {
      display: table-row-group;
    }
    /* The header cell shown only on page 2+ */
    .print-wrapper-table > thead > tr > td {
      padding: 5px 10px 4px;
      border-bottom: 1.5px solid #111;
      background: white;
    }
    /* On the very first page the full screen header is visible — hide the
       compact thead so it doesn't double up. We achieve this by making the
       thead invisible on the first page via a zero-height trick: we insert a
       1px ghost first-row that pushes the real thead to page 2 rendering.
       But actually the simpler approach: always show the compact header in
       thead — it appears on EVERY page including page 1, which is fine because
       the screen-only full header (.standard-report-layout) is hidden at print. */
    .standard-report-layout { display: none !important; }
    .page-header { display: block; }

    /* avoid page break inside table rows */
    tr { page-break-inside: avoid; }
    /* inner data table header repeats too */
    thead { display: table-header-group; }
    tfoot { display: table-footer-group; }
    .page-header-spacer { display: none; }
  }
  .page-header-spacer { display: none; }

  /* ── Report title ── */
  .report-title {
    font-size: 18px; font-weight: 900; letter-spacing: -0.3px;
    color: #111827; text-transform: uppercase; margin-bottom: 6px;
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
  .brand-logo { width: 60px; height: auto; }
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

// ── Compact repeating page-header (appears on every printed page via thead) ───
// Returns the thead HTML — the outer print-wrapper-table in wrapBodyContent()
// ensures the browser repeats this on every page automatically.
const renderPageHeader = (docTitle: string, docNumber: string, clientName: string) => `
  <thead class="print-only-thead">
    <tr>
      <td style="padding:5px 10px 4px;border-bottom:1.5px solid #111;background:white;width:100%;">
        <div style="display:flex;align-items:center;justify-content:space-between;">
          <div style="display:flex;align-items:center;gap:8px;">
            <img src="${window.location.origin}/otnologo-removebg-preview.png" alt="OTNO" style="width:36px;height:auto;"/>
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
      </td>
    </tr>
  </thead>
`;

// ── Wraps all report body content in the print-wrapper-table ──────────────────
// The <thead> (renderPageHeader) repeats on every printed page; the <tbody>
// contains all actual report content.
const wrapBodyContent = (theadHtml: string, bodyHtml: string) => `
  <table class="print-wrapper-table" style="width:100%;border-collapse:collapse;">
    ${theadHtml}
    <tbody>
      <tr>
        <td style="padding:8px 10px;vertical-align:top;">
          ${bodyHtml}
        </td>
      </tr>
    </tbody>
  </table>
`;

// ── Standard two-column layout (screen heading + client/site panels) ─────────
interface StandardReportLayoutData {
  documentType: string;
  documentNumber: string;
  documentDate: string;
  clientName: string;
  clientAddress?: string;
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
}

const renderStandardReportLayout = (data: StandardReportLayoutData) => `
  <div class="standard-report-layout">
    <div class="standard-report-left">
      <div class="brand-block">
        <div class="brand-top">
          <img src="${window.location.origin}/otnologo-removebg-preview.png" alt="OTNO Logo" class="brand-logo" />
          <div class="brand-title">${COMPANY_NAME}</div>
        </div>
        <div class="brand-meta">
          <span><strong>Reg No:</strong> ${COMPANY_PIN}</span>
        </div>
      </div>

      <div class="panel client-panel">
        <h3>${data.clientName || "-"}</h3>
        ${data.clientAddress ? `<p style="margin-bottom:4px;font-size:9px;">${data.clientAddress}</p>` : ""}
        <div style="margin-top:8px;">
          <div class="info-row"><span class="info-label">Customer No</span><span class="info-sep">:</span><span class="info-value" style="font-weight:800;">${data.clientId || ""}</span></div>
          <div class="info-row"><span class="info-label">Cell No</span><span class="info-sep">:</span><span class="info-value">${data.contactPhone || ""}</span></div>
          <div class="info-row"><span class="info-label">Tel No</span><span class="info-sep">:</span><span class="info-value">${data.contactPhone || ""}</span></div>
          ${data.clientVat ? `<div class="info-row"><span class="info-label">Vat No</span><span class="info-sep">:</span><span class="info-value">${data.clientVat}</span></div>` : ""}
          ${data.clientReg ? `<div class="info-row"><span class="info-label">Reg No</span><span class="info-sep">:</span><span class="info-value">${data.clientReg}</span></div>` : ""}
          <div class="info-row"><span class="info-label">Email</span><span class="info-sep">:</span><span class="info-value">${data.contactEmail || ""}</span></div>
        </div>
      </div>
    </div>

    <div class="standard-report-right">
      <h2 class="report-title">${data.documentType}</h2>
      <div class="panel">
        <h3>Document Details</h3>
        <div class="info-row"><span class="info-label">Document No</span><span class="info-sep">:</span><span class="info-value">${data.documentNumber || "-"}</span></div>
        <div class="info-row"><span class="info-label">Document Type</span><span class="info-sep">:</span><span class="info-value">${data.documentType}</span></div>
        <div class="info-row"><span class="info-label">Document Date</span><span class="info-sep">:</span><span class="info-value">${data.documentDate || "-"}</span></div>
        ${data.orderNumber ? `<div class="info-row"><span class="info-label">Your Order No</span><span class="info-sep">:</span><span class="info-value">${data.orderNumber}</span></div>` : ""}
        ${data.manualNumber ? `<div class="info-row"><span class="info-label">Manual No</span><span class="info-sep">:</span><span class="info-value">${data.manualNumber}</span></div>` : ""}
        ${data.hireQuoteNo ? `<div class="info-row"><span class="info-label">Hire Quote No</span><span class="info-sep">:</span><span class="info-value">${data.hireQuoteNo}</span></div>` : ""}
        ${data.hireStartDate ? `<div class="info-row"><span class="info-label">Hire Start Date</span><span class="info-sep">:</span><span class="info-value">${data.hireStartDate}</span></div>` : ""}
        ${data.hireEndDate ? `<div class="info-row"><span class="info-label">Hire End Date</span><span class="info-sep">:</span><span class="info-value">${data.hireEndDate}</span></div>` : ""}
        ${data.depositRequired ? `<div class="info-row"><span class="info-label">Deposit Required</span><span class="info-sep">:</span><span class="info-value">${data.depositRequired}</span></div>` : ""}
      </div>

      <div class="panel">
        <h3>Company Details</h3>
        <div class="info-row"><span class="info-label">Company</span><span class="info-sep">:</span><span class="info-value">${COMPANY_NAME}</span></div>
        <div class="info-row"><span class="info-label">Address</span><span class="info-sep">:</span><span class="info-value">${COMPANY_ADDRESS}</span></div>
        <div class="info-row"><span class="info-label">Location</span><span class="info-sep">:</span><span class="info-value">${COMPANY_LOCATION}</span></div>
        <div class="info-row"><span class="info-label">Tel No</span><span class="info-sep">:</span><span class="info-value">otnoacess@gmail.com</span></div>
        ${data.createdBy ? `<div class="info-row"><span class="info-label">Salesman</span><span class="info-sep">:</span><span class="info-value">${data.createdBy}</span></div>` : ""}
      </div>

      <div class="panel">
        <h3>Site Details</h3>
        <div class="info-row"><span class="info-label">Site No</span><span class="info-sep">:</span><span class="info-value" style="font-weight:800;">${data.siteId || ""}</span></div>
        <div class="info-row"><span class="info-label">Site Name</span><span class="info-sep">:</span><span class="info-value">${data.siteName || ""}</span></div>
        <div class="info-row"><span class="info-label">Site Address</span><span class="info-sep">:</span><span class="info-value">${data.siteAddress || ""}</span></div>
        <div style="margin-top:5px;">
          <div class="info-row"><span class="info-label">Contact</span><span class="info-sep">:</span><span class="info-value">${data.contactName || ""}</span></div>
          <div class="info-row"><span class="info-label">Tel No</span><span class="info-sep">:</span><span class="info-value">${data.contactPhone || ""}</span></div>
        </div>
      </div>
    </div>
  </div>
`;

// ═══════════════════════════════════════════════════════════════════════════════
// HIRE DELIVERY NOTE
// ═══════════════════════════════════════════════════════════════════════════════
export const generateDeliveryNotePDF = (data: DeliveryNoteData) => {
  const printWindow = window.open("", "_blank");
  if (!printWindow) { alert("Please allow popups for this site to generate PDFs"); return; }

  const deliveryNotePage = () => wrapBodyContent(
    renderPageHeader("Hire Delivery Note", data.deliveryNoteNumber, data.companyName),
    `
      ${renderStandardReportLayout({
        documentType: "Hire Delivery Note",
        documentNumber: data.deliveryNoteNumber,
        documentDate: data.deliveryDate,
        hireStartDate: data.hireStartDate,
        clientName: data.companyName,
        contactName: data.contactName,
        contactPhone: data.contactPhone,
        siteName: data.siteName,
        siteId: data.siteId,
        siteAddress: data.siteAddress,
        clientId: data.clientId,
        orderNumber: data.quotationNumber,
        hireQuoteNo: data.quotationNumber,
        createdBy: data.createdBy,
      })}

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
    `
  );

  const html = `<!DOCTYPE html><html><head><title>Hire Delivery Note - ${data.deliveryNoteNumber}</title>
    <style>${SHARED_PRINT_STYLES}</style></head><body>
    ${deliveryNotePage()}
    ${deliveryNotePage()}
  </body></html>`;

  printWindow.document.write(withPrintOption(html));
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

  const loadingNotePage = (copyLabel: string) => wrapBodyContent(
    renderPageHeader(noteTitle, data.quotationNumber, data.companyName),
    `
      ${renderStandardReportLayout({
        documentType: noteTitle,
        documentNumber: data.quotationNumber,
        documentDate: data.dateCreated,
        clientName: data.companyName,
        contactName: data.contactName,
        contactPhone: data.contactPhone,
        siteName: data.siteName,
        siteId: data.siteId,
        siteLocation: data.siteLocation,
        siteAddress: data.siteAddress,
        clientId: data.clientId,
        manualNumber: copyLabel,
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
    `
  );

  const html = `<!DOCTYPE html><html><head><title>${noteTitle} - ${data.quotationNumber}</title>
    <style>${SHARED_PRINT_STYLES}</style></head><body>
    ${loadingNotePage("Company Copy")}
    ${loadingNotePage("Client Copy")}
  </body></html>`;

  printWindow.document.write(withPrintOption(html));
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
        .yard-note-header .brand-logo { width: 48px; height: auto; }
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
          <img src="${window.location.origin}/otnologo-removebg-preview.png" alt="OTNO Logo" class="brand-logo" />
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
  const discountAmount = (subtotal + vatAmount) * (data.discountRate / 100);
  const totalAfterDiscount = subtotal + vatAmount - discountAmount;

  const html = `<!DOCTYPE html><html><head><title>Hire Quotation - ${data.quotationNumber}</title>
    <style>
      ${SHARED_PRINT_STYLES}
      .grand-total { font-size: 12px; background: #333; color: white; }
      .terms { margin-top: 14px; padding: 8px; background: #f9f9f9; border-left: 3px solid #333; font-size: 9px; line-height: 1.4; }
    </style></head><body>
    ${wrapBodyContent(
      renderPageHeader("Hire Quotation", data.quotationNumber, data.companyName),
      `
      ${renderStandardReportLayout({
      documentType: "Hire Quotation",
      documentNumber: data.quotationNumber,
      documentDate: data.dateCreated,
      clientName: data.companyName,
      contactName: data.contactName,
      contactPhone: data.contactPhone,
      contactEmail: data.contactEmail,
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
          <th>#</th><th>Part Number</th><th>Description</th>
          <th class="text-right">Qty</th>
          <th class="text-right">Mass/Item</th>
          <th class="text-right">Rate</th>
          <th class="text-right">Hire/Week (Net)</th>
        </tr>
      </thead>
      <tbody>
        ${data.items.map((item, idx) => {
          const discountRate = Math.min(Math.max(item.discountRate, 0), 100) / 100;
          const discountedRate = item.weeklyRate * (1 - discountRate);
          const discountedTotal = discountedRate * item.quantity;
          return `<tr>
            <td>${idx + 1}</td>
            <td>${item.partNumber || "-"}</td>
            <td>${item.description || "-"}</td>
            <td class="text-right">${item.quantity}</td>
            <td class="text-right">${formatMass(item.massPerItem)}</td>
            <td class="text-right">${formatCurrency(discountedRate)}</td>
            <td class="text-right">${formatCurrency(discountedTotal)}</td>
          </tr>`;
        }).join("")}
        <tr class="total-row">
          <td colspan="3"><strong>SUBTOTAL</strong></td>
          <td class="text-right"><strong>${totalQuantity}</strong></td>
          <td class="text-right"><strong>${formatMass(totalMass)}</strong></td>
          <td class="text-right">-</td>
          <td class="text-right"><strong>${formatCurrency(subtotal)}</strong></td>
        </tr>
        <tr class="total-row"><td colspan="6"><strong>VAT (16%)</strong></td><td class="text-right"><strong>${formatCurrency(vatAmount)}</strong></td></tr>
        ${data.discountRate > 0 ? `<tr class="total-row"><td colspan="6"><strong>Discount (${data.discountRate}%)</strong></td><td class="text-right"><strong>-${formatCurrency(discountAmount)}</strong></td></tr>` : ""}
        <tr class="total-row" style="background:#333;color:white;">
          <td colspan="6"><strong>TOTAL (incl. VAT)</strong></td>
          <td class="text-right"><strong>${formatCurrency(totalAfterDiscount)}</strong></td>
        </tr>
      </tbody>
    </table>

    <div class="terms">
      <strong>COMMENTS</strong><br/>
      ${(data.comments || "Quotes exclude transport to and from site.\nOne month deposit is required upfront.\nWe do not accept cash payments.").split("\n").join("<br/>")}
    </div>

    <div class="terms">
      <strong>TERMS:</strong> Order confirmation is through deposit payment before collection. One month deposit required upfront. We do not accept cash payments.<br/>
      <strong>Payment:</strong> Account Name: OTNO ACCESS SOLUTIONS LIMITED | KES Acc: 02107773676350 | I&amp;M Bank, Changamwe | Swift: IMBLKENA | Mpesa: 542542
    </div>

    <div class="signature-section">
      <div class="signature-box"><p><strong>For ${COMPANY_NAME}:</strong></p><p style="margin-bottom:14px;">Name: ___________________________</p><p style="margin-bottom:14px;">Signature: ___________________________</p><p>Date: ___________________________</p></div>
      <div class="signature-box"><p><strong>For Client:</strong></p><p style="margin-bottom:14px;">Name: ___________________________</p><p style="margin-bottom:14px;">Signature: ___________________________</p><p>Date: ___________________________</p></div>
    </div>
    <div style="text-align:right;font-size:8px;color:#999;margin-top:14px;">Print date: ${formatTimestamp()}</div>
    `
    )}
  </body></html>`;

  printWindow.document.write(withPrintOption(html));
  printWindow.document.close();
};

// ═══════════════════════════════════════════════════════════════════════════════
// QUOTATION CALCULATION PDF
// ═══════════════════════════════════════════════════════════════════════════════
export const generateQuotationPDF = (data: QuotationCalculationData) => {
  const printWindow = window.open("", "_blank");
  if (!printWindow) { alert("Please allow popups for this site to generate PDFs"); return; }

  const html = `<!DOCTYPE html><html><head><title>Hire Quotation - ${data.quotationNumber}</title>
    <style>
      ${SHARED_PRINT_STYLES}
      .summary-box { background: #f5f5f5; padding: 10px; margin-bottom: 14px; }
      .summary-row { display: flex; justify-content: space-between; margin-bottom: 6px; padding-bottom: 6px; border-bottom: 1px solid #ddd; font-size: 9.5px; }
      .summary-row:last-child { border-bottom: none; }
      .summary-row.grand { font-size: 11px; font-weight: bold; background: #333; color: white; margin: -10px; margin-top: 8px; padding: 10px; }
      .terms { margin-top: 14px; padding: 8px; background: #f9f9f9; border-left: 3px solid #333; font-size: 9px; line-height: 1.4; }
    </style></head><body>
    ${wrapBodyContent(
      renderPageHeader("Hire Quotation", data.quotationNumber, data.companyName),
      `
      ${renderStandardReportLayout({
      documentType: "Hire Quotation",
      documentNumber: data.quotationNumber,
      documentDate: data.dateCreated,
      clientName: data.companyName,
      contactName: data.contactName,
      contactPhone: data.contactPhone,
      contactEmail: data.contactEmail,
      siteName: data.siteName,
      siteId: data.siteId,
      siteLocation: data.siteLocation,
      siteAddress: data.siteAddress,
      clientId: data.clientId,
      createdBy: data.createdBy,
    })}

    <div style="margin-bottom:10px;font-size:9.5px;line-height:1.5;">
      <strong>Dear: ${data.companyName || data.contactName || "Valued Customer"}</strong><br/>
      We thank you for your valued enquiry and are pleased to submit our quotation. Valid for 30 DAYS.
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
      <div class="summary-row"><span>Total for Hire Period</span><span>${formatCurrency(data.totalForPeriod)}</span></div>
      <div class="summary-row"><span>VAT (${data.vatRate}%)</span><span>${formatCurrency(data.vatAmount)}</span></div>
      ${data.discountRate > 0 ? `<div class="summary-row"><span>Discount (${data.discountRate}%)</span><span>-${formatCurrency(data.discountAmount)}</span></div>` : ""}
      <div class="summary-row grand"><span>GRAND TOTAL (incl. VAT)</span><span>${formatCurrency(data.grandTotal)}</span></div>
      <div class="summary-row grand"><span>PAYMENT TOTAL</span><span>${formatCurrency(data.paymentTotal)}</span></div>
    </div>

    <div class="terms">
      <strong>TERMS:</strong> Quote does not include transport. Order confirmation through deposit payment. One month deposit required upfront. We do not accept cash.<br/>
      <strong>Payment:</strong> Account Name: OTNO ACCESS SOLUTIONS LIMITED | KES Acc: 02107773676350 | I&amp;M Bank, Changamwe | Swift: IMBLKENA | Mpesa: 542542
    </div>

    <div class="signature-section">
      <div class="signature-box"><p><strong>For ${COMPANY_NAME}:</strong></p><p style="margin-bottom:14px;">Name: ___________________________</p><p style="margin-bottom:14px;">Signature: ___________________________</p><p>Date: ___________________________</p></div>
      <div class="signature-box"><p><strong>For Client:</strong></p><p style="margin-bottom:14px;">Name: ___________________________</p><p style="margin-bottom:14px;">Signature: ___________________________</p><p>Date: ___________________________</p></div>
    </div>
    <div style="text-align:right;font-size:8px;color:#999;margin-top:14px;">Print date: ${formatTimestamp()}</div>
    `
    )}
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

  const gatePassPage = (copyLabel: string) => wrapBodyContent(
    renderPageHeader("Hire Return Form", data.returnNoteNumber, data.companyName),
    `
      ${renderStandardReportLayout({
        documentType: "Hire Return Form",
        documentNumber: data.returnNoteNumber,
        documentDate: data.returnDate,
        clientName: data.companyName,
        contactName: data.contactName,
        contactPhone: data.contactPhone,
        contactEmail: data.contactEmail,
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

      <table style="border-color:#8a5a6b;">
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
    `
  );

  // Page 2: System Return Note
  const systemItemRows = data.items.map(item =>
    `<tr>
      <td>${item.partNumber || "-"}</td>
      <td>${item.description || "-"}</td>
      <td class="text-right">${item.totalDelivered - item.totalReturned + item.balanceAfter}</td>
      <td class="text-right">${item.good}</td>
      <td class="text-right">${item.dirty}</td>
      <td class="text-right">${item.damaged}</td>
      <td class="text-right">${item.scrap}</td>
      <td class="text-right">${item.totalReturned}</td>
      <td class="text-right">${item.balanceAfter}</td>
    </tr>`
  ).join("");

  const systemPage = (copyLabel: string) => wrapBodyContent(
    renderPageHeader("Hire Return Note", data.returnNoteNumber, data.companyName),
    `
      ${renderStandardReportLayout({
        documentType: "Hire Return Note",
        documentNumber: data.returnNoteNumber,
        documentDate: data.returnDate,
        clientName: data.companyName,
        contactName: data.contactName,
        contactPhone: data.contactPhone,
        contactEmail: data.contactEmail,
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
            <th class="text-right">On Site</th>
            <th class="text-right">Good</th><th class="text-right">Dirty</th>
            <th class="text-right">Damaged</th><th class="text-right">Scrap</th>
            <th class="text-right">This Return</th><th class="text-right">Balance</th>
          </tr>
        </thead>
        <tbody>
          ${systemItemRows}
          <tr class="total-row">
            <td colspan="7"><strong>Total This Return</strong></td>
            <td class="text-right"><strong>${totalReturned}</strong></td>
            <td></td>
          </tr>
          <tr class="total-row">
            <td colspan="8"><strong>Mass (Ton)</strong></td>
            <td class="text-right"><strong>${(totalMass / 1000).toFixed(3)}</strong></td>
          </tr>
        </tbody>
      </table>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px;">
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

      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-top:10px;">
        <div style="border-top:2px solid #333;padding-top:6px;">
          <p><strong>OTNO Representative</strong></p>
          <p>Name: ${data.receivedBy || "_______________"}</p>
          <p>Signature: _______________ &nbsp; Date: _______________</p>
        </div>
        <div style="border-top:2px solid #333;padding-top:6px;">
          <p><strong>Vehicle Reg No:</strong> ${data.vehicleNo || "_______________"}</p>
          <p><strong>Transporter / Customer / Driver</strong></p>
          <p>Name: ${data.returnedBy || "_______________"}</p>
          <p>Signature: _______________ &nbsp; Date: _______________</p>
        </div>
        <div style="border-top:2px solid #333;padding-top:6px;">
          <p><strong>Customer Representative</strong></p>
          <p>Name: _______________</p>
          <p>Signature: _______________ &nbsp; Date: _______________</p>
        </div>
      </div>

      <div class="line-row" style="margin-top:8px;">
        <span>Time Arrive:</span><span class="line-fill"></span>
        <span style="margin-left:24px;">Time Depart:</span><span class="line-fill"></span>
      </div>

      <p style="margin-top:8px;font-size:9px;">Please check that the equipment count agrees with the above. Hire charges after quantities returned as above will cease on <strong>${data.returnDate}</strong>.</p>
      <p style="font-size:9px;">All errors are to be clearly noted. Failure to do this assumes acceptance of the documentation.</p>

      <div class="section" style="margin-top:8px;">
        <strong>Charges:</strong>
        <ul style="padding-left:14px;margin-top:3px;font-size:9px;">
          <li><strong>Dirty Equipment:</strong> Will be charged at 2× the list hire price of the item.</li>
          <li><strong>Damaged Equipment:</strong> Will be charged at 4× the list hire price of the item.</li>
          <li><strong>Lost / Scrap Equipment:</strong> Will be charged at the selling price of the item.</li>
        </ul>
      </div>

      ${data.remarks ? `<div class="section" style="margin-top:8px;"><strong>Remarks:</strong> ${data.remarks}</div>` : ""}

      <div style="margin-top:10px;border-top:1px solid #ccc;padding-top:5px;font-size:9px;">
        <div class="line-row"><span>Processed By:</span><span class="line-fill">${data.createdBy || "-"}</span></div>
        <div class="line-row"><span>Processed Date:</span><span class="line-fill">${formatTimestamp()}</span></div>
      </div>
    `
  );

  const html =
    "<!DOCTYPE html><html><head>" +
    "<title>Hire Return Note - " + data.returnNoteNumber + "</title>" +
    "<style>" + SHARED_PRINT_STYLES + `
      .page[style*="background:#f8cddd"] .panel { border-color: #8a5a6b; }
    ` + "</style>" +
    "</head><body>" +
    gatePassPage("Company Copy") +
    systemPage("Company Copy") +
    gatePassPage("Client Copy") +
    systemPage("Client Copy") +
    "</body></html>";

  printWindow.document.write(withPrintOption(html));
  printWindow.document.close();
};
