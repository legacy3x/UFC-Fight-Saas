import { createClient } from '@supabase/supabase-js';
import { Fighter, FightStats } from '../types';

// Scoring weights for different aspects
const WEIGHTS = {
  STRIKING: {
    VOLUME: 0.15,
    ACCURACY: 0.15,
    DEFENSE: 0.1,
    POWER: 0.1
  },
  GRAPPLING: {
    TAKEDOWNS: 0.15,
    DEFENSE: 0.1,
    CONTROL: 0.1,
    SUBMISSIONS: 0.15
  }
};

// Style matchup matrix - how different styles fare against each other
const STYLE_MATCHUPS = {
  STRIKER: {
    STRIKER: 0.5,    // Even matchup
    GRAPPLER: 0.4,   // Slight disadvantage
    BALANCED: 0.5    // Even matchup
  },
  GRAPPLER: {
    STRIKER: 0.6,    // Slight advantage
    GRAPPLER: 0.5,    // Even matchup
    BALANCED: 0.45   // Slight disadvantage
  },
  BALANCED: {
    STRIKER: 0.5,    // Even matchup
    GRAPPLER: 0.55,  // Slight advantage
    BALANCED: 0.5    // Even matchup
  }
};

export class FightPredictor {
  private supabase;

  constructor() {
    this.supabase = createClient(
      process.env.VITE_SUPABASE_URL!,
      process.env.VITE_SUPABASE_ANON_KEY!
    );
  }

  private determineStyle(stats: FightStats): 'STRIKER' | 'GRAPPLER' | 'BALANCED' {
    const strikingScore = (
      stats.significant_strikes_per_min * 0.4 +
      stats.significant_strike_accuracy * 0.3 +
      stats.significant_strike_defense * 0.3
    );

    const grapplingScore = (
      stats.takedown_avg * 0.3 +
      stats.takedown_accuracy * 0.3 +
      stats.submission_avg * 0.4
    );

    // Normalize scores to 0-1 range
    const normalizedStriking = Math.min(strikingScore / 10, 1);
    const normalizedGrappling = Math.min(grapplingScore / 5, 1);

    // Determine style based on relative strengths
    if (normalizedStriking > normalizedGrappling * 1.5) {
      return 'STRIKER';
    } else if (normalizedGrappling > normalizedStriking * 1.5) {
      return 'GRAPPLER';
    } else {
      return 'BALANCED';
    }
  }

  private calculateStrikingAdvantage(fighter1: Fighter, fighter2: Fighter): number {
    if (!fighter1.fight_stats || !fighter2.fight_stats) return 0;

    const f1Stats = fighter1.fight_stats;
    const f2Stats = fighter2.fight_stats;

    // Offensive striking
    const f1Offense = (
      f1Stats.significant_strikes_per_min * WEIGHTS.STRIKING.VOLUME +
      f1Stats.significant_strike_accuracy * WEIGHTS.STRIKING.ACCURACY
    );

    const f2Offense = (
      f2Stats.significant_strikes_per_min * WEIGHTS.STRIKING.VOLUME +
      f2Stats.significant_strike_accuracy * WEIGHTS.STRIKING.ACCURACY
    );

    // Defensive striking
    const f1Defense = f1Stats.significant_strike_defense * WEIGHTS.STRIKING.DEFENSE;
    const f2Defense = f2Stats.significant_strike_defense * WEIGHTS.STRIKING.DEFENSE;

    // Calculate overall advantage
    return (f1Offense - f2Defense) - (f2Offense - f1Defense);
  }

  private calculateGrapplingAdvantage(fighter1: Fighter, fighter2: Fighter): number {
    if (!fighter1.fight_stats || !fighter2.fight_stats) return 0;

    const f1Stats = fighter1.fight_stats;
    const f2Stats = fighter2.fight_stats;

    // Offensive grappling
    const f1Offense = (
      f1Stats.takedown_avg * WEIGHTS.GRAPPLING.TAKEDOWNS +
      f1Stats.submission_avg * WEIGHTS.GRAPPLING.SUBMISSIONS
    );

    const f2Offense = (
      f2Stats.takedown_avg * WEIGHTS.GRAPPLING.TAKEDOWNS +
      f2Stats.submission_avg * WEIGHTS.GRAPPLING.SUBMISSIONS
    );

    // Defensive grappling
    const f1Defense = f1Stats.takedown_defense * WEIGHTS.GRAPPLING.DEFENSE;
    const f2Defense = f2Stats.takedown_defense * WEIGHTS.GRAPPLING.DEFENSE;

    // Calculate overall advantage
    return (f1Offense - f2Defense) - (f2Offense - f1Defense);
  }

  private predictMethod(
    fighter1: Fighter,
    fighter2: Fighter,
    strikingAdvantage: number,
    grapplingAdvantage: number,
    confidence: number
  ): string {
    if (!fighter1.fight_stats || !fighter2.fight_stats) {
      return 'Decision - Unanimous';
    }

    const f1Stats = fighter1.fight_stats;
    const f2Stats = fighter2.fight_stats;

    // Calculate finishing potential
    const koProb = Math.abs(strikingAdvantage) * 
      (f1Stats.significant_strikes_per_min + f2Stats.significant_strikes_per_min) / 20;
    
    const subProb = Math.abs(grapplingAdvantage) * 
      (f1Stats.submission_avg + f2Stats.submission_avg) / 4;

    // Adjust probabilities based on confidence
    const finishMultiplier = confidence > 0.7 ? 1.3 : confidence < 0.5 ? 0.7 : 1;
    const adjustedKoProb = koProb * finishMultiplier;
    const adjustedSubProb = subProb * finishMultiplier;

    // Determine method based on highest probability
    if (adjustedKoProb > 0.3) {
      return 'KO/TKO';
    } else if (adjustedSubProb > 0.25) {
      return 'Submission';
    } else if (confidence > 0.65) {
      return 'Decision - Unanimous';
    } else {
      return 'Decision - Split';
    }
  }

  private generateReasoning(
    fighter1: Fighter,
    fighter2: Fighter,
    strikingAdvantage: number,
    grapplingAdvantage: number,
    winner: Fighter,
    method: string,
    confidence: number
  ): string {
    if (!fighter1.fight_stats || !fighter2.fight_stats) {
      return 'Insufficient data for detailed analysis.';
    }

    const reasons: string[] = [];
    const f1Name = `${fighter1.first_name} ${fighter1.last_name}`;
    const f2Name = `${fighter2.first_name} ${fighter2.last_name}`;
    const winnerName = `${winner.first_name} ${winner.last_name}`;

    // Add striking analysis
    if (Math.abs(strikingAdvantage) > 0.1) {
      const betterStriker = strikingAdvantage > 0 ? f1Name : f2Name;
      reasons.push(
        `${betterStriker} has a significant striking advantage, landing ${
          Math.abs(strikingAdvantage * 100).toFixed(1)
        }% more effective strikes.`
      );
    }

    // Add grappling analysis
    if (Math.abs(grapplingAdvantage) > 0.1) {
      const betterGrappler = grapplingAdvantage > 0 ? f1Name : f2Name;
      reasons.push(
        `${betterGrappler} shows superior grappling ability with ${
          Math.abs(grapplingAdvantage * 100).toFixed(1)
        }% better control metrics.`
      );
    }

    // Add style matchup analysis
    const f1Style = this.determineStyle(fighter1.fight_stats);
    const f2Style = this.determineStyle(fighter2.fight_stats);
    reasons.push(
      `Style matchup: ${f1Name} (${f1Style}) vs ${f2Name} (${f2Style}) favors ${winnerName}.`
    );

    // Add method reasoning
    if (method === 'KO/TKO') {
      reasons.push(
        `The striking differential suggests a potential finish via strikes.`
      );
    } else if (method === 'Submission') {
      reasons.push(
        `The grappling advantage indicates a submission opportunity.`
      );
    } else {
      reasons.push(
        `The competitive nature of this matchup suggests it will go to the judges.`
      );
    }

    // Add confidence explanation
    if (confidence > 0.7) {
      reasons.push(
        `High confidence prediction based on clear statistical advantages.`
      );
    } else if (confidence > 0.5) {
      reasons.push(
        `Moderate confidence due to competitive matchup metrics.`
      );
    } else {
      reasons.push(
        `Lower confidence prediction - this could be a close fight.`
      );
    }

    return reasons.join(' ');
  }

  public async predictFight(fighter1Id: number, fighter2Id: number) {
    try {
      // Fetch fighters with their stats
      const { data: fighters, error } = await this.supabase
        .from('fighters')
        .select(`
          *,
          fight_stats (*)
        `)
        .in('id', [fighter1Id, fighter2Id]);

      if (error) throw error;
      if (!fighters || fighters.length !== 2) {
        throw new Error('Could not find both fighters');
      }

      const [fighter1, fighter2] = fighters;

      // Calculate advantages
      const strikingAdvantage = this.calculateStrikingAdvantage(fighter1, fighter2);
      const grapplingAdvantage = this.calculateGrapplingAdvantage(fighter1, fighter2);

      // Calculate overall advantage
      const totalAdvantage = (strikingAdvantage + grapplingAdvantage) / 2;

      // Determine winner and confidence
      const winner = totalAdvantage > 0 ? fighter1 : fighter2;
      const confidence = Math.min(Math.abs(totalAdvantage) + 0.5, 1);

      // Predict method
      const method = this.predictMethod(
        fighter1,
        fighter2,
        strikingAdvantage,
        grapplingAdvantage,
        confidence
      );

      // Generate reasoning
      const reasoning = this.generateReasoning(
        fighter1,
        fighter2,
        strikingAdvantage,
        grapplingAdvantage,
        winner,
        method,
        confidence
      );

      // Format confidence to exactly 2 decimal places for database insertion
      const formattedConfidence = Number(confidence.toFixed(2));

      // Log prediction with properly formatted values
      await this.supabase
        .from('prediction_logs')
        .insert({
          fighter1_id: fighter1.id,
          fighter2_id: fighter2.id,
          fighter1_name: `${fighter1.first_name} ${fighter1.last_name}`,
          fighter2_name: `${fighter2.first_name} ${fighter2.last_name}`,
          predicted_winner: `${winner.first_name} ${winner.last_name}`,
          predicted_method: method,
          confidence: formattedConfidence
        });

      return {
        winner: {
          id: winner.id,
          name: `${winner.first_name} ${winner.last_name}`
        },
        method,
        confidence: formattedConfidence,
        reasoning
      };
    } catch (error) {
      console.error('Error predicting fight:', error);
      throw error;
    }
  }
}