// Temporary type definitions until Supabase types regenerate
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
          created_at: string;
          updated_at: string;
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
    };
  };
};
