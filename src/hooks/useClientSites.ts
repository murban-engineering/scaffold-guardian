import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ClientSite {
  id: string;
  quotation_id: string;
  site_number: string;
  site_suffix: string;
  site_name: string;
  site_location: string | null;
  site_address: string | null;
  site_manager_name: string | null;
  site_manager_phone: string | null;
  site_manager_email: string | null;
  site_opened_by: string | null;
  site_open_date: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateClientSiteInput {
  quotation_id: string;
  site_number: string;
  site_suffix?: string;
  site_name: string;
  site_location?: string;
  site_address?: string;
  site_manager_name?: string;
  site_manager_phone?: string;
  site_manager_email?: string;
  site_opened_by?: string;
  site_open_date?: string;
  notes?: string;
}

export const useClientSites = (quotationId: string | null) => {
  return useQuery({
    queryKey: ["client-sites", quotationId],
    queryFn: async (): Promise<ClientSite[]> => {
      if (!quotationId) return [];
      const { data, error } = await supabase
        .from("client_sites")
        .select("*")
        .eq("quotation_id", quotationId)
        .order("site_suffix", { ascending: true });

      if (error) throw error;
      return data as ClientSite[];
    },
    enabled: !!quotationId,
  });
};

export const useAllClientSites = () => {
  return useQuery({
    queryKey: ["all-client-sites"],
    queryFn: async (): Promise<ClientSite[]> => {
      const { data, error } = await supabase
        .from("client_sites")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as ClientSite[];
    },
  });
};

export const deriveSiteNumber = (quotationNo: string, suffix: string = "") => {
  const parts = quotationNo.match(/\d+/g);
  const lastPart = parts?.[parts.length - 1];
  if (!lastPart) return `NK-0001${suffix ? `-${suffix}` : ""}`;
  const num = Number.parseInt(lastPart, 10);
  if (Number.isNaN(num)) return `NK-0001${suffix ? `-${suffix}` : ""}`;
  const base = `NK-${String(num).padStart(4, "0")}`;
  return suffix ? `${base}-${suffix}` : base;
};

export const useCreateClientSite = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateClientSiteInput): Promise<ClientSite> => {
      const { data, error } = await supabase
        .from("client_sites")
        .insert([input])
        .select()
        .single();

      if (error) throw error;
      return data as ClientSite;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["client-sites", data.quotation_id] });
      toast.success(`Site ${data.site_number} created successfully`);
    },
    onError: (error) => {
      toast.error(`Failed to create site: ${error.message}`);
    },
  });
};

export const useUpdateClientSite = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ClientSite> & { id: string }): Promise<ClientSite> => {
      const { data, error } = await supabase
        .from("client_sites")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as ClientSite;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["client-sites", data.quotation_id] });
      toast.success("Site updated successfully");
    },
    onError: (error) => {
      toast.error(`Failed to update site: ${error.message}`);
    },
  });
};

export const useDeleteClientSite = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, quotation_id }: { id: string; quotation_id: string }): Promise<void> => {
      const { error } = await supabase
        .from("client_sites")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["client-sites", variables.quotation_id] });
      toast.success("Site removed successfully");
    },
    onError: (error) => {
      toast.error(`Failed to remove site: ${error.message}`);
    },
  });
};
