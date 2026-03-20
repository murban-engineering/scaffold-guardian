import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { differenceInCalendarDays, format, endOfMonth, addMonths, startOfMonth, isBefore, isSameMonth } from "date-fns";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { useHireQuotations } from "@/hooks/useHireQuotations";
import { useMaintenanceLogs } from "@/hooks/useMaintenanceLogs";
import { useScaffolds } from "@/hooks/useScaffolds";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Printer, CalendarDays, DollarSign, Users, Search, ClipboardList } from "lucide-react";
import { generateHireQuotationReportPDF, HireQuotationReportData } from "@/lib/pdfGenerator";
import { asDateOrToday, resolveDispatchDateFromHistoryPayload, toIsoDateOrToday } from "@/lib/accountingDates";

const currency = new Intl.NumberFormat("en-KE", {
  style: "currency",
  currency: "KES",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const resolveDispatchDateFromHistory = (
  deliveryHistoryPayload: unknown,
  quotationId: string,
  quotationNumber?: string | null
) => {
  const persistedDispatchDate = resolveDispatchDateFromHistoryPayload(deliveryHistoryPayload);
  if (persistedDispatchDate) return persistedDispatchDate;

  if (typeof window === "undefined") return null;

  const keys = [
    `hire-delivery-history:${quotationId}`,
    quotationNumber ? `hire-delivery-history:${quotationNumber}` : null,
  ].filter(Boolean) as string[];

  for (const key of keys) {
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) continue;

      const parsed = JSON.parse(raw);
      const resolvedDate = resolveDispatchDateFromHistoryPayload(parsed);
      if (resolvedDate) return resolvedDate;
    } catch {
      // Ignore invalid localStorage payloads and continue to the next key.
    }
  }

  return null;
};

const COMPANY_NAME = "OTNO Access Solutions";
const COMPANY_ADDRESS = "P.O.BOX 142-00502 Nairobi Karen";
const COMPANY_LOCATION = "P.O.BOX 142-00502 Nairobi Karen";

const deriveInvoiceNumber = (quotationNumber: string, fallbackSequence: number) => {
  const quotedSequence = Number.parseInt(quotationNumber.replace(/\D/g, ""), 10);
  if (Number.isFinite(quotedSequence) && quotedSequence >= 1000) {
    return `INV-${String(quotedSequence - 1000).padStart(4, "0")}`;
  }
  return `INV-${String(fallbackSequence).padStart(4, "0")}`;
};

/** Returns the exact number of billable DAYS (not weeks). */
/**
 * Billing starts the day AFTER dispatch.
 * e.g. dispatched 12 Mar → first billable day is 13 Mar (day 1), week 1 ends 19 Mar.
 * On the dispatch day itself, 0 days are billed.
 */
const calculateBillableDays = (dispatchDateValue: string, billingDate: Date) => {
  const dispatchDate = asDateOrToday(dispatchDateValue);
  const elapsedDays = differenceInCalendarDays(billingDate, dispatchDate);
  // elapsedDays == 0 on dispatch day (0 billable), == 1 the next day (1 billable day), etc.
  return Math.max(elapsedDays, 0);
};

/** Fractional weeks (days / 7) used for billing calculations. */
const billableDaysToWeeks = (days: number) => days / 7;

/** Human-readable label: "2 weeks 4 days", "1 week", "3 days", etc. */
const formatWeeksDaysLabel = (days: number) => {
  const fullWeeks = Math.floor(days / 7);
  const remainderDays = days % 7;
  const weekPart = fullWeeks > 0 ? `${fullWeeks} week${fullWeeks !== 1 ? "s" : ""}` : "";
  const dayPart = remainderDays > 0 ? `${remainderDays} day${remainderDays !== 1 ? "s" : ""}` : "";
  if (weekPart && dayPart) return `${weekPart} ${dayPart}`;
  return weekPart || dayPart || "1 day";
};

const calculateMonthlyInvoiceWeeks = (periodStart: Date, periodEnd: Date, isFirstBillingMonth: boolean) => {
  if (!isFirstBillingMonth) return 4;

  const elapsedDays = differenceInCalendarDays(periodEnd, periodStart) + 1;
  return Math.max(Math.floor(elapsedDays / 7), 0);
};

const escapeHtml = (value: string) =>
  value.split("&").join("&amp;").split("<").join("&lt;").split(">").join("&gt;").split('"').join("&quot;").split("'").join("&#39;");

const renderAccountingReportHeader = ({
  documentTitle,
  documentNumber,
  documentDate,
  client,
  site,
  siteAddress,
  contactName,
  contactPhone,
  createdBy,
  extraRows = "",
  showBrandSubtitle = true,
}: {
  documentTitle: string;
  documentNumber: string;
  documentDate: string;
  client: string;
  site: string;
  siteAddress: string;
  contactName: string;
  contactPhone: string;
  createdBy: string;
  extraRows?: string;
  showBrandSubtitle?: boolean;
}) => `
  <div class="print-header">
    <div class="header-grid">
      <div class="left-block">
        <div class="brand-top">
          <img src="${window.location.origin}/otn-logo-red.png" alt="Logo" class="logo"/>
          <div>
            <div class="brand-title">${COMPANY_NAME}</div>
            ${showBrandSubtitle ? '<div class="brand-subtitle">A Division of OTNO Access Group</div>' : ""}
          </div>
        </div>
        <div class="panel client-panel">
          <h3>${escapeHtml(client)}</h3>
          <div class="client-address">${escapeHtml(siteAddress || "-")}</div>
          <div class="spacer"></div>
          <div class="row"><span class="lbl">Contact</span><span class="sep">:</span><span class="val">${escapeHtml(contactName || "-")}</span></div>
          <div class="row"><span class="lbl">Cell No</span><span class="sep">:</span><span class="val">${escapeHtml(contactPhone || "-")}</span></div>
        </div>
      </div>
      <div class="right-block">
        <h1>${escapeHtml(documentTitle)}</h1>
        <div class="panel">
          <h3>Document Details</h3>
          <div class="row"><span class="lbl">Document No</span><span class="sep">:</span><span class="val">${escapeHtml(documentNumber)}</span></div>
          <div class="row"><span class="lbl">Document Type</span><span class="sep">:</span><span class="val">${escapeHtml(documentTitle)}</span></div>
          <div class="row"><span class="lbl">Document Date</span><span class="sep">:</span><span class="val">${escapeHtml(documentDate)}</span></div>
          <div class="row"><span class="lbl">Printed</span><span class="sep">:</span><span class="val">${new Date().toLocaleString("en-KE", { dateStyle: "medium", timeStyle: "short" })}</span></div>
          ${extraRows}
        </div>
        <div class="panel">
          <h3>Company Details</h3>
          <div class="row"><span class="lbl">Company</span><span class="sep">:</span><span class="val">${escapeHtml(COMPANY_NAME)}</span></div>
          <div class="row"><span class="lbl">Address</span><span class="sep">:</span><span class="val">${escapeHtml(COMPANY_ADDRESS)}</span></div>
          <div class="row"><span class="lbl">Location</span><span class="sep">:</span><span class="val">${escapeHtml(COMPANY_LOCATION)}</span></div>
          <div class="row"><span class="lbl">Prepared By</span><span class="sep">:</span><span class="val">${escapeHtml(createdBy || "-")}</span></div>
        </div>
        <div class="panel">
          <h3>Site Details</h3>
          <div class="row"><span class="lbl">Customer</span><span class="sep">:</span><span class="val">${escapeHtml(client)}</span></div>
          <div class="row"><span class="lbl">Site Name</span><span class="sep">:</span><span class="val">${escapeHtml(site)}</span></div>
          <div class="row"><span class="lbl">Site Address</span><span class="sep">:</span><span class="val">${escapeHtml(siteAddress || "-")}</span></div>
          <div class="row"><span class="lbl">Contact</span><span class="sep">:</span><span class="val">${escapeHtml(contactName || "-")}</span></div>
          <div class="row"><span class="lbl">Cell No</span><span class="sep">:</span><span class="val">${escapeHtml(contactPhone || "-")}</span></div>
        </div>
      </div>
    </div>
  </div>
`;

type HireLineBreakdown = {
  partNumber: string;
  item: string;
  quantity: number;
  weeklyRate: number;
  discountRate: number;
  effectiveWeeklyRate: number;
  /** Fractional weeks (days / 7) used for amount calculation */
  weeks: number;
  /** Display label e.g. "2 weeks 4 days" */
  weeksLabel: string;
  lineTotal: number;
};

type PolicyLineBreakdown = {
  partNumber: string;
  item: string;
  condition: "dirty" | "damaged" | "scrap";
  quantity: number;
  basePrice: number;
  multiplierLabel: string;
  lineTotal: number;
};

type DeliveryHistorySiteRecord = {
  siteNumber?: string;
};

type ClientInvoice = {
  id: string;
  invoiceNumber: string;
  quotationNumber: string;
  accountNumber: string;
  client: string;
  site: string;
  siteAddress: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  dispatchDate: string;
  /** Total billable days */
  hireDays: number;
  /** Fractional weeks (hireDays / 7) */
  hireWeeks: number;
  /** Human label e.g. "2 weeks 4 days" */
  hireWeeksLabel: string;
  hireTotal: number;
  policyTotal: number;
  grandTotal: number;
  hireBreakdown: HireLineBreakdown[];
  policyBreakdown: PolicyLineBreakdown[];
  createdBy: string;
  createdDate: string;
  workflowStatus: string;
};

const renderTaxInvoiceHeader = (invoice: ClientInvoice, billingDateStr: string) =>
  renderAccountingReportHeader({
    documentTitle: "Tax Invoice",
    documentNumber: invoice.invoiceNumber,
    documentDate: billingDateStr,
    client: invoice.client,
    site: invoice.site,
    siteAddress: invoice.siteAddress || "-",
    contactName: invoice.contactName || "-",
    contactPhone: invoice.contactPhone || "-",
    createdBy: invoice.createdBy,
    showBrandSubtitle: false,
    extraRows: `
      <div class="row"><span class="lbl">Quotation No</span><span class="sep">:</span><span class="val">${escapeHtml(invoice.quotationNumber)}</span></div>
      <div class="row"><span class="lbl">Dispatch Date</span><span class="sep">:</span><span class="val">${escapeHtml(invoice.dispatchDate)}</span></div>
      <div class="row"><span class="lbl">Hire Period</span><span class="sep">:</span><span class="val">${escapeHtml(invoice.hireWeeksLabel)} (${invoice.hireDays} days)</span></div>
    `,
  });

const openInvoicePrint = (invoice: ClientInvoice, billingDateStr: string) => {
  const win = window.open("", "_blank");
  if (!win) { alert("Please allow popups to print invoices"); return; }

  const hireRows = invoice.hireBreakdown.length > 0
    ? invoice.hireBreakdown.map(l => `
      <tr>
        <td>${escapeHtml(l.partNumber)}</td>
        <td>${escapeHtml(l.item)}</td>
        <td class="r">${l.quantity}</td>
        <td class="r">${escapeHtml(l.weeksLabel)}</td>
        <td class="r">${currency.format(l.lineTotal)}</td>
      </tr>`).join("")
    : `<tr><td colspan="5" class="c">No hire items.</td></tr>`;

  const policyRows = invoice.policyBreakdown.length > 0
    ? invoice.policyBreakdown.map(l => `
      <tr>
        <td>${escapeHtml(l.partNumber)}</td>
        <td>${escapeHtml(l.item)}</td>
        <td class="cap">${escapeHtml(l.condition)}</td>
        <td class="r">${l.quantity}</td>
        <td class="r">${currency.format(l.basePrice)}</td>
        <td>${escapeHtml(l.multiplierLabel)}</td>
        <td class="r">${currency.format(l.lineTotal)}</td>
      </tr>`).join("")
    : `<tr><td colspan="7" class="c">No return-policy charges.</td></tr>`;

  const vatRate = 0.16;
  const subtotalBeforeVat = invoice.grandTotal;
  const vatAmount = subtotalBeforeVat * vatRate;
  const totalWithVat = subtotalBeforeVat + vatAmount;

  const html = `<!doctype html><html><head>
    <title>Invoice ${escapeHtml(invoice.invoiceNumber)}</title>
    <style>
      *{margin:0;padding:0;box-sizing:border-box;}
      body{font-family:Arial,sans-serif;color:#111;font-size:9.5px;line-height:1.3;padding:12px;}
      h1{margin:0 0 4px;font-size:32px;line-height:1.1}
      h2{margin:10px 0 5px;font-size:11px;border-bottom:1px solid #ccc;padding-bottom:3px;text-transform:uppercase;font-weight:800;}
      .header-grid{display:grid;grid-template-columns:1.1fr 1fr;gap:16px;align-items:start;margin-bottom:14px}
      .left-block{padding:8px 4px;display:grid;gap:10px}
      .right-block{display:grid;gap:8px}
      .brand-top{display:flex;align-items:center;gap:12px;margin-bottom:8px}
      .logo{width:176px;height:auto}
      .brand-title{font-size:18px;font-weight:800;line-height:1.15;color:#111827}
      .brand-subtitle{font-size:11px;color:#4b5563;margin-top:2px}
      .panel{border:1px solid #111827;border-radius:6px;padding:8px}
      .panel h3{margin:0 0 6px;font-size:12px;border-bottom:1px solid #e5e7eb;padding-bottom:4px;text-transform:uppercase}
      .client-panel h3{font-size:20px;border-bottom:none;padding-bottom:0;margin-bottom:8px}
      .client-address{white-space:pre-line;min-height:42px}
      .spacer{height:16px}
      .row{display:flex;align-items:flex-start;margin-bottom:3px}.lbl{width:112px;font-weight:700;color:#374151}.sep{width:10px;color:#6b7280}.val{flex:1}
      table{width:100%;border-collapse:collapse;}
      th,td{border:1px solid #ddd;padding:4px 6px;text-align:left;font-size:8.5px;vertical-align:top;}
      th{background:#f5f5f5;font-weight:800;text-transform:uppercase;letter-spacing:0.2px;}
      .r{text-align:right}.c{text-align:center}.cap{text-transform:capitalize}
      .sum{max-width:340px;margin:10px 0 0 auto;border:1px solid #ccc;border-radius:4px;padding:8px;}
      .sum-row{display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid #eee;font-size:9px;}
      .sum-row.total{font-weight:700;border-top:2px solid #333;border-bottom:none;margin-top:4px;padding-top:6px;font-size:11px;}
      .ft{margin-top:8px;font-size:9px;color:#555;}
      .policy-box{border:1px solid #333;border-radius:6px;padding:8px;margin-top:10px;background:#fcfcfc;}
      .policy-box h4{margin:0 0 5px;font-size:9px;text-transform:uppercase;font-weight:800;}
      .policy-box ul{margin:0;padding-left:14px;font-size:8.5px;}.policy-box li{margin-bottom:3px;}
      .print-bar{position:sticky;top:0;z-index:999;display:flex;justify-content:flex-end;padding:8px 12px;background:rgba(255,255,255,.96);border-bottom:1px solid #ddd;margin:-12px -12px 8px -12px;}
      .print-btn{border:1px solid #333;border-radius:6px;background:#111;color:#fff;padding:6px 12px;font-size:11px;font-weight:600;cursor:pointer;}
      /* Branded yellow footer */
      .branded-footer{margin-top:auto;}
      .footer-brand{background:#facc15;color:#1f2937;font-weight:700;display:flex;justify-content:space-between;align-items:center;padding:6px 10px;}
      .footer-legal{text-align:center;font-size:7.5px;color:#4b5563;padding:3px 8px 4px;border:1px solid #e5e7eb;border-top:none;}
      .footer-processed{display:flex;justify-content:space-between;font-size:7px;color:#6b7280;padding:4px 0 0;}
      /* Page wrappers */
      .page1-wrap{display:flex;flex-direction:column;min-height:92vh;}
      .page1-body{flex:1;}
      .page2-wrap{display:flex;flex-direction:column;min-height:92vh;}
      .page2-body{flex:1;}
      @media print{
        .print-bar{display:none;}
        body{padding:6px;font-size:8.5px;}
        .print-header{position:static;background:#fff;padding-top:8px;break-inside:avoid-page;}
        .print-content{margin-top:0;}
        .page2-wrap{page-break-before:always;break-before:page;min-height:92vh;}
      }
    </style></head><body>
    <div class="print-bar"><button class="print-btn" onclick="window.print()">Print Invoice</button></div>

    <div class="page1-wrap">
      <div class="page1-body">
        ${renderTaxInvoiceHeader(invoice, billingDateStr)}
        <div class="print-content">
          <h2>A. Weekly Hire Charges</h2>
          <table>
            <thead><tr>
              <th>Part No</th><th>Description</th><th class="r">Qty</th><th class="r">Weeks</th><th class="r">Amount (KES)</th>
            </tr></thead>
            <tbody>${hireRows}</tbody>
          </table>
        </div>
      </div>
      <div class="branded-footer">
        <div class="footer-brand">
          <span>${COMPANY_NAME} — Your Trusted Scaffolding &amp; Access Partner.</span>
          <img src="${window.location.origin}/otn-logo-red.png" alt="OTN Logo" style="height:28px;width:auto;" />
        </div>
        <div class="footer-legal">
          All transactions are subject to our standard Terms of Trade which can be found at: otnoaseas@gmail.com &nbsp;|&nbsp; Page 1 of 2
        </div>
        <div class="footer-processed">
          <span>Processed By: &nbsp;${escapeHtml(invoice.createdBy || "-")}</span>
          <span>Print date: ${new Date().toLocaleDateString("en-GB")} ${new Date().toLocaleTimeString("en-GB", {hour:"2-digit",minute:"2-digit"})}</span>
        </div>
      </div>
    </div>

    <div class="page2-wrap">
      <div class="page2-body">
        ${renderTaxInvoiceHeader(invoice, billingDateStr)}
        <h2>B. Return Condition Charges</h2>
        <table>
          <thead><tr>
            <th>Part No</th><th>Description</th><th>Condition</th><th class="r">Qty</th>
            <th class="r">Base Price</th><th>Policy</th><th class="r">Amount (KES)</th>
          </tr></thead>
          <tbody>${policyRows}</tbody>
        </table>

        <div style="margin-top:12px;">
          <div class="sum">
            <div class="sum-row"><span>A. Hire Charges</span><strong>${currency.format(invoice.hireTotal)}</strong></div>
            <div class="sum-row"><span>B. Return Policy Charges</span><strong>${currency.format(invoice.policyTotal)}</strong></div>
            <div class="sum-row"><span>Subtotal</span><strong>${currency.format(subtotalBeforeVat)}</strong></div>
            <div class="sum-row"><span>VAT (16%)</span><strong>${currency.format(vatAmount)}</strong></div>
            <div class="sum-row total"><span>TOTAL DUE</span><span>${currency.format(totalWithVat)}</span></div>
          </div>

          <div class="policy-box">
            <h4>Return Condition Billing Policy</h4>
            <ul>
              <li><strong>Dirty Equipment:</strong> Charged at 2× the list hire price of the item.</li>
              <li><strong>Damaged Equipment:</strong> Charged at 4× the list hire price of the item.</li>
              <li><strong>Scrap Equipment:</strong> Charged at the selling price (unit price) of the item.</li>
            </ul>
          </div>

          <p class="ft">Invoice date: ${escapeHtml(billingDateStr)}. ${COMPANY_NAME}. All amounts in Kenya Shillings (KES).</p>
        </div>
      </div>
      <div class="branded-footer">
        <div class="footer-brand">
          <span>${COMPANY_NAME} — Your Trusted Scaffolding &amp; Access Partner.</span>
          <img src="${window.location.origin}/otn-logo-red.png" alt="OTN Logo" style="height:28px;width:auto;" />
        </div>
        <div class="footer-legal">
          All transactions are subject to our standard Terms of Trade which can be found at: otnoaseas@gmail.com &nbsp;|&nbsp; Page 2 of 2
        </div>
        <div class="footer-processed">
          <span>Processed By: &nbsp;${escapeHtml(invoice.createdBy || "-")}</span>
          <span>Print date: ${new Date().toLocaleDateString("en-GB")} ${new Date().toLocaleTimeString("en-GB", {hour:"2-digit",minute:"2-digit"})}</span>
        </div>
      </div>
    </div>
  </body></html>`;

  win.document.write(html);
  win.document.close();
};

const openScrapReport = (invoice: ClientInvoice) => {
  const scrapItems = invoice.policyBreakdown.filter(l => l.condition === "scrap");
  if (!scrapItems.length) {
    alert("No scrap items found for this client.");
    return;
  }
  const win = window.open("", "_blank");
  if (!win) { alert("Please allow popups to print reports"); return; }

  const rows = scrapItems.map(l => `
    <tr>
      <td>${escapeHtml(l.partNumber)}</td>
      <td>${escapeHtml(l.item)}</td>
      <td class="r">${l.quantity}</td>
      <td class="r">${currency.format(l.basePrice)}</td>
      <td class="r">${currency.format(l.lineTotal)}</td>
    </tr>`).join("");

  const totalScrap = scrapItems.reduce((s, l) => s + l.lineTotal, 0);
  const vatAmount = totalScrap * 0.16;
  const totalWithVat = totalScrap + vatAmount;

  const html = `<!doctype html><html><head>
    <title>Scrap Report - ${escapeHtml(invoice.client)}</title>
    <style>
      body{font-family:Arial,sans-serif;margin:24px;color:#111;font-size:12px}
      h1{margin:0 0 4px;font-size:16px;line-height:1.2}
      h2{margin:18px 0 6px;font-size:13px;border-bottom:1px solid #ccc;padding-bottom:4px}
      .header-grid{display:grid;grid-template-columns:1.1fr 1fr;gap:16px;align-items:start;margin-bottom:14px}
      .left-block{padding:8px 4px;display:grid;gap:10px}
      .right-block{display:grid;gap:8px}
      .brand-top{display:flex;align-items:center;gap:12px;margin-bottom:8px}
      .logo{width:88px;height:auto}
      .brand-title{font-size:18px;font-weight:800;line-height:1.15;color:#111827}
      .brand-subtitle{font-size:11px;color:#4b5563;margin-top:2px}
      .brand-meta{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:4px 10px;color:#374151;font-size:11px}
      .panel{border:1px solid #111827;border-radius:6px;padding:8px}
      .panel h3{margin:0 0 6px;font-size:12px;border-bottom:1px solid #e5e7eb;padding-bottom:4px;text-transform:uppercase}
      .client-panel h3{font-size:20px;border-bottom:none;padding-bottom:0;margin-bottom:8px}
      .client-address{white-space:pre-line;min-height:42px}
      .spacer{height:16px}
      .row{display:flex;align-items:flex-start;margin-bottom:3px}.lbl{width:112px;font-weight:700;color:#374151}.sep{width:10px;color:#6b7280}.val{flex:1}
      table{width:100%;border-collapse:collapse;margin-top:8px}
      th,td{border:1px solid #ddd;padding:6px 8px;text-align:left}
      th{background:#f5f5f5;font-size:11px}
      .r{text-align:right}
      .sum{max-width:360px;margin:14px 0 0 auto}
      .sum-row{display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid #eee}
      .sum-row.total{font-weight:700;border-top:2px solid #333;border-bottom:none;margin-top:6px;padding-top:8px;font-size:14px}
      .ft{margin-top:10px;font-size:11px;color:#555}
      .print-bar{position:sticky;top:0;z-index:999;display:flex;justify-content:flex-end;padding:10px 20px;background:rgba(255,255,255,.96);border-bottom:1px solid #ddd}
      .print-btn{border:1px solid #333;border-radius:6px;background:#111;color:#fff;padding:8px 14px;font-size:12px;font-weight:600;cursor:pointer}
      @media print{
        .print-bar{display:none}
        body{margin:0;padding:12px}
        .print-header{position:fixed;top:0;left:12px;right:12px;background:#fff;padding-top:8px}
        .print-content{margin-top:350px}
      }
    </style></head><body>
    <div class="print-bar"><button class="print-btn" onclick="window.print()">Print Scrap Report</button></div>
    ${renderAccountingReportHeader({
      documentTitle: "Scrap Items Report",
      documentNumber: invoice.quotationNumber,
      documentDate: invoice.createdDate,
      client: invoice.client,
      site: invoice.site,
      siteAddress: invoice.siteAddress || "-",
      contactName: invoice.contactName || "-",
      contactPhone: invoice.contactPhone || "-",
      createdBy: invoice.createdBy,
      extraRows: `<div class="row"><span class="lbl">Invoice No</span><span class="sep">:</span><span class="val">${escapeHtml(invoice.invoiceNumber)}</span></div>`,
    })}

    <div class="print-content">
      <h2>Scrap Items</h2>
      <table>
        <thead><tr>
          <th>Part No</th><th>Description</th><th class="r">Qty</th><th class="r">Unit Price (KES)</th><th class="r">Amount (KES)</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>

      <div class="sum">
        <div class="sum-row"><span>Scrap Total</span><strong>${currency.format(totalScrap)}</strong></div>
        <div class="sum-row"><span>VAT (16%)</span><strong>${currency.format(vatAmount)}</strong></div>
        <div class="sum-row total"><span>TOTAL DUE</span><span>${currency.format(totalWithVat)}</span></div>
      </div>

      <p class="ft">Scrap report for ${COMPANY_NAME}. All amounts in Kenya Shillings (KES).</p>
    </div>
  </body></html>`;

  win.document.write(html);
  win.document.close();
};

const openCustomerStatement = (
  invoice: ClientInvoice,
  allInvoices: ClientInvoice[],
  billingDateStr: string,
) => {
  const customerInvoices = allInvoices
    .filter((entry) => entry.client === invoice.client)
    .sort((a, b) => {
      const byDispatch = a.dispatchDate.localeCompare(b.dispatchDate);
      if (byDispatch !== 0) return byDispatch;
      return a.invoiceNumber.localeCompare(b.invoiceNumber);
    });

  if (!customerInvoices.length) {
    alert("No customer statement entries found for this client.");
    return;
  }

  const billingDate = asDateOrToday(billingDateStr);
  let runningBalance = 0;
  const rows = customerInvoices.map((entry) => {
    runningBalance += entry.grandTotal;
    return {
      entry,
      runningBalance,
    };
  });

  const totalDue = rows[rows.length - 1]?.runningBalance ?? 0;
  const ageing = {
    current: 0,
    d30: 0,
    d60: 0,
    d90: 0,
    d120: 0,
    d150: 0,
    d180: 0,
  };

  rows.forEach(({ entry }) => {
    const ageDays = Math.max(differenceInCalendarDays(billingDate, asDateOrToday(entry.dispatchDate)), 0);
    if (ageDays <= 30) ageing.current += entry.grandTotal;
    else if (ageDays <= 60) ageing.d30 += entry.grandTotal;
    else if (ageDays <= 90) ageing.d60 += entry.grandTotal;
    else if (ageDays <= 120) ageing.d90 += entry.grandTotal;
    else if (ageDays <= 150) ageing.d120 += entry.grandTotal;
    else if (ageDays <= 180) ageing.d150 += entry.grandTotal;
    else ageing.d180 += entry.grandTotal;
  });

  const win = window.open("", "_blank");
  if (!win) {
    alert("Please allow popups to print customer statements");
    return;
  }

  const statementRows = rows
    .map(({ entry, runningBalance: rowBalance }, idx) => `
      <tr>
        <td>${escapeHtml(entry.dispatchDate)}</td>
        <td>${escapeHtml(entry.invoiceNumber)}</td>
        <td>${escapeHtml(entry.site)}</td>
        <td>${escapeHtml(entry.quotationNumber)}</td>
        <td>${idx > 0 ? escapeHtml(rows[idx - 1].entry.invoiceNumber) : "-"}</td>
        <td class="r">${currency.format(entry.grandTotal)}</td>
        <td class="r">${currency.format(0)}</td>
        <td class="r">${currency.format(rowBalance)}</td>
      </tr>
    `)
    .join("");

  const html = `<!doctype html><html><head>
    <title>Customer Statement - ${escapeHtml(invoice.client)}</title>
    <style>
      body{font-family:Arial,sans-serif;margin:24px;color:#111;font-size:12px}
      h1{margin:0 0 4px;font-size:32px;line-height:1.1}
      .subtitle{font-size:12px;text-transform:uppercase;color:#4b5563;font-weight:700;letter-spacing:.04em}
      .header-grid{display:grid;grid-template-columns:1.1fr 1fr;gap:16px;align-items:start;margin-bottom:14px}
      .left-block{padding:8px 4px;display:grid;gap:10px}
      .right-block{display:grid;gap:8px}
      .brand-top{display:flex;align-items:center;gap:12px;margin-bottom:8px}
      .logo{width:88px;height:auto}
      .brand-title{font-size:18px;font-weight:800;line-height:1.15;color:#111827}
      .brand-subtitle{font-size:11px;color:#4b5563;margin-top:2px}
      .panel{border:1px solid #111827;border-radius:6px;padding:8px}
      .panel h3{margin:0 0 6px;font-size:12px;border-bottom:1px solid #e5e7eb;padding-bottom:4px;text-transform:uppercase}
      .client-panel h3{font-size:16px;border-bottom:none;padding-bottom:0;margin-bottom:8px}
      .client-address{white-space:pre-line;min-height:42px}
      .spacer{height:16px}
      .row{display:flex;align-items:flex-start;margin-bottom:3px}.lbl{width:112px;font-weight:700;color:#374151}.sep{width:10px;color:#6b7280}.val{flex:1}
      table{width:100%;border-collapse:collapse;margin-top:8px}
      th,td{border:1px solid #ddd;padding:6px 8px;text-align:left}
      th{background:#f5f5f5;font-size:11px}
      .r{text-align:right}
      .totals{display:grid;grid-template-columns:1fr auto;gap:8px;margin-top:10px}
      .total-due{font-size:13px;font-weight:700}
      .aging{margin-top:12px}
      .ft{margin-top:10px;font-size:11px;color:#555}
      .print-bar{position:sticky;top:0;z-index:999;display:flex;justify-content:flex-end;padding:10px 20px;background:rgba(255,255,255,.96);border-bottom:1px solid #ddd}
      .print-btn{border:1px solid #333;border-radius:6px;background:#111;color:#fff;padding:8px 14px;font-size:12px;font-weight:600;cursor:pointer}
      @media print{.print-bar{display:none} body{margin:0;padding:12px}}
    </style></head><body>
    <div class="print-bar"><button class="print-btn" onclick="window.print()">Print Customer Statement</button></div>
    <div class="header-grid">
      <div class="left-block">
        <div class="brand-top">
          <img src="${window.location.origin}/otn-logo.png" alt="Logo" class="logo"/>
          <div>
            <div class="brand-title">${COMPANY_NAME}</div>
            <div class="brand-subtitle">A Division of OTNO Access Group</div>
          </div>
        </div>
        <div class="panel client-panel">
          <h3>${escapeHtml(invoice.client)}</h3>
          <div class="client-address">${escapeHtml(invoice.siteAddress || "-")}</div>
          <div class="spacer"></div>
          <div class="row"><span class="lbl">Contact</span><span class="sep">:</span><span class="val">${escapeHtml(invoice.contactName || "-")}</span></div>
          <div class="row"><span class="lbl">Cell No</span><span class="sep">:</span><span class="val">${escapeHtml(invoice.contactPhone || "-")}</span></div>
        </div>
      </div>
      <div class="right-block">
        <h1>Customer Statement</h1>
        <div class="subtitle">(and settlement discount credit note)</div>
        <div class="panel">
          <h3>OTNO Access Solutions</h3>
          <div>${escapeHtml(COMPANY_ADDRESS)}</div>
          <div>${escapeHtml(COMPANY_LOCATION)}</div>
        </div>
        <div class="panel">
          <div class="row"><span class="lbl">Customer No</span><span class="sep">:</span><span class="val">${escapeHtml(invoice.accountNumber || "-")}</span></div>
          <div class="row"><span class="lbl">Date</span><span class="sep">:</span><span class="val">${escapeHtml(billingDateStr)}</span></div>
          <div class="row"><span class="lbl">Terms</span><span class="sep">:</span><span class="val">Net 30 Days</span></div>
          <div class="row"><span class="lbl">Deposit Held</span><span class="sep">:</span><span class="val">${currency.format(0)}</span></div>
          <div class="row"><span class="lbl">Credit Limit</span><span class="sep">:</span><span class="val">-</span></div>
          <div class="row"><span class="lbl">VAT No</span><span class="sep">:</span><span class="val">-</span></div>
        </div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Date</th><th>Document No</th><th>Site No</th><th>Order No</th><th>Prev Doc No</th>
          <th class="r">Amount (KES)</th><th class="r">Paid (KES)</th><th class="r">Balance (KES)</th>
        </tr>
      </thead>
      <tbody>${statementRows}</tbody>
    </table>

    <div class="totals">
      <div>
        <div><strong>Payment Details:</strong></div>
        <div>Account Name: OTNO ACCESS SOLUTIONS LIMITED</div>
        <div>KES Account Number: 02107773676350</div>
        <div>Bank Name: I&amp;M BANK LIMITED</div>
        <div>Branch Name: Changamwe</div>
        <div>Bank Code: 57</div>
        <div>Branch Code: 021</div>
        <div>Swift Code: IMBLKENA</div>
        <div>Mpesa Paybill Code: 542542</div>
      </div>
      <div class="total-due">Total Due: ${currency.format(totalDue)}</div>
    </div>

    <div class="aging">
      <table>
        <thead>
          <tr>
            <th>180+ Days</th><th>150 Days</th><th>120 Days</th><th>90 Days</th><th>60 Days</th><th>30 Days</th><th>Current</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="r">${currency.format(ageing.d180)}</td>
            <td class="r">${currency.format(ageing.d150)}</td>
            <td class="r">${currency.format(ageing.d120)}</td>
            <td class="r">${currency.format(ageing.d90)}</td>
            <td class="r">${currency.format(ageing.d60)}</td>
            <td class="r">${currency.format(ageing.d30)}</td>
            <td class="r">${currency.format(ageing.current)}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <p class="ft">Customer statement generated for ${escapeHtml(invoice.client)} by ${escapeHtml(COMPANY_NAME)}. All amounts in Kenya Shillings (KES).</p>
  </body></html>`;

  win.document.write(html);
  win.document.close();
};

const Accounting = () => {
  const navigate = useNavigate();
  const { data: quotations = [], isLoading } = useHireQuotations();
  const { data: maintenanceLogs = [] } = useMaintenanceLogs();
  const { data: scaffolds = [] } = useScaffolds();
  const { data: siteNameByQuotationAndNumber = new Map<string, string>() } = useQuery({
    queryKey: ["accounting-client-sites-name-map"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_sites")
        .select("quotation_id, site_number, site_name");

      if (error) throw error;

      const map = new Map<string, string>();
      (data ?? []).forEach((site) => {
        if (!site.quotation_id || !site.site_number || !site.site_name) return;
        map.set(`${site.quotation_id}:${site.site_number}`, site.site_name);
      });

      return map;
    },
  });
  const [billingDate, setBillingDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [selectedClient, setSelectedClient] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch profiles to resolve created_by UUIDs to names
  const { data: profilesMap = new Map<string, string>() } = useQuery({
    queryKey: ["profiles-name-map"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("user_id, full_name");
      const map = new Map<string, string>();
      (data ?? []).forEach((p) => map.set(p.user_id, p.full_name));
      return map;
    },
  });

  // Only quotations with dispatched items
  // Only quotations explicitly dispatched via Hire Delivery are eligible for billing
  const activeQuotations = useMemo(() => {
    return quotations.filter((q) => {
      const status = q.status?.toLowerCase() ?? "";
      return status === "dispatched" || status === "completed";
    });
  }, [quotations]);

  // Return policy surcharges from maintenance logs
  const surchargeMap = useMemo(() => {
    const scaffoldById = new Map(scaffolds.map((s) => [s.id, s]));
    const map = new Map<string, { total: number; entries: PolicyLineBreakdown[] }>();

    for (const log of maintenanceLogs) {
      const match = (log.issue_description ?? "").match(
        /Return condition:\s*(dirty|damaged|scrap)\.\s*Quantity:\s*(\d+(?:\.\d+)?)\.\s*Quotation:\s*([^.]+)\./i
      );
      if (!match) continue;

      const condition = match[1].toLowerCase() as "dirty" | "damaged" | "scrap";
      const quantity = Number.parseFloat(match[2]);
      const quotationNumber = match[3].trim();
      if (!quotationNumber || !Number.isFinite(quantity) || quantity <= 0) continue;

      const scaffold = scaffoldById.get(log.scaffold_id) as any;
      const partNumber = scaffold?.part_number || "-";
      const itemLabel = scaffold?.description || scaffold?.part_number || "Unknown item";
      const listHirePrice = scaffold?.weekly_rate ?? 0;
      const unitPrice = scaffold?.unit_price ?? 0;

      let charge = 0, basePrice = 0, multiplierLabel = "";
      if (condition === "dirty") {
        charge = quantity * listHirePrice * 2;
        basePrice = listHirePrice;
        multiplierLabel = "2× hire price";
      } else if (condition === "damaged") {
        charge = quantity * listHirePrice * 4;
        basePrice = listHirePrice;
        multiplierLabel = "4× hire price";
      } else if (condition === "scrap") {
        charge = quantity * unitPrice;
        basePrice = unitPrice;
        multiplierLabel = "Selling price";
      }

      if (charge > 0) {
        const existing = map.get(quotationNumber) ?? { total: 0, entries: [] };
        existing.total += charge;
        existing.entries.push({ partNumber, item: itemLabel, condition, quantity, basePrice, multiplierLabel, lineTotal: charge });
        map.set(quotationNumber, existing);
      }
    }
    return map;
  }, [maintenanceLogs, scaffolds]);

  // Build invoices
  const invoices = useMemo<ClientInvoice[]>(() => {
    const bd = asDateOrToday(billingDate);
    return activeQuotations.map((q, idx) => {
      const deliveryHistory = Array.isArray(q.delivery_history)
        ? (q.delivery_history as DeliveryHistorySiteRecord[])
        : [];
      const latestDeliveryWithSiteNumber = [...deliveryHistory]
        .reverse()
        .find((record) => typeof record.siteNumber === "string" && record.siteNumber.trim().length > 0);
      const siteNameFromSavedSite = latestDeliveryWithSiteNumber?.siteNumber
        ? siteNameByQuotationAndNumber.get(`${q.id}:${latestDeliveryWithSiteNumber.siteNumber}`)
        : undefined;

      const lineItems = q.line_items ?? [];
      // Use stored dispatch_date if available, then delivery history, then a stable fallback.
      const storedDispatchDate = q.dispatch_date;
      let dispatchDate: string;
      if (storedDispatchDate) {
        dispatchDate = toIsoDateOrToday(storedDispatchDate);
      } else {
        const historyDispatchDate = resolveDispatchDateFromHistory(q.delivery_history, q.id, q.quotation_number);
        if (historyDispatchDate) {
          dispatchDate = toIsoDateOrToday(historyDispatchDate);
        } else {
          const dispatchDates = lineItems
            .filter((li) => (li.delivered_quantity ?? 0) > 0)
            .map((li) => li.created_at ?? li.updated_at)
            .filter(Boolean)
            .sort();
          const dispatchDateRaw = dispatchDates[0] ?? q.created_at ?? q.updated_at;
          dispatchDate = toIsoDateOrToday(dispatchDateRaw);
        }
      }
      const hireDays = calculateBillableDays(dispatchDate, bd);
      const hireWeeks = billableDaysToWeeks(hireDays);
      const hireWeeksLabel = formatWeeksDaysLabel(hireDays);

      // Build a fallback qty map from delivery history in case line item quantities are 0
      const deliveryHistoryQtyMap = new Map<string, number>();
      for (const record of deliveryHistory) {
        if (!Array.isArray((record as { items?: unknown }).items)) continue;
        for (const item of (record as { items: { itemCode?: string; quantityDelivered?: number }[] }).items) {
          if (!item.itemCode) continue;
          const prev = deliveryHistoryQtyMap.get(item.itemCode) ?? 0;
          deliveryHistoryQtyMap.set(item.itemCode, prev + (item.quantityDelivered ?? 0));
        }
      }

      const hireBreakdown: HireLineBreakdown[] = lineItems.map((li) => {
        let qty = (li.delivered_quantity ?? 0) > 0 ? li.delivered_quantity : li.quantity ?? 0;
        // Fallback: if still 0, pull from delivery history by part number
        if (qty === 0 && li.part_number) {
          qty = deliveryHistoryQtyMap.get(li.part_number) ?? 0;
        }
        const weeklyRate = li.weekly_rate ?? 0;
        const discountRate = Math.min(Math.max(li.hire_discount ?? 0, 0), 100);
        const effectiveWeeklyRate = Math.max(weeklyRate * (1 - discountRate / 100), 0);
        // Exact fractional billing: days/7 * weekly rate (no ceiling rounding)
        const lineTotal = qty * effectiveWeeklyRate * hireWeeks;
        return {
          partNumber: li.part_number || "-",
          item: li.description || li.part_number || "Unnamed",
          quantity: qty,
          weeklyRate,
          discountRate,
          effectiveWeeklyRate,
          weeks: hireWeeks,
          weeksLabel: hireWeeksLabel,
          lineTotal,
        };
      });

      const hireTotal = hireBreakdown.reduce((s, l) => s + l.lineTotal, 0);
      const qNum = q.quotation_number || "Draft";
      const surcharge = surchargeMap.get(qNum) ?? { total: 0, entries: [] };

      return {
        id: q.id,
        invoiceNumber: q.invoice_number || deriveInvoiceNumber(qNum, idx),
        quotationNumber: qNum,
        accountNumber: q.account_number || "-",
        client: q.company_name || q.site_manager_name || "Unnamed client",
        site: siteNameFromSavedSite || q.site_name || "-",
        siteAddress: q.site_address || "",
        contactName: q.site_manager_name || "",
        contactPhone: q.site_manager_phone || "",
        contactEmail: q.site_manager_email || "",
        dispatchDate,
        hireDays,
        hireWeeks,
        hireWeeksLabel,
        hireTotal,
        policyTotal: surcharge.total,
        grandTotal: hireTotal + surcharge.total,
        hireBreakdown,
        policyBreakdown: surcharge.entries,
        createdBy: profilesMap.get(q.created_by) || q.created_by || "-",
        createdDate: toIsoDateOrToday(q.created_at),
        workflowStatus: q.status?.toLowerCase() ?? "",
      };
    });
  }, [activeQuotations, billingDate, surchargeMap, siteNameByQuotationAndNumber]);

  const uniqueClients = useMemo(
    () => Array.from(new Set(invoices.map((i) => i.client))).sort(),
    [invoices]
  );

  const filteredInvoices = useMemo(() => {
    let result = selectedClient === "all" ? invoices : invoices.filter((i) => i.client === selectedClient);
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter((i) =>
        i.client.toLowerCase().includes(q) ||
        i.site.toLowerCase().includes(q) ||
        i.quotationNumber.toLowerCase().includes(q) ||
        i.accountNumber.toLowerCase().includes(q) ||
        i.invoiceNumber.toLowerCase().includes(q)
      );
    }
    // Sort latest → earliest by dispatch date
    return [...result].sort((a, b) => b.dispatchDate.localeCompare(a.dispatchDate));
  }, [invoices, selectedClient, searchQuery]);

  const dispatchedInvoices = useMemo(
    () => filteredInvoices.filter((invoice) => invoice.workflowStatus === "dispatched"),
    [filteredInvoices]
  );

  const completedInvoices = useMemo(
    () => filteredInvoices.filter((invoice) => invoice.workflowStatus === "completed"),
    [filteredInvoices]
  );

  // Generate monthly invoices from dispatch date to billing date
  const generateMonthlyInvoices = (invoice: ClientInvoice) => {
    const dispatchDate = asDateOrToday(invoice.dispatchDate);
    const bd = asDateOrToday(billingDate);
    const months: { label: string; startDate: Date; endDate: Date }[] = [];
    let current = startOfMonth(dispatchDate);
    while (isBefore(current, bd) || format(current, "yyyy-MM") === format(bd, "yyyy-MM")) {
      const monthEnd = endOfMonth(current);
      // Always use the full end of month as the billing date for monthly invoices
      months.push({ label: format(current, "MMMM yyyy"), startDate: startOfMonth(current), endDate: monthEnd });
      current = addMonths(current, 1);
    }
    return months;
  };

  const openMonthlyInvoice = (invoice: ClientInvoice, monthStart: Date, monthEnd: Date, monthLabel: string) => {
    const monthBillingDate = format(monthEnd, "yyyy-MM-dd");
    const dispatchDate = asDateOrToday(invoice.dispatchDate);
    const isFirstBillingMonth = isSameMonth(monthStart, dispatchDate);
    const billingStartDate = isFirstBillingMonth ? dispatchDate : startOfMonth(monthStart);
    const billingStartIso = format(billingStartDate, "yyyy-MM-dd");
    const weeks = calculateMonthlyInvoiceWeeks(billingStartDate, monthEnd, isFirstBillingMonth);
    const monthDays = weeks * 7; // for monthly invoices keep whole-week multiples
    const monthWeeksLabel = formatWeeksDaysLabel(monthDays);
    const monthInvoice: ClientInvoice = {
      ...invoice,
      dispatchDate: billingStartIso,
      hireDays: monthDays,
      hireWeeks: weeks,
      hireWeeksLabel: monthWeeksLabel,
      invoiceNumber: `${invoice.invoiceNumber}-${format(monthEnd, "MMyy")}`,
      hireBreakdown: invoice.hireBreakdown.map((l) => ({
        ...l,
        weeks,
        weeksLabel: monthWeeksLabel,
        lineTotal: l.quantity * l.effectiveWeeklyRate * weeks,
      })),
      hireTotal: invoice.hireBreakdown.reduce((s, l) => s + l.quantity * l.effectiveWeeklyRate * weeks, 0),
      grandTotal: invoice.hireBreakdown.reduce((s, l) => s + l.quantity * l.effectiveWeeklyRate * weeks, 0) + invoice.policyTotal,
    };
    openInvoicePrint(monthInvoice, monthBillingDate);
  };

  const handleSidebarItemClick = (item: string) => {
    const routes: Record<string, string> = {
      dashboard: "/",
      sites: "/sites",
      "previous-clients": "/previous-clients",
      maintenance: "/maintenance-logs",
      revenue: "/revenue",
      settings: "/settings",
      "site-master-plan": "/site-master-plan",
    };
    if (["inventory", "workforce"].includes(item)) {
      navigate("/", { state: { activeItem: item }, replace: true });
    } else if (routes[item]) {
      navigate(routes[item]);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar activeItem="accounting" onItemClick={handleSidebarItemClick} />

      <main className="ml-0 md:ml-64">
        <Header
          title="Accounting"
          subtitle="Billing starts automatically from dispatch date. Select a date to generate invoices."
        />

        <div className="space-y-6 p-6">
          {/* Controls */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="pt-6 space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <CalendarDays className="h-4 w-4" />
                  Billing Date
                </div>
                <Input
                  type="date"
                  value={billingDate}
                  onChange={(e) => setBillingDate(e.target.value)}
                />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Users className="h-4 w-4" />
                  Filter Client
                </div>
                <Select value={selectedClient} onValueChange={setSelectedClient}>
                  <SelectTrigger><SelectValue placeholder="All clients" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Clients</SelectItem>
                    {uniqueClients.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Search className="h-4 w-4" />
                  Search
                </div>
                <Input
                  type="text"
                  placeholder="Client, site, quotation no..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <DollarSign className="h-4 w-4" />
                  Total Billing (KES)
                </div>
                <p className="text-3xl font-bold">{currency.format(filteredInvoices.reduce((s, i) => s + i.grandTotal, 0))}</p>
                <p className="text-xs text-muted-foreground mt-1">{filteredInvoices.length} active client(s)</p>
              </CardContent>
            </Card>
          </div>

          {/* Client Invoices */}
          <Card>
            <CardHeader>
              <CardTitle>Client Billing</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-sm text-muted-foreground">Loading...</p>
              ) : filteredInvoices.length ? (
                <div className="space-y-6">
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Dispatched Workflows</h3>
                    {dispatchedInvoices.length ? (
                      <div className="overflow-x-auto rounded-lg border border-border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Invoice</TableHead>
                              <TableHead>Client</TableHead>
                              <TableHead>Site</TableHead>
                              <TableHead>Dispatch Date</TableHead>
                              <TableHead className="text-right">Weeks</TableHead>
                              <TableHead className="text-right">Hire (KES)</TableHead>
                              <TableHead className="text-right">Policy (KES)</TableHead>
                              <TableHead className="text-right">Total (KES)</TableHead>
                              <TableHead className="text-center">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {dispatchedInvoices.map((inv) => (
                              <TableRow key={inv.id}>
                                <TableCell>
                                  <div className="font-medium">{inv.invoiceNumber}</div>
                                  <div className="text-xs text-muted-foreground">{inv.quotationNumber}</div>
                                </TableCell>
                                <TableCell className="font-medium">{inv.client}</TableCell>
                                <TableCell>{inv.site}</TableCell>
                                <TableCell>{inv.dispatchDate}</TableCell>
                                <TableCell className="text-right">{inv.hireWeeksLabel}</TableCell>
                                <TableCell className="text-right">{currency.format(inv.hireTotal)}</TableCell>
                                <TableCell className="text-right">
                                  {inv.policyTotal > 0 ? (
                                    <span className="text-destructive font-medium">{currency.format(inv.policyTotal)}</span>
                                  ) : (
                                    <span className="text-muted-foreground">-</span>
                                  )}
                                </TableCell>
                                <TableCell className="text-right font-bold">{currency.format(inv.grandTotal)}</TableCell>
                                <TableCell className="text-center">
                                  <div className="flex items-center justify-center">
                                    <Select
                                      onValueChange={(action) => {
                                        if (action === "dds") {
                                          openInvoicePrint(inv, billingDate);
                                          return;
                                        }

                                        if (action === "scrap") {
                                          openScrapReport(inv);
                                          return;
                                        }

                                        if (action === "customer-statement") {
                                          openCustomerStatement(inv, invoices, billingDate);
                                          return;
                                        }

                                        if (action.startsWith("monthly:")) {
                                          const monthIdx = Number(action.replace("monthly:", ""));
                                          const months = generateMonthlyInvoices(inv);
                                          const m = months[monthIdx];
                                          if (m) openMonthlyInvoice(inv, m.startDate, m.endDate, m.label);
                                        }
                                      }}
                                    >
                                      <SelectTrigger className="h-8 w-[180px] text-xs">
                                        <SelectValue placeholder="Reports" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="dds">Tax Invoice Copy</SelectItem>
                                        <SelectItem
                                          value="scrap"
                                          disabled={inv.policyBreakdown.filter((l) => l.condition === "scrap").length === 0}
                                        >
                                          Scrap Report
                                        </SelectItem>
                                        <SelectItem value="customer-statement">
                                          Customer Statement
                                        </SelectItem>
                                        {generateMonthlyInvoices(inv).map((m, idx) => (
                                          <SelectItem key={idx} value={`monthly:${idx}`}>
                                            Tax Invoice: {m.label}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                        No dispatched workflows match the current filters.
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Completed Workflows</h3>
                    {completedInvoices.length ? (
                      <div className="overflow-x-auto rounded-lg border border-border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Invoice</TableHead>
                              <TableHead>Client</TableHead>
                              <TableHead>Site</TableHead>
                              <TableHead>Dispatch Date</TableHead>
                              <TableHead className="text-right">Weeks</TableHead>
                              <TableHead className="text-right">Hire (KES)</TableHead>
                              <TableHead className="text-right">Policy (KES)</TableHead>
                              <TableHead className="text-right">Total (KES)</TableHead>
                              <TableHead className="text-center">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {completedInvoices.map((inv) => (
                              <TableRow key={inv.id}>
                                <TableCell>
                                  <div className="font-medium">{inv.invoiceNumber}</div>
                                  <div className="text-xs text-muted-foreground">{inv.quotationNumber}</div>
                                </TableCell>
                                <TableCell className="font-medium">{inv.client}</TableCell>
                                <TableCell>{inv.site}</TableCell>
                                <TableCell>{inv.dispatchDate}</TableCell>
                                <TableCell className="text-right">{inv.hireWeeksLabel}</TableCell>
                                <TableCell className="text-right">{currency.format(inv.hireTotal)}</TableCell>
                                <TableCell className="text-right">
                                  {inv.policyTotal > 0 ? (
                                    <span className="text-destructive font-medium">{currency.format(inv.policyTotal)}</span>
                                  ) : (
                                    <span className="text-muted-foreground">-</span>
                                  )}
                                </TableCell>
                                <TableCell className="text-right font-bold">{currency.format(inv.grandTotal)}</TableCell>
                                <TableCell className="text-center">
                                  <div className="flex items-center justify-center">
                                    <Select
                                      onValueChange={(action) => {
                                        if (action === "dds") {
                                          openInvoicePrint(inv, billingDate);
                                          return;
                                        }

                                        if (action === "scrap") {
                                          openScrapReport(inv);
                                          return;
                                        }

                                        if (action === "customer-statement") {
                                          openCustomerStatement(inv, invoices, billingDate);
                                          return;
                                        }

                                        if (action.startsWith("monthly:")) {
                                          const monthIdx = Number(action.replace("monthly:", ""));
                                          const months = generateMonthlyInvoices(inv);
                                          const m = months[monthIdx];
                                          if (m) openMonthlyInvoice(inv, m.startDate, m.endDate, m.label);
                                        }
                                      }}
                                    >
                                      <SelectTrigger className="h-8 w-[180px] text-xs">
                                        <SelectValue placeholder="Reports" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="dds">Tax Invoice Copy</SelectItem>
                                        <SelectItem
                                          value="scrap"
                                          disabled={inv.policyBreakdown.filter((l) => l.condition === "scrap").length === 0}
                                        >
                                          Scrap Report
                                        </SelectItem>
                                        <SelectItem value="customer-statement">
                                          Customer Statement
                                        </SelectItem>
                                        {generateMonthlyInvoices(inv).map((m, idx) => (
                                          <SelectItem key={idx} value={`monthly:${idx}`}>
                                            Tax Invoice: {m.label}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                        No completed workflows found yet. Completed workflows include returned goods.
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                  No dispatched quotations found. Billing appears here once goods are dispatched.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Hire Quotations Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5" />
                Hire Quotations
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-sm text-muted-foreground">Loading...</p>
              ) : (() => {
                const allQuotations = quotations.filter((q) => {
                  if (searchQuery.trim()) {
                    const s = searchQuery.trim().toLowerCase();
                    return (
                      (q.company_name || "").toLowerCase().includes(s) ||
                      (q.site_name || "").toLowerCase().includes(s) ||
                      (q.quotation_number || "").toLowerCase().includes(s) ||
                      (q.site_manager_name || "").toLowerCase().includes(s)
                    );
                  }
                  if (selectedClient !== "all") {
                    return (q.company_name || q.site_manager_name || "Unnamed client") === selectedClient;
                  }
                  return true;
                // Sort latest → earliest by created_at
                }).sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""));
                return allQuotations.length ? (
                <div className="overflow-x-auto rounded-lg border border-border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Quotation No</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>Site</TableHead>
                        <TableHead>Site Address</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Items</TableHead>
                        <TableHead className="text-center">Print</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allQuotations.map((q) => {
                        const lineItems = q.line_items ?? [];
                        const client = q.company_name || q.site_manager_name || "Unnamed client";
                        return (
                          <TableRow key={q.id}>
                            <TableCell className="font-mono font-medium">{q.quotation_number || "Draft"}</TableCell>
                            <TableCell className="font-medium">{client}</TableCell>
                            <TableCell>{q.site_name || "-"}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{q.site_address || "-"}</TableCell>
                            <TableCell>
                              <Badge variant={q.status === "dispatched" || q.status === "completed" ? "default" : "secondary"} className="capitalize">
                                {q.status || "draft"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">{lineItems.length}</TableCell>
                            <TableCell className="text-center">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  const reportData: HireQuotationReportData = {
                                    companyName: client,
                                    contactName: q.site_manager_name || "",
                                    contactPhone: q.site_manager_phone || "",
                                    contactEmail: q.site_manager_email || "",
                                    officeTel: "",
                                    officeEmail: "",
                                    siteName: q.site_name || "",
                                    siteLocation: q.site_address || "",
                                    siteAddress: q.site_address || "",
                                    quotationNumber: q.quotation_number || "Draft",
                                    dateCreated: format(asDateOrToday(q.created_at), "yyyy-MM-dd"),
                                    createdBy: profilesMap.get(q.created_by) || q.created_by || "-",
                                    discountRate: 0,
                                    clientId: q.client_id || "",
                                    items: lineItems.map((li) => {
                                      const qty = (li.delivered_quantity ?? 0) > 0 ? li.delivered_quantity : li.quantity ?? 0;
                                      const rate = li.weekly_rate ?? 0;
                                      const disc = li.hire_discount ?? 0;
                                      const effectiveRate = rate * (1 - Math.min(Math.max(disc, 0), 100) / 100);
                                      return {
                                        partNumber: li.part_number || "-",
                                        description: li.description || "-",
                                        quantity: qty,
                                        warehouseAvailableQty: 0,
                                        massPerItem: li.mass_per_item ?? 0,
                                        weeklyRate: rate,
                                        weeklyTotal: effectiveRate * qty,
                                        discountRate: disc,
                                      };
                                    }),
                                  };
                                  generateHireQuotationReportPDF(reportData);
                                }}
                              >
                                <Printer className="h-3.5 w-3.5 mr-1" />
                                Print Quotation
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                  No quotations found.
                </div>
              );
              })()}
            </CardContent>
          </Card>

          {/* Policy reminder */}
          <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
            <strong>Billing Policy:</strong> Dirty equipment → 2× list hire price · Damaged equipment → 4× list hire price · Scrap equipment → selling price (unit price).
            <span className="ml-2">All invoices include 16% VAT.</span>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Accounting;
