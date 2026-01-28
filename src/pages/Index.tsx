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

const Index = () => {
  const [activeItem, setActiveItem] = useState("dashboard");

  return (
    <div className="min-h-screen bg-background">
      <Sidebar activeItem={activeItem} onItemClick={setActiveItem} />
      
      <main className="ml-64">
        <Header 
          title="Dashboard" 
          subtitle="Welcome back, John. Here's your scaffold operations overview." 
        />
        
        <div className="p-6 space-y-6">
          {/* Quick Actions */}
          <QuickActions />

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <StatCard
              title="Total Scaffolds"
              value="923"
              change="+12 this month"
              changeType="positive"
              icon={Package}
              iconBg="primary"
            />
            <StatCard
              title="Active Sites"
              value="8"
              change="2 starting soon"
              changeType="neutral"
              icon={MapPin}
              iconBg="accent"
            />
            <StatCard
              title="Inspections Due"
              value="5"
              change="3 overdue"
              changeType="negative"
              icon={ClipboardCheck}
              iconBg="success"
            />
            <StatCard
              title="Safety Alerts"
              value="3"
              change="1 critical"
              changeType="negative"
              icon={AlertTriangle}
              iconBg="danger"
            />
            <StatCard
              title="Active Workers"
              value="156"
              change="12 on leave"
              changeType="neutral"
              icon={Users}
              iconBg="accent"
            />
            <StatCard
              title="Pending Repairs"
              value="18"
              change="5 urgent"
              changeType="negative"
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
