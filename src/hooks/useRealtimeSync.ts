import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { isSupabaseConfigured, supabase } from "@/integrations/supabase/client";

/**
 * Subscribes to realtime changes on all key tables and invalidates
 * the relevant TanStack Query caches so the UI stays in sync for ALL users.
 */
export const useRealtimeSync = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const channel = supabase
      .channel("realtime-sync-v2")
      .on("postgres_changes", { event: "*", schema: "public", table: "quotation_line_items" }, () => {
        queryClient.invalidateQueries({ queryKey: ["hire-quotations"] });
        queryClient.invalidateQueries({ queryKey: ["hire-quotation"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "hire_quotations" }, () => {
        queryClient.invalidateQueries({ queryKey: ["hire-quotations"] });
        queryClient.invalidateQueries({ queryKey: ["hire-quotation"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "scaffolds" }, () => {
        queryClient.invalidateQueries({ queryKey: ["scaffolds"] });
        queryClient.invalidateQueries({ queryKey: ["scaffold-stats"] });
        queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "client_sites" }, () => {
        queryClient.invalidateQueries({ queryKey: ["client-sites"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "sites" }, () => {
        queryClient.invalidateQueries({ queryKey: ["sites"] });
        queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "alerts" }, () => {
        queryClient.invalidateQueries({ queryKey: ["alerts"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => {
        queryClient.invalidateQueries({ queryKey: ["profiles"] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
};
