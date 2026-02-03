import { useMemo, useState } from "react";
import { FolderClock, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import HireQuotationWorkflow from "@/components/dashboard/HireQuotationWorkflow";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useHireQuotations, HireQuotation } from "@/hooks/useHireQuotations";

const Sites = () => {
  const navigate = useNavigate();
  const { data: hireQuotations = [], isLoading } = useHireQuotations();
  const [selectedQuotation, setSelectedQuotation] = useState<HireQuotation | null>(null);

  const activeQuotations = useMemo(() => {
    return hireQuotations.filter((quotation) => {
      const status = quotation.status?.toLowerCase?.() ?? "";
      return status === "active" || status === "pending";
    });
  }, [hireQuotations]);

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
    if (item === "settings") {
      navigate("/settings");
      return;
    }
  };

  const handleOpenWorkflow = (quotation: HireQuotation) => {
    setSelectedQuotation(quotation);
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
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
          <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
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
                            <TableCell className="capitalize">{quotation.status || "draft"}</TableCell>
                            <TableCell className="text-right">
                              <Button size="sm" onClick={() => handleOpenWorkflow(quotation)}>
                                Open workflow
                              </Button>
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
