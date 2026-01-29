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
import { useAuth } from "@/contexts/AuthContext";
import { useDashboardStats } from "@/hooks/useDashboardStats";

const Index = () => {
  const [activeItem, setActiveItem] = useState("dashboard");
  const { profile } = useAuth();
  const { data: stats, isLoading } = useDashboardStats();

  return (
    <div className="min-h-screen bg-background">
      <Sidebar activeItem={activeItem} onItemClick={setActiveItem} />
      
      <main className="ml-64">
        <Header 
          title="Dashboard" 
          subtitle={`Welcome back, ${profile?.full_name?.split(' ')[0] || 'there'}. Here's your scaffold operations overview.`}
        />
        
        <div className="p-6 space-y-6">
          {/* Hire Quotation Form */}
          <HireQuotationForm />

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
              change={stats?.inspectionsDue && stats.inspectionsDue > 0 ? `${stats.inspectionsDue} pending` : "All caught up"}
              changeType={stats?.inspectionsDue && stats.inspectionsDue > 0 ? "negative" : "positive"}
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
      </main>
    </div>
  );
};

export default Index;
