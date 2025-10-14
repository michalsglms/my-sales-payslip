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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      deals: {
        Row: {
          campaign: string | null
          client_link: string | null
          client_name: string | null
          client_phone: string | null
          client_type: string
          completed_within_4_days: boolean
          created_at: string
          id: string
          initial_deposit: number
          is_new_client: boolean
          notes: string | null
          sales_rep_id: string
          traffic_source: string
        }
        Insert: {
          campaign?: string | null
          client_link?: string | null
          client_name?: string | null
          client_phone?: string | null
          client_type: string
          completed_within_4_days?: boolean
          created_at?: string
          id?: string
          initial_deposit: number
          is_new_client?: boolean
          notes?: string | null
          sales_rep_id: string
          traffic_source: string
        }
        Update: {
          campaign?: string | null
          client_link?: string | null
          client_name?: string | null
          client_phone?: string | null
          client_type?: string
          completed_within_4_days?: boolean
          created_at?: string
          id?: string
          initial_deposit?: number
          is_new_client?: boolean
          notes?: string | null
          sales_rep_id?: string
          traffic_source?: string
        }
        Relationships: [
          {
            foreignKeyName: "deals_sales_rep_id_fkey"
            columns: ["sales_rep_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      monthly_kpis: {
        Row: {
          aff_conversion_rate: boolean | null
          avg_call_time_minutes: boolean | null
          avg_calls_count: boolean | null
          created_at: string
          id: string
          month: number
          ppc_conversion_rate: boolean | null
          sales_rep_id: string
          updated_at: string
          work_excellence: number | null
          year: number
        }
        Insert: {
          aff_conversion_rate?: boolean | null
          avg_call_time_minutes?: boolean | null
          avg_calls_count?: boolean | null
          created_at?: string
          id?: string
          month: number
          ppc_conversion_rate?: boolean | null
          sales_rep_id: string
          updated_at?: string
          work_excellence?: number | null
          year: number
        }
        Update: {
          aff_conversion_rate?: boolean | null
          avg_call_time_minutes?: boolean | null
          avg_calls_count?: boolean | null
          created_at?: string
          id?: string
          month?: number
          ppc_conversion_rate?: boolean | null
          sales_rep_id?: string
          updated_at?: string
          work_excellence?: number | null
          year?: number
        }
        Relationships: []
      }
      monthly_targets: {
        Row: {
          cfd_target_amount: number | null
          created_at: string
          general_target_amount: number
          id: string
          month: number
          sales_rep_id: string
          workdays_in_period: number | null
          year: number
        }
        Insert: {
          cfd_target_amount?: number | null
          created_at?: string
          general_target_amount: number
          id?: string
          month: number
          sales_rep_id: string
          workdays_in_period?: number | null
          year: number
        }
        Update: {
          cfd_target_amount?: number | null
          created_at?: string
          general_target_amount?: number
          id?: string
          month?: number
          sales_rep_id?: string
          workdays_in_period?: number | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "monthly_targets_sales_rep_id_fkey"
            columns: ["sales_rep_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          base_salary: number
          created_at: string
          deduction_amount: number
          full_name: string
          id: string
          updated_at: string
        }
        Insert: {
          base_salary?: number
          created_at?: string
          deduction_amount?: number
          full_name: string
          id: string
          updated_at?: string
        }
        Update: {
          base_salary?: number
          created_at?: string
          deduction_amount?: number
          full_name?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      quarterly_targets: {
        Row: {
          cfd_target_amount: number | null
          created_at: string
          general_target_amount: number
          id: string
          quarter: number
          sales_rep_id: string
          workdays_in_period: number | null
          year: number
        }
        Insert: {
          cfd_target_amount?: number | null
          created_at?: string
          general_target_amount: number
          id?: string
          quarter: number
          sales_rep_id: string
          workdays_in_period?: number | null
          year: number
        }
        Update: {
          cfd_target_amount?: number | null
          created_at?: string
          general_target_amount?: number
          id?: string
          quarter?: number
          sales_rep_id?: string
          workdays_in_period?: number | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "quarterly_targets_sales_rep_id_fkey"
            columns: ["sales_rep_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
          role: Database["public"]["Enums"]["app_role"]
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: {
        Args: { _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "sales_rep"
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
      app_role: ["admin", "sales_rep"],
    },
  },
} as const
