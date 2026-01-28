import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type ScaffoldStatus = "available" | "in_use" | "damaged" | "maintenance";
export type ScaffoldType = "frame" | "tube_coupler" | "mobile" | "suspended" | "cantilever" | "system";

export interface Scaffold {
  id: string;
  scaffold_type: ScaffoldType;
  status: ScaffoldStatus;
  serial_number: string | null;
  qr_code: string | null;
  site_id: string | null;
  manufacturer: string | null;
  purchase_date: string | null;
  last_inspection_date: string | null;
  next_inspection_due: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  sites?: {
    name: string;
    location: string;
  } | null;
}

export interface ScaffoldStats {
  total: number;
  available: number;
  inUse: number;
  damaged: number;
  maintenance: number;
  byType: Record<ScaffoldType, number>;
}

export const useScaffolds = () => {
  return useQuery({
    queryKey: ["scaffolds"],
    queryFn: async (): Promise<Scaffold[]> => {
      const { data, error } = await supabase
        .from("scaffolds")
        .select(`
          *,
          sites (name, location)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Scaffold[];
    },
  });
};

export const useScaffoldStats = () => {
  return useQuery({
    queryKey: ["scaffold-stats"],
    queryFn: async (): Promise<ScaffoldStats> => {
      const { data, error } = await supabase
        .from("scaffolds")
        .select("scaffold_type, status");

      if (error) throw error;

      const stats: ScaffoldStats = {
        total: data.length,
        available: 0,
        inUse: 0,
        damaged: 0,
        maintenance: 0,
        byType: {
          frame: 0,
          tube_coupler: 0,
          mobile: 0,
          suspended: 0,
          cantilever: 0,
          system: 0,
        },
      };

      data.forEach((scaffold) => {
        // Count by status
        switch (scaffold.status) {
          case "available":
            stats.available++;
            break;
          case "in_use":
            stats.inUse++;
            break;
          case "damaged":
            stats.damaged++;
            break;
          case "maintenance":
            stats.maintenance++;
            break;
        }
        
        // Count by type
        if (scaffold.scaffold_type in stats.byType) {
          stats.byType[scaffold.scaffold_type as ScaffoldType]++;
        }
      });

      return stats;
    },
  });
};

export const useCreateScaffold = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (scaffold: { scaffold_type: ScaffoldType; status?: ScaffoldStatus; serial_number?: string; site_id?: string; manufacturer?: string; notes?: string }) => {
      const { data, error } = await supabase
        .from("scaffolds")
        .insert([scaffold])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scaffolds"] });
      queryClient.invalidateQueries({ queryKey: ["scaffold-stats"] });
      toast.success("Scaffold added successfully");
    },
    onError: (error) => {
      toast.error(`Failed to add scaffold: ${error.message}`);
    },
  });
};

export const useUpdateScaffold = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Scaffold> & { id: string }) => {
      const { data, error } = await supabase
        .from("scaffolds")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scaffolds"] });
      queryClient.invalidateQueries({ queryKey: ["scaffold-stats"] });
      toast.success("Scaffold updated successfully");
    },
    onError: (error) => {
      toast.error(`Failed to update scaffold: ${error.message}`);
    },
  });
};
