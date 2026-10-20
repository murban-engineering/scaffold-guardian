import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { fetchManualInventoryPermission } from "@/lib/manualInventoryPermission";

export const useInventoryPermissions = () => {
  const { user } = useAuth();
  const permission = useQuery({
    queryKey: ["manual-inventory-permission", user?.id],
    enabled: Boolean(user),
    queryFn: fetchManualInventoryPermission,
  });
  return {
    canManageInventory: Boolean(user) && permission.data === true,
    isLoading: Boolean(user) && permission.isPending,
  };
};