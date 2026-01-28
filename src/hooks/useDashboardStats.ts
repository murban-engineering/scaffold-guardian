import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface DashboardStats {
  totalScaffolds: number;
  activeSites: number;
  inspectionsDue: number;
  safetyAlerts: number;
  activeWorkers: number;
  pendingRepairs: number;
}

export const useDashboardStats = () => {
  return useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async (): Promise<DashboardStats> => {
      // Get scaffold count
      const { count: scaffoldCount } = await supabase
        .from("scaffolds")
        .select("*", { count: "exact", head: true });

      // Get active sites count
      const { count: activeSitesCount } = await supabase
        .from("sites")
        .select("*", { count: "exact", head: true })
        .in("status", ["active", "on_hold"]);

      // Get pending inspections count
      const { count: pendingInspections } = await supabase
        .from("inspections")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");

      // Get unread alerts count
      const { count: alertsCount } = await supabase
        .from("alerts")
        .select("*", { count: "exact", head: true })
        .eq("is_read", false);

      // Get unresolved maintenance count
      const { count: maintenanceCount } = await supabase
        .from("maintenance_logs")
        .select("*", { count: "exact", head: true })
        .eq("is_resolved", false);

      // Get active workers (profiles count as placeholder)
      const { count: workersCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      return {
        totalScaffolds: scaffoldCount || 0,
        activeSites: activeSitesCount || 0,
        inspectionsDue: pendingInspections || 0,
        safetyAlerts: alertsCount || 0,
        activeWorkers: workersCount || 0,
        pendingRepairs: maintenanceCount || 0,
      };
    },
  });
};
