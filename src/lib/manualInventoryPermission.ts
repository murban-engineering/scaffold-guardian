import { supabase } from "@/integrations/supabase/client";

export const fetchManualInventoryPermission = async (): Promise<boolean> => {
  const { data, error } = await supabase.rpc("can_manage_manual_inventory" as never);
  if (error) throw error;
  return data === true;
};