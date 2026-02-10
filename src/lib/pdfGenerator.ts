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
  items: Array<{
    partNumber: string | null;
    description: string | null;
    quantity: number;
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
  items: Array<{
    partNumber: string | null;
    description: string | null;
    quantity: number;
    massPerItem: number | null;
    totalMass: number | null;
  }>;
}

const COMPANY_NAME = "OTNO Access Solutions";
const COMPANY_ADDRESS = "99215-80107 Mombasa, Kenya";
const COMPANY_LOCATION = "Embakasi, Old North Airport Rd, next to Naivas Embakasi";

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
          <p><strong>Hire Delivery Note</strong></p>
        </div>
      </div>
      
      <div class="info-grid">
        <div class="info-section">
          <h3>Delivery Information</h3>
          <div class="info-row"><span class="info-label">Delivery Note No:</span><span class="info-value">${data.deliveryNoteNumber}</span></div>
          <div class="info-row"><span class="info-label">Quotation No:</span><span class="info-value">${data.quotationNumber}</span></div>
          <div class="info-row"><span class="info-label">Delivery Date:</span><span class="info-value">${data.deliveryDate}</span></div>
          <div class="info-row"><span class="info-label">Vehicle No:</span><span class="info-value">${data.vehicleNo || "-"}</span></div>
          <div class="info-row"><span class="info-label">Delivered By:</span><span class="info-value">${data.deliveredBy || "-"}</span></div>
          <div class="info-row"><span class="info-label">Created By:</span><span class="info-value">${data.createdBy || "-"}</span></div>
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

      <div class="delivery-terms">
        <p><strong>IMPORTANT:</strong> Please check that the equipment count agrees with the above. All errors are to be clearly noted. Failure to do this assumes acceptance of the documentation.</p>
        <ul>
          <li><span class="term-header">The Hirer undertakes:</span> to use the goods in accordance with the provisions of the Occupational Health and Safety Act No. 85 of 1993 as amended.</li>
          <li><span class="term-header">The Hirer shall ensure:</span> that all goods are used in accordance with Otno's instructions.</li>
          <li><span class="term-header">The Hirer shall not use:</span> any goods that are non-standard or unusual and will report their existence to the Owner.</li>
          <li><span class="term-header">Dirty Equipment:</span> Will be charged for at 2X the list hire price of the item.</li>
          <li><span class="term-header">Damaged Equipment:</span> Will be charged for at 4X the list hire price of the item.</li>
          <li><span class="term-header">Lost Equipment:</span> Will be charged for at the selling price of the item.</li>
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
        .delivery-terms ul {
          margin: 0;
          padding-left: 16px;
        }
        .delivery-terms li {
          margin-bottom: 6px;
          line-height: 1.4;
        }
        .term-header {
          font-weight: 700;
          text-decoration: underline;
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
          <div class="info-row"><span class="info-label">Date Created:</span><span class="info-value">${data.dateCreated}</span></div>
          <div class="info-row"><span class="info-label">Created By:</span><span class="info-value">${data.createdBy || "-"}</span></div>
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
            <td class="label">Site:</td>
            <td class="value">${data.siteName || ""}</td>
            <td class="label">Date:</td>
            <td class="value">${data.deliveryDate || ""}</td>
          </tr>
          <tr>
            <td class="label">Vehicle Reg:</td>
            <td class="value">${data.vehicleNo || ""}</td>
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
          <div class="info-row"><span class="info-label">Date Created:</span><span class="info-value">${data.dateCreated}</span></div>
          <div class="info-row"><span class="info-label">Created By:</span><span class="info-value">${data.createdBy || "-"}</span></div>
        </div>
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

      <div class="terms">
        <strong>TERMS:</strong><br />
        Quote does not include transport to and from site.<br />
        Order confirmation is through deposit payment before collection.<br />
        Four (4) weeks deposit is required upfront.<br />
        Items not currently available in our yard will not be billed.<br />
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
          <p><strong>Hire Quotation</strong></p>
        </div>
      </div>
      
      <div class="info-grid">
        <div class="info-section">
          <h3>Quotation Details</h3>
          <div class="info-row"><span class="info-label">Quotation No:</span><span class="info-value">${data.quotationNumber}</span></div>
          <div class="info-row"><span class="info-label">Date:</span><span class="info-value">${data.dateCreated}</span></div>
          <div class="info-row"><span class="info-label">Hire Period:</span><span class="info-value">${data.hireWeeks} week(s)</span></div>
          <div class="info-row"><span class="info-label">Created By:</span><span class="info-value">${data.createdBy || "-"}</span></div>
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
        Four (4) weeks deposit is required upfront.<br />
        Items not currently available in our yard will not be billed<br />
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
