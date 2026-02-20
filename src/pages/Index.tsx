import { useEffect, useState } from "react";
import { PackageSearch, MapPinned, ClipboardCheck, ShieldAlert, UsersRound, Wrench, FileText, FolderClock } from "lucide-react";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import StatCard from "@/components/dashboard/StatCard";
import InventoryOverview from "@/components/dashboard/InventoryOverview";
import RecentInspections from "@/components/dashboard/RecentInspections";
import ActiveSites from "@/components/dashboard/ActiveSites";
import AlertsWidget from "@/components/dashboard/AlertsWidget";
import QuickActions from "@/components/dashboard/QuickActions";
import MaintenanceLogOverview from "@/components/dashboard/MaintenanceLogOverview";
import AIChatAssistant from "@/components/dashboard/AIChatAssistant";
import DashboardCalendar from "@/components/dashboard/DashboardCalendar";

import HireQuotationWorkflow, { ProcessedClient } from "@/components/dashboard/HireQuotationWorkflow";
import type { StepKey } from "@/components/dashboard/HireQuotationWorkflow";
import SignedInUsers from "@/components/workforce/SignedInUsers";
import { useAuth } from "@/contexts/AuthContext";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useHireQuotations, HireQuotation } from "@/hooks/useHireQuotations";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
  const [workflowInitialStep, setWorkflowInitialStep] = useState<StepKey | undefined>(undefined);
  const [workflowInitialClientMode, setWorkflowInitialClientMode] = useState<"new" | "existing">("new");
  const { profile, hasRole, loading: authLoading } = useAuth();
  const canViewWorkforce = hasRole("admin");
  const { data: stats, isLoading } = useDashboardStats();
  const { data: hireQuotations = [], isLoading: quotationsLoading } = useHireQuotations();

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

  const handleStartNewQuotation = () => {
    setSelectedQuotation(null);
    setWorkflowInitialStep(undefined);
    setWorkflowInitialClientMode("new");
    setShowQuotationDialog(true);
  };

  const handleStartExistingClientOrder = () => {
    setSelectedQuotation(null);
    setWorkflowInitialStep(undefined);
    setWorkflowInitialClientMode("existing");
    setShowQuotationDialog(true);
  };

  const handleContinueQuotation = (quotation: HireQuotation) => {
    setSelectedQuotation(quotation);
    setShowContinueDialog(false);
    // If coming from sidebar site-master or yard-verification, show inline view
    if (activeItem === "site-master" || activeItem === "yard-verification") {
      return;
    }
    setShowQuotationDialog(true);
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
                      <DropdownMenuContent align="end" className="w-64">
                        <DropdownMenuItem onClick={handleStartNewQuotation} className="cursor-pointer">
                          <FileText className="mr-2 h-4 w-4" />
                          New Hire Quotation
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleStartExistingClientOrder} className="cursor-pointer">
                          <FileText className="mr-2 h-4 w-4" />
                          Existing Client New Site
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setShowContinueDialog(true)} className="cursor-pointer">
                          <FolderClock className="mr-2 h-4 w-4" />
                          Continue Quotation
                        </DropdownMenuItem>
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

            {/* Stats Grid */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
              <StatCard
                title="Total Scaffolds"
                value={isLoading ? "..." : stats?.totalScaffolds || 0}
                change={stats?.totalScaffolds ? "+12 this month" : "Add scaffolds to get started"}
                changeType={stats?.totalScaffolds ? "positive" : "neutral"}
                icon={PackageSearch}
                iconBg="primary"
              />
              <StatCard
                title="Active Sites"
                value={isLoading ? "..." : stats?.activeSites || 0}
                change={stats?.activeSites ? "2 starting soon" : "Create your first site"}
                changeType="neutral"
                icon={MapPinned}
                iconBg="accent"
              />
              <StatCard
                title="Inspections Due"
                value={isLoading ? "..." : stats?.inspectionsDue || 0}
                change={
                  stats?.inspectionsDue && stats.inspectionsDue > 0
                    ? `${stats.inspectionsDue} pending`
                    : "All caught up"
                }
                changeType={
                  stats?.inspectionsDue && stats.inspectionsDue > 0 ? "negative" : "positive"
                }
                icon={ClipboardCheck}
                iconBg="success"
              />
              <StatCard
                title="Safety Alerts"
                value={isLoading ? "..." : stats?.safetyAlerts || 0}
                change={stats?.safetyAlerts ? "Needs attention" : "No alerts"}
                changeType={stats?.safetyAlerts ? "negative" : "positive"}
                icon={ShieldAlert}
                iconBg="danger"
              />
              <StatCard
                title="Active Workers"
                value={isLoading ? "..." : stats?.activeWorkers || 0}
                change="Team members"
                changeType="neutral"
                icon={UsersRound}
                iconBg="accent"
              />
              <StatCard
                title="Pending Repairs"
                value={isLoading ? "..." : stats?.pendingRepairs || 0}
                change={stats?.pendingRepairs ? "Needs resolution" : "All resolved"}
                changeType={stats?.pendingRepairs ? "negative" : "positive"}
                icon={Wrench}
                iconBg="warning"
              />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
              {/* Left Column - Inventory */}
              <div className="xl:col-span-2">
                <InventoryOverview />
              </div>

              {/* Right Column - Alerts */}
              <div>
                <AlertsWidget />
              </div>
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
              setWorkflowInitialStep(undefined);
              setWorkflowInitialClientMode("new");
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
                <div className="max-h-[60vh] overflow-y-auto rounded-lg border border-border">
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
                      {hireQuotations.map((quotation) => {
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
