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
  if (value == null) {
    return "-";
  }
  const parsed = typeof value === "string" ? Number(value) : value;
  return Number.isFinite(parsed) ? `${parsed.toFixed(2)} kg` : "-";
};

const withPrintOption = (html: string) => {
  const printControls = `
    <style>
      h1, h2, h3 {
        text-align: left !important;
        font-weight: 800 !important;
      }
      h1 { font-size: 28px !important; }
      h2 { font-size: 22px !important; }
      h3 { font-size: 16px !important; }
      .report-title {
        font-size: 22px;
        font-weight: 800;
        margin-top: 8px;
        color: #111;
      }
      .print-controls {
        position: sticky;
        top: 0;
        z-index: 9999;
        display: flex;
        justify-content: flex-end;
        padding: 12px 20px;
        background: rgba(255, 255, 255, 0.96);
        border-bottom: 1px solid #ddd;
      }
      .print-button {
        border: 1px solid #333;
        border-radius: 6px;
        background: #111;
        color: #fff;
        padding: 8px 14px;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
      }
      @media print {
        .print-controls {
          display: none;
        }
      }
    </style>
    <script>
      const triggerPrint = () => window.print();
    </script>
    <div class="print-controls">
      <button type="button" class="print-button" onclick="triggerPrint()">Print report</button>
    </div>
  `;

  return html.replace("<body>", `<body>${printControls}`);
};

const STANDARD_REPORT_STYLES = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: "Arial", sans-serif; padding: 20px; font-size: 12px; color: #1f2937; line-height: 1.35; }
  .report-page { page-break-after: always; }
  .report-page:last-child { page-break-after: auto; }
  .report-header { display: grid; grid-template-columns: 1.1fr 1fr; gap: 16px; margin-bottom: 16px; align-items: start; }
  .brand-block { padding: 12px 14px; }
  .brand-top { display: flex; align-items: center; gap: 12px; margin-bottom: 8px; }
  .brand-logo { width: 72px; height: auto; }
  .brand-title { font-size: 18px; font-weight: 800; line-height: 1.15; color: #111827; }
  .brand-meta { display: flex; flex-wrap: wrap; gap: 8px 18px; font-size: 11px; color: #374151; }
  .report-box { border: 1px solid #111827; border-radius: 8px; padding: 10px 12px; }
  .report-title { font-size: 32px; line-height: 1; font-weight: 900; letter-spacing: -0.4px; margin-bottom: 8px; color: #111827; text-transform: uppercase; }
  .copy-label { display: inline-block; font-size: 11px; font-weight: 700; border: 1px solid #111827; padding: 2px 8px; border-radius: 999px; margin-bottom: 8px; }
  .standard-report-layout { display: grid; grid-template-columns: 1.5fr 1fr; gap: 16px; margin-bottom: 16px; align-items: start; }
  .standard-report-left { display: grid; gap: 12px; }
  .standard-report-right { display: grid; gap: 8px; }
  .client-panel { min-height: 220px; }
  .panel-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 14px; }
  .panel { border: 1px solid #111827; border-radius: 8px; padding: 10px; }
  .panel h3 { font-size: 15px; font-weight: 800; margin-bottom: 6px; color: #111827; }
  .info-row { display: flex; gap: 6px; margin-bottom: 4px; align-items: baseline; }
  .info-label { font-weight: 700; color: #111827; min-width: 130px; }
  .info-sep { color: #6b7280; }
  .info-value { color: #111827; word-break: break-word; flex: 1; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 14px; }
  th, td { border: 1px solid #111827; padding: 6px 8px; font-size: 11px; vertical-align: top; }
  th { background: #f3f4f6; text-transform: uppercase; letter-spacing: 0.2px; font-weight: 800; }
  .total-row td { background: #f9fafb; font-weight: 800; }
  .text-right { text-align: right; }
  .section-box { border: 1px solid #111827; border-radius: 8px; padding: 10px; margin-bottom: 12px; }
  .section-box h4 { margin-bottom: 6px; font-size: 12px; text-transform: uppercase; }
  .signature-section { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 22px; }
  .signature-box { border-top: 1px solid #111827; padding-top: 8px; }
  .signature-box p { margin-bottom: 5px; }
  @media print { body { padding: 0; } }
`;

const STANDARD_REPORT_HEADER_STYLES = `
  .report-title { font-size: 32px; line-height: 1; font-weight: 900; letter-spacing: -0.4px; margin-bottom: 8px; color: #111827; text-transform: uppercase; }
  .standard-report-layout { display: grid; grid-template-columns: 1.5fr 1fr; gap: 16px; margin-bottom: 16px; align-items: start; }
  .standard-report-left { display: grid; gap: 12px; }
  .standard-report-right { display: grid; gap: 8px; }
  .client-panel { min-height: 220px; }
  .brand-block { padding: 12px 14px; }
  .brand-top { display: flex; align-items: center; gap: 12px; margin-bottom: 8px; }
  .brand-logo { width: 72px; height: auto; }
  .brand-title { font-size: 18px; font-weight: 800; line-height: 1.15; color: #111827; }
  .brand-meta { display: flex; flex-wrap: wrap; gap: 8px 18px; font-size: 11px; color: #374151; }
  .panel { border: 1px solid #111827; border-radius: 8px; padding: 10px; }
  .panel h3 { font-size: 15px; font-weight: 800; margin-bottom: 6px; color: #111827; }
  .info-row { display: flex; gap: 6px; margin-bottom: 4px; align-items: baseline; }
  .info-label { font-weight: 700; color: #111827; min-width: 130px; }
  .info-sep { color: #6b7280; }
  .info-value { color: #111827; word-break: break-word; flex: 1; }
`;

const renderReportHeader = (title: string, copyLabel?: string) => `
  <div class="report-header">
    <div class="brand-block">
      <div class="brand-top">
        <img src="${window.location.origin}/otnologo-removebg-preview.png" alt="OTNO Logo" class="brand-logo" />
        <div class="brand-title">${COMPANY_NAME}</div>
      </div>
      <div class="brand-meta">
        <span><strong>Address:</strong> ${COMPANY_ADDRESS}</span>
        <span><strong>Location:</strong> ${COMPANY_LOCATION}</span>
        <span><strong>PIN:</strong> ${COMPANY_PIN}</span>
      </div>
    </div>
    <div class="report-box">
      ${copyLabel ? `<span class="copy-label">${copyLabel}</span>` : ""}
      <h2 class="report-title">${title}</h2>
      <div class="info-row"><span class="info-label">Printed</span><span class="info-sep">:</span><span class="info-value">${formatTimestamp()}</span></div>
    </div>
  </div>
`;

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
        ${data.clientAddress ? `<p style="margin-bottom:6px;">${data.clientAddress}</p>` : ""}
        <div style="margin-top: 12px;">
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
        <div class="info-row"><span class="info-label">Site No</span><span class="info-sep">:</span><span class="info-value">${data.siteId || ""}</span></div>
        <div class="info-row"><span class="info-label">Site Name</span><span class="info-sep">:</span><span class="info-value">${data.siteName || ""}</span></div>
        <div class="info-row"><span class="info-label">Site Address</span><span class="info-sep">:</span><span class="info-value">${data.siteAddress || ""}</span></div>
        <div style="margin-top:8px;">
          <div class="info-row"><span class="info-label">Contact</span><span class="info-sep">:</span><span class="info-value">${data.contactName || ""}</span></div>
          <div class="info-row"><span class="info-label">Tel No</span><span class="info-sep">:</span><span class="info-value">${data.contactPhone || ""}</span></div>
        </div>
      </div>
    </div>
  </div>
`;

export const generateDeliveryNotePDF = (data: DeliveryNoteData) => {
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Please allow popups for this site to generate PDFs");
    return;
  }

  const totalMass = data.items.reduce((sum, item) => sum + (item.totalMass || 0), 0);

  const deliveryNotePage = () => `
    <div class="delivery-note-page">
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
            <th>Balance Qty</th>
            <th>This Delivery</th>
            <th>Mass/Item (kg)</th>
            <th>Total Mass (kg)</th>
          </tr>
        </thead>
        <tbody>
          ${data.items.map((item, idx) => `
            <tr>
              <td>${idx + 1}</td>
              <td>${item.partNumber || "-"}</td>
              <td>${item.description || "-"}</td>
              <td>${item.balanceQuantity}</td>
              <td>${item.quantity}</td>
              <td>${formatMass(item.massPerItem)}</td>
              <td>${formatMass(item.totalMass)}</td>
            </tr>
          `).join("")}
          <tr class="total-row">
            <td colspan="6">Total Mass</td>
            <td>${formatMass(totalMass)}</td>
          </tr>
        </tbody>
      </table>

      ${data.remarks ? `<div class="remarks"><strong>Remarks:</strong> ${data.remarks}</div>` : ""}

      <div class="comments" style="margin-top: 16px; margin-bottom: 12px; padding: 10px; background: #f9f9f9; border-left: 3px solid #333; font-size: 12px;">
        <strong>COMMENTS</strong><br />
        Quotes exclude transport to and from site.<br />
        One month deposit is required upfront.<br />
        We do not accept cash payments.
      </div>

      <div class="delivery-terms">
        <h4>IMPORTANT</h4>
        <p>Please check that the equipment count agrees with the above. All errors are to be clearly noted. Failure to do this assumes acceptance of the documentation.</p>
        <ul>
          <li>The Hirer undertakes: to use the goods in accordance with the provisions of the Occupational Health and Safety Act No. 85 of 1993 as amended.</li>
          <li>The Hirer shall ensure: that all goods are used in accordance with Otno's instructions.</li>
          <li>The Hirer shall not use: any goods that are non-standard or unusual and will report their existence to the Owner.</li>
        </ul>
        <h4>Pricing</h4>
        <ul>
          <li>Dirty Equipment: Will be charged for at 2X the list hire price of the item.</li>
          <li>Damaged Equipment: Will be charged for at 4X the list hire price of the item.</li>
          <li>Lost Equipment: Will be charged for at the selling price of the item.</li>
        </ul>
      </div>

      <div class="signature-section">
        <div class="signature-box">
          <p><strong>Delivered By:</strong></p>
          <p>Name: ${data.deliveredBy || "_______________"}</p>
          <p>Signature: _______________</p>
          <p>Date: _______________</p>
        </div>
        <div class="signature-box">
          <p><strong>Received By:</strong></p>
          <p>Name: ${data.receivedBy || "_______________"}</p>
          <p>Signature: _______________</p>
          <p>Date: _______________</p>
        </div>
      </div>
    </div>
  `;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Hire Delivery Note - ${data.deliveryNoteNumber}</title>
      <style>
        ${STANDARD_REPORT_STYLES}
        .delivery-note-page { page-break-after: always; }
        .delivery-note-page:last-child { page-break-after: auto; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 14px; }
        .info-section { border: 1px solid #111827; border-radius: 8px; padding: 10px; }
        .info-section h3 { font-size: 15px; font-weight: 800; margin-bottom: 6px; }
        .delivery-terms { border: 1px solid #111827; border-radius: 8px; padding: 10px; margin: 8px 0 12px; }
        .delivery-terms ul { margin: 0; padding-left: 16px; }
        .delivery-terms li { margin-bottom: 5px; }
        .remarks { margin-bottom: 10px; padding: 10px; border: 1px solid #111827; border-radius: 8px; background: #f9fafb; }
      </style>
    </head>
    <body>
      ${deliveryNotePage()}
      ${deliveryNotePage()}
    </body>
    </html>
  `;

  printWindow.document.write(withPrintOption(html));
  printWindow.document.close();
};

export const generateHireLoadingNotePDF = (data: HireLoadingNoteData) => {
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Please allow popups for this site to generate PDFs");
    return;
  }

  const totalMass = data.items.reduce((sum, item) => sum + (item.totalMass || 0), 0);
  const noteTitle = data.noteTitle ?? "Hire Loading Report";

  const loadingNotePage = (copyLabel: string) => `
    <div class="loading-note-page">
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
            <th class="text-right">Mass/Item</th>
            <th class="text-right">Total Mass</th>
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

      <div class="section comments-section">
        <h3>Comments</h3>
        <p>Quote Excludes Transport To And From Site</p>
        <p>Four Weeks Hire Deposit Required Upfront</p>
      </div>

      <div class="post-total-grid">
        <div class="section transport-section">
          <h3>Transport Charges</h3>
          <div class="line-row"><span>Internal Vehicle Charges:</span><span class="line-fill">R</span></div>
          <div class="line-row"><span>External Vehicle Charges:</span><span class="line-fill">R</span></div>
        </div>

        <div class="section safety-section">
          <h3>Safety Verification</h3>
          <p>Vehicle safely loaded as per palletizing &amp; loading procedure.</p>
          <div class="line-row"><span>Checker:</span><span class="line-fill"></span></div>
          <div class="line-row"><span>Signature:</span><span class="line-fill"></span></div>
        </div>
      </div>

      <div class="section signing-section">
        <div class="signing-grid">
          <div class="line-row"><span>Checker's Name:</span><span class="line-fill"></span></div>
          <div class="line-row"><span>Signature:</span><span class="line-fill"></span></div>
          <div class="line-row"><span>Date:</span><span class="line-fill"></span></div>

          <div class="line-row"><span>Transporter's/Customer/Driver's Name:</span><span class="line-fill"></span></div>
          <div class="line-row"><span>Signature:</span><span class="line-fill"></span></div>
          <div class="line-row"><span>Date:</span><span class="line-fill"></span></div>

          <div class="line-row"><span>Customer Representative's Name:</span><span class="line-fill"></span></div>
          <div class="line-row"><span>Signature:</span><span class="line-fill"></span></div>
          <div class="line-row"><span>Date:</span><span class="line-fill"></span></div>
        </div>
      </div>

      <div class="section transporter-section">
        <div class="line-row"><span>Vehicle Registration Number:</span><span class="line-fill"></span></div>
        <div class="line-row"><span>Name of Transporter/Customer:</span><span class="line-fill"></span></div>
        <div class="line-row split-row">
          <span>Time Arrive:</span><span class="line-fill"></span>
          <span>Time Depart:</span><span class="line-fill"></span>
        </div>
      </div>

      <div class="section terms-section">
        <p><strong>Please check that the equipment count agrees with the above. All errors are to be clearly noted. Failure to do this assumes acceptance of the documentation.</strong></p>
        <p>* The Hirer undertakes to use the goods in accordance with the provisions of the Occupational Health and Safety Act No. 85 of 1993 as amended.</p>
        <p>* The Hirer shall approach the Owner for any advice or assistance in the event of inability to comply with the above.</p>
        <p>* The Hirer shall not use any goods that are non-standard or unusual and will report their existence to the Owner.</p>
        <p><strong>Charges:</strong></p>
        <p>* Dirty Equipment will be charged for at 2X the list hire price of the item.</p>
        <p>* Damaged Equipment will be charged for at 4X the list hire price of the item.</p>
        <p>* Lost Equipment will be charged for at the selling price of the item.</p>
      </div>
    </div>
  `;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Hire Loading Report - ${data.quotationNumber}</title>
      <style>
        ${STANDARD_REPORT_STYLES}
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
        .info-section { border: 1px solid #111827; padding: 10px; border-radius: 8px; }
        .info-section h3 { font-size: 13px; color: #111827; margin-bottom: 8px; }
        .section { border: 1px solid #111827; border-radius: 8px; padding: 10px; margin-bottom: 16px; }
        .section h3 { font-size: 13px; color: #111827; margin-bottom: 8px; }
        .section p { margin-bottom: 4px; }
        .comments-section { margin-bottom: 12px; }
        .post-total-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px; }
        .line-row { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
        .line-fill { flex: 1; border-bottom: 1px solid #555; min-height: 14px; display: inline-block; }
        .signing-section { margin-bottom: 12px; }
        .signing-grid { display: grid; grid-template-columns: 1.5fr 1fr 1fr; gap: 8px 12px; }
        .transporter-section { margin-bottom: 12px; }
        .split-row { gap: 8px; }
        .split-row > span:nth-child(3) { margin-left: 12px; }
        .terms-section { font-size: 11px; line-height: 1.35; }
        .loading-note-page { page-break-after: always; }
        .loading-note-page:last-child { page-break-after: auto; }
      </style>
    </head>
    <body>
      ${loadingNotePage("Company Copy")}
      ${loadingNotePage("Client Copy")}
    </body>
    </html>
  `;

  printWindow.document.write(withPrintOption(html));
  printWindow.document.close();
};

export const generateYardVerificationNotePDF = (data: DeliveryNoteData) => {
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Please allow popups for this site to generate PDFs");
    return;
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Yard Verification Report - ${data.deliveryNoteNumber}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; padding: 20px; font-size: 12px; }
        .yard-note h1 { text-align: center; font-size: 18px; margin-bottom: 10px; letter-spacing: 0.8px; text-transform: uppercase; }
        .yard-note .title-block { text-align: center; }
        .yard-note .title-block h1 { text-align: center; font-size: 14px; }
        .yard-note .title-block p { text-align: center; }
        .yard-note-table { width: 100%; border-collapse: collapse; font-size: 11px; }
        .yard-note-table th, .yard-note-table td { border: 1px solid #333; padding: 6px; }
        .yard-note-table th { background: #f5f5f5; text-align: center; }
        .yard-note-table .label { width: 20%; font-weight: bold; }
        .yard-note-table .value { width: 30%; }
        .yard-note-table .small { width: 12%; }
        .yard-note-table .notes { height: 28px; }
        .yard-note-footer { margin-top: 10px; }
        .yard-note-footer .row { display: flex; gap: 16px; margin-bottom: 6px; }
        .yard-note-footer .field { flex: 1; border: 1px solid #333; padding: 6px; min-height: 28px; }
        .yard-note-header { display: flex; flex-direction: column; align-items: center; gap: 6px; margin-bottom: 10px; }
        .yard-note-header .brand-logo { width: 56px; height: auto; }
        .yard-note-info-table td { height: 28px; }
        .yard-note-info-table .label { font-weight: bold; }
        @media print { body { padding: 0; } }
      </style>
    </head>
    <body>
      <div class="yard-note">
        <div class="yard-note-header">
          <img src="${window.location.origin}/otnologo-removebg-preview.png" alt="OTNO Logo" class="brand-logo" />
          <h1>Yard Verification Report</h1>
        </div>
        <table class="yard-note-table yard-note-info-table">
          <tr>
            <td class="label">Customer/Branch Name:</td>
            <td class="value">&nbsp;</td>
            <td class="label">ID no:</td>
            <td class="value">&nbsp;</td>
          </tr>
          <tr>
            <td class="label">Client ID:</td>
            <td class="value">&nbsp;</td>
            <td class="label">Site ID:</td>
            <td class="value">&nbsp;</td>
          </tr>
          <tr>
            <td class="label">Site:</td>
            <td class="value">&nbsp;</td>
            <td class="label">Date:</td>
            <td class="value">&nbsp;</td>
          </tr>
          <tr>
            <td class="label">Vehicle Reg:</td>
            <td class="value">&nbsp;</td>
            <td class="label">Created By:</td>
            <td class="value">&nbsp;</td>
          </tr>
          <tr>
            <td class="label">Branch:</td>
            <td class="value">&nbsp;</td>
            <td class="label"></td>
            <td class="value"></td>
          </tr>
          <tr>
            <td class="label">Customer Return (Yes/No):</td>
            <td class="value">&nbsp;</td>
            <td class="label">OTNO Return (Yes/No):</td>
            <td class="value">&nbsp;</td>
          </tr>
          <tr>
            <td class="label">Request for collection:</td>
            <td class="value" colspan="3">&nbsp;</td>
          </tr>
        </table>

        <table class="yard-note-table" style="margin-top: 10px;">
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
              <td class="notes">&nbsp;</td>
              <td class="notes">&nbsp;</td>
              <td class="notes">&nbsp;</td>
              <td class="notes">&nbsp;</td>
              <td class="notes">&nbsp;</td>
              <td class="notes">&nbsp;</td>
              <td class="notes">&nbsp;</td>
              <td class="notes">&nbsp;</td>
            </tr>
          `).join("")}
        </table>

        <div class="yard-note-footer">
          <div class="row">
            <div class="field"><strong>Gate Pass no:</strong></div>
            <div class="field"><strong>Customer site return slip no:</strong></div>
          </div>
          <div class="row">
            <div class="field"><strong>Checker name:</strong></div>
            <div class="field"><strong>Checker Signature:</strong></div>
          </div>
          <div class="row">
            <div class="field"><strong>Discrepancies reported to office staff (name and signature):</strong></div>
          </div>
          <div class="row">
            <div class="field"><strong>Discrepancies resolved with customer by (name and signature):</strong></div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  printWindow.document.write(withPrintOption(html));
  printWindow.document.close();
};

export const generateHireQuotationReportPDF = (data: HireQuotationReportData) => {
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Please allow popups for this site to generate PDFs");
    return;
  }

  const subtotal = data.items.reduce((sum, item) => {
    const discountAmount = item.weeklyRate * item.quantity * (item.discountRate / 100);
    return sum + (item.weeklyRate * item.quantity - discountAmount);
  }, 0);
  const totalQuantity = data.items.reduce((sum, item) => sum + item.quantity, 0);
  const totalMass = data.items.reduce((sum, item) => sum + (item.massPerItem || 0) * item.quantity, 0);
  const vatRate = 0.16;
  const vatAmount = subtotal * vatRate;
  const totalBeforeDiscount = subtotal + vatAmount;
  const discountAmount = totalBeforeDiscount * (data.discountRate / 100);
  const totalAfterDiscount = totalBeforeDiscount - discountAmount;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Hire Quotation - ${data.quotationNumber}</title>
      <style>
        ${STANDARD_REPORT_STYLES}
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
        .info-section { border: 1px solid #111827; padding: 10px; border-radius: 8px; }
        .info-section h3 { font-size: 13px; color: #111827; margin-bottom: 8px; }
        .terms { margin-top: 16px; padding: 10px; background: #f9f9f9; border-left: 3px solid #333; font-size: 11px; }
      </style>
    </head>
    <body>
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

      <div style="margin-bottom: 16px; font-size: 12px; line-height: 1.5;">
        <strong>Dear: ${data.companyName || data.contactName || "Valued Customer"}</strong><br />
        We thank you for your valued enquiry and are pleased to submit our relevant quotation based on the terms detailed below.<br />
        This Quote is valid for a period of 30 DAYS and is subject to confirmation thereafter.
      </div>

      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Part Number</th>
            <th>Description</th>
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
            return `
              <tr>
                <td>${idx + 1}</td>
                <td>${item.partNumber || "-"}</td>
                <td>${item.description || "-"}</td>
                <td class="text-right">${item.quantity}</td>
                <td class="text-right">${formatMass(item.massPerItem)}</td>
                <td class="text-right">${formatCurrency(discountedRate)}</td>
                <td class="text-right">${formatCurrency(discountedTotal)}</td>
              </tr>
            `;
          }).join("")}
          <tr class="total-row">
            <td colspan="3"><strong>SUBTOTAL</strong></td>
            <td class="text-right"><strong>${totalQuantity}</strong></td>
            <td class="text-right"><strong>${formatMass(totalMass)}</strong></td>
            <td class="text-right">-</td>
            <td class="text-right"><strong>${formatCurrency(subtotal)}</strong></td>
          </tr>
          <tr class="total-row">
            <td colspan="6"><strong>VAT (16%)</strong></td>
            <td class="text-right"><strong>${formatCurrency(vatAmount)}</strong></td>
          </tr>
          ${data.discountRate > 0 ? `
            <tr class="total-row">
              <td colspan="6"><strong>Discount (${data.discountRate}%)</strong></td>
              <td class="text-right"><strong>-${formatCurrency(discountAmount)}</strong></td>
            </tr>
          ` : ""}
          <tr class="total-row" style="background: #333; color: white;">
            <td colspan="6"><strong>TOTAL (incl. VAT)</strong></td>
            <td class="text-right"><strong>${formatCurrency(totalAfterDiscount)}</strong></td>
          </tr>
        </tbody>
      </table>

      <div class="comments" style="margin-top: 16px; margin-bottom: 12px; padding: 10px; background: #f9f9f9; border-left: 3px solid #333; font-size: 12px;">
        <strong>COMMENTS</strong><br />
        ${(data.comments || "Quotes exclude transport to and from site.\nOne month deposit is required upfront.\nWe do not accept cash payments.").split("\n").join("<br />")}
      </div>

      <div class="terms">
        <strong>TERMS:</strong><br />
        Order confirmation is through deposit payment before collection.<br />
        One month deposit is required upfront.<br />
        Items not currently available in our yard will not be billed.<br />
        We do not accept cash payments.<br />
        <strong>Note:</strong><br />
        All transactions are subject to our Standard Terms of Trade.<br />
        By accepting this quotation, you agree to be bound by all the terms and conditions outlined in our
        Scaffold Hire Contract.<br />
        We thank you for affording us the opportunity to quote. Please sign below for acceptance.<br />
        <strong>Payment Details:</strong><br />
        Account Name: OTNO ACCESS SOLUTIONS LIMITED<br />
        KES Account Number: 02107773676350<br />
        Bank Name: I&amp;M BANK LIMITED<br />
        Branch Name: Changamwe<br />
        Bank Code: 57, Branch code: 021<br />
        Swift code: IMBLKENA<br />
        Mpesa paybill code: 542542
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 40px;">
        <div style="border-top: 1px solid #333; padding-top: 10px;">
          <p style="margin-bottom: 5px;"><strong>For ${COMPANY_NAME}:</strong></p>
          <p style="margin-bottom: 20px;">Name: ___________________________</p>
          <p style="margin-bottom: 20px;">Signature: ___________________________</p>
          <p>Date: ___________________________</p>
        </div>
        <div style="border-top: 1px solid #333; padding-top: 10px;">
          <p style="margin-bottom: 5px;"><strong>For Client:</strong></p>
          <p style="margin-bottom: 20px;">Name: ___________________________</p>
          <p style="margin-bottom: 20px;">Signature: ___________________________</p>
          <p>Date: ___________________________</p>
        </div>
      </div>
      <div style="text-align: right; font-size: 9px; color: #999; margin-top: 20px;">Print date: ${formatTimestamp()}</div>
    </body>
    </html>
  `;

  printWindow.document.write(withPrintOption(html));
  printWindow.document.close();
};

export const generateQuotationPDF = (data: QuotationCalculationData) => {
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Please allow popups for this site to generate PDFs");
    return;
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Hire Quotation - ${data.quotationNumber}</title>
      <style>
        ${STANDARD_REPORT_STYLES}
        .info-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 20px; margin-bottom: 20px; }
        .info-section { border: 1px solid #111827; border-radius: 8px; padding: 10px; }
        .info-section h3 { font-size: 14px; color: #111827; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; margin-bottom: 10px; }
        .grand-total { font-size: 14px; background: #333; color: white; }
        .summary-box { background: #f5f5f5; padding: 15px; margin-bottom: 20px; }
        .summary-row { display: flex; justify-content: space-between; margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px solid #ddd; }
        .summary-row:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
        .summary-row.grand { font-size: 16px; font-weight: bold; background: #333; color: white; margin: -15px; margin-top: 10px; padding: 15px; }
        .terms { margin-top: 20px; padding: 10px; background: #f9f9f9; border-left: 3px solid #333; font-size: 11px; }
      </style>
    </head>
    <body>
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

      <div style="margin-bottom: 16px; font-size: 12px; line-height: 1.5;">
        <strong>Dear: ${data.companyName || data.contactName || "Valued Customer"}</strong><br />
        We thank you for your valued enquiry and are pleased to submit our relevant quotation based on the terms detailed below.<br />
        This Quote is valid for a period of 30 DAYS and is subject to confirmation thereafter.
      </div>

      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Part Number</th>
            <th>Description</th>
            <th class="text-right">Qty</th>
            <th class="text-right">Weekly Rate</th>
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
        <div class="summary-row">
          <span>Number of Weeks</span>
          <span>× ${data.hireWeeks}</span>
        </div>
        <div class="summary-row">
          <span>Total for Hire Period</span>
          <span>${formatCurrency(data.totalForPeriod)}</span>
        </div>
        <div class="summary-row">
          <span>VAT (${data.vatRate}%)</span>
          <span>${formatCurrency(data.vatAmount)}</span>
        </div>
        ${data.discountRate > 0 ? `
          <div class="summary-row">
            <span>Discount (${data.discountRate}%)</span>
            <span>-${formatCurrency(data.discountAmount)}</span>
          </div>
        ` : ""}
        <div class="summary-row grand">
          <span>GRAND TOTAL (incl. VAT)</span>
          <span>${formatCurrency(data.grandTotal)}</span>
        </div>
        <div class="summary-row grand">
          <span>PAYMENT TOTAL</span>
          <span>${formatCurrency(data.paymentTotal)}</span>
        </div>
      </div>

      <div class="terms">
        <strong>TERMS:</strong><br />
        Quote does not include transport to and from site.<br />
        Order confirmation is through deposit payment before collection.<br />
        One month deposit is required upfront.<br />
        Items not currently available in our yard will not be billed.<br />
        We do not accept cash payments.<br />
        <strong>Note:</strong><br />
        All transactions are subject to our Standard Terms of Trade.<br />
        By accepting this quotation, you agree to be bound by all the terms and conditions outlined in our
        Scaffold Hire Contract.<br />
        We thank you for affording us the opportunity to quote. Please sign below for acceptance.<br />
        <strong>Payment Details:</strong><br />
        Account Name: OTNO ACCESS SOLUTIONS LIMITED<br />
        KES Account Number: 02107773676350<br />
        Bank Name: I&amp;M BANK LIMITED<br />
        Branch Name: Changamwe<br />
        Bank Code: 57, Branch code: 021<br />
        Swift code: IMBLKENA<br />
        Mpesa paybill code: 542542
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 40px;">
        <div style="border-top: 1px solid #333; padding-top: 10px;">
          <p style="margin-bottom: 5px;"><strong>For ${COMPANY_NAME}:</strong></p>
          <p style="margin-bottom: 20px;">Name: ___________________________</p>
          <p style="margin-bottom: 20px;">Signature: ___________________________</p>
          <p>Date: ___________________________</p>
        </div>
        <div style="border-top: 1px solid #333; padding-top: 10px;">
          <p style="margin-bottom: 5px;"><strong>For Client:</strong></p>
          <p style="margin-bottom: 20px;">Name: ___________________________</p>
          <p style="margin-bottom: 20px;">Signature: ___________________________</p>
          <p>Date: ___________________________</p>
        </div>
      </div>
      <div style="text-align: right; font-size: 9px; color: #999; margin-top: 20px;">Print date: ${formatTimestamp()}</div>
    </body>
    </html>
  `;

  printWindow.document.write(withPrintOption(html));
  printWindow.document.close();
};

export const generateHireReturnNotePDF = (data: HireReturnNoteData) => {
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Please allow popups for this site to generate PDFs");
    return;
  }

  const totalReturned = data.items.reduce((sum, item) => sum + item.totalReturned, 0);
  const totalMass = data.items.reduce((sum, item) => sum + (item.totalMass || 0), 0);

  // ---- Page 1: Manual-style Hire Return Slip ----
  const gatePassItemRows = Array.from({ length: 20 }, () =>
    "<tr>" +
    '<td class="gp-empty-row"></td>' +
    '<td class="text-center gp-empty-row"></td>' +
    '<td class="text-center gp-empty-row"></td>' +
    '<td class="text-center gp-empty-row"></td>' +
    '<td class="text-center gp-empty-row"></td>' +
    '<td class="text-center gp-empty-row"></td>' +
    '<td class="text-center gp-empty-row"></td>' +
    "</tr>"
  ).join("");

  const gatePassPage = (copyLabel: string) => `
    <div class="page gate-pass-page pink-sheet">
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

      <table class="gp-table">
        <thead>
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
        <tbody>
          ${gatePassItemRows}
        </tbody>
      </table>

      <div class="gp-customer-section">
        <div class="gp-transport-grid">
          <div class="gp-row"><span class="gp-label">Size of Vehicle</span><span class="gp-val-line"></span></div>
          <div class="gp-row"><span class="gp-label">Vehicle Reg. No</span><span class="gp-val-line"></span></div>
          <div class="gp-row"><span class="gp-label">Time In</span><span class="gp-val-line"></span></div>
          <div class="gp-row"><span class="gp-label">Time Out</span><span class="gp-val-line"></span></div>
        </div>

        <div class="gp-sig-grid">
          <div class="gp-sig-box">
            <p><strong>OTNOS Checker</strong></p>
            <p>Name: _______________</p>
            <p>Signature: _______________</p>
          </div>
          <div class="gp-sig-box">
            <p><strong>Customer / Driver</strong></p>
            <p>Name: _______________</p>
            <p>Signature: _______________</p>
          </div>
        </div>

        <div class="gp-balance-row">
          <span>Balance still on site: <strong>Yes / No</strong></span>
          <span style="margin-left:30px;">Is site clear: <strong>Yes / No</strong></span>
          <span style="margin-left:30px;">Collect again: <strong>Yes / No</strong></span>
        </div>
        <div class="gp-row" style="margin-top:6px;"><span class="gp-label">Collection Date</span><span class="gp-val-line"></span></div>
      </div>

      <div class="gp-footer">
        <p>${COMPANY_NAME} &bull; ${COMPANY_LOCATION}</p>
        <p style="font-size:9px; margin-top:4px;">All transactions are subject to our terms of trade.</p>
      </div>
    </div>
  `;

  // ---- Page 2: Return Note ----
  const systemItemRows = data.items.map((item) =>
    "<tr>" +
    "<td>" + (item.partNumber || "-") + "</td>" +
    "<td>" + (item.description || "-") + "</td>" +
    '<td class="text-right">' + (item.totalDelivered - item.totalReturned + item.balanceAfter) + "</td>" +
    '<td class="text-right">' + item.good + "</td>" +
    '<td class="text-right">' + item.dirty + "</td>" +
    '<td class="text-right">' + item.damaged + "</td>" +
    '<td class="text-right">' + item.scrap + "</td>" +
    '<td class="text-right">' + item.totalReturned + "</td>" +
    '<td class="text-right">' + item.balanceAfter + "</td>" +
    "</tr>"
  ).join("");

  const systemPage = (copyLabel: string) => `
    <div class="page system-page">
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

      <h3 class="section-title">Equipment Details</h3>
      <table>
        <thead>
          <tr>
            <th>Part Number</th>
            <th>Description</th>
            <th class="text-right">On Site</th>
            <th class="text-right">Good</th>
            <th class="text-right">Dirty</th>
            <th class="text-right">Damaged</th>
            <th class="text-right">Scrap</th>
            <th class="text-right">This Return</th>
            <th class="text-right">Balance</th>
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

      <div class="sys-safety">
        <h4>SAFETY VERIFICATION</h4>
        <div class="sys-site-grid">
          <div>
            <p>Vehicle safety loaded as per palletizing &amp; loading procedure</p>
            <div class="sys-row"><span class="sys-label">Checker:</span><span>${data.receivedBy || "_______________"}</span></div>
            <div class="sys-row"><span class="sys-label">Signature:</span><span>_______________</span></div>
          </div>
          <div>
            <p><strong>Transport Charges</strong></p>
            <div class="sys-row"><span class="sys-label">Internal Vehicle:</span><span>_______________</span></div>
            <div class="sys-row"><span class="sys-label">External Vehicle:</span><span>_______________</span></div>
          </div>
        </div>
      </div>

      <div class="sys-signatures">
        <div class="sig-block">
          <p><strong>OTNO Representative</strong></p>
          <p>Name: ${data.receivedBy || "_______________"}</p>
          <p>Signature: _______________ &nbsp; Date: _______________</p>
        </div>
        <div class="sig-block">
          <p><strong>Vehicle Reg No:</strong> ${data.vehicleNo || "_______________"}</p>
          <p><strong>Transporter / Customer / Driver</strong></p>
          <p>Name: ${data.returnedBy || "_______________"}</p>
          <p>Signature: _______________ &nbsp; Date: _______________</p>
        </div>
        <div class="sig-block">
          <p><strong>Customer Representative</strong></p>
          <p>Name: _______________</p>
          <p>Signature: _______________ &nbsp; Date: _______________</p>
        </div>
      </div>

      <div class="sys-row" style="margin-top:8px;">
        <span class="sys-label">Time Arrive:</span><span>_______________</span>
        <span class="sys-label" style="margin-left:30px;">Time Depart:</span><span>_______________</span>
      </div>

      <p style="margin-top:10px; font-size:11px;">Please check that the equipment count agrees with the above. Hire charges after the quantities returned as above will cease on <strong>${data.returnDate}</strong>.</p>
      <p style="font-size:11px;">All errors are to be clearly noted. Failure to do this assumes acceptance of the documentation.</p>

      <div class="sys-charges">
        <h4>Charges:</h4>
        <ul>
          <li><strong>Dirty Equipment:</strong> Will be charged at 2× the list hire price of the item.</li>
          <li><strong>Damaged Equipment:</strong> Will be charged at 4× the list hire price of the item.</li>
          <li><strong>Lost / Scrap Equipment:</strong> Will be charged at the selling price of the item.</li>
        </ul>
      </div>

      ${data.remarks ? '<div class="remarks"><strong>Remarks:</strong> ' + data.remarks + "</div>" : ""}

      <div class="sys-footer">
        <div class="sys-row"><span class="sys-label">Processed By:</span><span>${data.createdBy || "-"}</span></div>
        <div class="sys-row"><span class="sys-label">Processed Date:</span><span>${formatTimestamp()}</span></div>
      </div>
    </div>
  `;

  const styles = `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; padding: 16px; font-size: 11px; color: #222; }
    .page { page-break-after: always; }
    .page:last-child { page-break-after: auto; }
    @media print { body { padding: 0; } }

    ${STANDARD_REPORT_HEADER_STYLES}

    /* ---- Gate Pass Styles ---- */
    .pink-sheet { background: #f8cddd; border: 1px solid #c58ea3; padding: 14px; }
    .gp-top-meta { display: flex; justify-content: flex-end; gap: 8px; margin-bottom: 8px; }
    .gp-meta-box { border: 1px dashed #666; padding: 4px 8px; font-size: 10px; background: #fce4ee; }
    .gp-header { display: flex; align-items: center; border-bottom: 2px solid #111; padding-bottom: 10px; margin-bottom: 12px; }
    .gp-logo { width: 90px; height: auto; margin-right: 16px; }
    .gp-header-right h1 { font-size: 22px; margin: 0; text-transform: uppercase; }
    .gp-header-right h2 { font-size: 16px; margin: 0; color: #444; }
    .gp-header-doc { margin-left: auto; text-align: right; font-size: 10px; }
    .gp-info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 12px; }
    .gp-info-left, .gp-info-right { border: 1px solid #8a5a6b; padding: 8px; border-radius: 4px; background: #f9dce8; }
    .gp-row { display: flex; margin-bottom: 4px; align-items: baseline; }
    .gp-label { font-weight: bold; width: 130px; font-size: 11px; }
    .gp-val { flex: 1; }
    .gp-val-line { flex: 1; border-bottom: 1px solid #999; min-height: 14px; }
    .gp-table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
    .gp-table th, .gp-table td { border: 1px solid #8a5a6b; padding: 6px 8px; }
    .gp-table th { background: #f3b9cf; font-size: 11px; text-transform: uppercase; }
    .gp-empty-row { height: 24px; }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .total-row { font-weight: bold; background: #f3b9cf; }
    .gp-customer-section { border: 1px solid #8a5a6b; padding: 10px; border-radius: 4px; margin-bottom: 12px; background: #f9dce8; }
    .gp-transport-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-bottom: 10px; }
    .gp-sig-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 10px; }
    .gp-sig-box p { margin-bottom: 4px; }
    .gp-balance-row { font-size: 11px; padding: 4px 0; border-top: 1px solid #8a5a6b; }
    .gp-footer { text-align: center; font-size: 10px; color: #333; border-top: 1px solid #8a5a6b; padding-top: 8px; margin-top: 10px; }

    /* ---- Return Note Page Styles ---- */
    .sys-header { display: flex; align-items: center; border-bottom: 3px solid #111; padding-bottom: 10px; margin-bottom: 12px; }
    .sys-logo { width: 90px; height: auto; margin-right: 16px; }
    .sys-header-center { flex: 1; }
    .sys-header-center h1 { font-size: 22px; margin-bottom: 2px; }
    .copy-label { font-weight: bold; color: #555; font-size: 12px; }
    .sys-details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 12px; }
    .sys-detail-box { border: 1px solid #bbb; padding: 8px; border-radius: 4px; }
    .sys-detail-box h3 { font-size: 12px; text-transform: uppercase; border-bottom: 1px solid #ddd; padding-bottom: 4px; margin-bottom: 6px; }
    .sys-row { display: flex; margin-bottom: 3px; align-items: baseline; font-size: 11px; }
    .sys-label { font-weight: bold; width: 120px; color: #444; }
    .sys-site-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .section-title { font-size: 13px; text-transform: uppercase; margin-bottom: 6px; border-bottom: 1px solid #ddd; padding-bottom: 4px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
    th, td { border: 1px solid #bbb; padding: 5px 6px; font-size: 11px; }
    th { background: #e8e8e8; font-weight: bold; }
    .sys-safety { border: 1px solid #bbb; padding: 8px; border-radius: 4px; margin-bottom: 12px; }
    .sys-safety h4 { font-size: 12px; text-transform: uppercase; margin-bottom: 6px; }
    .sys-safety p { margin-bottom: 4px; }
    .sys-signatures { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-top: 12px; }
    .sig-block { border-top: 2px solid #333; padding-top: 8px; }
    .sig-block p { margin-bottom: 4px; }
    .sys-charges { border: 1px solid #333; border-radius: 4px; padding: 8px; margin-top: 10px; background: #fcfcfc; }
    .sys-charges h4 { margin-bottom: 6px; font-size: 12px; }
    .sys-charges ul { padding-left: 16px; margin: 0; }
    .sys-charges li { margin-bottom: 4px; line-height: 1.4; }
    .remarks { margin-top: 10px; padding: 8px; background: #f9f9f9; border-left: 3px solid #333; }
    .sys-footer { margin-top: 12px; border-top: 1px solid #ccc; padding-top: 6px; }
  `;

  const html =
    "<!DOCTYPE html><html><head>" +
    "<title>Hire Return Note - " + data.returnNoteNumber + "</title>" +
    "<style>" + styles + "</style>" +
    "</head><body>" +
    gatePassPage("Company Copy") +
    systemPage("Company Copy") +
    gatePassPage("Client Copy") +
    systemPage("Client Copy") +
    "</body></html>";

  printWindow.document.write(withPrintOption(html));
  printWindow.document.close();
};
