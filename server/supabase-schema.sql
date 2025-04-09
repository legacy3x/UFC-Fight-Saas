-- Enable Row Level Security on all tables
ALTER SYSTEM SET max_parallel_workers_per_gather = 4;

-- Users table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  last_login TIMESTAMPTZ,
  credits INTEGER DEFAULT 0 NOT NULL,
  CONSTRAINT username_length CHECK (char_length(username) >= 3 AND char_length(username) <= 24),
  CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+[.][A-Za-z]+$')
);

-- User roles
CREATE TABLE IF NOT EXISTS public.user_roles (
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'moderator', 'user', 'vip')),
  granted_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  granted_by UUID REFERENCES public.users(id),
  PRIMARY KEY (user_id, role)
);

-- Fighters table
CREATE TABLE IF NOT EXISTS public.fighters (
  id SERIAL PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  nickname TEXT,
  weight_class TEXT NOT NULL CHECK (weight_class IN (
    'Strawweight', 'Flyweight', 'Bantamweight', 'Featherweight',
    'Lightweight', 'Welterweight', 'Middleweight', 'Light Heavyweight',
    'Heavyweight', 'Women\'s Strawweight', 'Women\'s Flyweight',
    'Women\'s Bantamweight', 'Women\'s Featherweight'
  )),
  country TEXT NOT NULL,
  team TEXT,
  height_cm INTEGER,
  reach_cm INTEGER,
  stance TEXT CHECK (stance IN ('Orthodox', 'Southpaw', 'Switch')),
  dob DATE,
  wins INTEGER DEFAULT 0 NOT NULL,
  losses INTEGER DEFAULT 0 NOT NULL,
  draws INTEGER DEFAULT 0 NOT NULL,
  no_contests INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT name_length CHECK (char_length(first_name) >= 2 AND char_length(last_name) >= 2)
);

-- Fight stats (detailed per-fight metrics)
CREATE TABLE IF NOT EXISTS public.fight_stats (
  id SERIAL PRIMARY KEY,
  fighter_id INTEGER REFERENCES public.fighters(id) ON DELETE CASCADE NOT NULL,
  fight_id INTEGER NOT NULL, -- References fight_history(id)
  significant_strikes_landed INTEGER DEFAULT 0 NOT NULL,
  significant_strikes_attempted INTEGER DEFAULT 0 NOT NULL,
  takedowns_landed INTEGER DEFAULT 0 NOT NULL,
  takedowns_attempted INTEGER DEFAULT 0 NOT NULL,
  submission_attempts INTEGER DEFAULT 0 NOT NULL,
  knockdowns INTEGER DEFAULT 0 NOT NULL,
  control_time_seconds INTEGER DEFAULT 0 NOT NULL,
  strikes_to_head INTEGER DEFAULT 0 NOT NULL,
  strikes_to_body INTEGER DEFAULT 0 NOT NULL,
  strikes_to_leg INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE (fighter_id, fight_id)
);

-- Fight history (all past fights)
CREATE TABLE IF NOT EXISTS public.fight_history (
  id SERIAL PRIMARY KEY,
  event_id INTEGER REFERENCES public.upcoming_events(id) ON DELETE SET NULL,
  fighter1_id INTEGER REFERENCES public.fighters(id) ON DELETE SET NULL NOT NULL,
  fighter2_id INTEGER REFERENCES public.fighters(id) ON DELETE SET NULL NOT NULL,
  winner_id INTEGER REFERENCES public.fighters(id) ON DELETE SET NULL,
  method TEXT CHECK (method IN (
    'KO/TKO', 'Submission', 'Decision - Unanimous', 'Decision - Split',
    'Decision - Majority', 'DQ', 'No Contest', 'Other'
  )),
  round INTEGER,
  time TEXT,
  date TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT different_fighters CHECK (fighter1_id != fighter2_id)
);

-- Betting odds
CREATE TABLE IF NOT EXISTS public.betting_odds (
  id SERIAL PRIMARY KEY,
  fight_id INTEGER REFERENCES public.fight_history(id) ON DELETE CASCADE NOT NULL,
  fighter1_odds DECIMAL(5,2) NOT NULL,
  fighter2_odds DECIMAL(5,2) NOT NULL,
  draw_odds DECIMAL(5,2),
  last_updated TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  source TEXT NOT NULL
);

-- Upcoming events
CREATE TABLE IF NOT EXISTS public.upcoming_events (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  date TIMESTAMPTZ NOT NULL,
  is_pay_per_view BOOLEAN DEFAULT FALSE NOT NULL,
  main_event_fight_id INTEGER REFERENCES public.fight_history(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes for performance
CREATE INDEX idx_fighters_weight_class ON public.fighters(weight_class);
CREATE INDEX idx_fight_history_fighter1 ON public.fight_history(fighter1_id);
CREATE INDEX idx_fight_history_fighter2 ON public.fight_history(fighter2_id);
CREATE INDEX idx_fight_history_winner ON public.fight_history(winner_id);
CREATE INDEX idx_fight_stats_fighter ON public.fight_stats(fighter_id);
CREATE INDEX idx_upcoming_events_date ON public.upcoming_events(date);

-- Set up Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fighters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fight_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fight_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.betting_odds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.upcoming_events ENABLE ROW LEVEL SECURITY;

-- Create update timestamp function
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_users_modtime
BEFORE UPDATE ON public.users
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_fighters_modtime
BEFORE UPDATE ON public.fighters
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_upcoming_events_modtime
BEFORE UPDATE ON public.upcoming_events
FOR EACH ROW EXECUTE FUNCTION update_modified_column();
