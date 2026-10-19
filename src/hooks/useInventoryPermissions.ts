import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export const useInventoryPermissions = () => {
  const { user } = useAuth();
  const permission = useQuery({
    queryKey: ["manual-inventory-permission", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      // The database verifies the signed-in identity; names and browser storage
      // are never used to grant access.
      const { data, error } = await supabase.rpc("can_manage_manual_inventory" as never);
      if (error) throw error;
      return data === true;
    },
  });
  return {
    canManageInventory: Boolean(user) && permission.data === true,
    isLoading: Boolean(user) && permission.isPending,
  };
};