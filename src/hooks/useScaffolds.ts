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
  part_number: string | null;
  description: string | null;
  quantity: number | null;
  mass_per_item: number | null;
  weekly_rate: number | null;
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

export interface InventoryDeductionItem {
  scaffoldId: string;
  quantity: number;
}

export const useDeductScaffoldInventory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ items, scaffolds }: { items: InventoryDeductionItem[]; scaffolds: Scaffold[] }) => {
      const updates = items
        .map((item) => {
          const scaffold = scaffolds.find((scaffoldItem) => scaffoldItem.id === item.scaffoldId);
          if (!scaffold) return null;
          const currentQuantity = scaffold.quantity ?? 0;
          const nextQuantity = Math.max(currentQuantity - item.quantity, 0);
          if (nextQuantity === currentQuantity) return null;
          return { id: scaffold.id, quantity: nextQuantity };
        })
        .filter((update): update is { id: string; quantity: number } => Boolean(update));

      if (!updates.length) {
        return [];
      }

      // Use the secure database function to update quantities
      const results = await Promise.all(
        updates.map(async (update) => {
          const { error } = await supabase.rpc("update_scaffold_quantity", {
            scaffold_id: update.id,
            new_quantity: update.quantity,
          });
          if (error) throw error;
          return { id: update.id, quantity: update.quantity };
        })
      );

      return results;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["scaffolds"] });
      queryClient.invalidateQueries({ queryKey: ["scaffold-stats"] });
      if (data.length > 0) {
        toast.success("Inventory quantities updated after delivery");
      }
    },
    onError: (error) => {
      toast.error(`Failed to update inventory: ${error.message}`);
    },
  });
};

export interface InventoryReturnItem {
  scaffoldId: string;
  quantity: number;
}

export const useReturnScaffoldInventory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ items, scaffolds }: { items: InventoryReturnItem[]; scaffolds: Scaffold[] }) => {
      const updates = items
        .map((item) => {
          const scaffold = scaffolds.find((scaffoldItem) => scaffoldItem.id === item.scaffoldId);
          if (!scaffold) return null;
          const currentQuantity = scaffold.quantity ?? 0;
          const nextQuantity = currentQuantity + item.quantity;
          if (nextQuantity === currentQuantity) return null;
          return { id: scaffold.id, quantity: nextQuantity };
        })
        .filter((update): update is { id: string; quantity: number } => Boolean(update));

      if (!updates.length) {
        return [];
      }

      // Use the secure database function to update quantities
      const results = await Promise.all(
        updates.map(async (update) => {
          const { error } = await supabase.rpc("update_scaffold_quantity", {
            scaffold_id: update.id,
            new_quantity: update.quantity,
          });
          if (error) throw error;
          return { id: update.id, quantity: update.quantity };
        })
      );

      return results;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["scaffolds"] });
      queryClient.invalidateQueries({ queryKey: ["scaffold-stats"] });
      if (data.length > 0) {
        toast.success("Inventory quantities updated after return");
      }
    },
    onError: (error) => {
      toast.error(`Failed to update inventory: ${error.message}`);
    },
  });
};
