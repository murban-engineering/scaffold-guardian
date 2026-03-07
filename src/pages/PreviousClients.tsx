import { useState } from "react";
import { FolderClock, MapPin, Printer } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import HireQuotationWorkflow from "@/components/dashboard/HireQuotationWorkflow";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useHireQuotations, HireQuotation } from "@/hooks/useHireQuotations";
import { useClientSites } from "@/hooks/useClientSites";
import { generateHireQuotationReportPDF } from "@/lib/pdfGenerator";
import { toClientIdFromQuotationNumber } from "@/lib/clientId";
import { toast } from "sonner";

const ClientSitesBadges = ({ quotationId }: { quotationId: string }) => {
  const { data: sites } = useClientSites(quotationId);
  if (!sites?.length) return <span className="text-xs text-muted-foreground">No sites registered</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {sites.map((site) => (
        <Badge key={site.id} variant="outline" className="font-mono text-xs">
          {site.site_number} — {site.site_name}
        </Badge>
      ))}
    </div>
  );
};

const PreviousClients = () => {
  const navigate = useNavigate();
  const { data: hireQuotations = [], isLoading } = useHireQuotations();
  const [selectedQuotation, setSelectedQuotation] = useState<HireQuotation | null>(null);
  // Keep selectedQuotation live-synced with realtime DB updates
  const liveSelectedQuotation = selectedQuotation
    ? (hireQuotations.find(q => q.id === selectedQuotation.id) ?? selectedQuotation)
    : null;

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
    if (item === "sites") {
      navigate("/sites");
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
    }
  };

  const handleOpenWorkflow = (quotation: HireQuotation) => {
    setSelectedQuotation(quotation);
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  };

  const handlePrintQuotation = (quotation: HireQuotation) => {
    if (!quotation.line_items?.length) {
      toast.error("No equipment items found for this hire quotation.");
      return;
    }

    generateHireQuotationReportPDF({
      quotationNumber: quotation.quotation_number,
      dateCreated: formatDate(quotation.created_at),
      companyName: quotation.company_name ?? "",
      siteName: quotation.site_name ?? "",
      siteLocation: quotation.delivery_address ?? "",
      siteAddress: quotation.site_address ?? "",
      contactName: quotation.site_manager_name ?? "",
      contactPhone: quotation.site_manager_phone ?? "",
      contactEmail: quotation.site_manager_email ?? "",
      officeTel: "",
      officeEmail: "",
      createdBy: "",
      clientId: toClientIdFromQuotationNumber(quotation.quotation_number),
      discountRate: 0,
      items: quotation.line_items.map((item) => ({
        partNumber: item.part_number,
        description: item.description,
        quantity: item.quantity,
        warehouseAvailableQty: 0,
        massPerItem: item.mass_per_item,
        weeklyRate: item.weekly_rate,
        weeklyTotal: item.weekly_total ?? item.quantity * item.weekly_rate,
        discountRate: item.hire_discount ?? 0,
      })),
    });

    toast.success("Hire quotation opened for printing");
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar activeItem="previous-clients" onItemClick={handleSidebarItemClick} />

      <main className="ml-0 md:ml-64">
        <Header
          title="Previous Clients"
          subtitle="Browse saved hire quotations and reopen client workflows from the archive."
        />

        <div className="p-6 space-y-6">
          <section>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FolderClock className="h-5 w-5" />
                  Previous Clients
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Browse all saved hire quotations and reopen the workflow for any client.
                </p>
                {isLoading ? (
                  <p className="text-sm text-muted-foreground">Loading saved clients...</p>
                ) : hireQuotations.length ? (
                  <div className="rounded-lg border border-border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Client</TableHead>
                          <TableHead>Site</TableHead>
                          <TableHead>Registered Sites</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {hireQuotations.map((quotation) => (
                          <TableRow key={quotation.id}>
                            <TableCell>
                              <div className="font-medium">
                                {quotation.company_name || quotation.site_manager_name || "Unnamed client"}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {formatDate(quotation.created_at)}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">{quotation.site_name || "No site name"}</div>
                              <div className="text-xs text-muted-foreground line-clamp-1">
                                {quotation.site_address || "No site address"}
                              </div>
                            </TableCell>
                            <TableCell>
                              <ClientSitesBadges quotationId={quotation.id} />
                            </TableCell>
                            <TableCell className="capitalize">{quotation.status || "draft"}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button size="sm" variant="outline" onClick={() => handlePrintQuotation(quotation)}>
                                  <Printer className="mr-2 h-4 w-4" />
                                  Print
                                </Button>
                                <Button size="sm" onClick={() => handleOpenWorkflow(quotation)}>
                                  Open workflow
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                    No saved quotations found yet. Create a new hire quotation to get started.
                  </div>
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
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => handlePrintQuotation(liveSelectedQuotation ?? selectedQuotation)}>
                    <Printer className="mr-2 h-4 w-4" />
                    Print quotation
                  </Button>
                  <Button variant="ghost" onClick={() => setSelectedQuotation(null)}>
                    Clear selection
                  </Button>
                </div>
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

export default PreviousClients;
