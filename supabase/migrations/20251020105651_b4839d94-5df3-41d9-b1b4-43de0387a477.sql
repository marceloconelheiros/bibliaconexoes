-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enums
CREATE TYPE testament_type AS ENUM ('OT', 'NT');
CREATE TYPE plan_mode AS ENUM ('ULTRA_15', 'FAST_30', 'BALANCED_90', 'COMFY_180', 'CLASSIC_365');
CREATE TYPE plan_style AS ENUM ('SEQUENTIAL', 'MIX_ON', 'TRIAD');
CREATE TYPE psalms_group AS ENUM ('NONE', 'PS1', 'PS2', 'PS3', 'PS4', 'PS5');

-- Books table
CREATE TABLE public.books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  abbrev TEXT NOT NULL,
  testament testament_type NOT NULL,
  order_index INTEGER NOT NULL UNIQUE,
  chapters_count INTEGER NOT NULL,
  has_audio BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Chapters table
CREATE TABLE public.chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  chapter_number INTEGER NOT NULL,
  osis_code TEXT,
  text_content TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(book_id, chapter_number)
);

-- Audio tracks table
CREATE TABLE public.audio_tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  audio_url TEXT,
  psalms_group psalms_group DEFAULT 'NONE',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Plans table
CREATE TABLE public.plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  mode plan_mode NOT NULL,
  style plan_style DEFAULT 'SEQUENTIAL',
  start_date DATE NOT NULL,
  days_total INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Plan days table
CREATE TABLE public.plan_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL,
  date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(plan_id, day_number)
);

-- Plan day chapters table (many-to-many)
CREATE TABLE public.plan_day_chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_day_id UUID NOT NULL REFERENCES public.plan_days(id) ON DELETE CASCADE,
  chapter_id UUID NOT NULL REFERENCES public.chapters(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Progress table
CREATE TABLE public.progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  plan_id UUID NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE,
  chapter_id UUID NOT NULL REFERENCES public.chapters(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, plan_id, chapter_id)
);

-- Streaks table
CREATE TABLE public.streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  plan_id UUID NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE,
  current_streak INTEGER DEFAULT 0,
  best_streak INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, plan_id)
);

-- Enable RLS on all tables
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audio_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_day_chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.streaks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for books (public read)
CREATE POLICY "Anyone can view books"
  ON public.books FOR SELECT
  USING (true);

-- RLS Policies for chapters (public read)
CREATE POLICY "Anyone can view chapters"
  ON public.chapters FOR SELECT
  USING (true);

-- RLS Policies for audio_tracks (public read)
CREATE POLICY "Anyone can view audio tracks"
  ON public.audio_tracks FOR SELECT
  USING (true);

-- RLS Policies for plans (user-specific)
CREATE POLICY "Users can view their own plans"
  ON public.plans FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own plans"
  ON public.plans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own plans"
  ON public.plans FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own plans"
  ON public.plans FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for plan_days (user-specific via plan)
CREATE POLICY "Users can view their plan days"
  ON public.plan_days FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.plans 
    WHERE plans.id = plan_days.plan_id 
    AND plans.user_id = auth.uid()
  ));

CREATE POLICY "Users can create their plan days"
  ON public.plan_days FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.plans 
    WHERE plans.id = plan_days.plan_id 
    AND plans.user_id = auth.uid()
  ));

-- RLS Policies for plan_day_chapters
CREATE POLICY "Users can view their plan day chapters"
  ON public.plan_day_chapters FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.plan_days pd
    JOIN public.plans p ON p.id = pd.plan_id
    WHERE pd.id = plan_day_chapters.plan_day_id 
    AND p.user_id = auth.uid()
  ));

CREATE POLICY "Users can create their plan day chapters"
  ON public.plan_day_chapters FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.plan_days pd
    JOIN public.plans p ON p.id = pd.plan_id
    WHERE pd.id = plan_day_chapters.plan_day_id 
    AND p.user_id = auth.uid()
  ));

-- RLS Policies for progress (user-specific)
CREATE POLICY "Users can view their own progress"
  ON public.progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own progress"
  ON public.progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own progress"
  ON public.progress FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for streaks (user-specific)
CREATE POLICY "Users can view their own streaks"
  ON public.streaks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own streaks"
  ON public.streaks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own streaks"
  ON public.streaks FOR UPDATE
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_chapters_book_id ON public.chapters(book_id);
CREATE INDEX idx_audio_tracks_book_id ON public.audio_tracks(book_id);
CREATE INDEX idx_plans_user_id ON public.plans(user_id);
CREATE INDEX idx_plan_days_plan_id ON public.plan_days(plan_id);
CREATE INDEX idx_plan_day_chapters_plan_day_id ON public.plan_day_chapters(plan_day_id);
CREATE INDEX idx_progress_user_plan ON public.progress(user_id, plan_id);
CREATE INDEX idx_streaks_user_plan ON public.streaks(user_id, plan_id);