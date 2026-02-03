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
  items: Array<{
    partNumber: string | null;
    description: string | null;
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
  customerOrderNo: string;
  officialOrdersUsed: string;
  bulkOrdersUsed: string;
  newOrderForEveryQuote: string;
  telephonicOrders: string;
  personsNameAsOrder: string;
  personsName: string;
  requisitionNumberUsed: string;
  requisitionNo: string;
  createdBy: string;
  items: Array<{
    partNumber: string | null;
    description: string | null;
    quantity: number;
    massPerItem: number | null;
    weeklyRate: number;
    weeklyTotal: number;
  }>;
}

const COMPANY_NAME = "OTNO Access Solutions";
const COMPANY_ADDRESS = "99215-80107 Mombasa, Kenya";
const COMPANY_LOCATION = "Embakasi, Old North Airport Rd, next to Naivas Embakasi";

const formatCurrency = (value: number) =>
  `Ksh ${value.toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatMass = (value: number | null) =>
  value != null ? `${value.toFixed(2)} kg` : "-";

const formatFlag = (value: string) => {
  if (!value) return "-";
  return value === "yes" ? "Yes" : value === "no" ? "No" : value;
};

export const generateDeliveryNotePDF = (data: DeliveryNoteData) => {
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Please allow popups for this site to generate PDFs");
    return;
  }

  const totalMass = data.items.reduce((sum, item) => sum + (item.totalMass || 0), 0);

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Delivery Note - ${data.deliveryNoteNumber}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; padding: 20px; font-size: 12px; }
        .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 10px; }
        .header h1 { font-size: 24px; margin-bottom: 5px; }
        .header p { color: #666; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
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
        .signature-section { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 40px; }
        .signature-box { border-top: 1px solid #333; padding-top: 10px; }
        .signature-box p { margin-bottom: 5px; }
        .remarks { margin-top: 20px; padding: 10px; background: #f9f9f9; border-left: 3px solid #333; }
        .page-break { page-break-before: always; }
        .yard-note { margin-top: 20px; }
        .yard-note h1 { text-align: center; font-size: 20px; margin-bottom: 6px; }
        .yard-note h2 { text-align: center; font-size: 16px; margin-bottom: 12px; }
        .yard-note-table { width: 100%; border-collapse: collapse; font-size: 11px; }
        .yard-note-table th, .yard-note-table td { border: 1px solid #333; padding: 6px; }
        .yard-note-table th { background: #f5f5f5; text-align: center; }
        .yard-note-table .label { width: 22%; font-weight: bold; }
        .yard-note-table .value { width: 28%; }
        .yard-note-table .small { width: 12%; }
        .yard-note-table .notes { height: 28px; }
        .yard-note-footer { margin-top: 10px; }
        .yard-note-footer .row { display: flex; gap: 16px; margin-bottom: 6px; }
        .yard-note-footer .field { flex: 1; border: 1px solid #333; padding: 6px; min-height: 28px; }
        @media print { body { padding: 0; } }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${COMPANY_NAME}</h1>
        <p>Email: otnoacess@gmail.com</p>
        <p>${COMPANY_ADDRESS}</p>
        <p>${COMPANY_LOCATION}</p>
        <p>Delivery Note</p>
      </div>
      
      <div class="info-grid">
        <div class="info-section">
          <h3>Delivery Information</h3>
          <div class="info-row"><span class="info-label">Delivery Note No:</span><span class="info-value">${data.deliveryNoteNumber}</span></div>
          <div class="info-row"><span class="info-label">Quotation No:</span><span class="info-value">${data.quotationNumber}</span></div>
          <div class="info-row"><span class="info-label">Delivery Date:</span><span class="info-value">${data.deliveryDate}</span></div>
          <div class="info-row"><span class="info-label">Vehicle No:</span><span class="info-value">${data.vehicleNo || "-"}</span></div>
          <div class="info-row"><span class="info-label">Delivered By:</span><span class="info-value">${data.deliveredBy || "-"}</span></div>
        </div>
        <div class="info-section">
          <h3>Client Information</h3>
          <div class="info-row"><span class="info-label">Company:</span><span class="info-value">${data.companyName}</span></div>
          <div class="info-row"><span class="info-label">Site:</span><span class="info-value">${data.siteName}</span></div>
          <div class="info-row"><span class="info-label">Address:</span><span class="info-value">${data.siteAddress || "-"}</span></div>
          <div class="info-row"><span class="info-label">Contact:</span><span class="info-value">${data.contactName}</span></div>
          <div class="info-row"><span class="info-label">Phone:</span><span class="info-value">${data.contactPhone}</span></div>
        </div>
      </div>

      <div class="section">
        <h3>Hire Loading Note</h3>
        <div class="info-row"><span class="info-label">Loaded By:</span><span class="info-value">____________________</span></div>
        <div class="info-row"><span class="info-label">Checked By:</span><span class="info-value">____________________</span></div>
        <div class="info-row"><span class="info-label">Date:</span><span class="info-value">____________________</span></div>
        <div class="info-row"><span class="info-label">Time:</span><span class="info-value">____________________</span></div>
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
              <td>${item.quantity}</td>
              <td>__________</td>
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

      <div class="page-break yard-note">
        <h1>${COMPANY_NAME}</h1>
        <p style="text-align: center; margin-bottom: 6px;">${COMPANY_ADDRESS}</p>
        <p style="text-align: center; margin-bottom: 6px;">${COMPANY_LOCATION}</p>
        <h2>YARD VERIFICATION NOTE</h2>
        <table class="yard-note-table">
          <tr>
            <td class="label">Customer/Branch Name:</td>
            <td class="value">&nbsp;</td>
            <td class="label">ID no:</td>
            <td class="value">&nbsp;</td>
            <td class="label">Date:</td>
            <td class="value">&nbsp;</td>
          </tr>
          <tr>
            <td class="label">Vehicle Reg:</td>
            <td class="value">&nbsp;</td>
            <td class="label">Branch:</td>
            <td class="value">&nbsp;</td>
            <td class="label">Customer Return (Yes/No):</td>
            <td class="value">&nbsp;</td>
          </tr>
          <tr>
            <td class="label">Form-staff Return (Yes/No):</td>
            <td class="value">&nbsp;</td>
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

  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.onload = () => {
    printWindow.print();
  };
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
      <title>Yard Verification Note - ${data.deliveryNoteNumber}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; padding: 20px; font-size: 12px; }
        .yard-note h1 { text-align: center; font-size: 20px; margin-bottom: 6px; }
        .yard-note h2 { text-align: center; font-size: 18px; margin-bottom: 12px; }
        .yard-note-table { width: 100%; border-collapse: collapse; font-size: 11px; }
        .yard-note-table th, .yard-note-table td { border: 1px solid #333; padding: 6px; }
        .yard-note-table th { background: #f5f5f5; text-align: center; }
        .yard-note-table .label { width: 22%; font-weight: bold; }
        .yard-note-table .value { width: 28%; }
        .yard-note-table .small { width: 12%; }
        .yard-note-table .notes { height: 28px; }
        .yard-note-footer { margin-top: 10px; }
        .yard-note-footer .row { display: flex; gap: 16px; margin-bottom: 6px; }
        .yard-note-footer .field { flex: 1; border: 1px solid #333; padding: 6px; min-height: 28px; }
        @media print { body { padding: 0; } }
      </style>
    </head>
    <body>
      <div class="yard-note">
        <h1>${COMPANY_NAME}</h1>
        <p style="text-align: center; margin-bottom: 6px;">Email: otnoacess@gmail.com</p>
        <p style="text-align: center; margin-bottom: 6px;">${COMPANY_ADDRESS}</p>
        <p style="text-align: center; margin-bottom: 6px;">${COMPANY_LOCATION}</p>
        <h2>YARD VERIFICATION NOTE</h2>
        <table class="yard-note-table">
          <tr>
            <td class="label">Customer/Branch Name:</td>
            <td class="value">${data.companyName || ""}</td>
            <td class="label">ID no:</td>
            <td class="value">&nbsp;</td>
            <td class="label">Date:</td>
            <td class="value">${data.deliveryDate || ""}</td>
          </tr>
          <tr>
            <td class="label">Vehicle Reg:</td>
            <td class="value">${data.vehicleNo || ""}</td>
            <td class="label">Branch:</td>
            <td class="value">${data.siteName || ""}</td>
            <td class="label">Customer Return (Yes/No):</td>
            <td class="value">&nbsp;</td>
          </tr>
          <tr>
            <td class="label">Form-staff Return (Yes/No):</td>
            <td class="value">&nbsp;</td>
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

  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.onload = () => {
    printWindow.print();
  };
};

export const generateHireQuotationReportPDF = (data: HireQuotationReportData) => {
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
        .header { text-align: center; margin-bottom: 16px; border-bottom: 2px solid #333; padding-bottom: 10px; }
        .header h1 { font-size: 24px; margin-bottom: 5px; }
        .header p { color: #666; }
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
        @media print { body { padding: 0; } }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${COMPANY_NAME}</h1>
        <p>Email: otnoacess@gmail.com</p>
        <p>${COMPANY_ADDRESS}</p>
        <p>${COMPANY_LOCATION}</p>
        <p>Hire Quotation</p>
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
          <div class="info-row"><span class="info-label">Customer Order No:</span><span class="info-value">${data.customerOrderNo || "-"}</span></div>
          <div class="info-row"><span class="info-label">Official Orders Used:</span><span class="info-value">${formatFlag(data.officialOrdersUsed)}</span></div>
          <div class="info-row"><span class="info-label">Bulk Orders Used:</span><span class="info-value">${formatFlag(data.bulkOrdersUsed)}</span></div>
          <div class="info-row"><span class="info-label">New Order per Quote:</span><span class="info-value">${formatFlag(data.newOrderForEveryQuote)}</span></div>
          <div class="info-row"><span class="info-label">Telephonic Orders:</span><span class="info-value">${formatFlag(data.telephonicOrders)}</span></div>
          <div class="info-row"><span class="info-label">Person's Name as Order:</span><span class="info-value">${formatFlag(data.personsNameAsOrder)}</span></div>
          <div class="info-row"><span class="info-label">Person's Name:</span><span class="info-value">${data.personsName || "-"}</span></div>
          <div class="info-row"><span class="info-label">Requisition No Used:</span><span class="info-value">${formatFlag(data.requisitionNumberUsed)}</span></div>
          <div class="info-row"><span class="info-label">Requisition No:</span><span class="info-value">${data.requisitionNo || "-"}</span></div>
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
            <th class="text-right">Hire/Week</th>
          </tr>
        </thead>
        <tbody>
          ${data.items.map((item, idx) => `
            <tr>
              <td>${idx + 1}</td>
              <td>${item.partNumber || "-"}</td>
              <td>${item.description || "-"}</td>
              <td class="text-right">${item.quantity}</td>
              <td class="text-right">${formatMass(item.massPerItem)}</td>
              <td class="text-right">${formatCurrency(item.weeklyRate)}</td>
              <td class="text-right">${formatCurrency(item.weeklyTotal)}</td>
            </tr>
          `).join("")}
          <tr class="total-row">
            <td colspan="3"><strong>SUBTOTAL</strong></td>
            <td class="text-right"><strong>${data.items.reduce((sum, item) => sum + item.quantity, 0)}</strong></td>
            <td class="text-right"><strong>${formatMass(data.items.reduce((sum, item) => sum + (item.massPerItem || 0) * item.quantity, 0))}</strong></td>
            <td class="text-right">-</td>
            <td class="text-right"><strong>${formatCurrency(data.items.reduce((sum, item) => sum + item.weeklyTotal, 0))}</strong></td>
          </tr>
          <tr class="total-row">
            <td colspan="6"><strong>VAT (16%)</strong></td>
            <td class="text-right"><strong>${formatCurrency(data.items.reduce((sum, item) => sum + item.weeklyTotal, 0) * 0.16)}</strong></td>
          </tr>
          <tr class="total-row" style="background: #333; color: white;">
            <td colspan="6"><strong>TOTAL (incl. VAT)</strong></td>
            <td class="text-right"><strong>${formatCurrency(data.items.reduce((sum, item) => sum + item.weeklyTotal, 0) * 1.16)}</strong></td>
          </tr>
        </tbody>
      </table>

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

  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.onload = () => {
    printWindow.print();
  };
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
        .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 10px; }
        .header h1 { font-size: 24px; margin-bottom: 5px; }
        .header p { color: #666; }
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
        <h1>${COMPANY_NAME}</h1>
        <p>Email: otnoacess@gmail.com</p>
        <p>${COMPANY_ADDRESS}</p>
        <p>${COMPANY_LOCATION}</p>
        <p>Hire Quotation</p>
      </div>
      
      <div class="info-grid">
        <div class="info-section">
          <h3>Quotation Details</h3>
          <div class="info-row"><span class="info-label">Quotation No:</span><span class="info-value">${data.quotationNumber}</span></div>
          <div class="info-row"><span class="info-label">Date:</span><span class="info-value">${data.dateCreated}</span></div>
          <div class="info-row"><span class="info-label">Hire Period:</span><span class="info-value">${data.hireWeeks} week(s)</span></div>
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
            <th class="text-right">Weekly Total</th>
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
              <td class="text-right">${formatCurrency(item.weeklyTotal)}</td>
            </tr>
          `).join("")}
          <tr class="total-row">
            <td colspan="3"><strong>TOTAL</strong></td>
            <td class="text-right"><strong>${data.items.reduce((sum, item) => sum + item.quantity, 0)}</strong></td>
            <td class="text-right">-</td>
            <td class="text-right"><strong>${formatCurrency(data.weeklyTotal)}</strong></td>
          </tr>
        </tbody>
      </table>

      <div class="summary-box">
        <div class="summary-row">
          <span>Weekly Hire Total</span>
          <span>${formatCurrency(data.weeklyTotal)}</span>
        </div>
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
        <strong>Payment Terms:</strong> ${data.paymentTerms}
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

  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.onload = () => {
    printWindow.print();
  };
};
