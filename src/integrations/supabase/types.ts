export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      alerts: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_read: boolean
          priority: string
          site_id: string | null
          title: string
          type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_read?: boolean
          priority?: string
          site_id?: string | null
          title: string
          type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_read?: boolean
          priority?: string
          site_id?: string | null
          title?: string
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alerts_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      client_sites: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          notes: string | null
          quotation_id: string
          site_address: string | null
          site_location: string | null
          site_manager_email: string | null
          site_manager_name: string | null
          site_manager_phone: string | null
          site_name: string
          site_number: string
          site_open_date: string | null
          site_opened_by: string | null
          site_suffix: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          notes?: string | null
          quotation_id: string
          site_address?: string | null
          site_location?: string | null
          site_manager_email?: string | null
          site_manager_name?: string | null
          site_manager_phone?: string | null
          site_name: string
          site_number: string
          site_open_date?: string | null
          site_opened_by?: string | null
          site_suffix?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          notes?: string | null
          quotation_id?: string
          site_address?: string | null
          site_location?: string | null
          site_manager_email?: string | null
          site_manager_name?: string | null
          site_manager_phone?: string | null
          site_name?: string
          site_number?: string
          site_open_date?: string | null
          site_opened_by?: string | null
          site_suffix?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_sites_quotation_id_fkey"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "hire_quotations"
            referencedColumns: ["id"]
          },
        ]
      }
      hire_quotations: {
        Row: {
          account_number: string | null
          basket_discount: number | null
          bulk_order_required: boolean | null
          client_id: string | null
          company_address: string | null
          company_name: string | null
          created_at: string
          created_by: string
          credit_limit: number | null
          delivery_address: string | null
          delivery_history: Json | null
          dispatch_date: string | null
          hire_weeks: number | null
          id: string
          market_segment: string[] | null
          notes: string | null
          official_order_required: boolean | null
          other_discount: number | null
          payment_method: string | null
          project_type: string[] | null
          quotation_number: string
          return_history: Json | null
          site_address: string | null
          site_manager_email: string | null
          site_manager_name: string | null
          site_manager_phone: string | null
          site_name: string | null
          status: string
          telephonic_order_acceptable: boolean | null
          tonnage_discount: number | null
          transport_arrangement: string | null
          tube_clamp_discount: number | null
          updated_at: string
        }
        Insert: {
          account_number?: string | null
          basket_discount?: number | null
          bulk_order_required?: boolean | null
          client_id?: string | null
          company_address?: string | null
          company_name?: string | null
          created_at?: string
          created_by: string
          credit_limit?: number | null
          delivery_address?: string | null
          delivery_history?: Json | null
          dispatch_date?: string | null
          hire_weeks?: number | null
          id?: string
          market_segment?: string[] | null
          notes?: string | null
          official_order_required?: boolean | null
          other_discount?: number | null
          payment_method?: string | null
          project_type?: string[] | null
          quotation_number: string
          return_history?: Json | null
          site_address?: string | null
          site_manager_email?: string | null
          site_manager_name?: string | null
          site_manager_phone?: string | null
          site_name?: string | null
          status?: string
          telephonic_order_acceptable?: boolean | null
          tonnage_discount?: number | null
          transport_arrangement?: string | null
          tube_clamp_discount?: number | null
          updated_at?: string
        }
        Update: {
          account_number?: string | null
          basket_discount?: number | null
          bulk_order_required?: boolean | null
          client_id?: string | null
          company_address?: string | null
          company_name?: string | null
          created_at?: string
          created_by?: string
          credit_limit?: number | null
          delivery_address?: string | null
          delivery_history?: Json | null
          dispatch_date?: string | null
          hire_weeks?: number | null
          id?: string
          market_segment?: string[] | null
          notes?: string | null
          official_order_required?: boolean | null
          other_discount?: number | null
          payment_method?: string | null
          project_type?: string[] | null
          quotation_number?: string
          return_history?: Json | null
          site_address?: string | null
          site_manager_email?: string | null
          site_manager_name?: string | null
          site_manager_phone?: string | null
          site_name?: string | null
          status?: string
          telephonic_order_acceptable?: boolean | null
          tonnage_discount?: number | null
          transport_arrangement?: string | null
          tube_clamp_discount?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      inspections: {
        Row: {
          checklist: Json | null
          created_at: string
          findings: string | null
          id: string
          inspection_date: string
          inspector_id: string
          photos: string[] | null
          recommendations: string | null
          scaffold_count: number
          site_id: string
          status: Database["public"]["Enums"]["inspection_status"]
          updated_at: string
        }
        Insert: {
          checklist?: Json | null
          created_at?: string
          findings?: string | null
          id?: string
          inspection_date?: string
          inspector_id: string
          photos?: string[] | null
          recommendations?: string | null
          scaffold_count?: number
          site_id: string
          status?: Database["public"]["Enums"]["inspection_status"]
          updated_at?: string
        }
        Update: {
          checklist?: Json | null
          created_at?: string
          findings?: string | null
          id?: string
          inspection_date?: string
          inspector_id?: string
          photos?: string[] | null
          recommendations?: string | null
          scaffold_count?: number
          site_id?: string
          status?: Database["public"]["Enums"]["inspection_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inspections_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_logs: {
        Row: {
          assigned_to: string | null
          created_at: string
          id: string
          is_resolved: boolean
          issue_description: string
          priority: Database["public"]["Enums"]["maintenance_priority"]
          reported_by: string
          resolution: string | null
          resolved_at: string | null
          scaffold_id: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          id?: string
          is_resolved?: boolean
          issue_description: string
          priority?: Database["public"]["Enums"]["maintenance_priority"]
          reported_by: string
          resolution?: string | null
          resolved_at?: string | null
          scaffold_id: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          id?: string
          is_resolved?: boolean
          issue_description?: string
          priority?: Database["public"]["Enums"]["maintenance_priority"]
          reported_by?: string
          resolution?: string | null
          resolved_at?: string | null
          scaffold_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_logs_scaffold_id_fkey"
            columns: ["scaffold_id"]
            isOneToOne: false
            referencedRelation: "scaffolds"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      quotation_line_items: {
        Row: {
          balance_quantity: number | null
          created_at: string
          delivered_quantity: number | null
          description: string | null
          hire_discount: number | null
          id: string
          mass_per_item: number | null
          part_number: string | null
          quantity: number
          quotation_id: string
          return_balance_quantity: number | null
          returned_quantity: number | null
          scaffold_id: string | null
          total_mass: number | null
          updated_at: string
          weekly_rate: number
          weekly_total: number | null
        }
        Insert: {
          balance_quantity?: number | null
          created_at?: string
          delivered_quantity?: number | null
          description?: string | null
          hire_discount?: number | null
          id?: string
          mass_per_item?: number | null
          part_number?: string | null
          quantity?: number
          quotation_id: string
          return_balance_quantity?: number | null
          returned_quantity?: number | null
          scaffold_id?: string | null
          total_mass?: number | null
          updated_at?: string
          weekly_rate?: number
          weekly_total?: number | null
        }
        Update: {
          balance_quantity?: number | null
          created_at?: string
          delivered_quantity?: number | null
          description?: string | null
          hire_discount?: number | null
          id?: string
          mass_per_item?: number | null
          part_number?: string | null
          quantity?: number
          quotation_id?: string
          return_balance_quantity?: number | null
          returned_quantity?: number | null
          scaffold_id?: string | null
          total_mass?: number | null
          updated_at?: string
          weekly_rate?: number
          weekly_total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "quotation_line_items_quotation_id_fkey"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "hire_quotations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotation_line_items_scaffold_id_fkey"
            columns: ["scaffold_id"]
            isOneToOne: false
            referencedRelation: "scaffolds"
            referencedColumns: ["id"]
          },
        ]
      }
      scaffolds: {
        Row: {
          created_at: string
          description: string | null
          id: string
          last_inspection_date: string | null
          manufacturer: string | null
          mass_per_item: number | null
          next_inspection_due: string | null
          notes: string | null
          part_number: string | null
          purchase_date: string | null
          qr_code: string | null
          quantity: number | null
          scaffold_type: Database["public"]["Enums"]["scaffold_type"]
          serial_number: string | null
          site_id: string | null
          status: Database["public"]["Enums"]["scaffold_status"]
          unit_price: number | null
          updated_at: string
          weekly_rate: number | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          last_inspection_date?: string | null
          manufacturer?: string | null
          mass_per_item?: number | null
          next_inspection_due?: string | null
          notes?: string | null
          part_number?: string | null
          purchase_date?: string | null
          qr_code?: string | null
          quantity?: number | null
          scaffold_type: Database["public"]["Enums"]["scaffold_type"]
          serial_number?: string | null
          site_id?: string | null
          status?: Database["public"]["Enums"]["scaffold_status"]
          unit_price?: number | null
          updated_at?: string
          weekly_rate?: number | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          last_inspection_date?: string | null
          manufacturer?: string | null
          mass_per_item?: number | null
          next_inspection_due?: string | null
          notes?: string | null
          part_number?: string | null
          purchase_date?: string | null
          qr_code?: string | null
          quantity?: number | null
          scaffold_type?: Database["public"]["Enums"]["scaffold_type"]
          serial_number?: string | null
          site_id?: string | null
          status?: Database["public"]["Enums"]["scaffold_status"]
          unit_price?: number | null
          updated_at?: string
          weekly_rate?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "scaffolds_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      sites: {
        Row: {
          address: string | null
          created_at: string
          end_date: string | null
          id: string
          location: string
          name: string
          notes: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["site_status"]
          supervisor_id: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          end_date?: string | null
          id?: string
          location: string
          name: string
          notes?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["site_status"]
          supervisor_id?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          end_date?: string | null
          id?: string
          location?: string
          name?: string
          notes?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["site_status"]
          supervisor_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_next_client_id: { Args: never; Returns: string }
      has_elevated_role: { Args: { _user_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      update_scaffold_quantity: {
        Args: { new_quantity: number; scaffold_id: string }
        Returns: undefined
      }
      upsert_scaffold:
        | {
            Args: {
              p_description?: string
              p_mass_per_item?: number
              p_part_number?: string
              p_quantity?: number
              p_scaffold_type: Database["public"]["Enums"]["scaffold_type"]
              p_status?: Database["public"]["Enums"]["scaffold_status"]
              p_weekly_rate?: number
            }
            Returns: string
          }
        | {
            Args: {
              p_description?: string
              p_mass_per_item?: number
              p_part_number?: string
              p_quantity?: number
              p_scaffold_type: Database["public"]["Enums"]["scaffold_type"]
              p_status?: Database["public"]["Enums"]["scaffold_status"]
              p_unit_price?: number
              p_weekly_rate?: number
            }
            Returns: string
          }
    }
    Enums: {
      app_role: "admin" | "supervisor" | "inspector" | "worker"
      inspection_status: "passed" | "pending" | "failed"
      maintenance_priority: "low" | "medium" | "high" | "urgent"
      scaffold_status: "available" | "in_use" | "damaged" | "maintenance"
      scaffold_type:
        | "frame"
        | "tube_coupler"
        | "mobile"
        | "suspended"
        | "cantilever"
        | "system"
      site_status: "active" | "on_hold" | "completed" | "planning"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "supervisor", "inspector", "worker"],
      inspection_status: ["passed", "pending", "failed"],
      maintenance_priority: ["low", "medium", "high", "urgent"],
      scaffold_status: ["available", "in_use", "damaged", "maintenance"],
      scaffold_type: [
        "frame",
        "tube_coupler",
        "mobile",
        "suspended",
        "cantilever",
        "system",
      ],
      site_status: ["active", "on_hold", "completed", "planning"],
    },
  },
} as const
