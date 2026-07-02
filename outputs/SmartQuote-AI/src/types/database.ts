export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type QuoteStatus = Database["public"]["Enums"]["quote_status"];

export interface Database {
  public: {
    Tables: {
      company_settings: {
        Row: {
          id: string;
          owner_id: string;
          company_name: string;
          logo_path: string | null;
          vat: string | null;
          iban: string | null;
          address: string | null;
          email_signature: string;
          default_tax: number;
          brand_primary: string;
          brand_secondary: string;
          pdf_terms: string;
          ai_enabled: boolean;
          ai_tone: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          company_name?: string;
          logo_path?: string | null;
          vat?: string | null;
          iban?: string | null;
          address?: string | null;
          email_signature?: string;
          default_tax?: number;
          brand_primary?: string;
          brand_secondary?: string;
          pdf_terms?: string;
          ai_enabled?: boolean;
          ai_tone?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          company_name?: string;
          logo_path?: string | null;
          vat?: string | null;
          iban?: string | null;
          address?: string | null;
          email_signature?: string;
          default_tax?: number;
          brand_primary?: string;
          brand_secondary?: string;
          pdf_terms?: string;
          ai_enabled?: boolean;
          ai_tone?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "company_settings_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      clients: {
        Row: {
          id: string;
          owner_id: string;
          company: string;
          contact_person: string;
          email: string;
          phone: string | null;
          address: string | null;
          notes: string | null;
          archived_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          company: string;
          contact_person: string;
          email: string;
          phone?: string | null;
          address?: string | null;
          notes?: string | null;
          archived_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          company?: string;
          contact_person?: string;
          email?: string;
          phone?: string | null;
          address?: string | null;
          notes?: string | null;
          archived_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "clients_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      products: {
        Row: {
          id: string;
          owner_id: string;
          sku: string;
          name: string;
          description: string | null;
          category: string | null;
          purchase_price: number;
          selling_price: number;
          tax: number;
          stock: number;
          unit: string;
          image_path: string | null;
          archived_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          sku: string;
          name: string;
          description?: string | null;
          category?: string | null;
          purchase_price?: number;
          selling_price?: number;
          tax?: number;
          stock?: number;
          unit?: string;
          image_path?: string | null;
          archived_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          sku?: string;
          name?: string;
          description?: string | null;
          category?: string | null;
          purchase_price?: number;
          selling_price?: number;
          tax?: number;
          stock?: number;
          unit?: string;
          image_path?: string | null;
          archived_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "products_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      quotes: {
        Row: {
          id: string;
          owner_id: string;
          quote_number: string;
          client_id: string;
          status: Database["public"]["Enums"]["quote_status"];
          subtotal: number;
          tax: number;
          total: number;
          notes: string | null;
          archived_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          quote_number?: string;
          client_id: string;
          status?: Database["public"]["Enums"]["quote_status"];
          subtotal?: number;
          tax?: number;
          total?: number;
          notes?: string | null;
          archived_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          quote_number?: string;
          client_id?: string;
          status?: Database["public"]["Enums"]["quote_status"];
          subtotal?: number;
          tax?: number;
          total?: number;
          notes?: string | null;
          archived_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "quotes_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "quotes_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      quote_items: {
        Row: {
          id: string;
          quote_id: string;
          product_id: string;
          quantity: number;
          price: number;
          discount: number;
          tax: number;
          total: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          quote_id: string;
          product_id: string;
          quantity: number;
          price: number;
          discount?: number;
          tax?: number;
          total?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          quote_id?: string;
          product_id?: string;
          quantity?: number;
          price?: number;
          discount?: number;
          tax?: number;
          total?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "quote_items_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "quote_items_quote_id_fkey";
            columns: ["quote_id"];
            isOneToOne: false;
            referencedRelation: "quotes";
            referencedColumns: ["id"];
          },
        ];
      };
      activity_events: {
        Row: {
          id: string;
          owner_id: string;
          entity_type: string;
          entity_id: string | null;
          action: string;
          description: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          entity_type: string;
          entity_id?: string | null;
          action: string;
          description: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          entity_type?: string;
          entity_id?: string | null;
          action?: string;
          description?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "activity_events_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      quote_status: "draft" | "pending" | "accepted" | "rejected";
    };
    CompositeTypes: Record<string, never>;
  };
}

export type Tables<TableName extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][TableName]["Row"];
export type TablesInsert<TableName extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][TableName]["Insert"];
export type TablesUpdate<TableName extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][TableName]["Update"];

export type CompanySettingsRow = Tables<"company_settings">;
export type CompanySettingsInsert = TablesInsert<"company_settings">;
export type CompanySettingsUpdate = TablesUpdate<"company_settings">;
export type ClientRow = Tables<"clients">;
export type ClientInsert = TablesInsert<"clients">;
export type ClientUpdate = TablesUpdate<"clients">;
export type ProductRow = Tables<"products">;
export type ProductInsert = TablesInsert<"products">;
export type ProductUpdate = TablesUpdate<"products">;
export type QuoteRow = Tables<"quotes">;
export type QuoteInsert = TablesInsert<"quotes">;
export type QuoteUpdate = TablesUpdate<"quotes">;
export type QuoteItemRow = Tables<"quote_items">;
export type QuoteItemInsert = TablesInsert<"quote_items">;
export type QuoteItemUpdate = TablesUpdate<"quote_items">;
export type ActivityEventRow = Tables<"activity_events">;
export type ActivityEventInsert = TablesInsert<"activity_events">;
export type ActivityEventUpdate = TablesUpdate<"activity_events">;
