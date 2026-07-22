export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      advisory_signals: {
        Row: {
          confidence: number | null
          created_at: string | null
          id: number
          macro_analysis: string | null
          polymarket_sentiment: string | null
          reasoning: string | null
          signal: string
          symbol: string
          technical_analysis: string | null
        }
        Insert: {
          confidence?: number | null
          created_at?: string | null
          id?: number
          macro_analysis?: string | null
          polymarket_sentiment?: string | null
          reasoning?: string | null
          signal: string
          symbol: string
          technical_analysis?: string | null
        }
        Update: {
          confidence?: number | null
          created_at?: string | null
          id?: number
          macro_analysis?: string | null
          polymarket_sentiment?: string | null
          reasoning?: string | null
          signal?: string
          symbol?: string
          technical_analysis?: string | null
        }
        Relationships: []
      }
      agent_states: {
        Row: {
          created_at: string | null
          id: number
          state_json: Json | null
          thread_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          state_json?: Json | null
          thread_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          state_json?: Json | null
          thread_id?: string | null
        }
        Relationships: []
      }
      categories: {
        Row: {
          color_key: string | null
          created_at: string
          display_name: string | null
          icon: string | null
          id: string
          in_carousel: boolean
          is_visible: boolean
          name: string
          parent_id: string | null
          slug: string
          sort_order: number
        }
        Insert: {
          color_key?: string | null
          created_at?: string
          display_name?: string | null
          icon?: string | null
          id?: string
          in_carousel?: boolean
          is_visible?: boolean
          name: string
          parent_id?: string | null
          slug: string
          sort_order?: number
        }
        Update: {
          color_key?: string | null
          created_at?: string
          display_name?: string | null
          icon?: string | null
          id?: string
          in_carousel?: boolean
          is_visible?: boolean
          name?: string
          parent_id?: string | null
          slug?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      pending_approvals: {
        Row: {
          created_at: string | null
          id: string
          resume_url: string
          serial: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          resume_url: string
          serial?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          resume_url?: string
          serial?: string | null
        }
        Relationships: []
      }
      price_data: {
        Row: {
          ask: number | null
          bid: number | null
          id: number
          price: number
          symbol: string
          timestamp: string | null
        }
        Insert: {
          ask?: number | null
          bid?: number | null
          id?: number
          price: number
          symbol: string
          timestamp?: string | null
        }
        Update: {
          ask?: number | null
          bid?: number | null
          id?: number
          price?: number
          symbol?: string
          timestamp?: string | null
        }
        Relationships: []
      }
      product_category: {
        Row: {
          category_id: string
          product_id: string
        }
        Insert: {
          category_id: string
          product_id: string
        }
        Update: {
          category_id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_category_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      product_images: {
        Row: {
          id: string
          image_url: string
          is_main: boolean | null
          product_id: string
        }
        Insert: {
          id?: string
          image_url: string
          is_main?: boolean | null
          product_id: string
        }
        Update: {
          id?: string
          image_url?: string
          is_main?: boolean | null
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_translations: {
        Row: {
          ai_metadata: Json | null
          created_at: string | null
          description: string | null
          features: Json | null
          id: string
          lang: string
          product_id: string
          specs: Json | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          ai_metadata?: Json | null
          created_at?: string | null
          description?: string | null
          features?: Json | null
          id?: string
          lang: string
          product_id: string
          specs?: Json | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          ai_metadata?: Json | null
          created_at?: string | null
          description?: string | null
          features?: Json | null
          id?: string
          lang?: string
          product_id?: string
          specs?: Json | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_translations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          ai_metadata: Json
          brand: string | null
          category_id: string | null
          created_at: string | null
          description: string | null
          id: string
          images: Json
          is_active: boolean
          is_serialized: boolean
          name: string
          slug: string | null
          specs: Json
          updated_at: string
        }
        Insert: {
          ai_metadata?: Json
          brand?: string | null
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          images?: Json
          is_active?: boolean
          is_serialized?: boolean
          name: string
          slug?: string | null
          specs?: Json
          updated_at?: string
        }
        Update: {
          ai_metadata?: Json
          brand?: string | null
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          images?: Json
          is_active?: boolean
          is_serialized?: boolean
          name?: string
          slug?: string | null
          specs?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          id: string
          role: string
          updated_at: string
        }
        Insert: {
          id: string
          role?: string
          updated_at?: string
        }
        Update: {
          id?: string
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      serial_items: {
        Row: {
          created_at: string
          id: string
          serial_number: string
          sold_at: string | null
          variant_id: string
          warranty_status: string
        }
        Insert: {
          created_at?: string
          id?: string
          serial_number: string
          sold_at?: string | null
          variant_id: string
          warranty_status?: string
        }
        Update: {
          created_at?: string
          id?: string
          serial_number?: string
          sold_at?: string | null
          variant_id?: string
          warranty_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "serial_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "variants"
            referencedColumns: ["id"]
          },
        ]
      }
      store_configuration: {
        Row: {
          id: number
          layout: Json
          theme: Json
          updated_at: string
        }
        Insert: {
          id?: number
          layout?: Json
          theme?: Json
          updated_at?: string
        }
        Update: {
          id?: number
          layout?: Json
          theme?: Json
          updated_at?: string
        }
        Relationships: []
      }
      variants: {
        Row: {
          attributes: Json
          condition: Database["public"]["Enums"]["product_condition"]
          created_at: string
          discount_badge: string | null
          id: string
          price: number
          product_id: string
          sale_price: number | null
          sku_code: string
          stock_quantity: number
          updated_at: string
        }
        Insert: {
          attributes?: Json
          condition?: Database["public"]["Enums"]["product_condition"]
          created_at?: string
          discount_badge?: string | null
          id?: string
          price: number
          product_id: string
          sale_price?: number | null
          sku_code: string
          stock_quantity?: number
          updated_at?: string
        }
        Update: {
          attributes?: Json
          condition?: Database["public"]["Enums"]["product_condition"]
          created_at?: string
          discount_badge?: string | null
          id?: string
          price?: number
          product_id?: string
          sale_price?: number | null
          sku_code?: string
          stock_quantity?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      category_subtree: { Args: { _parent: string }; Returns: Json }
      get_category_flat: {
        Args: never
        Returns: {
          depth: number
          id: string
          name: string
          parent_id: string
          path: string
          slug: string
        }[]
      }
      get_category_tree: { Args: never; Returns: Json }
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      product_condition: "Premium" | "Excellent" | "Good" | "Fair"
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
      product_condition: ["Premium", "Excellent", "Good", "Fair"],
    },
  },
} as const
