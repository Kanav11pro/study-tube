// Complete type definitions matching the database schema
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          exam_type: string;
          target_year: number;
          profile_picture?: string;
          subscription_tier: string;
          ai_notes_used_this_month: number;
          ai_notes_reset_date: string;
          referral_code?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name: string;
          exam_type: string;
          target_year: number;
          profile_picture?: string;
          subscription_tier?: string;
          ai_notes_used_this_month?: number;
          ai_notes_reset_date?: string;
          referral_code?: string;
        };
        Update: {
          email?: string;
          full_name?: string;
          exam_type?: string;
          target_year?: number;
          profile_picture?: string;
          subscription_tier?: string;
          ai_notes_used_this_month?: number;
          ai_notes_reset_date?: string;
        };
      };
      playlists: {
        Row: {
          id: string;
          user_id: string;
          youtube_playlist_id: string;
          title: string;
          description?: string;
          thumbnail_url?: string;
          channel_name?: string;
          total_videos: number;
          created_at: string;
          last_accessed_at: string;
        };
      };
      videos: {
        Row: {
          id: string;
          playlist_id: string;
          youtube_video_id: string;
          title: string;
          thumbnail_url?: string;
          duration_seconds: number;
          position_order: number;
          created_at: string;
        };
      };
      video_progress: {
        Row: {
          id: string;
          user_id: string;
          video_id: string;
          playlist_id: string;
          watch_time_seconds: number;
          is_completed: boolean;
          notes_generated: boolean;
          last_watched_at: string;
        };
      };
      ai_notes: {
        Row: {
          id: string;
          user_id: string;
          video_id: string;
          video_title: string;
          summary: string;
          key_points: string[];
          created_at: string;
        };
      };
      study_streaks: {
        Row: {
          id: string;
          user_id: string;
          study_date: string;
          watch_time_seconds: number;
          videos_completed: number;
          created_at: string;
        };
      };
      user_settings: {
        Row: {
          id: string;
          user_id: string;
          auto_play_next: boolean;
          default_playback_speed: number;
          auto_complete_percentage: number;
          daily_reminder_time?: string;
          weekly_progress_email: boolean;
          created_at: string;
          updated_at: string;
        };
      };
      video_notes: {
        Row: {
          id: string;
          user_id: string;
          video_id: string;
          playlist_id: string;
          note_text: string;
          timestamp_seconds: number;
          created_at: string;
        };
      };
      subscription_plans: {
        Row: {
          id: string;
          name: string;
          price_inr: number;
          duration_days: number;
          max_playlists?: number;
          max_ai_notes_per_month: number;
          features?: any;
          created_at: string;
        };
      };
      user_subscriptions: {
        Row: {
          id: string;
          user_id: string;
          plan_id: string;
          status: string;
          start_date: string;
          end_date: string;
          auto_renew: boolean;
          created_at: string;
        };
        Insert: {
          user_id: string;
          plan_id: string;
          status: string;
          start_date: string;
          end_date: string;
          auto_renew?: boolean;
        };
        Update: {
          status?: string;
          end_date?: string;
          auto_renew?: boolean;
        };
      };
      subscription_requests: {
        Row: {
          id: string;
          user_id: string;
          plan_id: string;
          full_name: string;
          email: string;
          phone_number: string;
          upi_transaction_id: string;
          payment_screenshot_url: string;
          payment_date: string;
          amount_paid: number;
          status: string;
          admin_notes?: string;
          created_at: string;
          reviewed_at?: string;
          reviewed_by?: string;
        };
        Insert: {
          user_id: string;
          plan_id: string;
          full_name: string;
          email: string;
          phone_number: string;
          upi_transaction_id: string;
          payment_screenshot_url: string;
          payment_date: string;
          amount_paid: number;
          status?: string;
        };
        Update: {
          status?: string;
          admin_notes?: string;
          reviewed_at?: string;
          reviewed_by?: string;
        };
      };
      user_roles: {
        Row: {
          id: string;
          user_id: string;
          role: string;
          created_at: string;
        };
      };
      referral_codes: {
        Row: {
          id: string;
          user_id: string;
          code: string;
          referrals_count: number;
          free_months_earned: number;
          created_at: string;
        };
      };
      referral_signups: {
        Row: {
          id: string;
          referrer_id: string;
          referred_user_id: string;
          referral_code: string;
          premium_granted: boolean;
          granted_at: string;
          created_at: string;
        };
      };
      platform_settings: {
        Row: {
          id: string;
          setting_key: string;
          setting_value: any;
          updated_at: string;
        };
      };
    };
  };
};
