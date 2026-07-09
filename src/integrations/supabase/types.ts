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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      app_state: {
        Row: {
          data: Json
          module: string
          updated_at: string
          updated_by: string | null
          user_id: string
        }
        Insert: {
          data?: Json
          module: string
          updated_at?: string
          updated_by?: string | null
          user_id: string
        }
        Update: {
          data?: Json
          module?: string
          updated_at?: string
          updated_by?: string | null
          user_id?: string
        }
        Relationships: []
      }
      finance_budget: {
        Row: {
          approved: number
          category: string
          created_at: string
          id: string
          planned: number
          updated_at: string
          year: number
        }
        Insert: {
          approved?: number
          category: string
          created_at?: string
          id?: string
          planned?: number
          updated_at?: string
          year: number
        }
        Update: {
          approved?: number
          category?: string
          created_at?: string
          id?: string
          planned?: number
          updated_at?: string
          year?: number
        }
        Relationships: []
      }
      finance_cost_centers: {
        Row: {
          active: boolean
          code: string
          created_at: string
          id: string
          name: string
          responsible: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          id?: string
          name: string
          responsible?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          id?: string
          name?: string
          responsible?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      finance_expenses: {
        Row: {
          attachment_name: string | null
          campaign_id: string | null
          category: string | null
          cost_center_id: string | null
          created_at: string
          date: string
          description: string
          id: string
          invoice_id: string | null
          notes: string | null
          owner: string | null
          payment_method: string | null
          quantity: number
          supplier_id: string | null
          unit_value: number
          updated_at: string
        }
        Insert: {
          attachment_name?: string | null
          campaign_id?: string | null
          category?: string | null
          cost_center_id?: string | null
          created_at?: string
          date?: string
          description: string
          id?: string
          invoice_id?: string | null
          notes?: string | null
          owner?: string | null
          payment_method?: string | null
          quantity?: number
          supplier_id?: string | null
          unit_value?: number
          updated_at?: string
        }
        Update: {
          attachment_name?: string | null
          campaign_id?: string | null
          category?: string | null
          cost_center_id?: string | null
          created_at?: string
          date?: string
          description?: string
          id?: string
          invoice_id?: string | null
          notes?: string | null
          owner?: string | null
          payment_method?: string | null
          quantity?: number
          supplier_id?: string | null
          unit_value?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "finance_expenses_cost_center_id_fkey"
            columns: ["cost_center_id"]
            isOneToOne: false
            referencedRelation: "finance_cost_centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_expenses_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "finance_suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_invoices: {
        Row: {
          campaign_id: string | null
          category: string | null
          cost_center_id: string | null
          created_at: string
          date: string
          due_date: string | null
          event_id: string | null
          id: string
          notes: string | null
          number: string
          pdf_name: string | null
          project_id: string | null
          receipt_name: string | null
          received_at: string | null
          received_by: string | null
          sent_by: string | null
          sent_to_payment_at: string | null
          status: string | null
          supplier_id: string | null
          updated_at: string
          value: number
          xml_name: string | null
        }
        Insert: {
          campaign_id?: string | null
          category?: string | null
          cost_center_id?: string | null
          created_at?: string
          date?: string
          due_date?: string | null
          event_id?: string | null
          id?: string
          notes?: string | null
          number: string
          pdf_name?: string | null
          project_id?: string | null
          receipt_name?: string | null
          received_at?: string | null
          received_by?: string | null
          sent_by?: string | null
          sent_to_payment_at?: string | null
          status?: string | null
          supplier_id?: string | null
          updated_at?: string
          value?: number
          xml_name?: string | null
        }
        Update: {
          campaign_id?: string | null
          category?: string | null
          cost_center_id?: string | null
          created_at?: string
          date?: string
          due_date?: string | null
          event_id?: string | null
          id?: string
          notes?: string | null
          number?: string
          pdf_name?: string | null
          project_id?: string | null
          receipt_name?: string | null
          received_at?: string | null
          received_by?: string | null
          sent_by?: string | null
          sent_to_payment_at?: string | null
          status?: string | null
          supplier_id?: string | null
          updated_at?: string
          value?: number
          xml_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "finance_invoices_cost_center_id_fkey"
            columns: ["cost_center_id"]
            isOneToOne: false
            referencedRelation: "finance_cost_centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_invoices_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "finance_suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_payments: {
        Row: {
          created_at: string
          description: string
          due_date: string
          id: string
          invoice_id: string | null
          method: string | null
          paid_at: string | null
          status: string | null
          supplier_id: string | null
          updated_at: string
          value: number
        }
        Insert: {
          created_at?: string
          description: string
          due_date: string
          id?: string
          invoice_id?: string | null
          method?: string | null
          paid_at?: string | null
          status?: string | null
          supplier_id?: string | null
          updated_at?: string
          value?: number
        }
        Update: {
          created_at?: string
          description?: string
          due_date?: string
          id?: string
          invoice_id?: string | null
          method?: string | null
          paid_at?: string | null
          status?: string | null
          supplier_id?: string | null
          updated_at?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "finance_payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "finance_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_payments_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "finance_suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_purchase_requests: {
        Row: {
          campaign_id: string | null
          code: string
          cost_center_id: string | null
          created_at: string
          description: string
          estimated_value: number | null
          id: string
          justification: string | null
          project_id: string | null
          requester: string | null
          status: string | null
          supplier_id: string | null
          timeline: Json | null
          updated_at: string
          urgency: string | null
        }
        Insert: {
          campaign_id?: string | null
          code: string
          cost_center_id?: string | null
          created_at?: string
          description: string
          estimated_value?: number | null
          id?: string
          justification?: string | null
          project_id?: string | null
          requester?: string | null
          status?: string | null
          supplier_id?: string | null
          timeline?: Json | null
          updated_at?: string
          urgency?: string | null
        }
        Update: {
          campaign_id?: string | null
          code?: string
          cost_center_id?: string | null
          created_at?: string
          description?: string
          estimated_value?: number | null
          id?: string
          justification?: string | null
          project_id?: string | null
          requester?: string | null
          status?: string | null
          supplier_id?: string | null
          timeline?: Json | null
          updated_at?: string
          urgency?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "finance_purchase_requests_cost_center_id_fkey"
            columns: ["cost_center_id"]
            isOneToOne: false
            referencedRelation: "finance_cost_centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_purchase_requests_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "finance_suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_suppliers: {
        Row: {
          annual_investment: number | null
          category: string | null
          city: string | null
          company: string
          contact: string | null
          contract_ref: string | null
          created_at: string
          email: string | null
          id: string
          monthly_investment: number | null
          partner_id: string | null
          phone: string | null
          products: string[] | null
          rating: number | null
          updated_at: string
        }
        Insert: {
          annual_investment?: number | null
          category?: string | null
          city?: string | null
          company: string
          contact?: string | null
          contract_ref?: string | null
          created_at?: string
          email?: string | null
          id?: string
          monthly_investment?: number | null
          partner_id?: string | null
          phone?: string | null
          products?: string[] | null
          rating?: number | null
          updated_at?: string
        }
        Update: {
          annual_investment?: number | null
          category?: string | null
          city?: string | null
          company?: string
          contact?: string | null
          contract_ref?: string | null
          created_at?: string
          email?: string | null
          id?: string
          monthly_investment?: number | null
          partner_id?: string | null
          phone?: string | null
          products?: string[] | null
          rating?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          job_title: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          job_title?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          job_title?: string | null
          phone?: string | null
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
    }
    Enums: {
      app_role: "admin" | "gestor" | "analista" | "visualizador"
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
      app_role: ["admin", "gestor", "analista", "visualizador"],
    },
  },
} as const
