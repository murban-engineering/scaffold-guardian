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

type BillingMode = "month-end";

const currency = new Intl.NumberFormat("en-KE", {
  style: "currency",
  currency: "KES",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const Accounting = () => {
  const navigate = useNavigate();
  const { data: quotations = [], isLoading } = useHireQuotations();
  const { data: maintenanceLogs = [] } = useMaintenanceLogs();
  const { data: scaffolds = [] } = useScaffolds();
  const [billingMode, setBillingMode] = useState<BillingMode>("month-end");

  const completedQuotations = useMemo(() => {
    return quotations.filter((quotation) => quotation.status?.toLowerCase() === "completed");
  }, [quotations]);

  const billingDate = useMemo(() => {
    if (billingMode === "month-end") {
      return endOfMonth(new Date());
    }
    return endOfMonth(new Date());
  }, [billingMode]);

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

  const invoices = useMemo(() => {
    return completedQuotations.map((quotation, index) => {
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

      return {
        id: quotation.id,
        invoiceNumber: `INV-${format(billingDate, "yyyyMM")}-${String(index + 1).padStart(4, "0")}`,
        quotationNumber,
        client: quotation.company_name || quotation.site_manager_name || "Unnamed client",
        site: quotation.site_name || "No site name",
        itemCount,
        subtotal,
        surcharge,
        total,
      };
    });
  }, [completedQuotations, billingDate, surchargeByQuotation]);

  const totalMonthBilling = invoices.reduce((sum, invoice) => sum + invoice.total, 0);

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
          subtitle="Billing is managed in KES and invoices are generated after hire return completion."
        />

        <div className="space-y-6 p-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Billing option</CardTitle>
                <CardDescription>Billing trigger policy</CardDescription>
              </CardHeader>
              <CardContent>
                <Select value={billingMode} onValueChange={(value) => setBillingMode(value as BillingMode)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select billing option" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="month-end">Bill at end of every month</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Billing cycle</CardTitle>
                <CardDescription>Next invoice run date</CardDescription>
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
              <CardTitle>Auto-generated monthly invoices</CardTitle>
              <CardDescription>
                Only completed hire returns are invoiced. Amounts include conditional charges based on return condition policy.
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
                    Billing policy applied in accounting (KES): Dirty equipment is charged at 2× list hire price, damaged equipment is charged at 4× list hire price, and scrap equipment is charged at unit price. Invoices are generated once hire return is completed and are queued for {format(billingDate, "dd MMM yyyy")}.
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                  No completed hire returns found. Once a hire return is completed, its invoice will automatically appear here.
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
