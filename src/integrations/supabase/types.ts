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
      ai_notes: {
        Row: {
          created_at: string | null
          id: string
          key_points: string[]
          summary: string
          user_id: string
          video_id: string
          video_title: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          key_points: string[]
          summary: string
          user_id: string
          video_id: string
          video_title: string
        }
        Update: {
          created_at?: string | null
          id?: string
          key_points?: string[]
          summary?: string
          user_id?: string
          video_id?: string
          video_title?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_notes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_notes_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      playlists: {
        Row: {
          channel_name: string | null
          created_at: string | null
          description: string | null
          id: string
          last_accessed_at: string | null
          thumbnail_url: string | null
          title: string
          total_videos: number
          user_id: string
          youtube_playlist_id: string
        }
        Insert: {
          channel_name?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          last_accessed_at?: string | null
          thumbnail_url?: string | null
          title: string
          total_videos?: number
          user_id: string
          youtube_playlist_id: string
        }
        Update: {
          channel_name?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          last_accessed_at?: string | null
          thumbnail_url?: string | null
          title?: string
          total_videos?: number
          user_id?: string
          youtube_playlist_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "playlists_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string
          exam_type: Database["public"]["Enums"]["exam_type"]
          full_name: string
          id: string
          profile_picture: string | null
          target_year: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          exam_type: Database["public"]["Enums"]["exam_type"]
          full_name: string
          id: string
          profile_picture?: string | null
          target_year: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          exam_type?: Database["public"]["Enums"]["exam_type"]
          full_name?: string
          id?: string
          profile_picture?: string | null
          target_year?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      study_streaks: {
        Row: {
          created_at: string | null
          id: string
          study_date: string
          user_id: string
          videos_completed: number
          watch_time_seconds: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          study_date: string
          user_id: string
          videos_completed?: number
          watch_time_seconds?: number
        }
        Update: {
          created_at?: string | null
          id?: string
          study_date?: string
          user_id?: string
          videos_completed?: number
          watch_time_seconds?: number
        }
        Relationships: [
          {
            foreignKeyName: "study_streaks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_settings: {
        Row: {
          auto_complete_percentage: number
          auto_play_next: boolean
          created_at: string | null
          daily_reminder_time: string | null
          default_playback_speed: number
          id: string
          updated_at: string | null
          user_id: string
          weekly_progress_email: boolean
        }
        Insert: {
          auto_complete_percentage?: number
          auto_play_next?: boolean
          created_at?: string | null
          daily_reminder_time?: string | null
          default_playback_speed?: number
          id?: string
          updated_at?: string | null
          user_id: string
          weekly_progress_email?: boolean
        }
        Update: {
          auto_complete_percentage?: number
          auto_play_next?: boolean
          created_at?: string | null
          daily_reminder_time?: string | null
          default_playback_speed?: number
          id?: string
          updated_at?: string | null
          user_id?: string
          weekly_progress_email?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "user_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      video_notes: {
        Row: {
          created_at: string
          id: string
          note_text: string
          playlist_id: string
          tags: string | null
          timestamp_seconds: number
          updated_at: string
          user_id: string
          video_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          note_text: string
          playlist_id: string
          tags?: string | null
          timestamp_seconds?: number
          updated_at?: string
          user_id: string
          video_id: string
        }
        Update: {
          created_at?: string
          id?: string
          note_text?: string
          playlist_id?: string
          tags?: string | null
          timestamp_seconds?: number
          updated_at?: string
          user_id?: string
          video_id?: string
        }
        Relationships: []
      }
      video_progress: {
        Row: {
          id: string
          is_completed: boolean
          last_watched_at: string | null
          notes_generated: boolean
          playlist_id: string
          user_id: string
          video_id: string
          watch_time_seconds: number
        }
        Insert: {
          id?: string
          is_completed?: boolean
          last_watched_at?: string | null
          notes_generated?: boolean
          playlist_id: string
          user_id: string
          video_id: string
          watch_time_seconds?: number
        }
        Update: {
          id?: string
          is_completed?: boolean
          last_watched_at?: string | null
          notes_generated?: boolean
          playlist_id?: string
          user_id?: string
          video_id?: string
          watch_time_seconds?: number
        }
        Relationships: [
          {
            foreignKeyName: "video_progress_playlist_id_fkey"
            columns: ["playlist_id"]
            isOneToOne: false
            referencedRelation: "playlists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_progress_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      videos: {
        Row: {
          created_at: string | null
          duration_seconds: number
          id: string
          playlist_id: string
          position_order: number
          thumbnail_url: string | null
          title: string
          youtube_video_id: string
        }
        Insert: {
          created_at?: string | null
          duration_seconds: number
          id?: string
          playlist_id: string
          position_order: number
          thumbnail_url?: string | null
          title: string
          youtube_video_id: string
        }
        Update: {
          created_at?: string | null
          duration_seconds?: number
          id?: string
          playlist_id?: string
          position_order?: number
          thumbnail_url?: string | null
          title?: string
          youtube_video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "videos_playlist_id_fkey"
            columns: ["playlist_id"]
            isOneToOne: false
            referencedRelation: "playlists"
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
      exam_type: "JEE" | "NEET" | "Other"
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
      exam_type: ["JEE", "NEET", "Other"],
    },
  },
} as const
