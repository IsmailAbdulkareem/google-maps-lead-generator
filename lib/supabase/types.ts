export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      saved_searches: {
        Row: {
          id: string;
          user_id: string;
          search_id: string;
          query: string;
          category: string;
          city: string;
          area: string | null;
          country: string | null;
          industry: string | null;
          lead_count: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          search_id: string;
          query: string;
          category: string;
          city: string;
          area?: string | null;
          country?: string | null;
          industry?: string | null;
          lead_count: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          search_id?: string;
          query?: string;
          category?: string;
          city?: string;
          area?: string | null;
          country?: string | null;
          industry?: string | null;
          lead_count?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      saved_leads: {
        Row: {
          id: string;
          user_id: string;
          search_id: string;
          business_name: string;
          category: string;
          address: string;
          city: string;
          phone: string | null;
          email: string | null;
          website: string | null;
          rating: number | null;
          reviews: number | null;
          google_maps_link: string | null;
          business_status: string | null;
          lead_score: number;
          priority: string;
          website_status: string;
          weak_digital_presence: boolean;
          search_params: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          search_id: string;
          business_name: string;
          category: string;
          address: string;
          city: string;
          phone?: string | null;
          email?: string | null;
          website?: string | null;
          rating?: number | null;
          reviews?: number | null;
          google_maps_link?: string | null;
          business_status?: string | null;
          lead_score: number;
          priority: string;
          website_status: string;
          weak_digital_presence: boolean;
          search_params: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          search_id?: string;
          business_name?: string;
          category?: string;
          address?: string;
          city?: string;
          phone?: string | null;
          email?: string | null;
          website?: string | null;
          rating?: number | null;
          reviews?: number | null;
          google_maps_link?: string | null;
          business_status?: string | null;
          lead_score?: number;
          priority?: string;
          website_status?: string;
          weak_digital_presence?: boolean;
          search_params?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in string]: never;
    };
    Functions: {
      [_ in string]: never;
    };
    Enums: {
      [_ in string]: never;
    };
  };
}
