import { useEffect, useState } from "react";
import { FileText, FolderClock, Building2, FlaskConical, Trash2 } from "lucide-react";
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
import { useCreateQuotation, useDeleteQuotation, useHireQuotations, useUpdateQuotation, HireQuotation } from "@/hooks/useHireQuotations";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useLocation, useNavigate } from "react-router-dom";
import { useRealtimeSync } from "@/hooks/useRealtimeSync";
import { getNextTestQuotationNumber, isTestQuotationNumber } from "@/lib/testQuotation";
import { toClientIdFromQuotationNumber } from "@/lib/clientId";

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
  const [selectedContinueClient, setSelectedContinueClient] = useState("all");
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
  const deleteQuotation = useDeleteQuotation();

  // Keep selectedQuotation live-synced with the latest DB state via realtime
  const liveSelectedQuotation = selectedQuotation
    ? (hireQuotations.find(q => q.id === selectedQuotation.id) ?? selectedQuotation)
    : null;

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

  const toClientId = (quotation: HireQuotation | null) =>
    quotation?.client_id || "No client ID";

  const existingClientOptions = hireQuotations
    .filter((quotation) => (quotation.company_name || quotation.site_manager_name) && quotation.quotation_number)
    .reduce<HireQuotation[]>((acc, quotation) => {
      const companyKey = (quotation.company_name || "").trim().toLowerCase();
      const clientId = toClientId(quotation).toLowerCase();
      const key = `${companyKey}|${clientId}`;
      if (acc.some((entry) => `${(entry.company_name || "").trim().toLowerCase()}|${toClientId(entry).toLowerCase()}` === key)) {
        return acc;
      }
      acc.push(quotation);
      return acc;
    }, [])
    .slice(0, 10);

  const testClientOptions = hireQuotations
    .filter((quotation) => isTestQuotationNumber(quotation.quotation_number))
    .reduce<HireQuotation[]>((acc, quotation) => {
      const clientId = toClientId(quotation).toLowerCase();
      if (acc.some((entry) => toClientId(entry).toLowerCase() === clientId)) {
        return acc;
      }
      acc.push(quotation);
      return acc;
    }, [])
    .slice(0, 10);

  const isTestQuotation = (quotation: HireQuotation) =>
    isTestQuotationNumber(quotation.quotation_number);

  const standardQuotations = hireQuotations.filter((quotation) => !isTestQuotation(quotation));
  const testQuotations = hireQuotations.filter((quotation) => isTestQuotation(quotation));

  const continueClientOptions = hireQuotations.reduce<Array<{ value: string; label: string }>>((acc, quotation) => {
    const companyName = quotation.company_name?.trim() || "Unnamed client";
    const clientId = toClientId(quotation);
    const value = `${companyName}|${clientId}`;
    if (!acc.some((option) => option.value === value)) {
      acc.push({ value, label: `${companyName} (${clientId})` });
    }
    return acc;
  }, []);

  const filterQuotationsByClient = (rows: HireQuotation[]) =>
    selectedContinueClient === "all"
      ? rows
      : rows.filter((quotation) => {
          const companyName = quotation.company_name?.trim() || "Unnamed client";
          const clientId = toClientId(quotation);
          return `${companyName}|${clientId}` === selectedContinueClient;
        });

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
    const continuingFromTestClient = isTestQuotation(quotation);

    if (continuingFromTestClient && activeItem !== "site-master" && activeItem !== "yard-verification") {
      setSelectedQuotation(null);
      setSelectedExistingClient(quotation);
      setWorkflowInitialClientMode("new");
      setWorkflowInitialStep(undefined);
      setIsTestQuotationFlow(false);
      toast.info("Loaded test client details into a normal quotation flow. Update the client form and save to generate a new HSQ quotation.");
    } else {
      setSelectedExistingClient(null);
      setSelectedQuotation(quotation);
      setWorkflowInitialClientMode("new");
      setWorkflowInitialStep(undefined);
      setIsTestQuotationFlow(false);
    }

    setShowContinueDialog(false);
    // If coming from sidebar site-master or yard-verification, show inline view
    if (activeItem === "site-master" || activeItem === "yard-verification") {
      return;
    }
    setShowQuotationDialog(true);
  };

  const handleStartTestQuotation = async (quotation?: HireQuotation) => {
    if (quotation) {
      setSelectedQuotation(quotation);
      setSelectedExistingClient(null);
      setWorkflowInitialClientMode("new");
      setIsTestQuotationFlow(true);
      setWorkflowInitialStep("client");
      setShowQuotationDialog(true);
      return;
    }

    try {
      const nextTestQuotationNumber = getNextTestQuotationNumber(hireQuotations);
      const created = await createQuotation.mutateAsync({
        company_name: "",
        site_name: "",
        notes: "Test quotation for equipment and pricing validation.",
      });

      const testQuotation = await updateQuotation.mutateAsync({
        id: created.id,
        quotation_number: nextTestQuotationNumber,
      });

      setSelectedQuotation(testQuotation);
      setSelectedExistingClient(null);
      setWorkflowInitialClientMode("new");
      setIsTestQuotationFlow(true);
      setWorkflowInitialStep("client");
      setShowQuotationDialog(true);
      toast.success(`Test quotation ${nextTestQuotationNumber} created. Equipment is saved on this quotation.`);
    } catch (error) {
      console.error("Failed to open test quotation", error);
    }
  };

  const handleDeleteTestQuotation = async (quotation: HireQuotation) => {
    const clientId = toClientId(quotation);
    const confirmed = window.confirm(
      `Delete test quotation ${clientId}? This will permanently remove its quotation history from the system.`,
    );

    if (!confirmed) return;

    try {
      await deleteQuotation.mutateAsync({ id: quotation.id });

      const historyKeys = [
        `hire-delivery-history:${quotation.id}`,
        `hire-return-history:${quotation.id}`,
      ];

      if (quotation.quotation_number) {
        historyKeys.push(`hire-delivery-history:${quotation.quotation_number}`);
        historyKeys.push(`hire-return-history:${quotation.quotation_number}`);
      }

      historyKeys.forEach((key) => window.localStorage.removeItem(key));

      const testDraftsRaw = window.localStorage.getItem("hire-workflow:test-drafts");
      if (testDraftsRaw) {
        const testDrafts = JSON.parse(testDraftsRaw) as Record<string, { savedQuotationId?: string; header?: { quotationNo?: string } }>;
        const filteredDrafts = Object.fromEntries(
          Object.entries(testDrafts).filter(([, draft]) => {
            const hasMatchingSavedId = draft.savedQuotationId === quotation.id;
            const hasMatchingQuotationNo =
              Boolean(quotation.quotation_number) &&
              draft.header?.quotationNo === quotation.quotation_number;
            return !hasMatchingSavedId && !hasMatchingQuotationNo;
          }),
        );

        window.localStorage.setItem("hire-workflow:test-drafts", JSON.stringify(filteredDrafts));
      }

      if (selectedQuotation?.id === quotation.id) {
        setSelectedQuotation(null);
      }

      toast.success(`Deleted test quotation ${clientId} and cleared its saved history.`);
    } catch (error) {
      console.error("Failed to delete test quotation", error);
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
                initialQuotation={liveSelectedQuotation}
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
                              {createQuotation.isPending ? "Opening..." : "Open New Test Quotation"}
                            </DropdownMenuItem>
                            {testClientOptions.length ? (
                              testClientOptions.map((quotation) => {
                                const clientId = toClientId(quotation);
                                return (
                                  <DropdownMenuItem
                                    key={`test-${quotation.id}`}
                                    className="cursor-pointer"
                                    onClick={() => handleStartTestQuotation(quotation)}
                                  >
                                    <div className="flex w-full items-start justify-between gap-2">
                                      <div className="min-w-0">
                                        <p className="truncate text-sm font-medium">{clientId}</p>
                                        <p className="truncate text-xs text-muted-foreground">
                                          {quotation.company_name || quotation.site_manager_name || "Unnamed client"}
                                        </p>
                                      </div>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 shrink-0 text-destructive hover:text-destructive"
                                        onClick={(event) => {
                                          event.preventDefault();
                                          event.stopPropagation();
                                          handleDeleteTestQuotation(quotation);
                                        }}
                                        disabled={deleteQuotation.isPending}
                                        aria-label={`Delete test quotation ${clientId}`}
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </Button>
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
                                const clientId = toClientId(quotation);
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
              <DialogTitle>{isTestQuotationFlow ? `Test Quotation — ${liveSelectedQuotation?.quotation_number ?? "Draft"}` : "Create Hire Quotation"}</DialogTitle>
            </DialogHeader>
            <HireQuotationWorkflow 
              key={`${selectedQuotation?.id ?? "new"}:${selectedExistingClient?.id ?? "none"}:${workflowInitialClientMode}:${workflowInitialStep ?? "client"}:${isTestQuotationFlow ? "test" : "standard"}`}
              initialQuotation={liveSelectedQuotation}
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
          if (open) {
            setSelectedContinueClient("all");
          }
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
              <div className="grid gap-2 md:w-[360px]">
                <Label htmlFor="continue-client-filter">Client</Label>
                <Select value={selectedContinueClient} onValueChange={setSelectedContinueClient}>
                  <SelectTrigger id="continue-client-filter">
                    <SelectValue placeholder="All clients" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All clients</SelectItem>
                    {continueClientOptions.map((client) => (
                      <SelectItem key={client.value} value={client.value}>
                        {client.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {quotationsLoading ? (
                <p className="text-sm text-muted-foreground">Loading saved quotations...</p>
              ) : hireQuotations.length ? (
                <div className="max-h-[60vh] space-y-4 overflow-y-auto">
                  {[
                    { title: "Saved Quotations", rows: filterQuotationsByClient(standardQuotations), allowContinue: true },
                    {
                      title: "Test Quotations",
                      rows:
                        activeItem === "site-master" || activeItem === "yard-verification"
                          ? []
                          : filterQuotationsByClient(testQuotations),
                      allowContinue: false,
                    },
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
                                    {section.allowContinue ? (
                                      <Button size="sm" onClick={() => handleContinueQuotation(quotation)}>
                                        {activeItem === "site-master" || activeItem === "yard-verification" ? "Select" : "Continue"}
                                      </Button>
                                    ) : (
                                      <span className="text-xs text-muted-foreground">No continue action</span>
                                    )}
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
