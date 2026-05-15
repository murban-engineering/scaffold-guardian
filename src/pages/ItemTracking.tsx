import { useMemo, useState } from "react";
import { PackageSearch, ClipboardList, Users, Warehouse, Printer } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useScaffolds } from "@/hooks/useScaffolds";
import { useHireQuotations } from "@/hooks/useHireQuotations";
import { useAllClientSites } from "@/hooks/useClientSites";
import { buildCombinedInventoryMatrix, openCombinedInventoryReport } from "@/lib/combinedInventoryReport";

interface ClientHireRow {
  quotationId: string;
  clientName: string;
  clientId: string;
  quotationNumber: string;
  onHireQuantity: number;
}

const ItemTracking = () => {
  const navigate = useNavigate();
  const { data: scaffolds = [], isLoading: scaffoldsLoading } = useScaffolds();
  const { data: hireQuotations = [], isLoading: quotationsLoading } = useHireQuotations();
  const { data: allClientSites = [] } = useAllClientSites();
  const [selectedPartNumber, setSelectedPartNumber] = useState<string>("");

  const handleSidebarItemClick = (item: string) => {
    if (item === "dashboard") {
      navigate("/", { state: { activeItem: "dashboard" }, replace: true });
      return;
    }
    if (item === "inventory" || item === "workforce" || item === "otnoai") {
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
    if (item === "accounting") {
      navigate("/accounting");
      return;
    }
    if (item === "site-master-plan") {
      navigate("/site-master-plan");
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

  const partOptions = useMemo(() => {
    const items = scaffolds
      .filter((item) => Boolean(item.part_number))
      .sort((a, b) => (a.part_number ?? "").localeCompare(b.part_number ?? ""));

    return items;
  }, [scaffolds]);

  const selectedItem = useMemo(
    () => scaffolds.find((item) => item.part_number === selectedPartNumber) ?? null,
    [scaffolds, selectedPartNumber]
  );

  const combinedInventoryMatrix = useMemo(
    () => buildCombinedInventoryMatrix(hireQuotations, allClientSites),
    [allClientSites, hireQuotations]
  );

  const handlePrintCombinedReport = () => {
    openCombinedInventoryReport(combinedInventoryMatrix);
  };

  const onHireByClient = useMemo<ClientHireRow[]>(() => {
    if (!selectedPartNumber) return [];

    // Only count quotations that have actually been dispatched (not drafts/pending)
    const activeQuotations = hireQuotations.filter(
      (q) => q.status !== "draft" && q.status !== "pending"
    );

    return activeQuotations
      .map((quotation) => {
        const matchingItems = (quotation.line_items ?? []).filter(
          (lineItem) => lineItem.part_number === selectedPartNumber
        );

        if (matchingItems.length === 0) return null;

        const onHireQuantity = matchingItems.reduce((total, lineItem) => {
          // Use only actual delivered_quantity from DB — never fall back to ordered quantity
          const delivered = lineItem.delivered_quantity ?? 0;
          const returned = lineItem.returned_quantity ?? 0;
          const currentOnHire = Math.max(delivered - returned, 0);
          return total + currentOnHire;
        }, 0);

        if (onHireQuantity <= 0) return null;

        return {
          quotationId: quotation.id,
          clientName: quotation.company_name?.trim() || quotation.site_manager_name?.trim() || "Unnamed Client",
          clientId: quotation.client_id || "No Client ID",
          quotationNumber: quotation.quotation_number || "—",
          onHireQuantity,
        };
      })
      .filter((entry): entry is ClientHireRow => Boolean(entry))
      .sort((a, b) => b.onHireQuantity - a.onHireQuantity);
  }, [hireQuotations, selectedPartNumber]);

  const totalOnHire = useMemo(
    () => onHireByClient.reduce((total, row) => total + row.onHireQuantity, 0),
    [onHireByClient]
  );

  const quantityAtStart = selectedItem?.qty_at_start ?? 0;

  const handlePrintReport = () => {
    if (!selectedItem || !selectedPartNumber) return;

    const printWindow = window.open("", "_blank", "width=1000,height=800");
    if (!printWindow) return;

    const reportDate = new Date().toLocaleString();
    const reportRows =
      onHireByClient.length > 0
        ? onHireByClient
            .map(
              (row) => `
                <tr>
                  <td>${row.clientName}</td>
                  <td>${row.clientId}</td>
                  <td>${row.quotationNumber}</td>
                  <td class="numeric">${row.onHireQuantity}</td>
                </tr>
              `
            )
            .join("")
        : `<tr><td colspan="4">No clients currently have this item on hire.</td></tr>`;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Item Tracking Report - ${selectedPartNumber}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              color: #1f2937;
              margin: 32px;
            }
            h1 {
              margin-bottom: 8px;
            }
            .meta {
              color: #4b5563;
              margin: 0 0 20px;
              font-size: 14px;
            }
            .stats {
              display: grid;
              grid-template-columns: repeat(3, minmax(0, 1fr));
              gap: 12px;
              margin-bottom: 20px;
            }
            .stat-card {
              border: 1px solid #d1d5db;
              border-radius: 8px;
              padding: 12px;
            }
            .stat-label {
              font-size: 12px;
              text-transform: uppercase;
              color: #6b7280;
              margin-bottom: 4px;
            }
            .stat-value {
              font-size: 24px;
              font-weight: 700;
            }
            table {
              width: 100%;
              border-collapse: collapse;
            }
            th,
            td {
              border: 1px solid #d1d5db;
              padding: 10px;
              text-align: left;
            }
            th {
              background: #f3f4f6;
            }
            .numeric {
              text-align: right;
              font-weight: 600;
            }
          </style>
        </head>
        <body>
          <h1>Item Tracking Report</h1>
          <p class="meta"><strong>Part Number:</strong> ${selectedPartNumber}</p>
          <p class="meta"><strong>Description:</strong> ${selectedItem.description ?? selectedItem.scaffold_type ?? "N/A"}</p>
          <p class="meta"><strong>Generated:</strong> ${reportDate}</p>

          <div class="stats">
            <div class="stat-card">
              <p class="stat-label">Quantity at Start</p>
              <p class="stat-value">${quantityAtStart}</p>
            </div>
            <div class="stat-card">
              <p class="stat-label">Quantity on Hire</p>
              <p class="stat-value">${totalOnHire}</p>
            </div>
            <div class="stat-card">
              <p class="stat-label">Clients on Hire</p>
              <p class="stat-value">${onHireByClient.length}</p>
            </div>
          </div>

          <h2>Client Hire Breakdown</h2>
          <table>
            <thead>
              <tr>
                <th>Client</th>
                <th>Client ID</th>
                <th>Quotation</th>
                <th>On Hire Qty</th>
              </tr>
            </thead>
            <tbody>
              ${reportRows}
            </tbody>
          </table>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/40">
      <Sidebar activeItem="item-tracking" onItemClick={handleSidebarItemClick} />

      <div className="md:ml-64 transition-all duration-300">
        <Header
          title="Item Tracking"
          subtitle="Track starting quantity, active hires, and clients using each inventory part."
        />

        <main className="p-4 md:p-6 space-y-6">
          <Card className="overflow-hidden border-white/50 bg-card/80 shadow-xl backdrop-blur-xl">
            <div className="h-1.5 bg-gradient-to-r from-primary via-primary/70 to-accent" />
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <PackageSearch className="h-5 w-5 text-primary" />
                Select an Inventory Part
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-w-xl space-y-3">
                <p className="text-sm text-muted-foreground">
                  Choose a part number to generate a live tracking report with opening stock and current hires.
                </p>
                <Select value={selectedPartNumber} onValueChange={setSelectedPartNumber}>
                  <SelectTrigger className="h-11 rounded-xl border-white/45 bg-background/80 shadow-sm">
                    <SelectValue placeholder="Select part number" />
                  </SelectTrigger>
                  <SelectContent>
                    {partOptions.map((item) => (
                      <SelectItem key={item.id} value={item.part_number as string}>
                        {(item.part_number ?? "N/A") + " — " + (item.description ?? item.scaffold_type)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {selectedItem && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Card className="border-white/45 bg-card/75 shadow-lg backdrop-blur-xl">
                <CardContent className="flex items-center gap-3 p-5">
                  <Warehouse className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Quantity at Start</p>
                    <p className="text-2xl font-bold text-foreground">{quantityAtStart}</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-white/45 bg-card/75 shadow-lg backdrop-blur-xl">
                <CardContent className="flex items-center gap-3 p-5">
                  <ClipboardList className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Quantity on Hire</p>
                    <p className="text-2xl font-bold text-foreground">{totalOnHire}</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-white/45 bg-card/75 shadow-lg backdrop-blur-xl">
                <CardContent className="flex items-center gap-3 p-5">
                  <Users className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Clients on Hire</p>
                    <p className="text-2xl font-bold text-foreground">{onHireByClient.length}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <Card className="border-white/50 bg-card/80 shadow-xl backdrop-blur-xl">
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="text-lg">Client Hire Breakdown</CardTitle>
              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={handlePrintReport}
                  disabled={!selectedPartNumber || !selectedItem || scaffoldsLoading || quotationsLoading}
                >
                  <Printer className="mr-2 h-4 w-4" />
                  Print Report
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={handlePrintCombinedReport}
                  disabled={!combinedInventoryMatrix.itemRows.length}
                >
                  Print Combined Report
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {scaffoldsLoading || quotationsLoading ? (
                <p className="text-sm text-muted-foreground">Loading item tracking report...</p>
              ) : !selectedPartNumber || !selectedItem ? (
                <p className="text-sm text-muted-foreground">Select a part number to view report details.</p>
              ) : onHireByClient.length === 0 ? (
                <p className="text-sm text-muted-foreground">No clients currently have this item on hire.</p>
              ) : (
                <div className="rounded-xl border border-white/45">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Client</TableHead>
                        <TableHead>Client ID</TableHead>
                        <TableHead>Quotation</TableHead>
                        <TableHead className="text-right">On Hire Qty</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {onHireByClient.map((row) => (
                        <TableRow key={row.quotationId}>
                          <TableCell className="font-medium">{row.clientName}</TableCell>
                          <TableCell>{row.clientId}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="rounded-full border-primary/30 bg-primary/10 text-primary">
                              {row.quotationNumber}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-semibold">{row.onHireQuantity}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
};

export default ItemTracking;
