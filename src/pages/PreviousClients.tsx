import { useState } from "react";
import { FolderClock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import HireQuotationWorkflow from "@/components/dashboard/HireQuotationWorkflow";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useHireQuotations, HireQuotation } from "@/hooks/useHireQuotations";
import { useClientSites } from "@/hooks/useClientSites";

const ClientSitesBadges = ({ quotationId }: { quotationId: string }) => {
  const { data: sites } = useClientSites(quotationId);
  if (!sites?.length) return <span className="text-xs text-muted-foreground">No sites</span>;
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
    const navMap: Record<string, string> = {
      dashboard: "/",
      inventory: "/",
      workforce: "/",
      sites: "/sites",
      maintenance: "/maintenance-logs",
      revenue: "/revenue",
      accounting: "/accounting",
      "site-master-plan": "/site-master-plan",
      settings: "/settings",
    };
    const path = navMap[item];
    if (!path) return;
    if (item === "dashboard" || item === "inventory" || item === "workforce") {
      navigate("/", { state: { activeItem: item }, replace: true });
    } else {
      navigate(path);
    }
  };

  const handleOpenWorkflow = (quotation: HireQuotation) => {
    setSelectedQuotation(quotation);
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  };

  const statusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "active": return "bg-success/10 text-success border-success/20";
      case "dispatched": return "bg-primary/10 text-primary border-primary/20";
      case "completed": return "bg-muted text-muted-foreground";
      default: return "bg-warning/10 text-warning border-warning/20";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar activeItem="previous-clients" onItemClick={handleSidebarItemClick} />

      <main className="ml-0 md:ml-64">
        <Header
          title="Previous Clients"
          subtitle="Browse saved hire quotations and reopen client workflows from the archive."
        />

        <div className="p-4 md:p-6 space-y-4 md:space-y-6">
          <section>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                  <FolderClock className="h-5 w-5" />
                  Previous Clients
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Browse all saved hire quotations and reopen the workflow for any client.
                </p>
              </CardHeader>
              <CardContent className="p-0">
                {isLoading ? (
                  <p className="px-4 pb-4 text-sm text-muted-foreground">Loading saved clients...</p>
                ) : hireQuotations.length ? (
                  /* Mobile card list */
                  <div className="divide-y divide-border">
                    {hireQuotations.map((quotation) => (
                      <div key={quotation.id} className="px-4 py-3.5 hover:bg-muted/20 transition-colors">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-sm truncate">
                              {quotation.company_name || quotation.site_manager_name || "Unnamed client"}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {quotation.site_name || "No site"} · {formatDate(quotation.created_at)}
                            </p>
                          </div>
                          <Badge className={`text-xs border capitalize shrink-0 ${statusColor(quotation.status || "draft")}`}>
                            {quotation.status || "draft"}
                          </Badge>
                        </div>
                        <div className="mb-2.5">
                          <ClientSitesBadges quotationId={quotation.id} />
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full sm:w-auto"
                          onClick={() => handleOpenWorkflow(quotation)}
                        >
                          Open Workflow
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="px-4 pb-6 pt-2 rounded-lg border border-dashed border-border m-4 text-center text-sm text-muted-foreground">
                    No saved quotations found yet. Create a new hire quotation to get started.
                  </div>
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

export default PreviousClients;
