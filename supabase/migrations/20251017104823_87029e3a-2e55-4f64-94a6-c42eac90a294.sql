-- Create video_notes table for quick notes
CREATE TABLE IF NOT EXISTS public.video_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  video_id UUID NOT NULL,
  playlist_id UUID NOT NULL,
  note_text TEXT NOT NULL,
  timestamp_seconds INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.video_notes ENABLE ROW LEVEL SECURITY;

-- Create policies for video_notes
CREATE POLICY "Users can view their own video notes"
ON public.video_notes
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own video notes"
ON public.video_notes
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own video notes"
ON public.video_notes
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own video notes"
ON public.video_notes
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_video_notes_updated_at
BEFORE UPDATE ON public.video_notes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();