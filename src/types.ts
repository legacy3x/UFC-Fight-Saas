export interface Fighter {
  id: number;
  first_name: string;
  last_name: string;
  nickname?: string;
  weight_class: string;
  country: string;
  team?: string;
  height_cm?: number;
  reach_cm?: number;
  stance?: string;
  dob?: string;
  wins: number;
  losses: number;
  draws: number;
  no_contests: number;
  ranking?: number;
  created_at: string;
  updated_at: string;
  modified_at: string;
  fight_stats?: FightStats;
}

export interface FightStats {
  id: number;
  fighter_id: number;
  significant_strikes_per_min: number;
  significant_strike_accuracy: number;
  significant_strikes_absorbed_per_min: number;
  significant_strike_defense: number;
  takedown_avg: number;
  takedown_accuracy: number;
  takedown_defense: number;
  submission_avg: number;
  created_at: string;
  updated_at: string;
}

export interface UpcomingEvent {
  id: number;
  name: string;
  location: string;
  date: string;
  is_pay_per_view: boolean;
  main_event_fight_id?: number;
  created_at: string;
  updated_at: string;
  fight_cards?: FightCard[];
}

export interface FightCard {
  id: number;
  event_id: number;
  fighter1_id: number;
  fighter2_id: number;
  card_type: 'early_prelims' | 'prelims' | 'main_card';
  bout_order: number;
  created_at: string;
  updated_at: string;
  fighter1?: Fighter;
  fighter2?: Fighter;
}

export interface PredictionLog {
  id: number;
  fighter1_id: number;
  fighter2_id: number;
  fighter1_name: string;
  fighter2_name: string;
  predicted_winner: string;
  predicted_method: string;
  confidence: number;
  created_at: string;
}