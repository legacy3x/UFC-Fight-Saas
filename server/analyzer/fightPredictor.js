import { createClient } from '@supabase/supabase-js'
import { analyzeFighterProfile } from './fighterProfileAnalyzer.js'
import 'dotenv/config'

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY)

// Prediction thresholds
const PREDICTION_THRESHOLDS = {
  HIGH_CONFIDENCE: 0.7,
  MEDIUM_CONFIDENCE: 0.55,
  LOW_CONFIDENCE: 0.4
}

// Method probabilities based on fighter strengths
const METHOD_PROBABILITIES = {
  STRIKING: {
    KO_TKO: 0.4,
    DECISION: 0.6
  },
  GRAPPLING: {
    SUBMISSION: 0.5,
    DECISION: 0.5
  },
  BALANCED: {
    KO_TKO: 0.3,
    SUBMISSION: 0.2,
    DECISION: 0.5
  }
}

export async function predictFight(fighter1Id, fighter2Id) {
  try {
    // Get both fighters' profiles
    const [fighter1, fighter2] = await Promise.all([
      analyzeFighterProfile(fighter1Id),
      analyzeFighterProfile(fighter2Id)
    ])

    if (!fighter1.success || !fighter2.success) {
      throw new Error('Failed to analyze one or both fighters')
    }

    // Calculate matchup advantages
    const advantages = calculateAdvantages(
      fighter1.data,
      fighter2.data
    )

    // Determine predicted winner
    const { predictedWinner, confidence } = determineWinner(
      fighter1.data,
      fighter2.data,
      advantages
    )

    // Predict fight method
    const method = predictMethod(
      predictedWinner,
      fighter1.data,
      fighter2.data,
      confidence
    )

    // Generate detailed reasoning
    const reasoning = generateReasoning(
      fighter1.data,
      fighter2.data,
      predictedWinner,
      method,
      confidence,
      advantages
    )

    // Log prediction with properly formatted percentages
    await supabase
      .from('prediction_logs')
      .insert({
        fighter1_id: fighter1.data.fighter.id,
        fighter2_id: fighter2.data.fighter.id,
        fighter1_name: `${fighter1.data.fighter.first_name} ${fighter1.data.fighter.last_name}`,
        fighter2_name: `${fighter2.data.fighter.first_name} ${fighter2.data.fighter.last_name}`,
        predicted_winner: `${predictedWinner.first_name} ${predictedWinner.last_name}`,
        predicted_method: method.replace('_', '/'),
        confidence: Number(confidence.toFixed(2))
      })

    return {
      success: true,
      data: {
        fighter1: fighter1.data.fighter,
        fighter2: fighter2.data.fighter,
        prediction: {
          winner: predictedWinner,
          method: method.replace('_', '/'),
          confidence: Number(confidence.toFixed(2)),
          reasoning
        },
        advantages: {
          striking: Number(advantages.striking.toFixed(2)),
          grappling: Number(advantages.grappling.toFixed(2)),
          cardio: Number(advantages.cardio.toFixed(2)),
          power: Number(advantages.power.toFixed(2)),
          experience: Number(advantages.experience.toFixed(2)),
          accuracy: Number(advantages.accuracy.toFixed(2))
        }
      }
    }
  } catch (error) {
    console.error('Prediction failed:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

function calculateAdvantages(fighter1, fighter2) {
  const advantages = {
    striking: 0,
    grappling: 0,
    cardio: 0,
    power: 0,
    experience: 0,
    accuracy: 0
  }

  // Striking advantage (volume + accuracy)
  const f1Striking = fighter1.metrics.strikesPerMinute * fighter1.metrics.strikeAccuracy
  const f2Striking = fighter2.metrics.strikesPerMinute * fighter2.metrics.strikeAccuracy
  advantages.striking = (f1Striking - f2Striking) / Math.max(f1Striking, f2Striking)

  // Grappling advantage (takedowns + submissions)
  const f1Grappling = fighter1.metrics.takedownsPer15Min * (1 + fighter1.metrics.submissionsPerFight)
  const f2Grappling = fighter2.metrics.takedownsPer15Min * (1 + fighter2.metrics.submissionsPerFight)
  advantages.grappling = (f1Grappling - f2Grappling) / Math.max(f1Grappling, f2Grappling)

  // Cardio advantage (late round performance)
  advantages.cardio = fighter1.metrics.lateRoundWinRate - fighter2.metrics.lateRoundWinRate

  // Power advantage (knockdowns)
  advantages.power = fighter1.metrics.knockdownsPerFight - fighter2.metrics.knockdownsPerFight

  // Experience advantage (total fights)
  const f1Fights = fighter1.fighter.wins + fighter1.fighter.losses + fighter1.fighter.draws
  const f2Fights = fighter2.fighter.wins + fighter2.fighter.losses + fighter2.fighter.draws
  advantages.experience = (f1Fights - f2Fights) / Math.max(f1Fights, f2Fights)

  // Accuracy advantage
  advantages.accuracy = fighter1.metrics.strikeAccuracy - fighter2.metrics.strikeAccuracy

  return advantages
}

function determineWinner(fighter1, fighter2, advantages) {
  // Calculate composite score for each fighter
  const f1Score = calculateFighterScore(fighter1, advantages)
  const f2Score = calculateFighterScore(fighter2, advantages)

  const totalScore = f1Score + f2Score
  const f1Probability = f1Score / totalScore
  const f2Probability = f2Score / totalScore

  if (f1Probability > f2Probability) {
    return {
      predictedWinner: fighter1.fighter,
      confidence: f1Probability
    }
  } else {
    return {
      predictedWinner: fighter2.fighter,
      confidence: f2Probability
    }
  }
}

function calculateFighterScore(fighter, advantages) {
  let score = 0

  // Base score from record (win percentage)
  const totalFights = fighter.fighter.wins + fighter.fighter.losses + fighter.fighter.draws
  const winPercentage = totalFights > 0 ? fighter.fighter.wins / totalFights : 0.5
  score += winPercentage * 0.3

  // Add strengths from profile analysis
  if (fighter.strengths.includes('High-volume striker')) score += 0.2
  if (fighter.strengths.includes('Precision striker')) score += 0.15
  if (fighter.strengths.includes('Heavy-handed power puncher')) score += 0.25
  if (fighter.strengths.includes('Strong grappling game')) score += 0.2
  if (fighter.strengths.includes('Submission specialist')) score += 0.15
  if (fighter.strengths.includes('Excellent cardio in later rounds')) score += 0.1

  // Adjust based on matchup advantages
  if (advantages.striking > 0 && fighter.strengths.some(s => s.includes('striker'))) {
    score += advantages.striking * 0.2
  }
  if (advantages.grappling > 0 && fighter.strengths.some(s => s.includes('grappling') || s.includes('Submission'))) {
    score += advantages.grappling * 0.2
  }
  if (advantages.cardio > 0 && fighter.strengths.includes('Excellent cardio in later rounds')) {
    score += advantages.cardio * 0.15
  }
  if (advantages.power > 0 && fighter.strengths.includes('Heavy-handed power puncher')) {
    score += advantages.power * 0.25
  }

  return score
}

function predictMethod(winner, fighter1, fighter2, confidence) {
  const winnerProfile = winner.id === fighter1.fighter.id ? fighter1 : fighter2
  const loserProfile = winner.id === fighter1.fighter.id ? fighter2 : fighter1

  // Determine fighting style
  let style = 'BALANCED'
  if (winnerProfile.strengths.some(s => s.includes('striker'))) {
    style = 'STRIKING'
  } else if (winnerProfile.strengths.some(s => s.includes('grappling') || s.includes('Submission'))) {
    style = 'GRAPPLING'
  }

  // Get base probabilities for the style
  const methods = METHOD_PROBABILITIES[style]

  // Adjust based on confidence
  let adjustedMethods = { ...methods }
  if (confidence > PREDICTION_THRESHOLDS.HIGH_CONFIDENCE) {
    if (style === 'STRIKING') adjustedMethods.KO_TKO *= 1.3
    if (style === 'GRAPPLING') adjustedMethods.SUBMISSION *= 1.3
  } else if (confidence < PREDICTION_THRESHOLDS.LOW_CONFIDENCE) {
    adjustedMethods.DECISION *= 1.5
    adjustedMethods.KO_TKO *= 0.7
    adjustedMethods.SUBMISSION *= 0.7
  }

  // Normalize probabilities
  const total = Object.values(adjustedMethods).reduce((sum, val) => sum + val, 0)
  for (const key in adjustedMethods) {
    adjustedMethods[key] /= total
  }

  // Select method based on probabilities
  const random = Math.random()
  let cumulative = 0
  for (const [method, prob] of Object.entries(adjustedMethods)) {
    cumulative += prob
    if (random <= cumulative) {
      return method
    }
  }

  return 'DECISION'
}

function generateReasoning(fighter1, fighter2, winner, method, confidence, advantages) {
  const winnerName = `${winner.first_name} ${winner.last_name}`
  const loserName = winner.id === fighter1.fighter.id 
    ? `${fighter2.fighter.first_name} ${fighter2.fighter.last_name}`
    : `${fighter1.fighter.first_name} ${fighter1.fighter.last_name}`

  let reasoning = [`${winnerName} is favored over ${loserName} with ${Math.round(confidence * 100)}% confidence.`]

  // Add primary advantages
  if (Math.abs(advantages.striking) > 0.2) {
    reasoning.push(advantages.striking > 0
      ? `${winnerName} holds a significant striking advantage (${Math.round(Math.abs(advantages.striking * 100))}% more effective).`
      : `${loserName} is the more effective striker, but other factors favor ${winnerName}.`)
  }

  if (Math.abs(advantages.grappling) > 0.2) {
    reasoning.push(advantages.grappling > 0
      ? `${winnerName} has superior grappling skills (${Math.round(Math.abs(advantages.grappling * 100))}% more effective).`
      : `${loserName} has better grappling, but ${winnerName} can avoid those situations.`)
  }

  if (Math.abs(advantages.power) > 0.15) {
    reasoning.push(advantages.power > 0
      ? `${winnerName} carries significantly more knockout power.`
      : `${loserName} hits harder, but ${winnerName} can weather the storm.`)
  }

  if (Math.abs(advantages.cardio) > 0.15) {
    reasoning.push(advantages.cardio > 0
      ? `${winnerName} has better cardio for later rounds.`
      : `${loserName} may fade in later rounds against ${winnerName}'s pace.`)
  }

  // Add method-specific reasoning
  reasoning.push(`Most likely outcome: ${method.replace('_', '/')}.`)
  if (method === 'KO_TKO') {
    reasoning.push('Expect the fight to end by knockout, given the significant striking differential.')
  } else if (method === 'SUBMISSION') {
    reasoning.push('The grappling advantage suggests a submission finish is likely.')
  } else {
    reasoning.push('This matchup favors a decision outcome based on the competitive metrics.')
  }

  // Add confidence level
  if (confidence > PREDICTION_THRESHOLDS.HIGH_CONFIDENCE) {
    reasoning.push('High confidence in this prediction due to clear advantages.')
  } else if (confidence > PREDICTION_THRESHOLDS.MEDIUM_CONFIDENCE) {
    reasoning.push('Moderate confidence - while advantages exist, the fight could be competitive.')
  } else {
    reasoning.push('Lower confidence prediction - this could be a close fight with small margins.')
  }

  return reasoning.join(' ')
}