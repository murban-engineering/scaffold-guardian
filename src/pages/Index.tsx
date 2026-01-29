import { useState } from "react";
import { Package, MapPin, ClipboardCheck, AlertTriangle, Users, Wrench } from "lucide-react";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import StatCard from "@/components/dashboard/StatCard";
import InventoryOverview from "@/components/dashboard/InventoryOverview";
import RecentInspections from "@/components/dashboard/RecentInspections";
import ActiveSites from "@/components/dashboard/ActiveSites";
import AlertsWidget from "@/components/dashboard/AlertsWidget";
import QuickActions from "@/components/dashboard/QuickActions";
import HireQuotationForm from "@/components/dashboard/HireQuotationForm";
import HireQuotationWorkflow, { ProcessedClient } from "@/components/dashboard/HireQuotationWorkflow";
import { useAuth } from "@/contexts/AuthContext";
import { useDashboardStats } from "@/hooks/useDashboardStats";

const Index = () => {
  const [activeItem, setActiveItem] = useState("dashboard");
  const [processedClient, setProcessedClient] = useState<ProcessedClient | null>(null);
  const { profile } = useAuth();
  const { data: stats, isLoading } = useDashboardStats();

  const getEquipmentSummary = (client: ProcessedClient) => {
    if (!client.equipmentItems.length) {
      return "Equipment: none listed";
    }

    const lineItems = client.equipmentItems.map((item) => {
      const label = item.description || item.itemCode || "Item";
      return `${label} (${item.qtyDelivered || "0"})`;
    });
    const preview = lineItems.slice(0, 2).join(", ");
    const remainingCount = lineItems.length - 2;
    const previewText = preview || "Equipment listed";
    const suffix = remainingCount > 0 ? ` +${remainingCount} more` : "";

    return `Equipment: ${previewText}${suffix}`;
  };

  const headerTitle = activeItem === "inventory" ? "Inventory" : "Dashboard";
  const headerSubtitle =
    activeItem === "inventory"
      ? "Live view of your scaffold stock levels."
      : `Welcome back, ${profile?.full_name?.split(' ')[0] || "there"}. Here's your scaffold operations overview.`;

  return (
    <div className="min-h-screen bg-background">
      <Sidebar
        activeItem={activeItem}
        onItemClick={setActiveItem}
        processedClient={
          processedClient
            ? {
                clientCompanyName: processedClient.clientCompanyName,
                clientName: processedClient.clientName,
                siteName: processedClient.siteName,
                siteLocation: processedClient.siteLocation,
                siteAddress: processedClient.siteAddress,
                equipmentSummary: getEquipmentSummary(processedClient),
              }
            : null
        }
      />

      <main className="ml-64">
        <Header title={headerTitle} subtitle={headerSubtitle} />

        {activeItem === "inventory" ? (
          <div className="p-6">
            <InventoryOverview />
          </div>
        ) : (
          <div className="p-6 space-y-6">
            {/* Hire Quotation Form */}
            <HireQuotationForm />
            <HireQuotationWorkflow onClientProcessed={setProcessedClient} />

            {/* Quick Actions */}
            <QuickActions />

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
              <ActiveSites />
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
