import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useHireQuotations } from "@/hooks/useHireQuotations";

const formatCurrency = (value: number) =>
  `Ksh ${value.toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const Revenue = () => {
  const navigate = useNavigate();
  const { data: hireQuotations = [], isLoading } = useHireQuotations();

  const approvedQuotations = useMemo(() => {
    return hireQuotations.filter((quotation) => {
      const status = quotation.status?.toLowerCase?.() ?? "";
      return status.includes("approved") || status === "completed";
    });
  }, [hireQuotations]);

  const revenueRows = useMemo(() => {
    return approvedQuotations.map((quotation) => {
      const lineItems = quotation.line_items ?? [];
      const weeklyTotal = lineItems.reduce((sum, item) => {
        if (item.weekly_total != null) {
          return sum + item.weekly_total;
        }
        const rate = item.weekly_rate ?? 0;
        const qty = item.quantity ?? 0;
        const discountRate = Math.min(Math.max(item.hire_discount ?? 0, 0), 100) / 100;
        const hireRate = Math.max(rate * (1 - discountRate), 0);
        return sum + hireRate * qty;
      }, 0);
      const weeks = Math.max(quotation.hire_weeks ?? 1, 1);
      const totalRevenue = weeklyTotal * weeks;
      return {
        id: quotation.id,
        quotationNumber: quotation.quotation_number || "Draft",
        client: quotation.company_name || quotation.site_manager_name || "Unnamed client",
        site: quotation.site_name || "No site name",
        status: quotation.status || "approved",
        weeks,
        weeklyTotal,
        totalRevenue,
        createdAt: quotation.created_at,
      };
    });
  }, [approvedQuotations]);

  const totalRevenue = revenueRows.reduce((sum, row) => sum + row.totalRevenue, 0);
  const averageRevenue = revenueRows.length ? totalRevenue / revenueRows.length : 0;

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
    if (item === "settings") {
      navigate("/settings");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar activeItem="revenue" onItemClick={handleSidebarItemClick} />

      <main className="ml-0 md:ml-64">
        <Header title="Revenue" subtitle="Revenue generated from approved hire quotations." />

        <div className="space-y-6 p-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Total revenue</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-semibold">
                {formatCurrency(totalRevenue)}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Approved quotations</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-semibold">{revenueRows.length}</CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Average per quotation</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-semibold">
                {formatCurrency(averageRevenue)}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Approved quotation revenue</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-sm text-muted-foreground">Loading revenue totals...</p>
              ) : revenueRows.length ? (
                <div className="overflow-x-auto rounded-lg border border-border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Quotation</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>Site</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Weeks</TableHead>
                        <TableHead className="text-right">Weekly total</TableHead>
                        <TableHead className="text-right">Revenue</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {revenueRows.map((row) => (
                        <TableRow key={row.id}>
                          <TableCell>
                            <div className="font-medium">{row.quotationNumber}</div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(row.createdAt).toLocaleDateString("en-ZA", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })}
                            </div>
                          </TableCell>
                          <TableCell>{row.client}</TableCell>
                          <TableCell>{row.site}</TableCell>
                          <TableCell className="capitalize">{row.status}</TableCell>
                          <TableCell className="text-right">{row.weeks}</TableCell>
                          <TableCell className="text-right">{formatCurrency(row.weeklyTotal)}</TableCell>
                          <TableCell className="text-right font-semibold">
                            {formatCurrency(row.totalRevenue)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                  No approved quotations found yet.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Revenue;
