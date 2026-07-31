-- Notter 2.1 Supabase PostgreSQL Database Schema
-- Multi-user isolation with Row Level Security (RLS)

-- 1. User Profiles & Password Recovery Table
CREATE TABLE IF NOT EXISTS public.user_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  recovery_type TEXT NOT NULL DEFAULT 'question', -- 'question' | 'code'
  recovery_question TEXT,
  recovery_answer_hash TEXT,
  recovery_code_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own profile" ON public.user_profiles FOR ALL USING (auth.uid() = user_id);

-- 2. User BYOK API Keys Table
CREATE TABLE IF NOT EXISTS public.user_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider_id TEXT NOT NULL, -- 'gemini' | 'openai' | 'anthropic' | 'groq' | 'xai' | 'openrouter' | 'ollama' | 'lmstudio' | 'custom'
  name TEXT NOT NULL,
  api_key_encrypted TEXT NOT NULL,
  default_model TEXT NOT NULL,
  base_url TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_api_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own API keys" ON public.user_api_keys FOR ALL USING (auth.uid() = user_id);

-- 3. Books Table
CREATE TABLE IF NOT EXISTS public.books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  cover_color TEXT DEFAULT '#7C3AED',
  genre TEXT DEFAULT 'Fantasy',
  status TEXT DEFAULT 'Drafting',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own books" ON public.books FOR ALL USING (auth.uid() = user_id);

-- 4. Chapters Table
CREATE TABLE IF NOT EXISTS public.chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  chapter_number INT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  word_count INT DEFAULT 0,
  reading_time_minutes INT DEFAULT 1,
  status TEXT DEFAULT 'Unprocessed',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own chapters" ON public.chapters FOR ALL USING (auth.uid() = user_id);

-- 5. Characters Table
CREATE TABLE IF NOT EXISTS public.characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  aliases TEXT[] DEFAULT '{}',
  summary TEXT DEFAULT '',
  status TEXT DEFAULT 'Active',
  occupation TEXT,
  current_location TEXT,
  emotional_state TEXT,
  physical_injuries TEXT,
  physical_changes TEXT,
  clothing TEXT,
  goals TEXT,
  secrets_revealed TEXT[] DEFAULT '{}',
  promises_made TEXT[] DEFAULT '{}',
  promises_broken TEXT[] DEFAULT '{}',
  decisions TEXT[] DEFAULT '{}',
  knowledge_gained TEXT[] DEFAULT '{}',
  first_appearance_chapter_id UUID REFERENCES public.chapters(id) ON DELETE SET NULL,
  last_appearance_chapter_id UUID REFERENCES public.chapters(id) ON DELETE SET NULL,
  appeared_in_chapter_ids UUID[] DEFAULT '{}',
  chapter_appearances JSONB DEFAULT '[]',
  history JSONB DEFAULT '[]',
  tags TEXT[] DEFAULT '{}',
  author_notes TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.characters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own characters" ON public.characters FOR ALL USING (auth.uid() = user_id);

-- 6. Abilities Table
CREATE TABLE IF NOT EXISTS public.abilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  category TEXT DEFAULT 'Magic',
  user_character_names TEXT[] DEFAULT '{}',
  first_appearance_chapter_id UUID REFERENCES public.chapters(id) ON DELETE SET NULL,
  last_used_chapter_id UUID REFERENCES public.chapters(id) ON DELETE SET NULL,
  evolution_notes TEXT DEFAULT '',
  history JSONB DEFAULT '[]',
  tags TEXT[] DEFAULT '{}',
  author_notes TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.abilities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own abilities" ON public.abilities FOR ALL USING (auth.uid() = user_id);

-- 7. Items Table
CREATE TABLE IF NOT EXISTS public.items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  type TEXT,
  owner_character_name TEXT DEFAULT '',
  previous_owner_name TEXT DEFAULT '',
  current_location_name TEXT DEFAULT '',
  condition TEXT DEFAULT 'Intact',
  status TEXT DEFAULT 'Active',
  history_notes TEXT DEFAULT '',
  appeared_in_chapter_ids UUID[] DEFAULT '{}',
  history JSONB DEFAULT '[]',
  tags TEXT[] DEFAULT '{}',
  author_notes TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own items" ON public.items FOR ALL USING (auth.uid() = user_id);

-- 8. Locations Table
CREATE TABLE IF NOT EXISTS public.locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  summary TEXT DEFAULT '',
  type TEXT DEFAULT 'City',
  characters_present_names TEXT[] DEFAULT '{}',
  items_located_names TEXT[] DEFAULT '{}',
  events_occurred TEXT[] DEFAULT '{}',
  appeared_in_chapter_ids UUID[] DEFAULT '{}',
  history JSONB DEFAULT '[]',
  tags TEXT[] DEFAULT '{}',
  author_notes TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own locations" ON public.locations FOR ALL USING (auth.uid() = user_id);

-- 9. Organizations Table
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  alignment TEXT DEFAULT 'Neutral',
  leader_name TEXT DEFAULT '',
  member_names TEXT[] DEFAULT '{}',
  history JSONB DEFAULT '[]',
  tags TEXT[] DEFAULT '{}',
  author_notes TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own organizations" ON public.organizations FOR ALL USING (auth.uid() = user_id);

-- 10. Relationships Table
CREATE TABLE IF NOT EXISTS public.relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  character1_name TEXT NOT NULL,
  character2_name TEXT NOT NULL,
  relation_type TEXT DEFAULT 'Allies',
  status TEXT DEFAULT 'Active',
  description TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.relationships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own relationships" ON public.relationships FOR ALL USING (auth.uid() = user_id);

-- 11. Dialogue Facts Table
CREATE TABLE IF NOT EXISTS public.dialogue_facts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  chapter_id UUID NOT NULL REFERENCES public.chapters(id) ON DELETE CASCADE,
  chapter_number INT NOT NULL,
  speaker TEXT NOT NULL,
  recipient TEXT,
  type TEXT NOT NULL,
  fact TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.dialogue_facts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own dialogue facts" ON public.dialogue_facts FOR ALL USING (auth.uid() = user_id);

-- 12. Timeline Events Table
CREATE TABLE IF NOT EXISTS public.timeline_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  chapter_id UUID REFERENCES public.chapters(id) ON DELETE CASCADE,
  chapter_number INT NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  location TEXT,
  participants TEXT[] DEFAULT '{}',
  winner TEXT,
  loser TEXT,
  deaths TEXT[] DEFAULT '{}',
  injuries TEXT[] DEFAULT '{}',
  items_exchanged TEXT[] DEFAULT '{}',
  abilities_used TEXT[] DEFAULT '{}',
  consequences TEXT,
  time_passed_note TEXT DEFAULT '',
  current_arc TEXT DEFAULT '',
  significance TEXT DEFAULT 'Major',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.timeline_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own timeline events" ON public.timeline_events FOR ALL USING (auth.uid() = user_id);

-- 13. Plot Threads Table
CREATE TABLE IF NOT EXISTS public.plot_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  chapter_id UUID REFERENCES public.chapters(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  status TEXT DEFAULT 'Open',
  resolved_chapter_id UUID REFERENCES public.chapters(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.plot_threads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own plot threads" ON public.plot_threads FOR ALL USING (auth.uid() = user_id);

-- 14. Foreshadowing Table
CREATE TABLE IF NOT EXISTS public.foreshadowing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  chapter_id UUID REFERENCES public.chapters(id) ON DELETE CASCADE,
  clue_description TEXT NOT NULL,
  payoff_target TEXT DEFAULT '',
  status TEXT DEFAULT 'Unfulfilled',
  fulfilled_chapter_id UUID REFERENCES public.chapters(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.foreshadowing ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own foreshadowing" ON public.foreshadowing FOR ALL USING (auth.uid() = user_id);

-- 15. AI Extractions Table
CREATE TABLE IF NOT EXISTS public.ai_extractions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  chapter_id UUID NOT NULL REFERENCES public.chapters(id) ON DELETE CASCADE,
  extraction JSONB NOT NULL,
  status TEXT DEFAULT 'Pending',
  warnings TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.ai_extractions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own AI extractions" ON public.ai_extractions FOR ALL USING (auth.uid() = user_id);
