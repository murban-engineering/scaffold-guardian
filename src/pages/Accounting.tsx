import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { endOfMonth, format } from "date-fns";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { useHireQuotations } from "@/hooks/useHireQuotations";
import { useMaintenanceLogs } from "@/hooks/useMaintenanceLogs";
import { useScaffolds } from "@/hooks/useScaffolds";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type BillingMode = "month-end" | "custom-date";

type AccountingInvoice = {
  id: string;
  invoiceNumber: string;
  quotationNumber: string;
  client: string;
  site: string;
  itemCount: number;
  subtotal: number;
  surcharge: number;
  total: number;
  amountDue: number;
  generatedDate: string;
};

const currency = new Intl.NumberFormat("en-KE", {
  style: "currency",
  currency: "KES",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const asDateOrToday = (value: string) => {
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
};

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const openPrintableReport = (invoice: AccountingInvoice, selectedDate: string) => {
  const reportWindow = window.open("", "_blank");
  if (!reportWindow) {
    alert("Please allow popups for this site to print reports");
    return;
  }

  const hasPolicyCharge = invoice.surcharge > 0;
  const html = `
    <!doctype html>
    <html>
      <head>
        <title>Client Accounting Report - ${escapeHtml(invoice.client)}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 24px; color: #111; }
          h1 { margin: 0 0 6px; }
          h2 { margin: 22px 0 8px; font-size: 18px; }
          .meta { margin: 0 0 16px; color: #444; }
          .meta p { margin: 3px 0; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td { border: 1px solid #d8d8d8; padding: 8px; text-align: left; }
          th { background: #f5f5f5; }
          .text-right { text-align: right; }
          .summary { margin-top: 16px; max-width: 420px; margin-left: auto; }
          .summary-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #e8e8e8; }
          .summary-row.total { font-weight: 700; border-top: 2px solid #333; border-bottom: none; margin-top: 8px; padding-top: 10px; }
          .footnote { margin-top: 12px; font-size: 12px; color: #444; }
        </style>
      </head>
      <body>
        <h1>Client Dispatch & Return Report</h1>
        <p class="meta">Generated for accounting date: ${escapeHtml(selectedDate)}</p>
        <div class="meta">
          <p><strong>Client:</strong> ${escapeHtml(invoice.client)}</p>
          <p><strong>Site:</strong> ${escapeHtml(invoice.site)}</p>
          <p><strong>Invoice:</strong> ${escapeHtml(invoice.invoiceNumber)}</p>
          <p><strong>Quotation:</strong> ${escapeHtml(invoice.quotationNumber)}</p>
        </div>

        <h2>Charges</h2>
        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th class="text-right">Amount (KES)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Hire per week charges</td>
              <td class="text-right">${currency.format(invoice.subtotal)}</td>
            </tr>
            <tr>
              <td>Hire return policy charges</td>
              <td class="text-right">${currency.format(invoice.surcharge)}</td>
            </tr>
          </tbody>
        </table>

        <div class="summary">
          <div class="summary-row"><span>Hire per week</span><strong>${currency.format(invoice.subtotal)}</strong></div>
          <div class="summary-row"><span>Return policy charges</span><strong>${currency.format(invoice.surcharge)}</strong></div>
          <div class="summary-row total"><span>Total due</span><span>${currency.format(invoice.total)}</span></div>
        </div>

        ${hasPolicyCharge ? '<p class="footnote">Return-condition policy charges included: dirty equipment at 2× list hire, damaged at 4× list hire, scrap at unit price.</p>' : ""}
      </body>
    </html>
  `;

  reportWindow.document.write(html);
  reportWindow.document.close();
  reportWindow.focus();
  reportWindow.print();
};

const Accounting = () => {
  const navigate = useNavigate();
  const { data: quotations = [], isLoading } = useHireQuotations();
  const { data: maintenanceLogs = [] } = useMaintenanceLogs();
  const { data: scaffolds = [] } = useScaffolds();
  const [billingMode, setBillingMode] = useState<BillingMode>("month-end");
  const [customBillingDate, setCustomBillingDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [invoiceLookupDate, setInvoiceLookupDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [selectedClient, setSelectedClient] = useState("all-clients");

  const dispatchReadyQuotations = useMemo(() => {
    return quotations.filter((quotation) => {
      const status = quotation.status?.toLowerCase() ?? "";
      const hasDeliveredItems = (quotation.line_items ?? []).some((item) => (item.delivered_quantity ?? 0) > 0);
      return status === "dispatched" || status === "completed" || hasDeliveredItems;
    });
  }, [quotations]);

  const billingDate = useMemo(() => {
    if (billingMode === "custom-date") {
      return asDateOrToday(customBillingDate);
    }
    return endOfMonth(new Date());
  }, [billingMode, customBillingDate]);

  const surchargeByQuotation = useMemo(() => {
    const scaffoldById = new Map(scaffolds.map((scaffold) => [scaffold.id, scaffold]));
    const surchargeMap = new Map<string, number>();

    for (const log of maintenanceLogs) {
      const message = log.issue_description ?? "";
      const match = message.match(
        /Return condition:\s*(dirty|damaged|scrap)\.\s*Quantity:\s*(\d+(?:\.\d+)?)\.\s*Quotation:\s*([^.]+)\./i
      );
      if (!match) continue;

      const condition = match[1].toLowerCase();
      const quantity = Number.parseFloat(match[2]);
      const quotationNumber = match[3].trim();
      if (!quotationNumber || !Number.isFinite(quantity) || quantity <= 0) continue;

      const scaffold = scaffoldById.get(log.scaffold_id);
      const listHirePrice = scaffold?.weekly_rate ?? 0;
      const unitPrice = (scaffold as { unit_price?: number | null } | undefined)?.unit_price ?? 0;

      let charge = 0;
      if (condition === "dirty") {
        charge = quantity * listHirePrice * 2;
      } else if (condition === "damaged") {
        charge = quantity * listHirePrice * 4;
      } else if (condition === "scrap") {
        charge = quantity * unitPrice;
      }

      if (charge > 0) {
        surchargeMap.set(quotationNumber, (surchargeMap.get(quotationNumber) ?? 0) + charge);
      }
    }

    return surchargeMap;
  }, [maintenanceLogs, scaffolds]);

  const invoices = useMemo<AccountingInvoice[]>(() => {
    return dispatchReadyQuotations.map((quotation, index) => {
      const lineItems = quotation.line_items ?? [];
      const itemCount = lineItems.reduce((sum, item) => sum + (item.quantity ?? 0), 0);
      const subtotal = lineItems.reduce((sum, item) => {
        if (item.weekly_total != null) {
          return sum + item.weekly_total;
        }
        const quantity = item.quantity ?? 0;
        const weeklyRate = item.weekly_rate ?? 0;
        const discountRate = Math.min(Math.max(item.hire_discount ?? 0, 0), 100) / 100;
        return sum + Math.max(weeklyRate * (1 - discountRate), 0) * quantity;
      }, 0);

      const quotationNumber = quotation.quotation_number || "Draft";
      const surcharge = surchargeByQuotation.get(quotationNumber) ?? 0;
      const total = subtotal + surcharge;
      const client = quotation.company_name || quotation.site_manager_name || "Unnamed client";

      return {
        id: quotation.id,
        invoiceNumber: `INV-${format(billingDate, "yyyyMMdd")}-${String(index + 1).padStart(4, "0")}`,
        quotationNumber,
        client,
        site: quotation.site_name || "No site name",
        itemCount,
        subtotal,
        surcharge,
        total,
        amountDue: total,
        generatedDate: format(billingDate, "yyyy-MM-dd"),
      };
    });
  }, [dispatchReadyQuotations, billingDate, surchargeByQuotation]);

  const uniqueClients = useMemo(() => {
    return Array.from(new Set(invoices.map((invoice) => invoice.client))).sort((a, b) => a.localeCompare(b));
  }, [invoices]);

  const invoiceLookupResults = useMemo(() => {
    return invoices.filter((invoice) => {
      const matchesDate = invoice.generatedDate === invoiceLookupDate;
      const matchesClient = selectedClient === "all-clients" || invoice.client === selectedClient;
      return matchesDate && matchesClient;
    });
  }, [invoices, invoiceLookupDate, selectedClient]);

  const totalMonthBilling = invoices.reduce((sum, invoice) => sum + invoice.total, 0);
  const totalDueForLookup = invoiceLookupResults.reduce((sum, invoice) => sum + invoice.amountDue, 0);

  const handleSidebarItemClick = (item: string) => {
    if (item === "dashboard") {
      navigate("/", { state: { activeItem: "dashboard" }, replace: true });
      return;
    }
    if (item === "inventory" || item === "workforce") {
      navigate("/", { state: { activeItem: item }, replace: true });
      return;
    }
    if (item === "sites") {
      navigate("/sites");
      return;
    }
    if (item === "previous-clients") {
      navigate("/previous-clients");
      return;
    }
    if (item === "maintenance") {
      navigate("/maintenance-logs");
      return;
    }
    if (item === "revenue") {
      navigate("/revenue");
      return;
    }
    if (item === "settings") {
      navigate("/settings");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar activeItem="accounting" onItemClick={handleSidebarItemClick} />

      <main className="ml-0 md:ml-64">
        <Header
          title="Accounting"
          subtitle="Dispatched workflows automatically flow into billing. Generate monthly or date-specific invoices in KES."
        />

        <div className="space-y-6 p-6">
          <div className="grid gap-4 xl:grid-cols-4">
            <Card className="xl:col-span-2">
              <CardHeader>
                <CardTitle>Billing setup</CardTitle>
                <CardDescription>Choose monthly billing or generate invoice at a custom date.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Select value={billingMode} onValueChange={(value) => setBillingMode(value as BillingMode)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select billing option" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="month-end">Monthly billing (end of month)</SelectItem>
                    <SelectItem value="custom-date">Generate invoice on selected date</SelectItem>
                  </SelectContent>
                </Select>

                {billingMode === "custom-date" ? (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Invoice date</p>
                    <Input
                      type="date"
                      value={customBillingDate}
                      onChange={(event) => setCustomBillingDate(event.target.value)}
                    />
                  </div>
                ) : null}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Billing date</CardTitle>
                <CardDescription>Current invoice run date</CardDescription>
              </CardHeader>
              <CardContent className="text-2xl font-semibold">{format(billingDate, "dd MMM yyyy")}</CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Projected billing (KES)</CardTitle>
                <CardDescription>Includes return-condition policy charges</CardDescription>
              </CardHeader>
              <CardContent className="text-2xl font-semibold">{currency.format(totalMonthBilling)}</CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Invoice lookup</CardTitle>
              <CardDescription>Open any client's invoice by date and see amount due.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Invoice date</p>
                  <Input
                    type="date"
                    value={invoiceLookupDate}
                    onChange={(event) => setInvoiceLookupDate(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Client</p>
                  <Select value={selectedClient} onValueChange={setSelectedClient}>
                    <SelectTrigger>
                      <SelectValue placeholder="All clients" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all-clients">All clients</SelectItem>
                      {uniqueClients.map((client) => (
                        <SelectItem key={client} value={client}>
                          {client}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Card className="border-dashed">
                  <CardContent className="flex h-full items-center justify-between py-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Amount due on {format(asDateOrToday(invoiceLookupDate), "dd MMM yyyy")}</p>
                      <p className="text-2xl font-semibold">{currency.format(totalDueForLookup)}</p>
                    </div>
                    <Button variant="outline" onClick={() => setSelectedClient("all-clients")}>Reset</Button>
                  </CardContent>
                </Card>
              </div>

              <div className="overflow-x-auto rounded-lg border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Site</TableHead>
                      <TableHead className="text-right">Amount due</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoiceLookupResults.length ? (
                      invoiceLookupResults.map((invoice) => (
                        <TableRow key={`lookup-${invoice.id}`}>
                          <TableCell>
                            <div className="font-medium">{invoice.invoiceNumber}</div>
                            <div className="text-xs text-muted-foreground">{invoice.generatedDate}</div>
                          </TableCell>
                          <TableCell>{invoice.client}</TableCell>
                          <TableCell>{invoice.site}</TableCell>
                          <TableCell className="text-right font-semibold">{currency.format(invoice.amountDue)}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-sm text-muted-foreground">
                          No invoices found for this date/client selection.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Client reports</CardTitle>
              <CardDescription>
                Print a client report for dispatched workflows on the selected date, including weekly hire and return policy charges.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {invoiceLookupResults.length ? (
                <div className="overflow-x-auto rounded-lg border border-border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Client</TableHead>
                        <TableHead>Invoice</TableHead>
                        <TableHead className="text-right">Hire per week</TableHead>
                        <TableHead className="text-right">Policy charge</TableHead>
                        <TableHead className="text-right">Total due</TableHead>
                        <TableHead className="text-right">Report</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoiceLookupResults.map((invoice) => (
                        <TableRow key={`report-${invoice.id}`}>
                          <TableCell>{invoice.client}</TableCell>
                          <TableCell>
                            <div className="font-medium">{invoice.invoiceNumber}</div>
                            <div className="text-xs text-muted-foreground">{invoice.generatedDate}</div>
                          </TableCell>
                          <TableCell className="text-right">{currency.format(invoice.subtotal)}</TableCell>
                          <TableCell className="text-right">{currency.format(invoice.surcharge)}</TableCell>
                          <TableCell className="text-right font-semibold">{currency.format(invoice.total)}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openPrintableReport(invoice, invoiceLookupDate)}
                            >
                              Print report
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                  Select a billing date and client above to generate printable dispatch and return reports.
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Dispatch-ready billing queue</CardTitle>
              <CardDescription>
                Workflows appear here once dispatch is done (or after return completion). Amounts include return-condition policy charges.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-sm text-muted-foreground">Loading accounting pipeline...</p>
              ) : invoices.length ? (
                <div className="space-y-4">
                  <div className="overflow-x-auto rounded-lg border border-border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Invoice</TableHead>
                          <TableHead>Client</TableHead>
                          <TableHead>Site</TableHead>
                          <TableHead className="text-right">Items</TableHead>
                          <TableHead className="text-right">Hire amount</TableHead>
                          <TableHead className="text-right">Policy charge</TableHead>
                          <TableHead className="text-right">Invoice total</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {invoices.map((invoice) => (
                          <TableRow key={invoice.id}>
                            <TableCell>
                              <div className="font-medium">{invoice.invoiceNumber}</div>
                              <div className="text-xs text-muted-foreground">From quotation {invoice.quotationNumber}</div>
                            </TableCell>
                            <TableCell>{invoice.client}</TableCell>
                            <TableCell>{invoice.site}</TableCell>
                            <TableCell className="text-right">{invoice.itemCount}</TableCell>
                            <TableCell className="text-right">{currency.format(invoice.subtotal)}</TableCell>
                            <TableCell className="text-right">{currency.format(invoice.surcharge)}</TableCell>
                            <TableCell className="text-right font-semibold">{currency.format(invoice.total)}</TableCell>
                            <TableCell>
                              <Badge variant="secondary">Ready {format(billingDate, "dd MMM")}</Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                    Billing policy applied in accounting (KES): Dirty equipment is charged at 2× list hire price, damaged equipment is charged at 4× list hire price, and scrap equipment is charged at unit price.
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                  No dispatched workflows yet. Once a dispatch is completed in Hire Delivery, its invoice will automatically appear here.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Accounting;
