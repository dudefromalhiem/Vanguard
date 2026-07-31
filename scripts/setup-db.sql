-- The Vanguard Society — Database Schema
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor > New query)
-- or via the Supabase CLI: supabase db push

-- ============================================
-- NEWS
-- ============================================
CREATE TABLE IF NOT EXISTS news (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  body TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('announcement','achievement','article','result')),
  tags JSONB DEFAULT '[]',
  author TEXT NOT NULL,
  cover_image TEXT,
  published_at TIMESTAMPTZ,
  is_published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- EVENTS
-- ============================================
CREATE TABLE IF NOT EXISTS events (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL,
  event_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  location TEXT,
  location_map_url TEXT,
  capacity INTEGER,
  registration_deadline TIMESTAMPTZ,
  registration_open BOOLEAN DEFAULT TRUE,
  speakers JSONB DEFAULT '[]',
  requirements TEXT,
  organizer TEXT,
  wing TEXT CHECK (wing IN ('leadership','technical') OR wing IS NULL),
  type TEXT CHECK (type IN ('debate','workshop','lecture','forum','session','competition','social') OR type IS NULL),
  cover_image TEXT,
  gallery_album_id INTEGER,
  is_featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- MEMBERSHIP APPLICATIONS (created before members table)
-- ============================================
CREATE TABLE IF NOT EXISTS membership_applications (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  usn TEXT,
  branch TEXT,
  semester INTEGER,
  why_join TEXT,
  preferred_wing TEXT,
  password_hash TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','interview','accepted','rejected')),
  admin_notes TEXT,
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ
);

-- ============================================
-- MEMBERS
-- ============================================
CREATE TABLE IF NOT EXISTS members (
  id SERIAL PRIMARY KEY,
  application_id INTEGER REFERENCES membership_applications(id),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  phone TEXT,
  usn TEXT,
  branch TEXT,
  wing TEXT,
  role TEXT DEFAULT 'member',
  avatar TEXT,
  bio TEXT,
  portfolio_url TEXT,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

-- ============================================
-- EVENT REGISTRATIONS
-- ============================================
CREATE TABLE IF NOT EXISTS event_registrations (
  id SERIAL PRIMARY KEY,
  event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  member_id INTEGER REFERENCES members(id),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  ticket_code TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'confirmed' CHECK (status IN ('confirmed','waitlisted','cancelled','attended')),
  registered_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- POLLS
-- ============================================
CREATE TABLE IF NOT EXISTS polls (
  id SERIAL PRIMARY KEY,
  question TEXT NOT NULL,
  options JSONB NOT NULL DEFAULT '[]',
  select_type TEXT DEFAULT 'single' CHECK (select_type IN ('single','multi')),
  is_active BOOLEAN DEFAULT TRUE,
  end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS poll_votes (
  id SERIAL PRIMARY KEY,
  poll_id INTEGER NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  option_id TEXT NOT NULL,
  voter_id TEXT NOT NULL,
  voted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(poll_id, voter_id)
);

-- ============================================
-- TEAM
-- ============================================
CREATE TABLE IF NOT EXISTS team_members (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('executive','faculty','mentors','coordinators','past')),
  wing TEXT CHECK (wing IN ('leadership','technical') OR wing IS NULL),
  title TEXT,
  image TEXT,
  bio TEXT,
  email TEXT,
  linkedin TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  tenure TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- GALLERY
-- ============================================
CREATE TABLE IF NOT EXISTS gallery_albums (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  event_id INTEGER REFERENCES events(id),
  wing TEXT,
  year INTEGER,
  cover_image TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS gallery_images (
  id SERIAL PRIMARY KEY,
  album_id INTEGER NOT NULL REFERENCES gallery_albums(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  caption TEXT,
  tagged_members JSONB DEFAULT '[]',
  media_type TEXT DEFAULT 'image' CHECK (media_type IN ('image','video')),
  sort_order INTEGER DEFAULT 0
);

-- ============================================
-- PROJECTS
-- ============================================
CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL,
  tech_stack JSONB DEFAULT '[]',
  github_url TEXT,
  live_demo_url TEXT,
  cover_image TEXT,
  contributors JSONB DEFAULT '[]',
  awards JSONB DEFAULT '[]',
  wing TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active','completed','archived')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- RESOURCES
-- ============================================
CREATE TABLE IF NOT EXISTS resources (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('workshop','slides','pdf','github','kit','notes','other')),
  file_url TEXT,
  wing TEXT,
  tags JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ALUMNI
-- ============================================
CREATE TABLE IF NOT EXISTS alumni (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  batch TEXT,
  current_company TEXT,
  current_role TEXT,
  image TEXT,
  bio TEXT,
  linkedin TEXT,
  mentorship_available BOOLEAN DEFAULT FALSE,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PARTNERS / SPONSORS
-- ============================================
CREATE TABLE IF NOT EXISTS partners (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('sponsor','partner','collaborator')),
  logo TEXT,
  website TEXT,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- FAQS
-- ============================================
CREATE TABLE IF NOT EXISTS faqs (
  id SERIAL PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT CHECK (category IN ('general','membership','events','technical','other')),
  sort_order INTEGER DEFAULT 0
);

-- ============================================
-- NOTIFICATIONS
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('event','poll','news','recruitment','result','deadline','general')),
  title TEXT NOT NULL,
  message TEXT,
  link TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PUBLICATIONS
-- ============================================
CREATE TABLE IF NOT EXISTS publications (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT CHECK (type IN ('newsletter','report','paper','magazine','other')),
  file_url TEXT,
  cover_image TEXT,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES for common queries
-- ============================================
CREATE INDEX IF NOT EXISTS idx_news_published ON news(is_published, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_category ON news(category);
CREATE INDEX IF NOT EXISTS idx_news_slug ON news(slug);

CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date DESC);
CREATE INDEX IF NOT EXISTS idx_events_wing ON events(wing);
CREATE INDEX IF NOT EXISTS idx_events_featured ON events(is_featured);
CREATE INDEX IF NOT EXISTS idx_events_slug ON events(slug);

CREATE INDEX IF NOT EXISTS idx_registrations_event ON event_registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_registrations_email ON event_registrations(email);
CREATE INDEX IF NOT EXISTS idx_registrations_member ON event_registrations(member_id);

CREATE INDEX IF NOT EXISTS idx_polls_active ON polls(is_active);
CREATE INDEX IF NOT EXISTS idx_poll_votes_poll ON poll_votes(poll_id);

CREATE INDEX IF NOT EXISTS idx_team_category ON team_members(category, sort_order);
CREATE INDEX IF NOT EXISTS idx_team_active ON team_members(is_active);

CREATE INDEX IF NOT EXISTS idx_gallery_album ON gallery_images(album_id);

CREATE INDEX IF NOT EXISTS idx_projects_slug ON projects(slug);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);

CREATE INDEX IF NOT EXISTS idx_resources_category ON resources(category);

CREATE INDEX IF NOT EXISTS idx_members_email ON members(email);
CREATE INDEX IF NOT EXISTS idx_members_active ON members(is_active);

CREATE INDEX IF NOT EXISTS idx_applications_status ON membership_applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_email ON membership_applications(email);

CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

CREATE INDEX IF NOT EXISTS idx_faqs_category ON faqs(category, sort_order);

-- ============================================
-- Enable Row Level Security (optional but recommended)
-- For this project, we use service_role key server-side,
-- so RLS is primarily for safety.
-- ============================================
ALTER TABLE news ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE membership_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE alumni ENABLE ROW LEVEL SECURITY;
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE publications ENABLE ROW LEVEL SECURITY;

-- Allow service_role full access (our API uses service_role key)
-- Public (anon) read access for published content
CREATE POLICY "service_role_all" ON news FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON events FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON event_registrations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON polls FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON poll_votes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON team_members FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON gallery_albums FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON gallery_images FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON projects FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON resources FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON membership_applications FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON members FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON alumni FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON partners FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON faqs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON notifications FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON publications FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- Create storage bucket for file uploads
-- Run this separately if needed, or create via Supabase dashboard:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('uploads', 'uploads', true);
-- ============================================
