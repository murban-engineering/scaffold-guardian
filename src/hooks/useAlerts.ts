import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Alert {
  id: string;
  type: string;
  title: string;
  description: string | null;
  priority: string;
  is_read: boolean;
  user_id: string | null;
  site_id: string | null;
  created_at: string;
}

export const useAlerts = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["alerts", user?.id],
    queryFn: async (): Promise<Alert[]> => {
      const { data, error } = await supabase
        .from("alerts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      return data as Alert[];
    },
    enabled: !!user,
  });
};

export const useUnreadAlertCount = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["unread-alerts", user?.id],
    queryFn: async (): Promise<number> => {
      const { count, error } = await supabase
        .from("alerts")
        .select("*", { count: "exact", head: true })
        .eq("is_read", false);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!user,
  });
};

export const useMarkAlertRead = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (alertId: string) => {
      const { error } = await supabase
        .from("alerts")
        .update({ is_read: true })
        .eq("id", alertId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["unread-alerts", user?.id] });
    },
  });
};
