// PDF Generation utilities using browser print

export interface DeliveryNoteData {
  quotationNumber: string;
  deliveryNoteNumber: string;
  dateCreated: string;
  deliveryDate: string;
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

export const generateDeliveryNotePDF = (data: DeliveryNoteData) => {
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Please allow popups for this site to generate PDFs");
    return;
  }

  const totalMass = data.items.reduce((sum, item) => sum + (item.totalMass || 0), 0);

  const deliveryNotePage = () => `
    <div class="delivery-note-page">
      <div class="header">
        <img src="${window.location.origin}/otn-logo.png" alt="OTN Logo" class="header-logo" />
        <div class="header-content">
          <h1>${COMPANY_NAME}</h1>
          <p>Email: otnoacess@gmail.com</p>
          <p>${COMPANY_ADDRESS}</p>
          <p>${COMPANY_LOCATION}</p>
          <p><strong>PIN: ${COMPANY_PIN}</strong></p>
          <p><strong>Hire Delivery Note</strong></p>
        </div>
      </div>
      
      <div class="info-grid">
        <div class="info-section">
          <h3>Delivery Information</h3>
          <div class="info-row"><span class="info-label">Delivery Note No:</span><span class="info-value">${data.deliveryNoteNumber}</span></div>
          <div class="info-row"><span class="info-label">Quotation No:</span><span class="info-value">${data.quotationNumber}</span></div>
          <div class="info-row"><span class="info-label">Client ID:</span><span class="info-value">${data.clientId || "-"}</span></div>
          <div class="info-row"><span class="info-label">Site ID:</span><span class="info-value">${data.siteId || "-"}</span></div>
          <div class="info-row"><span class="info-label">Delivery Date:</span><span class="info-value">${data.deliveryDate}</span></div>
          <div class="info-row"><span class="info-label">Vehicle No:</span><span class="info-value">${data.vehicleNo || "-"}</span></div>
          <div class="info-row"><span class="info-label">Delivered By:</span><span class="info-value">${data.deliveredBy || "-"}</span></div>
          <div class="info-row"><span class="info-label">Created By:</span><span class="info-value">${data.createdBy || "-"}</span></div>
          <div class="info-row"><span class="info-label">Printed:</span><span class="info-value">${formatTimestamp()}</span></div>
        </div>
        <div class="info-section">
          <h3>Client Details</h3>
          <div class="info-row"><span class="info-label">Company:</span><span class="info-value">${data.companyName}</span></div>
          <div class="info-row"><span class="info-label">Site:</span><span class="info-value">${data.siteName}</span></div>
          <div class="info-row"><span class="info-label">Address:</span><span class="info-value">${data.siteAddress || "-"}</span></div>
          <div class="info-row"><span class="info-label">Contact:</span><span class="info-value">${data.contactName}</span></div>
          <div class="info-row"><span class="info-label">Phone:</span><span class="info-value">${data.contactPhone}</span></div>
        </div>
      </div>

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
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; padding: 20px; font-size: 12px; }
        .header { display: flex; align-items: flex-start; margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 10px; }
        .header-logo { width: 100px; height: auto; margin-right: 20px; }
        .header-content { flex: 1; }
        .header-content h1 { font-size: 24px; margin-bottom: 5px; }
        .header-content p { color: #666; }
        .info-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 20px; }
        .info-section h3 { font-size: 14px; color: #333; border-bottom: 1px solid #ddd; padding-bottom: 5px; margin-bottom: 10px; }
        .info-row { display: flex; margin-bottom: 5px; }
        .info-label { font-weight: bold; width: 120px; color: #555; }
        .info-value { flex: 1; }
        .section { border: 1px solid #ddd; border-radius: 6px; padding: 10px; margin-bottom: 20px; }
        .section h3 { font-size: 14px; color: #333; border-bottom: 1px solid #ddd; padding-bottom: 5px; margin-bottom: 10px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background: #f5f5f5; font-weight: bold; }
        .total-row { font-weight: bold; background: #f9f9f9; }
        .delivery-terms {
          border: 1px solid #333;
          border-radius: 6px;
          padding: 10px;
          margin-top: 12px;
          margin-bottom: 20px;
          background: #fcfcfc;
        }
        .delivery-terms p {
          margin-bottom: 8px;
          line-height: 1.4;
        }
        .delivery-terms h4 {
          margin-bottom: 8px;
          font-size: 13px;
          text-transform: uppercase;
        }
        .delivery-terms ul {
          margin: 0;
          padding-left: 16px;
          margin-bottom: 10px;
        }
        .delivery-terms li {
          margin-bottom: 6px;
          line-height: 1.4;
        }
        .signature-section { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 40px; }
        .signature-box { border-top: 1px solid #333; padding-top: 10px; }
        .signature-box p { margin-bottom: 5px; }
        .remarks { margin-top: 20px; padding: 10px; background: #f9f9f9; border-left: 3px solid #333; }
        .delivery-note-page { page-break-after: always; }
        .delivery-note-page:last-child { page-break-after: auto; }
        @media print { body { padding: 0; } }
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
  const noteTitle = data.noteTitle ?? "Hire Loading Note";

  const loadingNotePage = (copyLabel: string) => `
    <div class="loading-note-page">
      <div class="header">
        <img src="${window.location.origin}/otn-logo.png" alt="OTN Logo" class="header-logo" />
        <div class="header-content">
          <h1>${COMPANY_NAME}</h1>
          <p>Email: otnoacess@gmail.com</p>
          <p>${COMPANY_ADDRESS}</p>
          <p>${COMPANY_LOCATION}</p>
          <p><strong>PIN: ${COMPANY_PIN}</strong></p>
          <p><strong>${noteTitle}</strong></p>
          <p class="copy-label">${copyLabel}</p>
        </div>
      </div>

      <div class="info-grid">
        <div class="info-section">
          <h3>Client Details</h3>
          <div class="info-row"><span class="info-label">Company:</span><span class="info-value">${data.companyName}</span></div>
          <div class="info-row"><span class="info-label">Contact:</span><span class="info-value">${data.contactName}</span></div>
          <div class="info-row"><span class="info-label">Phone:</span><span class="info-value">${data.contactPhone}</span></div>
          <div class="info-row"><span class="info-label">Site Name:</span><span class="info-value">${data.siteName}</span></div>
          <div class="info-row"><span class="info-label">Site Location:</span><span class="info-value">${data.siteLocation || "-"}</span></div>
          <div class="info-row"><span class="info-label">Site Address:</span><span class="info-value">${data.siteAddress || "-"}</span></div>
        </div>
        <div class="info-section">
          <h3>OTNO Access Details</h3>
          <div class="info-row"><span class="info-label">Quotation No:</span><span class="info-value">${data.quotationNumber}</span></div>
          <div class="info-row"><span class="info-label">Client ID:</span><span class="info-value">${data.clientId || "-"}</span></div>
          <div class="info-row"><span class="info-label">Site ID:</span><span class="info-value">${data.siteId || "-"}</span></div>
          <div class="info-row"><span class="info-label">Date Created:</span><span class="info-value">${data.dateCreated}</span></div>
          <div class="info-row"><span class="info-label">Created By:</span><span class="info-value">${data.createdBy || "-"}</span></div>
          <div class="info-row"><span class="info-label">Printed:</span><span class="info-value">${formatTimestamp()}</span></div>
        </div>
      </div>

      <div class="section">
        <h3>Loading Details</h3>
        <div class="info-row"><span class="info-label">Loaded By:</span><span class="info-value">____________________</span></div>
        <div class="info-row"><span class="info-label">Checked By:</span><span class="info-value">____________________</span></div>
        <div class="info-row"><span class="info-label">Date:</span><span class="info-value">____________________</span></div>
        <div class="info-row"><span class="info-label">Time:</span><span class="info-value">____________________</span></div>
      </div>

      <div class="section">
        <h3>Ground Verification (To be completed on site)</h3>
        <div class="info-row"><span class="info-label">Received By:</span><span class="info-value">____________________</span></div>
        <div class="info-row"><span class="info-label">Site Time In:</span><span class="info-value">____________________</span></div>
        <div class="info-row"><span class="info-label">Site Time Out:</span><span class="info-value">____________________</span></div>
        <div class="info-row"><span class="info-label">Remarks:</span><span class="info-value">________________________________________________</span></div>
      </div>

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
    </div>
  `;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Hire Loading Note - ${data.quotationNumber}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; padding: 20px; font-size: 12px; }
        .header { display: flex; align-items: flex-start; margin-bottom: 16px; border-bottom: 2px solid #333; padding-bottom: 10px; }
        .header-logo { width: 100px; height: auto; margin-right: 20px; }
        .header-content { flex: 1; }
        .header-content h1 { font-size: 24px; margin-bottom: 5px; }
        .header-content p { color: #666; }
        .copy-label { font-weight: bold; color: #111; margin-top: 4px; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
        .info-section { border: 1px solid #ddd; padding: 10px; border-radius: 6px; }
        .info-section h3 { font-size: 13px; color: #333; margin-bottom: 8px; }
        .info-row { display: flex; margin-bottom: 5px; }
        .info-label { font-weight: bold; width: 140px; color: #555; }
        .info-value { flex: 1; }
        .section { border: 1px solid #ddd; border-radius: 6px; padding: 10px; margin-bottom: 16px; }
        .section h3 { font-size: 13px; color: #333; margin-bottom: 8px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background: #f5f5f5; font-weight: bold; }
        .text-right { text-align: right; }
        .total-row { font-weight: bold; background: #f9f9f9; }
        .loading-note-page { page-break-after: always; }
        .loading-note-page:last-child { page-break-after: auto; }
        @media print { body { padding: 0; } }
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
        .yard-note h1 { text-align: center; font-size: 20px; margin-bottom: 4px; }
        .yard-note h2 { text-align: center; font-size: 18px; margin-bottom: 8px; letter-spacing: 1px; }
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
        .yard-note-header { display: grid; grid-template-columns: 80px 1fr auto; align-items: center; gap: 12px; margin-bottom: 6px; }
        .yard-note-header .title-block { text-align: center; }
        .yard-note-meta { font-size: 10px; text-align: right; }
        .yard-note-info-table td { height: 28px; }
        .yard-note-info-table .label { font-weight: bold; }
        @media print { body { padding: 0; } }
      </style>
    </head>
    <body>
      <div class="yard-note">
        <div class="yard-note-header">
          <img src="${window.location.origin}/otn-logo.png" alt="OTN Logo" style="width: 80px; height: auto;" />
          <div class="title-block">
            <h1>${COMPANY_NAME}</h1>
            <p>Email: otnoacess@gmail.com</p>
            <p>${COMPANY_ADDRESS}</p>
            <p>${COMPANY_LOCATION}</p>
            <p><strong>PIN: ${COMPANY_PIN}</strong></p>
          </div>
          <div class="yard-note-meta">T.B.OD32</div>
        </div>
        <h2>YARD VERIFICATION REPORT</h2>
        <table class="yard-note-table yard-note-info-table">
          <tr>
            <td class="label">Customer/Branch Name:</td>
            <td class="value">${data.companyName || ""}</td>
            <td class="label">ID no:</td>
            <td class="value">${data.deliveryNoteNumber || ""}</td>
          </tr>
          <tr>
            <td class="label">Client ID:</td>
            <td class="value">${data.clientId || ""}</td>
            <td class="label">Site ID:</td>
            <td class="value">${data.siteId || ""}</td>
          </tr>
          <tr>
            <td class="label">Site:</td>
            <td class="value">${data.siteName || ""}</td>
            <td class="label">Date:</td>
            <td class="value">${data.deliveryDate || ""}</td>
          </tr>
          <tr>
            <td class="label">Vehicle Reg:</td>
            <td class="value">${data.vehicleNo || ""}</td>
            <td class="label">Created By:</td>
            <td class="value">${data.createdBy || ""}</td>
          </tr>
          <tr>
            <td class="label">Printed:</td>
            <td class="value">${formatTimestamp()}</td>
            <td class="label">Branch:</td>
            <td class="value">${data.siteName || ""}</td>
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
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; padding: 20px; font-size: 12px; }
        .header { display: flex; align-items: flex-start; margin-bottom: 16px; border-bottom: 2px solid #333; padding-bottom: 10px; }
        .header-logo { width: 100px; height: auto; margin-right: 20px; }
        .header-content { flex: 1; }
        .header-content h1 { font-size: 24px; margin-bottom: 5px; }
        .header-content p { color: #666; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
        .info-section { border: 1px solid #ddd; padding: 10px; border-radius: 6px; }
        .info-section h3 { font-size: 13px; color: #333; margin-bottom: 8px; }
        .info-row { display: flex; margin-bottom: 5px; }
        .info-label { font-weight: bold; width: 140px; color: #555; }
        .info-value { flex: 1; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background: #f5f5f5; font-weight: bold; }
        .text-right { text-align: right; }
        .total-row { font-weight: bold; background: #f9f9f9; }
        .terms { margin-top: 16px; padding: 10px; background: #f9f9f9; border-left: 3px solid #333; font-size: 11px; }
        @media print { body { padding: 0; } }
      </style>
    </head>
    <body>
      <div class="header">
        <img src="${window.location.origin}/otn-logo.png" alt="OTN Logo" class="header-logo" />
        <div class="header-content">
          <h1>${COMPANY_NAME}</h1>
          <p>Email: otnoacess@gmail.com</p>
          <p>${COMPANY_ADDRESS}</p>
          <p>${COMPANY_LOCATION}</p>
          <p><strong>PIN: ${COMPANY_PIN}</strong></p>
          <p><strong>Hire Quotation</strong></p>
        </div>
      </div>

      <div class="info-grid">
        <div class="info-section">
          <h3>Client Details</h3>
          <div class="info-row"><span class="info-label">Company:</span><span class="info-value">${data.companyName}</span></div>
          <div class="info-row"><span class="info-label">Contact:</span><span class="info-value">${data.contactName}</span></div>
          <div class="info-row"><span class="info-label">Phone:</span><span class="info-value">${data.contactPhone}</span></div>
          <div class="info-row"><span class="info-label">Email:</span><span class="info-value">${data.contactEmail || "-"}</span></div>
          <div class="info-row"><span class="info-label">Office Tel:</span><span class="info-value">${data.officeTel || "-"}</span></div>
          <div class="info-row"><span class="info-label">Office Email:</span><span class="info-value">${data.officeEmail || "-"}</span></div>
          <div class="info-row"><span class="info-label">Site Name:</span><span class="info-value">${data.siteName}</span></div>
          <div class="info-row"><span class="info-label">Site Location:</span><span class="info-value">${data.siteLocation || "-"}</span></div>
          <div class="info-row"><span class="info-label">Site Address:</span><span class="info-value">${data.siteAddress || "-"}</span></div>
        </div>
        <div class="info-section">
          <h3>OTNO Access Details</h3>
          <div class="info-row"><span class="info-label">Quotation No:</span><span class="info-value">${data.quotationNumber}</span></div>
          <div class="info-row"><span class="info-label">Client ID:</span><span class="info-value">${data.clientId || "-"}</span></div>
          <div class="info-row"><span class="info-label">Site ID:</span><span class="info-value">${data.siteId || "-"}</span></div>
          <div class="info-row"><span class="info-label">Date Created:</span><span class="info-value">${data.dateCreated}</span></div>
          <div class="info-row"><span class="info-label">Created By:</span><span class="info-value">${data.createdBy || "-"}</span></div>
          <div class="info-row"><span class="info-label">Printed:</span><span class="info-value">${formatTimestamp()}</span></div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Part Number</th>
            <th>Description</th>
            <th class="text-right">Qty</th>
            <th class="text-right">Warehouse Available Qty</th>
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
                <td class="text-right">${item.warehouseAvailableQty}</td>
                <td class="text-right">${formatMass(item.massPerItem)}</td>
                <td class="text-right">${formatCurrency(discountedRate)}</td>
                <td class="text-right">${formatCurrency(discountedTotal)}</td>
              </tr>
            `;
          }).join("")}
          <tr class="total-row">
            <td colspan="3"><strong>SUBTOTAL</strong></td>
            <td class="text-right"><strong>${totalQuantity}</strong></td>
            <td class="text-right">-</td>
            <td class="text-right"><strong>${formatMass(totalMass)}</strong></td>
            <td class="text-right">-</td>
            <td class="text-right"><strong>${formatCurrency(subtotal)}</strong></td>
          </tr>
          <tr class="total-row">
            <td colspan="7"><strong>VAT (16%)</strong></td>
            <td class="text-right"><strong>${formatCurrency(vatAmount)}</strong></td>
          </tr>
          ${data.discountRate > 0 ? `
            <tr class="total-row">
              <td colspan="7"><strong>Discount (${data.discountRate}%)</strong></td>
              <td class="text-right"><strong>-${formatCurrency(discountAmount)}</strong></td>
            </tr>
          ` : ""}
          <tr class="total-row" style="background: #333; color: white;">
            <td colspan="7"><strong>TOTAL (incl. VAT)</strong></td>
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
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; padding: 20px; font-size: 12px; }
        .header { display: flex; align-items: flex-start; margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 10px; }
        .header-logo { width: 100px; height: auto; margin-right: 20px; }
        .header-content { flex: 1; }
        .header-content h1 { font-size: 24px; margin-bottom: 5px; }
        .header-content p { color: #666; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
        .info-section h3 { font-size: 14px; color: #333; border-bottom: 1px solid #ddd; padding-bottom: 5px; margin-bottom: 10px; }
        .info-row { display: flex; margin-bottom: 5px; }
        .info-label { font-weight: bold; width: 120px; color: #555; }
        .info-value { flex: 1; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background: #f5f5f5; font-weight: bold; }
        .text-right { text-align: right; }
        .total-row { font-weight: bold; background: #f9f9f9; }
        .grand-total { font-size: 14px; background: #333; color: white; }
        .summary-box { background: #f5f5f5; padding: 15px; margin-bottom: 20px; }
        .summary-row { display: flex; justify-content: space-between; margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px solid #ddd; }
        .summary-row:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
        .summary-row.grand { font-size: 16px; font-weight: bold; background: #333; color: white; margin: -15px; margin-top: 10px; padding: 15px; }
        .terms { margin-top: 20px; padding: 10px; background: #f9f9f9; border-left: 3px solid #333; font-size: 11px; }
        @media print { body { padding: 0; } }
      </style>
    </head>
    <body>
      <div class="header">
        <img src="${window.location.origin}/otn-logo.png" alt="OTN Logo" class="header-logo" />
        <div class="header-content">
          <h1>${COMPANY_NAME}</h1>
          <p>Email: otnoacess@gmail.com</p>
          <p>${COMPANY_ADDRESS}</p>
          <p>${COMPANY_LOCATION}</p>
          <p><strong>PIN: ${COMPANY_PIN}</strong></p>
          <p><strong>Hire Quotation</strong></p>
        </div>
      </div>
      
      <div class="info-grid">
        <div class="info-section">
          <h3>Quotation Details</h3>
          <div class="info-row"><span class="info-label">Quotation No:</span><span class="info-value">${data.quotationNumber}</span></div>
          <div class="info-row"><span class="info-label">Client ID:</span><span class="info-value">${data.clientId || "-"}</span></div>
          <div class="info-row"><span class="info-label">Site ID:</span><span class="info-value">${data.siteId || "-"}</span></div>
          <div class="info-row"><span class="info-label">Date:</span><span class="info-value">${data.dateCreated}</span></div>
          <div class="info-row"><span class="info-label">Hire Period:</span><span class="info-value">${data.hireWeeks} week(s)</span></div>
          <div class="info-row"><span class="info-label">Created By:</span><span class="info-value">${data.createdBy || "-"}</span></div>
          <div class="info-row"><span class="info-label">Printed:</span><span class="info-value">${formatTimestamp()}</span></div>
        </div>
        <div class="info-section">
          <h3>Client Information</h3>
          <div class="info-row"><span class="info-label">Company:</span><span class="info-value">${data.companyName}</span></div>
          <div class="info-row"><span class="info-label">Site:</span><span class="info-value">${data.siteName}</span></div>
          <div class="info-row"><span class="info-label">Address:</span><span class="info-value">${data.siteAddress || "-"}</span></div>
          <div class="info-row"><span class="info-label">Contact:</span><span class="info-value">${data.contactName}</span></div>
          <div class="info-row"><span class="info-label">Phone:</span><span class="info-value">${data.contactPhone}</span></div>
          <div class="info-row"><span class="info-label">Email:</span><span class="info-value">${data.contactEmail || "-"}</span></div>
        </div>
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

  const gatePassPage = () => `
    <div class="page gate-pass-page pink-sheet">
      <div class="gp-top-meta">
        <div class="gp-meta-box">Gate Pass</div>
        <div class="gp-meta-box">Truck Bin No.</div>
      </div>

      <div class="gp-header">
        <img src="${window.location.origin}/otn-logo.png" alt="OTNOS Logo" class="gp-logo" />
        <div class="gp-header-right">
          <h1>otnos</h1>
          <h2>HIRE RETURN NOTE</h2>
        </div>
        <div class="gp-header-doc">
          <p>Doc Ref: OTN-HRN</p>
          <p>No: _______________</p>
        </div>
      </div>

      <div class="gp-info-grid">
        <div class="gp-info-left">
          <div class="gp-row"><span class="gp-label">Customer</span><span class="gp-val-line"></span></div>
          <div class="gp-row"><span class="gp-label">Site Name</span><span class="gp-val-line"></span></div>
          <div class="gp-row"><span class="gp-label">Site Code</span><span class="gp-val-line"></span></div>
          <div class="gp-row"><span class="gp-label">Site Address</span><span class="gp-val-line"></span></div>
        </div>
        <div class="gp-info-right">
          <div class="gp-row"><span class="gp-label">OTNOS Branch</span><span class="gp-val-line"></span></div>
          <div class="gp-row"><span class="gp-label">Date</span><span class="gp-val-line"></span></div>
          <div class="gp-row"><span class="gp-label">Hire End Date</span><span class="gp-val-line"></span></div>
          <div class="gp-row"><span class="gp-label">Customer Return</span><span class="gp-val-line"></span></div>
          <div class="gp-row"><span class="gp-label">OTNOS Collect</span><span class="gp-val-line"></span></div>
        </div>
      </div>

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

  // ---- Page 2: System-generated Return Note ----
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
      <div class="sys-header">
        <img src="${window.location.origin}/otn-logo.png" alt="OTNO Logo" class="sys-logo" />
        <div class="sys-header-center">
          <h1>Hire Return Note</h1>
          <p class="copy-label">${copyLabel}</p>
        </div>
      </div>

      <div class="sys-details-grid">
        <div class="sys-detail-box">
          <h3>Document Details</h3>
          <div class="sys-row"><span class="sys-label">Document No:</span><span>${data.returnNoteNumber}</span></div>
          <div class="sys-row"><span class="sys-label">Document Type:</span><span>Hire Return Note</span></div>
          <div class="sys-row"><span class="sys-label">Document Date:</span><span>${data.returnDate}</span></div>
          <div class="sys-row"><span class="sys-label">Quotation No:</span><span>${data.quotationNumber}</span></div>
          <div class="sys-row"><span class="sys-label">Client ID:</span><span>${data.clientId || "-"}</span></div>
          <div class="sys-row"><span class="sys-label">PIN:</span><span>${COMPANY_PIN}</span></div>
          <div class="sys-row"><span class="sys-label">Hire End Date:</span><span>${data.returnDate}</span></div>
        </div>
        <div class="sys-detail-box">
          <h3>Company Details</h3>
          <div class="sys-row"><span class="sys-label">${COMPANY_NAME}</span></div>
          <div class="sys-row"><span class="sys-label">Address:</span><span>${COMPANY_ADDRESS}</span></div>
          <div class="sys-row"><span class="sys-label">Location:</span><span>${COMPANY_LOCATION}</span></div>
          <div class="sys-row"><span class="sys-label">Email:</span><span>otnoacess@gmail.com</span></div>
          <div class="sys-row"><span class="sys-label">PIN:</span><span>${COMPANY_PIN}</span></div>
        </div>
      </div>

      <div class="sys-detail-box" style="margin-bottom:12px;">
        <h3>Client &amp; Site Details</h3>
        <div class="sys-site-grid">
          <div>
            <div class="sys-row"><span class="sys-label">Customer:</span><span>${data.companyName}</span></div>
            <div class="sys-row"><span class="sys-label">Contact:</span><span>${data.contactName}</span></div>
            <div class="sys-row"><span class="sys-label">Phone:</span><span>${data.contactPhone}</span></div>
            <div class="sys-row"><span class="sys-label">Email:</span><span>${data.contactEmail || "-"}</span></div>
          </div>
          <div>
            <div class="sys-row"><span class="sys-label">Site Name:</span><span>${data.siteName}</span></div>
            <div class="sys-row"><span class="sys-label">Site ID:</span><span>${data.siteId || "-"}</span></div>
            <div class="sys-row"><span class="sys-label">Site Location:</span><span>${data.siteLocation || "-"}</span></div>
            <div class="sys-row"><span class="sys-label">Site Address:</span><span>${data.siteAddress || "-"}</span></div>
          </div>
        </div>
      </div>

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

    /* ---- System Page Styles ---- */
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
    gatePassPage() +
    systemPage("System Generated") +
    "</body></html>";

  printWindow.document.write(withPrintOption(html));
  printWindow.document.close();
};
