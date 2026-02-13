import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Subscribes to realtime changes on key tables and invalidates
 * the relevant TanStack Query caches so the UI stays in sync.
 */
export const useRealtimeSync = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel("realtime-sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "quotation_line_items" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["hire-quotations"] });
          queryClient.invalidateQueries({ queryKey: ["hire-quotation"] });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "hire_quotations" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["hire-quotations"] });
          queryClient.invalidateQueries({ queryKey: ["hire-quotation"] });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "scaffolds" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["scaffolds"] });
          queryClient.invalidateQueries({ queryKey: ["scaffold-stats"] });
          queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
};
