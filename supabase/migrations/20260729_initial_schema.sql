-- Story Bible AI PostgreSQL Database Schema

CREATE TABLE IF NOT EXISTS books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  cover_color TEXT DEFAULT '#7C3AED',
  genre TEXT DEFAULT 'Fantasy',
  status TEXT DEFAULT 'Drafting',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  chapter_number INT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  word_count INT DEFAULT 0,
  reading_time_minutes INT DEFAULT 1,
  status TEXT DEFAULT 'Unprocessed',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  aliases TEXT[] DEFAULT '{}',
  summary TEXT DEFAULT '',
  status TEXT DEFAULT 'Active',
  first_appearance_chapter_id UUID REFERENCES chapters(id) ON DELETE SET NULL,
  last_appearance_chapter_id UUID REFERENCES chapters(id) ON DELETE SET NULL,
  appeared_in_chapter_ids UUID[] DEFAULT '{}',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS abilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  category TEXT DEFAULT 'Magic',
  user_character_names TEXT[] DEFAULT '{}',
  first_appearance_chapter_id UUID REFERENCES chapters(id) ON DELETE SET NULL,
  last_used_chapter_id UUID REFERENCES chapters(id) ON DELETE SET NULL,
  evolution_notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  owner_character_name TEXT DEFAULT '',
  current_location_name TEXT DEFAULT '',
  status TEXT DEFAULT 'Active',
  history_notes TEXT DEFAULT '',
  appeared_in_chapter_ids UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  summary TEXT DEFAULT '',
  type TEXT DEFAULT 'City',
  characters_present_names TEXT[] DEFAULT '{}',
  events_occurred TEXT[] DEFAULT '{}',
  appeared_in_chapter_ids UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  alignment TEXT DEFAULT 'Neutral',
  leader_name TEXT DEFAULT '',
  member_names TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  character1_name TEXT NOT NULL,
  character2_name TEXT NOT NULL,
  relation_type TEXT DEFAULT 'Allies',
  status TEXT DEFAULT 'Active',
  description TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS timeline_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  chapter_id UUID REFERENCES chapters(id) ON DELETE CASCADE,
  chapter_number INT NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  time_passed_note TEXT DEFAULT '',
  current_arc TEXT DEFAULT '',
  significance TEXT DEFAULT 'Major',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS plot_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  chapter_id UUID REFERENCES chapters(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  status TEXT DEFAULT 'Open',
  resolved_chapter_id UUID REFERENCES chapters(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS foreshadowing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  chapter_id UUID REFERENCES chapters(id) ON DELETE CASCADE,
  clue_description TEXT NOT NULL,
  payoff_target TEXT DEFAULT '',
  status TEXT DEFAULT 'Unfulfilled',
  fulfilled_chapter_id UUID REFERENCES chapters(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_extractions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  chapter_id UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  extraction JSONB NOT NULL,
  status TEXT DEFAULT 'Pending',
  warnings TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
