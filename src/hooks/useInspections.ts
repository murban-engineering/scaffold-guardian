import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type InspectionStatus = "passed" | "pending" | "failed";

export interface Inspection {
  id: string;
  site_id: string;
  inspector_id: string;
  inspection_date: string;
  status: InspectionStatus;
  scaffold_count: number;
  checklist: Record<string, boolean> | null;
  findings: string | null;
  recommendations: string | null;
  photos: string[] | null;
  created_at: string;
  updated_at: string;
  sites?: {
    name: string;
    location: string;
  };
  profiles?: {
    full_name: string;
  };
}

export const useInspections = () => {
  return useQuery({
    queryKey: ["inspections"],
    queryFn: async (): Promise<Inspection[]> => {
      const { data, error } = await supabase
        .from("inspections")
        .select(`
          *,
          sites (name, location)
        `)
        .order("inspection_date", { ascending: false });

      if (error) throw error;
      return data as Inspection[];
    },
  });
};

export const useRecentInspections = (limit = 5) => {
  return useQuery({
    queryKey: ["recent-inspections", limit],
    queryFn: async (): Promise<Inspection[]> => {
      const { data, error } = await supabase
        .from("inspections")
        .select(`
          *,
          sites (name, location)
        `)
        .order("inspection_date", { ascending: false })
        .limit(limit);

      if (error) throw error;

      // Fetch inspector profiles separately
      const inspectorIds = [...new Set(data.map(i => i.inspector_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", inspectorIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p.full_name]) || []);

      return data.map(inspection => ({
        ...inspection,
        profiles: {
          full_name: profileMap.get(inspection.inspector_id) || "Unknown Inspector",
        },
      })) as Inspection[];
    },
  });
};

export const useCreateInspection = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (inspection: { site_id: string; inspector_id: string; status?: InspectionStatus; scaffold_count?: number; findings?: string; recommendations?: string }) => {
      const { data, error } = await supabase
        .from("inspections")
        .insert([inspection])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inspections"] });
      queryClient.invalidateQueries({ queryKey: ["recent-inspections"] });
      toast.success("Inspection recorded successfully");
    },
    onError: (error) => {
      toast.error(`Failed to record inspection: ${error.message}`);
    },
  });
};
