import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type MaintenanceLogEntry = {
  scaffold_id: string;
  issue_description: string;
  reported_by: string;
  priority?: "low" | "medium" | "high" | "urgent";
};

export const useMaintenanceLogs = () => {
  return useQuery({
    queryKey: ["maintenance-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("maintenance_logs")
        .select("*, scaffolds(part_number, description)")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data ?? [];
    },
  });
};

export const useCreateMaintenanceLogs = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (entries: MaintenanceLogEntry[]) => {
      const { data, error } = await supabase.from("maintenance_logs").insert(entries).select();
      if (error) throw error;
      return data ?? [];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenance-logs"] });
      queryClient.invalidateQueries({ queryKey: ["scaffold-stats"] });
      toast.success("Maintenance logs updated");
    },
    onError: (error) => {
      toast.error(`Failed to update maintenance logs: ${error.message}`);
    },
  });
};
