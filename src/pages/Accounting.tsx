import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { endOfMonth, format } from "date-fns";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { useHireQuotations } from "@/hooks/useHireQuotations";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const currency = new Intl.NumberFormat("en-ZA", {
  style: "currency",
  currency: "ZAR",
  minimumFractionDigits: 2,
});

const Accounting = () => {
  const navigate = useNavigate();
  const { data: quotations = [], isLoading } = useHireQuotations();

  const approvedQuotations = useMemo(() => {
    return quotations.filter((quotation) => {
      const status = quotation.status?.toLowerCase();
      return status === "approved" || status === "converted" || status === "completed";
    });
  }, [quotations]);

  const billingDate = useMemo(() => endOfMonth(new Date()), []);

  const invoices = useMemo(() => {
    return approvedQuotations.map((quotation, index) => {
      const lineItems = quotation.line_items ?? [];
      const returnBillings = quotation.return_billings ?? [];
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

      const returnCharge = returnBillings.reduce((sum, billing) => sum + (billing.charge_amount ?? 0), 0);

      return {
        id: quotation.id,
        invoiceNumber: `INV-${format(billingDate, "yyyyMM")}-${String(index + 1).padStart(4, "0")}`,
        quotationNumber: quotation.quotation_number || "Draft",
        client: quotation.company_name || quotation.site_manager_name || "Unnamed client",
        site: quotation.site_name || "No site name",
        itemCount,
        subtotal,
        returnCharge,
        totalDue: subtotal + returnCharge,
      };
    });
  }, [approvedQuotations, billingDate]);

  const totalMonthBilling = invoices.reduce((sum, invoice) => sum + invoice.totalDue, 0);

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
          subtitle="Bills are generated monthly, with return-condition policy charges applied after hire return processing."
        />

        <div className="space-y-6 p-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Billing cycle</CardTitle>
                <CardDescription>Automatic month-end billing date</CardDescription>
              </CardHeader>
              <CardContent className="text-2xl font-semibold">
                {format(billingDate, "dd MMM yyyy")}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Clients queued</CardTitle>
                <CardDescription>Approved clients linked to items</CardDescription>
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
              <CardTitle>Auto-generated monthly invoices</CardTitle>
              <CardDescription>
                Invoice drafts are created automatically for approved clients using their quotation line items.
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
                          <TableHead className="text-right">Hire Amount</TableHead>
                          <TableHead className="text-right">Return Charges</TableHead>
                          <TableHead className="text-right">Total Due</TableHead>
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
                            <TableCell className="text-right">{currency.format(invoice.returnCharge)}</TableCell>
                            <TableCell className="text-right font-semibold">{currency.format(invoice.totalDue)}</TableCell>
                            <TableCell>
                              <Badge variant="secondary">Scheduled {format(billingDate, "dd MMM")}</Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                    Monthly billing automation rule: approved quotations are billed at month-end. Once hire return is processed,
                    additional charges are added by policy: dirty equipment at 2× list hire price, damaged at 4× list hire price,
                    and lost equipment at selling price. Item unit prices are sourced from inventory and stored in the database.
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                  No approved clients found. Once a quotation is approved, it will automatically appear here for month-end billing.
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
