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
  // Keep selectedQuotation live-synced with realtime DB updates
  const liveSelectedQuotation = selectedQuotation
    ? (hireQuotations.find(q => q.id === selectedQuotation.id) ?? selectedQuotation)
    : null;

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

    const origin = window.location.origin;
    const printDate = new Date().toLocaleString("en-KE", { dateStyle: "medium", timeStyle: "short" });
    const docDate = new Date().toLocaleDateString("en-ZA", { year: "numeric", month: "short", day: "numeric" });

    const tableRows = summarizedRemovalRows
      .map(
        (row) => `
          <tr>
            <td>${row.itemDescription}</td>
            <td class="text-right">${row.quantity}</td>
          </tr>
        `
      )
      .join("");

    const html = `<!DOCTYPE html><html><head><title>Inventory Removal Report - ${selectedClient}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: "Arial Narrow", Arial, sans-serif; font-size: 9.5px; color: #1f2937; line-height: 1.3; padding: 12px; }

        /* ── Print controls ── */
        .print-controls {
          position: fixed; top: 12px; right: 12px; z-index: 9999;
          display: flex; padding: 8px; background: rgba(255,255,255,0.97);
          border: 1px solid #ddd; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        }
        .print-button {
          border: 1px solid #333; border-radius: 6px; background: #111; color: #fff;
          padding: 6px 12px; font-size: 11px; font-weight: 600; cursor: pointer;
        }

        /* ── 4-panel header layout ── */
        .standard-report-layout {
          display: grid; grid-template-columns: 1.5fr 1fr; gap: 12px; margin-bottom: 12px;
        }
        .standard-report-left { display: grid; gap: 8px; }
        .standard-report-right { display: grid; gap: 6px; }
        .brand-block { padding: 8px 10px; }
        .brand-top { display: flex; align-items: center; gap: 10px; margin-bottom: 5px; }
        .brand-logo { width: 120px; height: auto; }
        .brand-title { font-size: 14px; font-weight: 800; line-height: 1.15; color: #111827; }
        .brand-meta { font-size: 9px; color: #374151; }
        .panel { border: 1px solid #111827; border-radius: 6px; padding: 7px 9px; }
        .panel h3 { font-size: 11px; font-weight: 800; margin-bottom: 4px; color: #111827; }
        .client-panel { min-height: 150px; }
        .report-title { font-size: 18px; font-weight: 900; letter-spacing: -0.2px; color: #111827; margin-bottom: 6px; }
        .info-row { display: flex; gap: 4px; margin-bottom: 2px; align-items: baseline; }
        .info-label { font-weight: 700; color: #111827; min-width: 110px; font-size: 9px; }
        .info-sep { color: #6b7280; }
        .info-value { color: #111827; word-break: break-word; flex: 1; font-size: 9px; }

        /* ── Repeating page header (print only) ── */
        .page-header { display: none; }
        @media print {
          body { padding: 0 !important; font-size: 8.5px; }
          .print-controls { display: none; }
          .page-header {
            display: block; position: fixed; top: 0; left: 0; right: 0;
            background: white; border-bottom: 1.5px solid #111; padding: 5px 10px 4px; z-index: 9999;
          }
          .page-header-spacer { display: block; height: 56px; }
          @page { size: A4; margin: 8mm; }
          tr { page-break-inside: avoid; }
          thead { display: table-header-group; }
        }
        .page-header-spacer { display: none; }

        /* ── Table ── */
        table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
        th, td { border: 1px solid #111827; padding: 4px 6px; font-size: 8.5px; vertical-align: top; }
        th { background: #f3f4f6; text-transform: uppercase; letter-spacing: 0.2px; font-weight: 800; }
        .text-right { text-align: right; }

        /* ── Page wrapper (flex so footer sticks) ── */
        .report-page { display: flex; flex-direction: column; min-height: 92vh; }
        @media print { .report-page { min-height: 92vh; } }

        /* ── Yellow footer ── */
        .footer-wrap { margin-top: auto; }
        .footer-brand {
          background: #facc15; color: #1f2937; font-weight: 700;
          display: flex; justify-content: space-between; align-items: center; padding: 6px 10px;
        }
        .footer-legal {
          text-align: center; font-size: 7.5px; color: #4b5563;
          padding: 3px 8px 4px; border: 1px solid #e5e7eb; border-top: none;
        }
        .footer-processed {
          display: flex; justify-content: space-between; font-size: 7px; color: #6b7280; padding: 4px 0 0;
        }
      </style>
    </head><body>

      <!-- Print button (screen only) -->
      <div class="print-controls">
        <button type="button" class="print-button" onclick="window.print()">Print report</button>
      </div>

      <!-- Fixed page header (repeats on every printed page) -->
      <div class="page-header">
        <div style="display:flex;align-items:center;justify-content:space-between;">
          <div style="display:flex;align-items:center;gap:8px;">
            <img src="${origin}/otn-logo-red.png" alt="OTNO" style="width:72px;height:auto;"/>
            <div>
              <div style="font-size:10px;font-weight:800;">OTNO Access Solutions</div>
              <div style="font-size:8px;color:#555;">99215-80107 Mombasa, Kenya &bull; PIN: P052471711M</div>
            </div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:11px;font-weight:800;text-transform:uppercase;">Inventory Removal Report</div>
            <div style="font-size:8px;color:#555;">${selectedClient}</div>
          </div>
        </div>
      </div>
      <div class="page-header-spacer"></div>

      <!-- Main page content -->
      <div class="report-page">

        <!-- 4-panel header (screen view) -->
        <div class="standard-report-layout">
          <div class="standard-report-left">
            <div class="brand-block">
              <div class="brand-top">
                <img src="${origin}/otn-logo-red.png" alt="OTNO Logo" class="brand-logo" />
                <div class="brand-title">OTNO Access Solutions</div>
              </div>
              <div class="brand-meta"><span><strong>Reg No:</strong> P052471711M</span></div>
            </div>
            <div class="panel client-panel">
              <h3>${selectedClient}</h3>
              <div style="margin-top:8px;">
                <div class="info-row"><span class="info-label">Client</span><span class="info-sep">:</span><span class="info-value" style="font-weight:800;">${selectedClient}</span></div>
              </div>
            </div>
          </div>

          <div class="standard-report-right">
            <h2 class="report-title">Inventory Removal Report</h2>
            <div class="panel">
              <h3>Document Details</h3>
              <div class="info-row"><span class="info-label">Document Type</span><span class="info-sep">:</span><span class="info-value">Inventory Removal Report</span></div>
              <div class="info-row"><span class="info-label">Document Date</span><span class="info-sep">:</span><span class="info-value">${docDate}</span></div>
            </div>
            <div class="panel">
              <h3>Company Details</h3>
              <div class="info-row"><span class="info-label">Company</span><span class="info-sep">:</span><span class="info-value">OTNO Access Solutions</span></div>
              <div class="info-row"><span class="info-label">Address</span><span class="info-sep">:</span><span class="info-value">99215-80107 Mombasa, Kenya</span></div>
              <div class="info-row"><span class="info-label">Location</span><span class="info-sep">:</span><span class="info-value">Embakasi, Old North Airport Rd, next to Naivas Embakasi</span></div>
              <div class="info-row"><span class="info-label">Email</span><span class="info-sep">:</span><span class="info-value">otnoacess@gmail.com</span></div>
            </div>
            <div class="panel">
              <h3>Site Details</h3>
              <div class="info-row"><span class="info-label">Client</span><span class="info-sep">:</span><span class="info-value">${selectedClient}</span></div>
            </div>
          </div>
        </div>

        <!-- Items table -->
        <table>
          <thead>
            <tr>
              <th>Item Description</th>
              <th class="text-right">Quantity Removed</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>

        <!-- Yellow branded footer -->
        <div class="footer-wrap">
          <div class="footer-brand">
            <span>OTNO Access Solutions — Your Trusted Scaffolding &amp; Access Partner.</span>
            <img src="${origin}/otn-logo-red.png" alt="OTNO" style="width:80px;height:auto;"/>
          </div>
          <div class="footer-legal">All transactions are subject to our standard Terms of Trade which can be found at: otnoacess@gmail.com</div>
          <div class="footer-processed">
            <div><div>Processed Date : ${docDate}</div></div>
            <div style="text-align:right;"><div>Print date : ${printDate}</div></div>
          </div>
        </div>

      </div>
    </body></html>`;

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

        <div className="p-4 md:p-6 space-y-4 md:space-y-6">
          <section className="space-y-3 md:space-y-4">
            <Card>
              <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between pb-3">
                <div>
                  <CardTitle className="text-base md:text-lg">Inventory Removal Report</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Generate client-specific reports from dispatched and completed quotations only.
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={handlePrintRemovalReport} className="w-full md:w-auto">
                  Print Report
                </Button>
              </CardHeader>
              <CardContent>
                {removalReportRows.length ? (
                  <div className="space-y-4">
                    <div className="grid gap-2">
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
                    <div className="rounded-lg border border-border overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Item Description</TableHead>
                            <TableHead className="text-right">Qty Removed</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {summarizedRemovalRows.map((row) => (
                            <TableRow key={`${selectedClient}-${row.itemDescription}`}>
                              <TableCell className="font-medium text-sm">{row.itemDescription}</TableCell>
                              <TableCell className="text-right font-bold">{row.quantity}</TableCell>
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

          <section className="grid grid-cols-1 gap-4 md:gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                  <MapPin className="h-5 w-5" />
                  Active & Pending Quotations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                {isLoading ? (
                  <p className="text-sm text-muted-foreground">Loading active quotations...</p>
                ) : activeQuotations.length ? (
                  <div className="space-y-2.5">
                    {activeQuotations.map((quotation) => (
                      <div
                        key={quotation.id}
                        className="rounded-xl border border-border bg-muted/30 p-3.5 space-y-2"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-foreground truncate">
                              {quotation.company_name || quotation.site_manager_name || "Client pending"}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {quotation.site_name || "Site name pending"} · Saved {formatDate(quotation.created_at)}
                            </p>
                          </div>
                          <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold uppercase text-primary">
                            {quotation.status || "pending"}
                          </span>
                        </div>
                        <Button size="sm" variant="outline" className="w-full" onClick={() => handleOpenWorkflow(quotation)}>
                          Open workflow
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No active or pending quotations yet.</p>
                )}
              </CardContent>
            </Card>
          </section>

          <section className="space-y-3 md:space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base md:text-lg font-semibold">Saved Hire Quotation Workflow</h2>
                <p className="text-sm text-muted-foreground">
                  Continue the selected client workflow, update equipment, and generate reports.
                </p>
              </div>
              {selectedQuotation ? (
                <Button variant="ghost" size="sm" onClick={() => setSelectedQuotation(null)}>
                  Clear selection
                </Button>
              ) : null}
            </div>
            {selectedQuotation ? (
              <HireQuotationWorkflow
                initialQuotation={liveSelectedQuotation}
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
