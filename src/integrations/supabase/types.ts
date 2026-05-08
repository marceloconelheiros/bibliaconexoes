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
      audio_tracks: {
        Row: {
          audio_url: string | null
          book_id: string
          chapter_timestamps: Json | null
          created_at: string | null
          id: string
          psalms_group: Database["public"]["Enums"]["psalms_group"] | null
          title: string
        }
        Insert: {
          audio_url?: string | null
          book_id: string
          chapter_timestamps?: Json | null
          created_at?: string | null
          id?: string
          psalms_group?: Database["public"]["Enums"]["psalms_group"] | null
          title: string
        }
        Update: {
          audio_url?: string | null
          book_id?: string
          chapter_timestamps?: Json | null
          created_at?: string | null
          id?: string
          psalms_group?: Database["public"]["Enums"]["psalms_group"] | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "audio_tracks_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
        ]
      }
      books: {
        Row: {
          abbrev: string
          chapters_count: number
          created_at: string | null
          has_audio: boolean | null
          id: string
          name: string
          order_index: number
          testament: Database["public"]["Enums"]["testament_type"]
        }
        Insert: {
          abbrev: string
          chapters_count: number
          created_at?: string | null
          has_audio?: boolean | null
          id?: string
          name: string
          order_index: number
          testament: Database["public"]["Enums"]["testament_type"]
        }
        Update: {
          abbrev?: string
          chapters_count?: number
          created_at?: string | null
          has_audio?: boolean | null
          id?: string
          name?: string
          order_index?: number
          testament?: Database["public"]["Enums"]["testament_type"]
        }
        Relationships: []
      }
      chapters: {
        Row: {
          book_id: string
          chapter_number: number
          created_at: string | null
          id: string
          osis_code: string | null
          text_content: string | null
        }
        Insert: {
          book_id: string
          chapter_number: number
          created_at?: string | null
          id?: string
          osis_code?: string | null
          text_content?: string | null
        }
        Update: {
          book_id?: string
          chapter_number?: number
          created_at?: string | null
          id?: string
          osis_code?: string | null
          text_content?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chapters_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_day_chapters: {
        Row: {
          chapter_id: string
          created_at: string | null
          id: string
          plan_day_id: string
          sort_order: number
        }
        Insert: {
          chapter_id: string
          created_at?: string | null
          id?: string
          plan_day_id: string
          sort_order: number
        }
        Update: {
          chapter_id?: string
          created_at?: string | null
          id?: string
          plan_day_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "plan_day_chapters_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_day_chapters_plan_day_id_fkey"
            columns: ["plan_day_id"]
            isOneToOne: false
            referencedRelation: "plan_days"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_days: {
        Row: {
          created_at: string | null
          date: string
          day_number: number
          id: string
          plan_id: string
        }
        Insert: {
          created_at?: string | null
          date: string
          day_number: number
          id?: string
          plan_id: string
        }
        Update: {
          created_at?: string | null
          date?: string
          day_number?: number
          id?: string
          plan_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_days_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          created_at: string | null
          days_total: number
          id: string
          mode: Database["public"]["Enums"]["plan_mode"]
          start_date: string
          style: Database["public"]["Enums"]["plan_style"] | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          days_total: number
          id?: string
          mode: Database["public"]["Enums"]["plan_mode"]
          start_date: string
          style?: Database["public"]["Enums"]["plan_style"] | null
          title: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          days_total?: number
          id?: string
          mode?: Database["public"]["Enums"]["plan_mode"]
          start_date?: string
          style?: Database["public"]["Enums"]["plan_style"] | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          birth_date: string | null
          cidade: string
          created_at: string
          email: string | null
          faith_detail: string | null
          faith_tradition: string
          id: string
          nome: string
          updated_at: string
          whatsapp: string
        }
        Insert: {
          avatar_url?: string | null
          birth_date?: string | null
          cidade?: string
          created_at?: string
          email?: string | null
          faith_detail?: string | null
          faith_tradition?: string
          id: string
          nome?: string
          updated_at?: string
          whatsapp?: string
        }
        Update: {
          avatar_url?: string | null
          birth_date?: string | null
          cidade?: string
          created_at?: string
          email?: string | null
          faith_detail?: string | null
          faith_tradition?: string
          id?: string
          nome?: string
          updated_at?: string
          whatsapp?: string
        }
        Relationships: []
      }
      progress: {
        Row: {
          chapter_id: string
          completed_at: string | null
          id: string
          plan_id: string
          user_id: string
        }
        Insert: {
          chapter_id: string
          completed_at?: string | null
          id?: string
          plan_id: string
          user_id: string
        }
        Update: {
          chapter_id?: string
          completed_at?: string | null
          id?: string
          plan_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "progress_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "progress_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      streaks: {
        Row: {
          best_streak: number | null
          current_streak: number | null
          id: string
          plan_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          best_streak?: number | null
          current_streak?: number | null
          id?: string
          plan_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          best_streak?: number | null
          current_streak?: number | null
          id?: string
          plan_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "streaks_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      plan_mode:
        | "ULTRA_15"
        | "FAST_30"
        | "BALANCED_90"
        | "COMFY_180"
        | "CLASSIC_365"
      plan_style: "SEQUENTIAL" | "MIX_ON" | "TRIAD"
      psalms_group: "NONE" | "PS1" | "PS2" | "PS3" | "PS4" | "PS5"
      testament_type: "OT" | "NT"
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
      plan_mode: [
        "ULTRA_15",
        "FAST_30",
        "BALANCED_90",
        "COMFY_180",
        "CLASSIC_365",
      ],
      plan_style: ["SEQUENTIAL", "MIX_ON", "TRIAD"],
      psalms_group: ["NONE", "PS1", "PS2", "PS3", "PS4", "PS5"],
      testament_type: ["OT", "NT"],
    },
  },
} as const
