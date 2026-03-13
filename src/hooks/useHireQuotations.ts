import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import type { DeliveryRecord } from "@/components/dashboard/DeliveryHistorySection";
import type { ReturnRecord } from "@/components/dashboard/ReturnHistorySection";

export interface QuotationLineItem {
  id: string;
  quotation_id: string;
  scaffold_id: string | null;
  part_number: string | null;
  description: string | null;
  quantity: number;
  delivered_quantity: number;
  balance_quantity: number;
  returned_quantity: number;
  return_balance_quantity: number;
  hire_discount: number | null;
  mass_per_item: number | null;
  weekly_rate: number;
  total_mass: number | null;
  weekly_total: number | null;
  created_at: string;
  updated_at: string;
}

export interface HireQuotation {
  id: string;
  quotation_number: string;
  invoice_number: string | null;
  client_id: string | null;
  created_by: string;
  status: string;
  company_name: string | null;
  company_address: string | null;
  site_name: string | null;
  site_address: string | null;
  site_manager_name: string | null;
  site_manager_phone: string | null;
  site_manager_email: string | null;
  official_order_required: boolean;
  bulk_order_required: boolean;
  telephonic_order_acceptable: boolean;
  transport_arrangement: string | null;
  tonnage_discount: number;
  basket_discount: number;
  tube_clamp_discount: number;
  other_discount: number;
  project_type: string[] | null;
  market_segment: string[] | null;
  account_number: string | null;
  payment_method: string | null;
  credit_limit: number | null;
  delivery_address: string | null;
  hire_weeks: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  dispatch_date: string | null;
  delivery_history: DeliveryRecord[] | unknown;
  return_history: ReturnRecord[] | unknown;
  line_items?: QuotationLineItem[];
}

export interface CreateQuotationInput {
  company_name?: string;
  company_address?: string;
  site_name?: string;
  site_address?: string;
  site_manager_name?: string;
  site_manager_phone?: string;
  site_manager_email?: string;
  official_order_required?: boolean;
  bulk_order_required?: boolean;
  telephonic_order_acceptable?: boolean;
  transport_arrangement?: string;
  tonnage_discount?: number;
  basket_discount?: number;
  tube_clamp_discount?: number;
  other_discount?: number;
  project_type?: string[];
  market_segment?: string[];
  account_number?: string;
  payment_method?: string;
  credit_limit?: number;
  delivery_address?: string;
  hire_weeks?: number;
  notes?: string;
  /** If provided, use this client_id instead of generating a new one (e.g. when promoting a test quotation). */
  client_id?: string;
}

export interface CreateLineItemInput {
  quotation_id: string;
  scaffold_id?: string;
  part_number?: string;
  description?: string;
  quantity: number;
  delivered_quantity?: number;
  balance_quantity?: number;
  hire_discount?: number;
  mass_per_item?: number;
  weekly_rate: number;
}

export const useHireQuotations = () => {
  return useQuery({
    queryKey: ["hire-quotations"],
    queryFn: async (): Promise<HireQuotation[]> => {
      const { data, error } = await supabase
        .from("hire_quotations")
        .select(`
          *,
          line_items:quotation_line_items(*)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as HireQuotation[];
    },
  });
};

export const useHireQuotation = (id: string | null) => {
  return useQuery({
    queryKey: ["hire-quotation", id],
    queryFn: async (): Promise<HireQuotation | null> => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from("hire_quotations")
        .select(`
          *,
          line_items:quotation_line_items(*)
        `)
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      return data as HireQuotation | null;
    },
    enabled: !!id,
  });
};

export const useCreateQuotation = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: CreateQuotationInput): Promise<HireQuotation> => {
      if (!user) throw new Error("You must be logged in to create a quotation");

      // Use provided client_id (e.g. when promoting a test quotation) or generate a new one
      let resolvedClientId = input.client_id || "";
      if (!resolvedClientId) {
        const { data: clientIdData, error: clientIdError } = await supabase
          .rpc("generate_next_client_id");
        if (clientIdError) throw clientIdError;
        resolvedClientId = clientIdData as string;
      }

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { client_id: _omit, ...rest } = input;
      const { data, error } = await supabase
        .from("hire_quotations")
        .insert([{
          ...rest,
          created_by: user.id,
          quotation_number: "", // Will be auto-generated by trigger
          client_id: resolvedClientId,
        }])
        .select()
        .single();

      if (error) throw error;
      return data as HireQuotation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hire-quotations"] });
      toast.success("Quotation created successfully");
    },
    onError: (error) => {
      toast.error(`Failed to create quotation: ${error.message}`);
    },
  });
};

export const useUpdateQuotation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<HireQuotation> & { id: string }): Promise<HireQuotation> => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { line_items, delivery_history, return_history, ...rest } = updates as HireQuotation & { line_items?: unknown };
      // Pass delivery/return history as Json-compatible types
      const safeUpdates = {
        ...rest,
        ...(delivery_history !== undefined ? { delivery_history: delivery_history as import("@/integrations/supabase/types").Json } : {}),
        ...(return_history !== undefined ? { return_history: return_history as import("@/integrations/supabase/types").Json } : {}),
      };
      const { data, error } = await supabase
        .from("hire_quotations")
        .update(safeUpdates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as HireQuotation;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["hire-quotations"] });
      queryClient.invalidateQueries({ queryKey: ["hire-quotation", data.id] });
      toast.success("Quotation updated successfully");
    },
    onError: (error) => {
      toast.error(`Failed to update quotation: ${error.message}`);
    },
  });
};

export const useDeleteQuotation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id }: { id: string }): Promise<void> => {
      const { error: deleteSitesError } = await supabase
        .from("client_sites")
        .delete()
        .eq("quotation_id", id);

      if (deleteSitesError) throw deleteSitesError;

      const { error: deleteLineItemsError } = await supabase
        .from("quotation_line_items")
        .delete()
        .eq("quotation_id", id);

      if (deleteLineItemsError) throw deleteLineItemsError;

      const { error: deleteQuotationError } = await supabase
        .from("hire_quotations")
        .delete()
        .eq("id", id);

      if (deleteQuotationError) throw deleteQuotationError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hire-quotations"] });
      toast.success("Quotation deleted successfully");
    },
    onError: (error) => {
      toast.error(`Failed to delete quotation: ${error.message}`);
    },
  });
};

export const useAddLineItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateLineItemInput): Promise<QuotationLineItem> => {
      const { data, error } = await supabase
        .from("quotation_line_items")
        .insert([input])
        .select()
        .single();

      if (error) throw error;
      return data as QuotationLineItem;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["hire-quotations"] });
      queryClient.invalidateQueries({ queryKey: ["hire-quotation", data.quotation_id] });
    },
    onError: (error) => {
      toast.error(`Failed to add line item: ${error.message}`);
    },
  });
};

export const useAddLineItems = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (items: CreateLineItemInput[]): Promise<QuotationLineItem[]> => {
      const { data, error } = await supabase
        .from("quotation_line_items")
        .insert(items)
        .select();

      if (error) throw error;
      return data as QuotationLineItem[];
    },
    onSuccess: (data) => {
      if (data.length > 0) {
        queryClient.invalidateQueries({ queryKey: ["hire-quotations"] });
        queryClient.invalidateQueries({ queryKey: ["hire-quotation", data[0].quotation_id] });
      }
    },
    onError: (error) => {
      toast.error(`Failed to add line items: ${error.message}`);
    },
  });
};

export const useRemoveLineItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, quotation_id }: { id: string; quotation_id: string }): Promise<void> => {
      const { error } = await supabase
        .from("quotation_line_items")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["hire-quotations"] });
      queryClient.invalidateQueries({ queryKey: ["hire-quotation", variables.quotation_id] });
    },
    onError: (error) => {
      toast.error(`Failed to remove line item: ${error.message}`);
    },
  });
};

export const useClearLineItems = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (quotation_id: string): Promise<void> => {
      const { error } = await supabase
        .from("quotation_line_items")
        .delete()
        .eq("quotation_id", quotation_id);

      if (error) throw error;
    },
    onSuccess: (_, quotation_id) => {
      queryClient.invalidateQueries({ queryKey: ["hire-quotations"] });
      queryClient.invalidateQueries({ queryKey: ["hire-quotation", quotation_id] });
    },
    onError: (error) => {
      toast.error(`Failed to clear line items: ${error.message}`);
    },
  });
};

export interface UpdateLineItemQuantityInput {
  part_number: string;
  delivered_quantity: number;
  balance_quantity: number;
}

export interface UpdateLineItemReturnQuantityInput {
  part_number: string;
  returned_quantity: number;
  return_balance_quantity: number;
}

export const useUpdateLineItemQuantities = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ quotation_id, items }: { quotation_id: string; items: UpdateLineItemQuantityInput[] }): Promise<void> => {
      for (const item of items) {
        const { error } = await supabase
          .from("quotation_line_items")
          .update({
            delivered_quantity: item.delivered_quantity,
            balance_quantity: item.balance_quantity,
          })
          .eq("quotation_id", quotation_id)
          .eq("part_number", item.part_number);

        if (error) throw error;
      }
    },
    onSuccess: (_, { quotation_id }) => {
      queryClient.invalidateQueries({ queryKey: ["hire-quotations"] });
      queryClient.invalidateQueries({ queryKey: ["hire-quotation", quotation_id] });
    },
    onError: (error) => {
      toast.error(`Failed to update delivery quantities: ${error.message}`);
    },
  });
};

export const useUpdateLineItemReturnQuantities = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ quotation_id, items }: { quotation_id: string; items: UpdateLineItemReturnQuantityInput[] }): Promise<void> => {
      for (const item of items) {
        const { error } = await supabase
          .from("quotation_line_items")
          .update({
            returned_quantity: item.returned_quantity,
            return_balance_quantity: item.return_balance_quantity,
          })
          .eq("quotation_id", quotation_id)
          .eq("part_number", item.part_number);

        if (error) throw error;
      }
    },
    onSuccess: (_, { quotation_id }) => {
      queryClient.invalidateQueries({ queryKey: ["hire-quotations"] });
      queryClient.invalidateQueries({ queryKey: ["hire-quotation", quotation_id] });
    },
    onError: (error) => {
      toast.error(`Failed to update return quantities: ${error.message}`);
    },
  });
};
