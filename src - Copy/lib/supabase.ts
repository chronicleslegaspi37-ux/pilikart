import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          full_name: string;
          phone_number: string;
          coins: number;
          is_admin: boolean;
          is_active: boolean;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          full_name: string;
          phone_number: string;
          coins?: number;
          is_admin?: boolean;
          is_active?: boolean;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          full_name?: string;
          phone_number?: string;
          coins?: number;
          is_admin?: boolean;
          is_active?: boolean;
          avatar_url?: string | null;
          updated_at?: string;
        };
      };
      categories: {
        Row: {
          id: string;
          name: string;
          image_url: string | null;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          image_url?: string | null;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          name?: string;
          image_url?: string | null;
          sort_order?: number;
        };
      };
      products: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          price: number;
          images: string[];
          video_url: string | null;
          category_id: string | null;
          badge: string | null;
          rating: number;
          sold_count: number;
          stock: number;
          product_type: string;
          is_flash_sale: boolean;
          flash_sale_price: number | null;
          flash_sale_end: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          price: number;
          images?: string[];
          video_url?: string | null;
          category_id?: string | null;
          badge?: string | null;
          rating?: number;
          sold_count?: number;
          stock?: number;
          product_type?: string;
          is_flash_sale?: boolean;
          flash_sale_price?: number | null;
          flash_sale_end?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          description?: string | null;
          price?: number;
          images?: string[];
          video_url?: string | null;
          category_id?: string | null;
          badge?: string | null;
          rating?: number;
          sold_count?: number;
          stock?: number;
          product_type?: string;
          is_flash_sale?: boolean;
          flash_sale_price?: number | null;
          flash_sale_end?: string | null;
          is_active?: boolean;
          updated_at?: string;
        };
      };
      orders: {
        Row: {
          id: string;
          user_id: string;
          phone_number: string;
          full_name: string;
          full_address: string;
          location: string;
          notes: string | null;
          items: Record<string, unknown>[];
          total_amount: number;
          delivery_fee: number;
          status: string;
          order_type: string;
          tracking_message: string | null;
          proof_of_delivery: string | null;
          cancellation_reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          phone_number: string;
          full_name: string;
          full_address: string;
          location: string;
          notes?: string | null;
          items: Record<string, unknown>[];
          total_amount: number;
          delivery_fee: number;
          status?: string;
          order_type?: string;
          tracking_message?: string | null;
          proof_of_delivery?: string | null;
          cancellation_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          status?: string;
          tracking_message?: string | null;
          proof_of_delivery?: string | null;
          cancellation_reason?: string | null;
          updated_at?: string;
        };
      };
      cart_items: {
        Row: {
          id: string;
          user_id: string;
          product_id: string;
          quantity: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          product_id: string;
          quantity?: number;
          created_at?: string;
        };
        Update: {
          quantity?: number;
        };
      };
      banners: {
        Row: {
          id: string;
          image_url: string;
          sort_order: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          image_url: string;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          image_url?: string;
          sort_order?: number;
          is_active?: boolean;
        };
      };
      bible_content: {
        Row: {
          id: string;
          verse_of_day: string;
          verse_reference: string;
          explanation: string;
          morning_prayer: string;
          afternoon_prayer: string;
          night_prayer: string;
          video_urls: string[];
          updated_at: string;
        };
        Insert: {
          id?: string;
          verse_of_day: string;
          verse_reference: string;
          explanation: string;
          morning_prayer: string;
          afternoon_prayer: string;
          night_prayer: string;
          video_urls?: string[];
          updated_at?: string;
        };
        Update: {
          verse_of_day?: string;
          verse_reference?: string;
          explanation?: string;
          morning_prayer?: string;
          afternoon_prayer?: string;
          night_prayer?: string;
          video_urls?: string[];
          updated_at?: string;
        };
      };
      daily_checkin: {
        Row: {
          id: string;
          user_id: string;
          checkin_date: string;
          day_number: number;
          coins_earned: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          checkin_date: string;
          day_number: number;
          coins_earned: number;
          created_at?: string;
        };
        Update: Record<string, never>;
      };
      checkin_rewards: {
        Row: {
          id: string;
          day_number: number;
          coins: number;
        };
        Insert: {
          id?: string;
          day_number: number;
          coins: number;
        };
        Update: {
          coins?: number;
        };
      };
      redeem_codes: {
        Row: {
          id: string;
          code: string;
          coins: number;
          usage_limit: number;
          usage_count: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          coins: number;
          usage_limit?: number;
          usage_count?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          code?: string;
          coins?: number;
          usage_limit?: number;
          usage_count?: number;
          is_active?: boolean;
        };
      };
      redeemed_codes: {
        Row: {
          id: string;
          user_id: string;
          code_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          code_id: string;
          created_at?: string;
        };
        Update: Record<string, never>;
      };
      game_sessions: {
        Row: {
          id: string;
          user_id: string;
          game_type: string;
          score: number;
          coins_earned: number;
          played_date: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          game_type: string;
          score?: number;
          coins_earned?: number;
          played_date: string;
          created_at?: string;
        };
        Update: Record<string, never>;
      };
      game_questions: {
        Row: {
          id: string;
          game_type: string;
          question: string;
          options: string[];
          correct_answer: string;
          image_url: string | null;
          difficulty: string | null;
          sort_order: number;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          game_type: string;
          question: string;
          options: string[];
          correct_answer: string;
          image_url?: string | null;
          difficulty?: string | null;
          sort_order?: number;
          is_active?: boolean;
        };
        Update: {
          question?: string;
          options?: string[];
          correct_answer?: string;
          image_url?: string | null;
          difficulty?: string | null;
          sort_order?: number;
          is_active?: boolean;
        };
      };
      rewards_products: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          coins_price: number;
          images: string[];
          stock: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          coins_price: number;
          images?: string[];
          stock?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          name?: string;
          description?: string | null;
          coins_price?: number;
          images?: string[];
          stock?: number;
          is_active?: boolean;
        };
      };
      support_messages: {
        Row: {
          id: string;
          user_id: string;
          message: string;
          is_admin: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          message: string;
          is_admin?: boolean;
          created_at?: string;
        };
        Update: Record<string, never>;
      };
      reviews: {
        Row: {
          id: string;
          product_id: string;
          user_id: string;
          rating: number;
          comment: string | null;
          images: string[];
          video_url: string | null;
          is_fake: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          user_id: string;
          rating: number;
          comment?: string | null;
          images?: string[];
          video_url?: string | null;
          is_fake?: boolean;
          created_at?: string;
        };
        Update: Record<string, never>;
      };
      announcements: {
        Row: {
          id: string;
          title: string;
          message: string;
          image_url: string | null;
          is_pinned: boolean;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          message: string;
          image_url?: string | null;
          is_pinned?: boolean;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          title?: string;
          message?: string;
          image_url?: string | null;
          is_pinned?: boolean;
          is_active?: boolean;
        };
      };
      admin_logs: {
        Row: {
          id: string;
          admin_id: string;
          action: string;
          details: Record<string, unknown>;
          created_at: string;
        };
        Insert: {
          id?: string;
          admin_id: string;
          action: string;
          details?: Record<string, unknown>;
          created_at?: string;
        };
        Update: Record<string, never>;
      };
      coin_transactions: {
        Row: {
          id: string;
          user_id: string;
          amount: number;
          type: string;
          description: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          amount: number;
          type: string;
          description: string;
          created_at?: string;
        };
        Update: Record<string, never>;
      };
    };
  };
};
