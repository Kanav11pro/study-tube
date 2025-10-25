-- Create doubt questions table
CREATE TABLE public.doubt_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  playlist_id UUID NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
  timestamp_seconds INTEGER NOT NULL DEFAULT 0,
  question_text TEXT,
  question_image_url TEXT,
  question_type TEXT NOT NULL CHECK (question_type IN ('text', 'image', 'screenshot')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create AI responses table
CREATE TABLE public.doubt_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES doubt_questions(id) ON DELETE CASCADE,
  response_text TEXT NOT NULL,
  response_data JSONB,
  model_used TEXT NOT NULL,
  related_timestamps INTEGER[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create video transcripts table
CREATE TABLE public.video_transcripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  transcript_text TEXT NOT NULL,
  transcript_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(video_id)
);

-- Enable RLS
ALTER TABLE public.doubt_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doubt_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_transcripts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for doubt_questions
CREATE POLICY "Users can view own doubt questions" ON public.doubt_questions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own doubt questions" ON public.doubt_questions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own doubt questions" ON public.doubt_questions
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for doubt_responses
CREATE POLICY "Users can view responses to their questions" ON public.doubt_responses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM doubt_questions 
      WHERE doubt_questions.id = doubt_responses.question_id 
      AND doubt_questions.user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert doubt responses" ON public.doubt_responses
  FOR INSERT WITH CHECK (true);

-- RLS Policies for video_transcripts
CREATE POLICY "Authenticated users can read transcripts" ON public.video_transcripts
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "System can manage transcripts" ON public.video_transcripts
  FOR ALL USING (true);

-- Create indexes for better performance
CREATE INDEX idx_doubt_questions_user_id ON public.doubt_questions(user_id);
CREATE INDEX idx_doubt_questions_video_id ON public.doubt_questions(video_id);
CREATE INDEX idx_doubt_questions_created_at ON public.doubt_questions(created_at);
CREATE INDEX idx_doubt_responses_question_id ON public.doubt_responses(question_id);
CREATE INDEX idx_video_transcripts_video_id ON public.video_transcripts(video_id);


