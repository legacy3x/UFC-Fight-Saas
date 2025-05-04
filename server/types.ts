export interface Fighter {
  id: number;
  first_name: string;
  last_name: string;
  nickname?: string;
  weight_class: string;
  height_cm?: number;
  reach_cm?: number;
  stance?: string;
  wins: number;
  losses: number;
  draws: number;
  created_at: string;
  updated_at: string;
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

export interface FightHistory {
  result: string;
  opponent: string;
  event: string;
  method: string;
  round: number;
  time: string;
  date: Date;
}