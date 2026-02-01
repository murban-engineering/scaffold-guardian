import { useEffect, useState } from "react";
import { Package, MapPin, ClipboardCheck, AlertTriangle, Users, Wrench, FileText, FolderClock } from "lucide-react";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import StatCard from "@/components/dashboard/StatCard";
import InventoryOverview from "@/components/dashboard/InventoryOverview";
import RecentInspections from "@/components/dashboard/RecentInspections";
import ActiveSites from "@/components/dashboard/ActiveSites";
import AlertsWidget from "@/components/dashboard/AlertsWidget";
import QuickActions from "@/components/dashboard/QuickActions";

import HireQuotationWorkflow, { ProcessedClient } from "@/components/dashboard/HireQuotationWorkflow";
import SignedInUsers from "@/components/workforce/SignedInUsers";
import { useAuth } from "@/contexts/AuthContext";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useHireQuotations, HireQuotation } from "@/hooks/useHireQuotations";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useLocation, useNavigate } from "react-router-dom";

const Index = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeItem, setActiveItem] = useState(() => {
    const stateItem = (location.state as { activeItem?: string } | null)?.activeItem;
    return stateItem ?? "dashboard";
  });
  const [processedClient, setProcessedClient] = useState<ProcessedClient | null>(null);
  const [showQuotationDialog, setShowQuotationDialog] = useState(false);
  const [showContinueDialog, setShowContinueDialog] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState<HireQuotation | null>(null);
  const { profile } = useAuth();
  const { data: stats, isLoading } = useDashboardStats();
  const { data: hireQuotations = [], isLoading: quotationsLoading } = useHireQuotations();

  useEffect(() => {
    const stateItem = (location.state as { activeItem?: string } | null)?.activeItem;
    if (stateItem && stateItem !== activeItem) {
      setActiveItem(stateItem);
    }
  }, [activeItem, location.state]);

  const headerTitle =
    activeItem === "inventory"
      ? "Inventory"
      : activeItem === "workforce"
        ? "Workforce"
        : "Dashboard";
  const headerSubtitle =
    activeItem === "inventory"
      ? "Live view of your scaffold stock levels."
      : activeItem === "workforce"
        ? "Track the team members currently signed in to your workspace."
        : `Welcome back, ${profile?.full_name?.split(' ')[0] || "there"}. Here's your scaffold operations overview.`;

  const formatDate = (value: string | null) => {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleDateString("en-ZA", { year: "numeric", month: "short", day: "numeric" });
  };

  const handleStartNewQuotation = () => {
    setSelectedQuotation(null);
    setShowQuotationDialog(true);
  };

  const handleContinueQuotation = (quotation: HireQuotation) => {
    setSelectedQuotation(quotation);
    setShowContinueDialog(false);
    setShowQuotationDialog(true);
  };

  const handleSidebarItemClick = (item: string) => {
    if (item === "sites") {
      navigate("/sites");
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

      <main className="ml-64">
        <Header title={headerTitle} subtitle={headerSubtitle} />

        {activeItem === "inventory" ? (
          <div className="p-6">
            <InventoryOverview />
          </div>
        ) : activeItem === "workforce" ? (
          <div className="p-6">
            <SignedInUsers />
          </div>
        ) : (
          <div className="p-6 space-y-6">
            {/* Quick Actions with Hire Quotation Button */}
            <div className="flex flex-wrap items-center gap-4">
              <Button 
                size="lg" 
                onClick={handleStartNewQuotation}
                className="gap-2"
              >
                <FileText className="h-5 w-5" />
                New Hire Quotation
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => setShowContinueDialog(true)}
                className="gap-2"
              >
                <FolderClock className="h-5 w-5" />
                Continue Quotation
              </Button>
              <QuickActions />
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              <StatCard
                title="Total Scaffolds"
                value={isLoading ? "..." : stats?.totalScaffolds || 0}
                change={stats?.totalScaffolds ? "+12 this month" : "Add scaffolds to get started"}
                changeType={stats?.totalScaffolds ? "positive" : "neutral"}
                icon={Package}
                iconBg="primary"
              />
              <StatCard
                title="Active Sites"
                value={isLoading ? "..." : stats?.activeSites || 0}
                change={stats?.activeSites ? "2 starting soon" : "Create your first site"}
                changeType="neutral"
                icon={MapPin}
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
                icon={AlertTriangle}
                iconBg="danger"
              />
              <StatCard
                title="Active Workers"
                value={isLoading ? "..." : stats?.activeWorkers || 0}
                change="Team members"
                changeType="neutral"
                icon={Users}
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
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RecentInspections />
              <ActiveSites processedClient={processedClient} />
            </div>

            {/* Hire Quotation Dialog */}
            <Dialog
              open={showQuotationDialog}
              onOpenChange={(open) => {
                setShowQuotationDialog(open);
                if (!open) {
                  setSelectedQuotation(null);
                }
              }}
            >
              <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create Hire Quotation</DialogTitle>
                </DialogHeader>
                <HireQuotationWorkflow 
                  initialQuotation={selectedQuotation}
                  onClientProcessed={(client) => {
                    setProcessedClient(client);
                    setShowQuotationDialog(false);
                  }} 
                />
              </DialogContent>
            </Dialog>
            <Dialog open={showContinueDialog} onOpenChange={setShowContinueDialog}>
              <DialogContent className="max-w-5xl">
                <DialogHeader>
                  <DialogTitle>Continue Saved Quotation</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Resume a saved hire quotation with client details and order line items.
                  </p>
                  {quotationsLoading ? (
                    <p className="text-sm text-muted-foreground">Loading saved quotations...</p>
                  ) : hireQuotations.length ? (
                    <div className="rounded-lg border border-border">
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
                              (sum, item) => sum + (item.weekly_total ?? item.weekly_rate * item.quantity),
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
                                    Continue
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
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
