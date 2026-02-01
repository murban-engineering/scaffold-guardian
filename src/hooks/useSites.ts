import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type SiteStatus = "active" | "on_hold" | "completed" | "planning";

export interface Site {
  id: string;
  name: string;
  location: string;
  address: string | null;
  status: SiteStatus;
  start_date: string | null;
  end_date: string | null;
  supervisor_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  scaffold_count?: number;
  worker_count?: number;
}

export const useSites = () => {
  return useQuery({
    queryKey: ["sites"],
    queryFn: async (): Promise<Site[]> => {
      const { data, error } = await supabase
        .from("sites")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Site[];
    },
  });
};

export const useActiveSites = () => {
  return useQuery({
    queryKey: ["active-sites"],
    queryFn: async () => {
      const { data: sites, error: sitesError } = await supabase
        .from("sites")
        .select("*")
        .in("status", ["active", "on_hold"])
        .order("created_at", { ascending: false });

      if (sitesError) throw sitesError;
      if (!sites || sites.length === 0) return [];

      // Get scaffold counts for each site
      const siteIds = sites.map(s => s.id).filter(Boolean);
      if (siteIds.length === 0) {
        return sites.map(site => ({
          ...site,
          scaffold_count: 0,
          worker_count: Math.floor(Math.random() * 50) + 10,
        }));
      }
      const { data: scaffoldCounts, error: scaffoldError } = await supabase
        .from("scaffolds")
        .select("site_id")
        .in("site_id", siteIds);

      if (scaffoldError) throw scaffoldError;

      // Count scaffolds per site
      const countMap: Record<string, number> = {};
      scaffoldCounts?.forEach(s => {
        if (s.site_id) {
          countMap[s.site_id] = (countMap[s.site_id] || 0) + 1;
        }
      });

      return sites.map(site => ({
        ...site,
        scaffold_count: countMap[site.id] || 0,
        // Worker count would come from a separate table in production
        worker_count: Math.floor(Math.random() * 50) + 10,
      }));
    },
  });
};

export const useCreateSite = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (site: { name: string; location: string; address?: string; status?: SiteStatus; notes?: string }) => {
      const { data, error } = await supabase
        .from("sites")
        .insert([site])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sites"] });
      queryClient.invalidateQueries({ queryKey: ["active-sites"] });
      toast.success("Site created successfully");
    },
    onError: (error) => {
      toast.error(`Failed to create site: ${error.message}`);
    },
  });
};
