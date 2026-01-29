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
      scaffold_items: {
        Row: {
          created_at: string
          description: string
          id: string
          mass_tonne_per_item: number | null
          part_number: string
          quantity: number
          updated_at: string
          weekly_rate: number | null
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          mass_tonne_per_item?: number | null
          part_number: string
          quantity?: number
          updated_at?: string
          weekly_rate?: number | null
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          mass_tonne_per_item?: number | null
          part_number?: string
          quantity?: number
          updated_at?: string
          weekly_rate?: number | null
        }
        Relationships: []
      }
      scaffolds: {
        Row: {
          created_at: string
          id: string
          last_inspection_date: string | null
          manufacturer: string | null
          next_inspection_due: string | null
          notes: string | null
          purchase_date: string | null
          qr_code: string | null
          scaffold_type: Database["public"]["Enums"]["scaffold_type"]
          serial_number: string | null
          site_id: string | null
          status: Database["public"]["Enums"]["scaffold_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_inspection_date?: string | null
          manufacturer?: string | null
          next_inspection_due?: string | null
          notes?: string | null
          purchase_date?: string | null
          qr_code?: string | null
          scaffold_type: Database["public"]["Enums"]["scaffold_type"]
          serial_number?: string | null
          site_id?: string | null
          status?: Database["public"]["Enums"]["scaffold_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          last_inspection_date?: string | null
          manufacturer?: string | null
          next_inspection_due?: string | null
          notes?: string | null
          purchase_date?: string | null
          qr_code?: string | null
          scaffold_type?: Database["public"]["Enums"]["scaffold_type"]
          serial_number?: string | null
          site_id?: string | null
          status?: Database["public"]["Enums"]["scaffold_status"]
          updated_at?: string
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
      has_elevated_role: { Args: { _user_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
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
