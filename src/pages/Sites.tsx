import { useEffect, useMemo, useState } from "react";
import { MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import HireQuotationWorkflow from "@/components/dashboard/HireQuotationWorkflow";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useHireQuotations, HireQuotation } from "@/hooks/useHireQuotations";

const Sites = () => {
  const navigate = useNavigate();
  const { data: hireQuotations = [], isLoading } = useHireQuotations();
  const [selectedQuotation, setSelectedQuotation] = useState<HireQuotation | null>(null);
  const [selectedClient, setSelectedClient] = useState<string>("");

  const activeQuotations = useMemo(() => {
    return hireQuotations.filter((quotation) => {
      const status = quotation.status?.toLowerCase?.() ?? "";
      return status === "active" || status === "pending";
    });
  }, [hireQuotations]);

  const removalReportQuotations = useMemo(() => {
    return hireQuotations.filter((quotation) => {
      const status = quotation.status?.toLowerCase?.() ?? "";
      const isEligibleStatus = status === "dispatched" || status === "completed";
      const hasDeductedEquipment = (quotation.line_items ?? []).some((item) => (item.delivered_quantity ?? 0) > 0);
      return isEligibleStatus && hasDeductedEquipment;
    });
  }, [hireQuotations]);

  const clientOptions = useMemo(() => {
    const uniqueClients = new Set(
      removalReportQuotations.map(
        (quotation) => quotation.company_name || quotation.site_manager_name || "Unknown client"
      )
    );

    return Array.from(uniqueClients).sort((a, b) => a.localeCompare(b));
  }, [removalReportQuotations]);

  const removalReportRows = useMemo(() => {
    return removalReportQuotations
      .flatMap((quotation) =>
        (quotation.line_items ?? [])
          .filter((item) => (item.delivered_quantity ?? 0) > 0)
          .map((item) => ({
            itemDescription: item.description || item.part_number || "Unknown item",
            quantity: item.delivered_quantity,
            client: quotation.company_name || quotation.site_manager_name || "Unknown client",
          }))
      )
      .sort((a, b) => a.itemDescription.localeCompare(b.itemDescription));
  }, [removalReportQuotations]);

  useEffect(() => {
    if (!clientOptions.length) {
      setSelectedClient("");
      return;
    }

    if (!selectedClient || !clientOptions.includes(selectedClient)) {
      setSelectedClient(clientOptions[0]);
    }
  }, [clientOptions, selectedClient]);

  const filteredRemovalReportRows = useMemo(() => {
    return removalReportRows.filter((row) => row.client === selectedClient);
  }, [removalReportRows, selectedClient]);

  const summarizedRemovalRows = useMemo(() => {
    const groupedRows = filteredRemovalReportRows.reduce<Record<string, number>>((acc, row) => {
      acc[row.itemDescription] = (acc[row.itemDescription] ?? 0) + row.quantity;
      return acc;
    }, {});

    return Object.entries(groupedRows)
      .map(([itemDescription, quantity]) => ({ itemDescription, quantity }))
      .sort((a, b) => a.itemDescription.localeCompare(b.itemDescription));
  }, [filteredRemovalReportRows]);

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
    if (item === "site-master-plan") {
      navigate("/site-master-plan");
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
    if (!selectedClient) {
      window.alert("Select a client to print the removal report.");
      return;
    }

    if (!summarizedRemovalRows.length) {
      window.alert("No inventory removal records available to print yet.");
      return;
    }

    const tableRows = summarizedRemovalRows
      .map(
        (row) => `
          <tr>
            <td>${row.itemDescription}</td>
            <td>${row.quantity}</td>
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
          <p>Client: <strong>${selectedClient}</strong></p>
          <table>
            <thead>
              <tr>
                <th>Item Description</th>
                <th>Quantity Removed</th>
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
                    Generate client-specific reports from dispatched and completed quotations only.
                  </p>
                </div>
                <Button variant="outline" onClick={handlePrintRemovalReport}>
                  Print Report
                </Button>
              </CardHeader>
              <CardContent>
                {removalReportRows.length ? (
                  <div className="space-y-4">
                    <div className="grid max-w-md gap-2">
                      <label className="text-sm font-medium text-foreground">Select client</label>
                      <Select value={selectedClient} onValueChange={setSelectedClient}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a client" />
                        </SelectTrigger>
                        <SelectContent>
                          {clientOptions.map((client) => (
                            <SelectItem key={client} value={client}>
                              {client}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="rounded-lg border border-border">
                      <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Item Description</TableHead>
                          <TableHead>Quantity Removed</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {summarizedRemovalRows.map((row) => (
                          <TableRow key={`${selectedClient}-${row.itemDescription}`}>
                            <TableCell className="font-medium">{row.itemDescription}</TableCell>
                            <TableCell>{row.quantity}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                      </Table>
                    </div>
                    {!summarizedRemovalRows.length ? (
                      <p className="text-sm text-muted-foreground">
                        No report rows found for the selected client.
                      </p>
                    ) : null}
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                    No inventory removal records yet. Dispatched and completed quotations with deducted equipment will appear here.
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
