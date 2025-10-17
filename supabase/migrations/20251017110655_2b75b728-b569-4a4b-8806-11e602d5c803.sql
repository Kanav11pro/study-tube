-- Add tags column to video_notes table
ALTER TABLE public.video_notes ADD COLUMN IF NOT EXISTS tags TEXT;