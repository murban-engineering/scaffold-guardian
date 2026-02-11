import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { endOfMonth, format } from "date-fns";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { useHireQuotations } from "@/hooks/useHireQuotations";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const currency = new Intl.NumberFormat("en-KE", {
  style: "currency",
  currency: "KES",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const BILLING_POLICY = [
  { key: "dirty", label: "Dirty Equipment", multiplierLabel: "2X list hire price" },
  { key: "damaged", label: "Damaged Equipment", multiplierLabel: "4X list hire price" },
  { key: "scrap", label: "Scrap Equipment", multiplierLabel: "Unit price" },
] as const;

const Accounting = () => {
  const navigate = useNavigate();
  const { data: quotations = [], isLoading } = useHireQuotations();
  const [billingMode, setBillingMode] = useState("month-end");

  const returnProcessedQuotations = useMemo(() => {
    return quotations.filter((quotation) => quotation.status?.toLowerCase() === "completed");
  }, [quotations]);

  const billingDate = useMemo(() => endOfMonth(new Date()), []);

  const invoices = useMemo(() => {
    return returnProcessedQuotations.map((quotation, index) => {
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

      return {
        id: quotation.id,
        invoiceNumber: `INV-${format(billingDate, "yyyyMM")}-${String(index + 1).padStart(4, "0")}`,
        quotationNumber: quotation.quotation_number || "Draft",
        client: quotation.company_name || quotation.site_manager_name || "Unnamed client",
        site: quotation.site_name || "No site name",
        itemCount,
        subtotal,
      };
    });
  }, [returnProcessedQuotations, billingDate]);

  const totalMonthBilling = invoices.reduce((sum, invoice) => sum + invoice.subtotal, 0);

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
          subtitle="Month-end billing in Kenya Shilling (KES), with invoices generated after hire return is processed."
        />

        <div className="space-y-6 p-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Billing cycle</CardTitle>
                <CardDescription>Automatic billing date</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-2xl font-semibold">{format(billingDate, "dd MMM yyyy")}</div>
                <div>
                  <Select value={billingMode} onValueChange={setBillingMode}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose billing mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="month-end">Bill at end of every month</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Invoices ready</CardTitle>
                <CardDescription>Hire returns already processed</CardDescription>
              </CardHeader>
              <CardContent className="text-2xl font-semibold">{invoices.length}</CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Projected billing</CardTitle>
                <CardDescription>Total invoice value for this cycle</CardDescription>
              </CardHeader>
              <CardContent className="text-2xl font-semibold">{currency.format(totalMonthBilling)}</CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Billing policy</CardTitle>
              <CardDescription>Charges applied after hire return by equipment condition</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                {BILLING_POLICY.map((rule) => (
                  <li key={rule.key} className="rounded-md border border-border px-3 py-2">
                    <span className="font-semibold">{rule.label}:</span> {rule.multiplierLabel}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Generated invoices (KES)</CardTitle>
              <CardDescription>
                Invoices are queued only after hire return is completed, then billed automatically at month-end.
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
                          <TableHead className="text-right">Amount (KES)</TableHead>
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
                            <TableCell className="text-right font-semibold">{currency.format(invoice.subtotal)}</TableCell>
                            <TableCell>
                              <Badge variant="secondary">Scheduled {format(billingDate, "dd MMM")}</Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                    Invoicing rule: once a hire return is processed and the quotation status becomes completed, the client is
                    queued automatically for month-end KES billing.
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                  No completed hire returns found yet. Process a hire return to generate an invoice in accounting.
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
