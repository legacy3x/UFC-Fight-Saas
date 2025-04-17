/*
  # Add Fight Card Management

  1. New Tables
    - `fight_cards` - Stores fight card information for events
      - `id` (bigint, primary key)
      - `event_id` (bigint, references upcoming_events)
      - `fighter1_id` (bigint, references fighters)
      - `fighter2_id` (bigint, references fighters)
      - `card_type` (text: 'early_prelims', 'prelims', 'main_card')
      - `bout_order` (integer)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `fight_cards` table
    - Add policies for admin access
*/

CREATE TABLE IF NOT EXISTS fight_cards (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  event_id bigint REFERENCES upcoming_events(id) ON DELETE CASCADE,
  fighter1_id bigint REFERENCES fighters(id) ON DELETE SET NULL,
  fighter2_id bigint REFERENCES fighters(id) ON DELETE SET NULL,
  card_type text NOT NULL CHECK (card_type IN ('early_prelims', 'prelims', 'main_card')),
  bout_order integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT different_fighters CHECK (fighter1_id <> fighter2_id)
);

CREATE INDEX idx_fight_cards_event ON fight_cards(event_id);
CREATE INDEX idx_fight_cards_fighters ON fight_cards(fighter1_id, fighter2_id);

ALTER TABLE fight_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage fight cards" ON fight_cards
  FOR ALL USING (EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Public can view fight cards" ON fight_cards
  FOR SELECT USING (true);

-- Trigger to update the updated_at timestamp
CREATE TRIGGER update_fight_cards_modtime 
  BEFORE UPDATE ON fight_cards 
  FOR EACH ROW 
  EXECUTE FUNCTION update_modified_column();