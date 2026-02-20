import { useMemo, useState } from "react";
import { MapPin, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import HireQuotationWorkflow from "@/components/dashboard/HireQuotationWorkflow";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useHireQuotations, HireQuotation } from "@/hooks/useHireQuotations";

const Sites = () => {
  const navigate = useNavigate();
  const { data: hireQuotations = [], isLoading } = useHireQuotations();
  const [selectedQuotation, setSelectedQuotation] = useState<HireQuotation | null>(null);
  const [clientSearchTerm, setClientSearchTerm] = useState("");

  const activeQuotations = useMemo(() => {
    return hireQuotations.filter((quotation) => {
      const status = quotation.status?.toLowerCase?.() ?? "";
      return status === "active" || status === "pending";
    });
  }, [hireQuotations]);

  const removalReportRows = useMemo(() => {
    return hireQuotations
      .filter((quotation) => {
        const status = quotation.status?.toLowerCase?.() ?? "";
        return status === "dispatched" || status === "returned";
      })
      .flatMap((quotation) =>
        (quotation.line_items ?? [])
          .filter((item) => item.quantity > 0)
          .map((item) => ({
            itemLabel: item.description || item.part_number || "Unknown item",
            itemCode: item.part_number || "—",
            quantity: item.quantity,
            client: quotation.company_name || quotation.site_manager_name || "Unknown client",
            site: quotation.site_name || "No site name",
            quotationId: quotation.quotation_number || quotation.id,
            status: quotation.status || "Unknown",
          }))
      )
      .sort((a, b) => {
        const itemCompare = a.itemLabel.localeCompare(b.itemLabel);
        if (itemCompare !== 0) return itemCompare;
        return a.client.localeCompare(b.client);
      });
  }, [hireQuotations]);

  const filteredRemovalReportRows = useMemo(() => {
    const normalizedSearchTerm = clientSearchTerm.trim().toLowerCase();
    if (!normalizedSearchTerm) {
      return removalReportRows;
    }

    return removalReportRows.filter((row) => {
      const matchesClient = row.client.toLowerCase().includes(normalizedSearchTerm);
      const matchesId = row.quotationId.toLowerCase().includes(normalizedSearchTerm);
      return matchesClient || matchesId;
    });
  }, [clientSearchTerm, removalReportRows]);

  const formatDate = (value: string | null) => {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleDateString("en-ZA", { year: "numeric", month: "short", day: "numeric" });
  };

  const handleSidebarItemClick = (item: string) => {
    if (item === "dashboard") {
      navigate("/", { state: { activeItem: "dashboard" }, replace: true });
      return;
    }
    if (item === "inventory" || item === "workforce") {
      navigate("/", { state: { activeItem: item }, replace: true });
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
    if (item === "accounting") {
      navigate("/accounting");
      return;
    }
    if (item === "settings") {
      navigate("/settings");
      return;
    }
  };

  const handleOpenWorkflow = (quotation: HireQuotation) => {
    setSelectedQuotation(quotation);
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  };

  const handlePrintRemovalReport = () => {
    if (!filteredRemovalReportRows.length) {
      window.alert("No inventory removal records available to print yet.");
      return;
    }

    const tableRows = filteredRemovalReportRows
      .map(
        (row) => `
          <tr>
            <td>${row.itemLabel}</td>
            <td>${row.itemCode}</td>
            <td>${row.quantity}</td>
            <td>${row.client}</td>
            <td>${row.site}</td>
            <td>${row.quotationId}</td>
            <td>${row.status}</td>
          </tr>
        `
      )
      .join("");

    const html = `
      <html>
        <head>
          <title>Inventory Removal Report</title>
          <style>
            body { font-family: Arial, sans-serif; color: #111; margin: 24px; }
            h1 { font-size: 20px; margin-bottom: 8px; }
            p { margin-top: 0; color: #555; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
            th { background: #f3f4f6; }
            .print-controls {
              position: sticky;
              top: 0;
              z-index: 9999;
              display: flex;
              justify-content: flex-end;
              padding-bottom: 12px;
              margin-bottom: 12px;
              border-bottom: 1px solid #ddd;
              background: rgba(255, 255, 255, 0.96);
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
              .print-controls { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="print-controls">
            <button type="button" class="print-button" onclick="window.print()">Print report</button>
          </div>
          <h1>Inventory Removal Report</h1>
          <p>Dispatched and returned client records, grouped by hire quotation.</p>
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Item Code</th>
                <th>Qty</th>
                <th>Client</th>
                <th>Site</th>
                <th>Hire Quotation ID</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
        </body>
      </html>
    `;

    const printWindow = window.open("", "_blank", "width=900,height=700");
    if (!printWindow) {
      window.alert("Please allow popups to print the report.");
      return;
    }

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar activeItem="sites" onItemClick={handleSidebarItemClick} />

      <main className="ml-0 md:ml-64">
        <Header
          title="Sites"
          subtitle="Review saved client quotations, active sites, and continue hire quotation workflows."
        />

        <div className="p-6 space-y-6">
          <section className="space-y-4">
            <Card>
              <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle>Inventory Removal Report</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Search by client ID or company name to review dispatched and returned items.
                  </p>
                </div>
                <Button variant="outline" onClick={handlePrintRemovalReport}>
                  Print Report
                </Button>
              </CardHeader>
              <CardContent>
                {removalReportRows.length ? (
                  <div className="space-y-4">
                    <div className="relative max-w-md">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        value={clientSearchTerm}
                        onChange={(event) => setClientSearchTerm(event.target.value)}
                        placeholder="Search by client ID or company name"
                        className="pl-10"
                      />
                    </div>
                    <div className="rounded-lg border border-border">
                      <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Item</TableHead>
                          <TableHead>Item Code</TableHead>
                          <TableHead>Qty</TableHead>
                          <TableHead>Client</TableHead>
                          <TableHead>Site</TableHead>
                          <TableHead>Hire Quotation ID</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredRemovalReportRows.map((row, index) => (
                          <TableRow key={`${row.quotationId}-${row.itemCode}-${index}`}>
                            <TableCell>
                              <div className="font-medium">{row.itemLabel}</div>
                              <div className="text-xs text-muted-foreground">{row.itemCode}</div>
                            </TableCell>
                            <TableCell>{row.itemCode}</TableCell>
                            <TableCell>{row.quantity}</TableCell>
                            <TableCell>{row.client}</TableCell>
                            <TableCell>{row.site}</TableCell>
                            <TableCell className="font-mono text-xs">{row.quotationId}</TableCell>
                            <TableCell>
                              <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-semibold uppercase text-primary">
                                {row.status}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                      </Table>
                    </div>
                    {!filteredRemovalReportRows.length ? (
                      <p className="text-sm text-muted-foreground">
                        No clients found. Try searching by quotation ID or company name.
                      </p>
                    ) : null}
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                    No inventory removal records yet. Completed hire quotations will appear here.
                  </div>
                )}
              </CardContent>
            </Card>
          </section>

          <section className="grid grid-cols-1 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Active & Pending Quotations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoading ? (
                  <p className="text-sm text-muted-foreground">Loading active quotations...</p>
                ) : activeQuotations.length ? (
                  <div className="space-y-3">
                    {activeQuotations.map((quotation) => (
                      <div
                        key={quotation.id}
                        className="rounded-lg border border-border bg-muted/30 p-4 space-y-2"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-foreground">
                              {quotation.company_name || quotation.site_manager_name || "Client pending"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {quotation.site_name || "Site name pending"}
                            </p>
                          </div>
                          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase text-primary">
                            {quotation.status || "pending"}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
                          <span>Saved {formatDate(quotation.created_at)}</span>
                          <Button size="sm" variant="outline" onClick={() => handleOpenWorkflow(quotation)}>
                            Open workflow
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No active or pending quotations yet.</p>
                )}
              </CardContent>
            </Card>
          </section>

          <section className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">Saved Hire Quotation Workflow</h2>
                <p className="text-sm text-muted-foreground">
                  Continue the selected client workflow, update equipment, and generate reports.
                </p>
              </div>
              {selectedQuotation ? (
                <Button variant="ghost" onClick={() => setSelectedQuotation(null)}>
                  Clear selection
                </Button>
              ) : null}
            </div>
            {selectedQuotation ? (
              <HireQuotationWorkflow
                initialQuotation={selectedQuotation}
                onClientProcessed={() => setSelectedQuotation(null)}
              />
            ) : (
              <Card>
                <CardContent className="py-10 text-center text-sm text-muted-foreground">
                  Select a client from the list above to open their hire quotation workflow.
                </CardContent>
              </Card>
            )}
          </section>
        </div>
      </main>
    </div>
  );
};

export default Sites;
