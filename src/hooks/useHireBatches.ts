import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface HireBatchItem {
  id: string;
  batch_id: string;
  quotation_line_item_id: string;
  qty_loaded: number;
  qty_delivered: number;
  delivered_at: string | null;
}

export interface HireBatch {
  id: string;
  quotation_id: string;
  batch_no: number;
  status: string;
  notes: string | null;
  loaded_by: string | null;
  delivered_by: string | null;
  created_at: string;
  loaded_at: string | null;
  delivered_at: string | null;
  items?: HireBatchItem[];
}

export const useHireBatches = (quotationId: string | null) => {
  return useQuery({
    queryKey: ["hire-batches", quotationId],
    queryFn: async (): Promise<HireBatch[]> => {
      if (!quotationId) return [];
      const { data, error } = await supabase
        .from("hire_batches")
        .select("*, items:hire_batch_items(*)")
        .eq("quotation_id", quotationId)
        .order("batch_no", { ascending: true });

      if (error) throw error;
      return data as HireBatch[];
    },
    enabled: !!quotationId,
  });
};

export const useCreateHireBatch = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { quotation_id: string; batch_no: number; notes?: string | null }) => {
      const { data, error } = await supabase
        .from("hire_batches")
        .insert([{ ...input }])
        .select()
        .single();

      if (error) throw error;
      return data as HireBatch;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["hire-batches", data.quotation_id] });
      toast.success(`Batch ${data.batch_no} created.`);
    },
    onError: (error) => {
      toast.error(`Failed to create batch: ${error.message}`);
    },
  });
};

export const useUpdateHireBatch = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<HireBatch> & { id: string }) => {
      const { data, error } = await supabase
        .from("hire_batches")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as HireBatch;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["hire-batches", data.quotation_id] });
    },
    onError: (error) => {
      toast.error(`Failed to update batch: ${error.message}`);
    },
  });
};

export const useUpsertHireBatchItems = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ quotationId, items }: { quotationId: string; items: Omit<HireBatchItem, "id">[] }) => {
      const { error } = await supabase
        .from("hire_batch_items")
        .upsert(items, { onConflict: "batch_id,quotation_line_item_id" });

      if (error) throw error;
      return items;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["hire-batches", variables.quotationId] });
    },
    onError: (error) => {
      toast.error(`Failed to update batch items: ${error.message}`);
    },
  });
};
