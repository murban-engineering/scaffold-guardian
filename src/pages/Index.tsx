import { useEffect, useState } from "react";
import { FileText, FolderClock, Building2, FlaskConical } from "lucide-react";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import InventoryOverview from "@/components/dashboard/InventoryOverview";
import ActiveClients from "@/components/dashboard/ActiveClients";
import RecentInspections from "@/components/dashboard/RecentInspections";
import ActiveSites from "@/components/dashboard/ActiveSites";
import QuickActions from "@/components/dashboard/QuickActions";
import MaintenanceLogOverview from "@/components/dashboard/MaintenanceLogOverview";
import AIChatAssistant from "@/components/dashboard/AIChatAssistant";
import DashboardCalendar from "@/components/dashboard/DashboardCalendar";

import HireQuotationWorkflow, { ProcessedClient } from "@/components/dashboard/HireQuotationWorkflow";
import type { StepKey } from "@/components/dashboard/HireQuotationWorkflow";
import SignedInUsers from "@/components/workforce/SignedInUsers";
import { useAuth } from "@/contexts/AuthContext";
import { useCreateQuotation, useHireQuotations, useUpdateQuotation, HireQuotation } from "@/hooks/useHireQuotations";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useLocation, useNavigate } from "react-router-dom";
import { useRealtimeSync } from "@/hooks/useRealtimeSync";

const Index = () => {
  useRealtimeSync();
  const location = useLocation();
  const navigate = useNavigate();
  const [activeItem, setActiveItem] = useState(() => {
    const stateItem = (location.state as { activeItem?: string } | null)?.activeItem;
    return stateItem ?? "dashboard";
  });
  const [globalSearch, setGlobalSearch] = useState("");
  const [processedClient, setProcessedClient] = useState<ProcessedClient | null>(null);
  const [showQuotationDialog, setShowQuotationDialog] = useState(false);
  const [showContinueDialog, setShowContinueDialog] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState<HireQuotation | null>(null);
  const [selectedExistingClient, setSelectedExistingClient] = useState<HireQuotation | null>(null);
  const [workflowInitialStep, setWorkflowInitialStep] = useState<StepKey | undefined>(undefined);
  const [workflowInitialClientMode, setWorkflowInitialClientMode] = useState<"new" | "existing">("new");
  const [isTestQuotationFlow, setIsTestQuotationFlow] = useState(false);
  const { profile, hasRole, loading: authLoading } = useAuth();
  const canViewWorkforce = hasRole("admin");
  const { data: hireQuotations = [], isLoading: quotationsLoading } = useHireQuotations();
  const createQuotation = useCreateQuotation();
  const updateQuotation = useUpdateQuotation();

  useEffect(() => {
    const stateItem = (location.state as { activeItem?: string } | null)?.activeItem;
    if (stateItem) {
      setActiveItem(stateItem);
      // Clear the state to prevent stale navigation
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  useEffect(() => {
    if (!authLoading && activeItem === "workforce" && !canViewWorkforce) {
      setActiveItem("dashboard");
    }
  }, [activeItem, authLoading, canViewWorkforce]);

  const headerTitle =
    activeItem === "inventory"
      ? "Inventory"
      : activeItem === "workforce"
        ? "Workforce"
        : activeItem === "otnoai"
          ? "OTNOAI"
          : activeItem === "site-master"
            ? "Site Master Plan"
            : activeItem === "yard-verification"
              ? "Yard Verification"
              : "Dashboard";
  const headerSubtitle =
    activeItem === "inventory"
      ? "Live view of your scaffold stock levels."
      : activeItem === "workforce"
        ? "Track the team members currently signed in to your workspace."
        : activeItem === "otnoai"
          ? "Your AI-powered assistant for inventory, sites, and maintenance."
          : activeItem === "site-master"
            ? "Manage client site locations and configurations."
            : activeItem === "yard-verification"
              ? "Verify and generate yard verification reports."
              : `Welcome back, ${profile?.full_name?.split(' ')[0] || "there"}. Here's your scaffold operations overview.`;

  const formatDate = (value: string | null) => {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleDateString("en-ZA", { year: "numeric", month: "short", day: "numeric" });
  };

  const existingClientOptions = hireQuotations
    .filter((quotation) => (quotation.company_name || quotation.site_manager_name) && quotation.quotation_number)
    .reduce<HireQuotation[]>((acc, quotation) => {
      const companyKey = (quotation.company_name || "").trim().toLowerCase();
      const clientId = quotation.quotation_number.replace("HSQ-", "CL-").toLowerCase();
      const key = `${companyKey}|${clientId}`;
      if (acc.some((entry) => `${(entry.company_name || "").trim().toLowerCase()}|${entry.quotation_number.replace("HSQ-", "CL-").toLowerCase()}` === key)) {
        return acc;
      }
      acc.push(quotation);
      return acc;
    }, [])
    .slice(0, 10);

  const isTestQuotation = (quotation: HireQuotation) =>
    (quotation.quotation_number || "").toUpperCase().startsWith("CL-");

  const standardQuotations = hireQuotations.filter((quotation) => !isTestQuotation(quotation));
  const testQuotations = hireQuotations.filter((quotation) => isTestQuotation(quotation));

  const handleStartNewQuotation = () => {
    setSelectedQuotation(null);
    setSelectedExistingClient(null);
    setWorkflowInitialStep(undefined);
    setWorkflowInitialClientMode("new");
    setIsTestQuotationFlow(false);
    setShowQuotationDialog(true);
  };

  const handleStartExistingClientOrder = (quotation?: HireQuotation) => {
    setSelectedQuotation(null);
    setSelectedExistingClient(quotation ?? null);
    setWorkflowInitialStep(undefined);
    setWorkflowInitialClientMode("existing");
    setIsTestQuotationFlow(false);
    setShowQuotationDialog(true);
  };

  const handleContinueQuotation = (quotation: HireQuotation) => {
    setSelectedExistingClient(null);
    setSelectedQuotation(quotation);
    setIsTestQuotationFlow(false);
    setShowContinueDialog(false);
    // If coming from sidebar site-master or yard-verification, show inline view
    if (activeItem === "site-master" || activeItem === "yard-verification") {
      return;
    }
    setShowQuotationDialog(true);
  };

  const handleStartTestQuotation = async (quotation?: HireQuotation) => {
    if (quotation) {
      setSelectedQuotation(null);
      setSelectedExistingClient(quotation);
      setWorkflowInitialClientMode("existing");
      setIsTestQuotationFlow(true);
      setWorkflowInitialStep("equipment");
      setShowQuotationDialog(true);
      return;
    }

    try {
      const todayLabel = new Date().toLocaleDateString("en-ZA", { day: "2-digit", month: "short", year: "numeric" });
      const quotation = await createQuotation.mutateAsync({
        company_name: "Test Quotation Client",
        site_name: `Price Check ${todayLabel}`,
        site_manager_name: "Prospective Client",
        notes: "Temporary quotation for price-check only.",
      });

      const customerNumber = quotation.quotation_number
        .replace("HSQ-", "CL-")
        .replace("HQ-", "CL-");

      const testQuotation = await updateQuotation.mutateAsync({
        id: quotation.id,
        quotation_number: customerNumber,
      });

      setSelectedExistingClient(null);
      setSelectedQuotation(testQuotation);
      setWorkflowInitialClientMode("new");
      setIsTestQuotationFlow(true);
      setWorkflowInitialStep("equipment");
      setShowQuotationDialog(true);

      toast.success(`Test quotation created. Customer number: ${customerNumber}`);
    } catch (error) {
      console.error("Failed to create test quotation", error);
    }
  };

  const handleSidebarItemClick = (item: string) => {
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
    if (item === "settings") {
      navigate("/settings");
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
    if (item === "site-master" || item === "yard-verification") {
      setActiveItem(item);
      setWorkflowInitialStep(item === "site-master" ? "site-master" : "delivery");
      setShowContinueDialog(true);
      return;
    }
    setActiveItem(item);
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar
        activeItem={activeItem}
        onItemClick={handleSidebarItemClick}
        processedClient={processedClient}
      />

      <main className="ml-0 md:ml-64">
        <Header title={headerTitle} subtitle={headerSubtitle} searchValue={globalSearch} onSearchChange={(v) => { setGlobalSearch(v); if (v.trim() && activeItem === "dashboard") setActiveItem("inventory"); }} />

        {activeItem === "inventory" ? (
          <div className="mx-auto w-full max-w-7xl px-6 py-8">
            <div className="rounded-2xl border border-border/60 bg-card/80 p-6 shadow-sm backdrop-blur">
              <InventoryOverview externalSearch={globalSearch} />
            </div>
          </div>
        ) : activeItem === "workforce" ? (
          <div className="mx-auto w-full max-w-7xl px-6 py-8">
            <div className="rounded-2xl border border-border/60 bg-card/80 p-6 shadow-sm backdrop-blur">
              <SignedInUsers />
            </div>
          </div>
        ) : activeItem === "otnoai" ? (
          <div className="mx-auto w-full max-w-7xl px-6 py-8">
            <div className="rounded-2xl border border-border/60 bg-card/80 shadow-sm backdrop-blur overflow-hidden" style={{ height: "calc(100vh - 160px)" }}>
              <AIChatAssistant embedded />
            </div>
          </div>
        ) : (activeItem === "site-master" || activeItem === "yard-verification") && selectedQuotation ? (
          <div className="mx-auto w-full max-w-7xl px-6 py-8">
            <div className="rounded-2xl border border-border/60 bg-card/80 p-6 shadow-sm backdrop-blur">
              <HireQuotationWorkflow
                key={`${selectedQuotation.id}-${activeItem}`}
                initialQuotation={selectedQuotation}
                initialStep={activeItem === "site-master" ? "site-master" : "delivery"}
                onClientProcessed={(client) => {
                  setProcessedClient(client);
                }}
              />
            </div>
          </div>
        ) : (
          <div className="mx-auto w-full max-w-7xl space-y-8 px-6 py-8">
            {/* Quick Actions with Hire Quotation Button */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_auto]">
                {/* Date + Quotation Actions */}
                <div className="rounded-2xl bg-gradient-to-br from-[hsl(172_50%_26%)] to-[hsl(172_50%_20%)] p-6 text-white shadow-lg">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">
                        {new Date().toLocaleDateString("en-US", { weekday: "long" })}
                      </p>
                      <p className="mt-1 text-5xl font-bold leading-none tracking-tight">
                        {new Date().getDate()}
                      </p>
                      <p className="mt-2 text-sm text-white/70">
                        {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                      </p>
                      <p className="mt-1 text-lg font-medium text-white/90">
                        {new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          size="sm"
                          className="gap-1.5 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-[hsl(172,50%,26%)] shadow transition-all hover:-translate-y-0.5 hover:bg-white/90"
                        >
                          <FileText className="h-3.5 w-3.5" />
                          Hire Quotation Actions
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-72">
                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger className="cursor-pointer">
                            <FlaskConical className="mr-2 h-4 w-4" />
                            Test Quotation
                          </DropdownMenuSubTrigger>
                          <DropdownMenuSubContent className="max-h-80 w-72 overflow-y-auto">
                            <DropdownMenuItem
                              onClick={() => handleStartTestQuotation()}
                              disabled={createQuotation.isPending}
                              className="cursor-pointer"
                            >
                              <FlaskConical className="mr-2 h-4 w-4" />
                              {createQuotation.isPending ? "Creating Test Quotation..." : "New Test Quotation"}
                            </DropdownMenuItem>
                            {existingClientOptions.length ? (
                              existingClientOptions.map((quotation) => {
                                const clientId = quotation.quotation_number.replace("HSQ-", "CL-");
                                return (
                                  <DropdownMenuItem
                                    key={`test-${quotation.id}`}
                                    className="cursor-pointer"
                                    onClick={() => handleStartTestQuotation(quotation)}
                                  >
                                    <div className="min-w-0">
                                      <p className="truncate text-sm font-medium">{clientId}</p>
                                      <p className="truncate text-xs text-muted-foreground">
                                        {quotation.company_name || quotation.site_manager_name || "Unnamed client"}
                                      </p>
                                    </div>
                                  </DropdownMenuItem>
                                );
                              })
                            ) : (
                              <DropdownMenuItem disabled>No client IDs available</DropdownMenuItem>
                            )}
                          </DropdownMenuSubContent>
                        </DropdownMenuSub>
                        <DropdownMenuItem onClick={handleStartNewQuotation} className="cursor-pointer">
                          <FileText className="mr-2 h-4 w-4" />
                          New Hire Quotation
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setShowContinueDialog(true)} className="cursor-pointer">
                          <FolderClock className="mr-2 h-4 w-4" />
                          Continue Quotation
                        </DropdownMenuItem>
                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger className="cursor-pointer">
                            <Building2 className="mr-2 h-4 w-4" />
                            Existing Client New Quotation
                          </DropdownMenuSubTrigger>
                          <DropdownMenuSubContent className="max-h-80 w-72 overflow-y-auto">
                            {existingClientOptions.length ? (
                              existingClientOptions.map((quotation) => {
                                const clientId = quotation.quotation_number.replace("HSQ-", "CL-");
                                return (
                                  <DropdownMenuItem
                                    key={quotation.id}
                                    className="cursor-pointer"
                                    onClick={() => handleStartExistingClientOrder(quotation)}
                                  >
                                    <div className="min-w-0">
                                      <p className="truncate text-sm font-medium">
                                        {quotation.company_name || quotation.site_manager_name || "Unnamed client"}
                                      </p>
                                      <p className="truncate text-xs text-muted-foreground">
                                        {clientId} • {quotation.site_manager_name || "No contact"}
                                      </p>
                                    </div>
                                  </DropdownMenuItem>
                                );
                              })
                            ) : (
                              <DropdownMenuItem disabled>No existing clients available</DropdownMenuItem>
                            )}
                          </DropdownMenuSubContent>
                        </DropdownMenuSub>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Mini Calendar */}
                <div className="rounded-2xl bg-gradient-to-br from-[hsl(172_50%_26%)] to-[hsl(172_50%_20%)] p-4 text-white shadow-lg">
                  <DashboardCalendar />
                </div>
              </div>
              <QuickActions />
            </div>

            {/* Chart + Clients Row */}
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_1fr]">
              <ActiveClients />
              <InventoryOverview chartOnly />
            </div>

            {/* Full Inventory Table */}
            <div className="xl:col-span-full">
              <InventoryOverview />
            </div>

            {/* Bottom Grid */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <RecentInspections />
              <ActiveSites processedClient={processedClient} />
            </div>

            <MaintenanceLogOverview />
          </div>
        )}

        {/* Hire Quotation Dialog - accessible from all views */}
        <Dialog
          open={showQuotationDialog}
          onOpenChange={(open) => {
            setShowQuotationDialog(open);
            if (!open) {
              setSelectedQuotation(null);
              setSelectedExistingClient(null);
              setWorkflowInitialStep(undefined);
              setWorkflowInitialClientMode("new");
              setIsTestQuotationFlow(false);
            }
          }}
        >
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Hire Quotation</DialogTitle>
            </DialogHeader>
            <HireQuotationWorkflow 
              initialQuotation={selectedQuotation}
              initialStep={workflowInitialStep}
              initialClientMode={workflowInitialClientMode}
              initialExistingClient={selectedExistingClient}
              isTestQuotation={isTestQuotationFlow}
              onClientProcessed={(client) => {
                setProcessedClient(client);
                setShowQuotationDialog(false);
              }} 
            />
          </DialogContent>
        </Dialog>
        <Dialog open={showContinueDialog} onOpenChange={(open) => {
          setShowContinueDialog(open);
          if (!open && (activeItem === "site-master" || activeItem === "yard-verification") && !selectedQuotation) {
            setActiveItem("dashboard");
          }
        }}>
          <DialogContent className="max-w-5xl">
            <DialogHeader>
              <DialogTitle>
                {activeItem === "site-master" ? "Select Quotation for Site Master Plan" : activeItem === "yard-verification" ? "Select Quotation for Yard Verification" : "Continue Saved Quotation"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {activeItem === "site-master" || activeItem === "yard-verification"
                  ? "Select a quotation to work with."
                  : "Resume a saved hire quotation with client details and order line items."}
              </p>
              {quotationsLoading ? (
                <p className="text-sm text-muted-foreground">Loading saved quotations...</p>
              ) : hireQuotations.length ? (
                <div className="max-h-[60vh] space-y-4 overflow-y-auto">
                  {[
                    { title: "Saved Quotations", rows: standardQuotations },
                    { title: "Test Quotations", rows: testQuotations },
                  ]
                    .filter((section) => section.rows.length > 0)
                    .map((section) => (
                      <div key={section.title} className="rounded-lg border border-border">
                        <div className="border-b px-4 py-2">
                          <p className="text-sm font-medium">{section.title}</p>
                        </div>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Quotation</TableHead>
                              <TableHead>Client</TableHead>
                              <TableHead>Site</TableHead>
                              <TableHead>Order Summary</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {section.rows.map((quotation) => {
                              const lineItems = quotation.line_items ?? [];
                              const itemCount = lineItems.reduce((sum, item) => sum + (item.quantity ?? 0), 0);
                              const weeklyTotal = lineItems.reduce(
                                (sum, item) => {
                                  if (item.weekly_total != null) {
                                    return sum + item.weekly_total;
                                  }
                                  const rate = item.weekly_rate ?? 0;
                                  const qty = item.quantity ?? 0;
                                  const discountRate = Math.min(Math.max(item.hire_discount ?? 0, 0), 100) / 100;
                                  const hireRate = Math.max(rate * (1 - discountRate), 0);
                                  return sum + hireRate * qty;
                                },
                                0
                              );

                              return (
                                <TableRow key={quotation.id}>
                                  <TableCell>
                                    <div className="font-medium">{quotation.quotation_number || "Draft"}</div>
                                    <div className="text-xs text-muted-foreground">{formatDate(quotation.created_at)}</div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="font-medium">{quotation.company_name || "Unnamed client"}</div>
                                    <div className="text-xs text-muted-foreground">{quotation.site_manager_name || "No contact"}</div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="font-medium">{quotation.site_name || "No site name"}</div>
                                    <div className="text-xs text-muted-foreground line-clamp-1">
                                      {quotation.site_address || "No site address"}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="font-medium">{itemCount} item(s)</div>
                                    <div className="text-xs text-muted-foreground">
                                      Weekly total: Ksh {weeklyTotal.toLocaleString("en-KE", { minimumFractionDigits: 2 })}
                                    </div>
                                  </TableCell>
                                  <TableCell className="capitalize">{quotation.status || "draft"}</TableCell>
                                  <TableCell className="text-right">
                                    <Button size="sm" onClick={() => handleContinueQuotation(quotation)}>
                                      {activeItem === "site-master" || activeItem === "yard-verification" ? "Select" : "Continue"}
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                  No saved quotations found yet. Create a new hire quotation to get started.
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default Index;
