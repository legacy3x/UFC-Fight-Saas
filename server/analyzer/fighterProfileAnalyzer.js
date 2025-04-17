import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY)

// Strength categories and their thresholds
const STRENGTHS = {
  VOLUME_STRIKER: {
    threshold: 4.5, // Significant strikes per minute
    description: 'High-volume striker'
  },
  ACCURATE_STRIKER: {
    threshold: 0.5, // Strike accuracy percentage
    description: 'Precision striker'
  },
  POWER_PUNCHER: {
    threshold: 0.4, // Knockdowns per fight
    description: 'Heavy-handed power puncher'
  },
  GRAPPLER: {
    threshold: 2.5, // Takedowns per 15 minutes
    description: 'Strong grappling game'
  },
  SUBMISSION_ARTIST: {
    threshold: 0.5, // Submissions per fight
    description: 'Submission specialist'
  },
  CARDIO_MONSTER: {
    threshold: 0.6, // Win rate in rounds 3-5
    description: 'Excellent cardio in later rounds'
  },
  CLINCH_WORKER: {
    threshold: 0.3, // Clinch strike ratio
    description: 'Effective clinch fighter'
  }
}

export async function analyzeFighterProfile(fighterId) {
  try {
    // Get fighter base stats
    const { data: fighter, error: fighterError } = await supabase
      .from('fighters')
      .select('*')
      .eq('id', fighterId)
      .single()

    if (fighterError || !fighter) {
      throw new Error(fighterError?.message || 'Fighter not found')
    }

    // Get detailed fight stats
    const { data: fightStats, error: statsError } = await supabase
      .from('fight_stats')
      .select('*')
      .eq('fighter_id', fighterId)

    if (statsError) throw statsError

    // Calculate aggregate metrics
    const metrics = calculateFighterMetrics(fighter, fightStats)
    
    // Determine strengths based on metrics
    const strengths = determineStrengths(metrics)
    
    // Generate summary text
    const summary = generateSummary(fighter, strengths, metrics)

    return {
      success: true,
      data: {
        fighter,
        metrics,
        strengths,
        summary
      }
    }
  } catch (error) {
    console.error('Profile analysis failed:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

function calculateFighterMetrics(fighter, fightStats) {
  if (!fightStats || fightStats.length === 0) {
    return {
      strikeAccuracy: 0,
      strikesPerMinute: 0,
      knockdownsPerFight: 0,
      takedownsPer15Min: 0,
      submissionsPerFight: 0,
      lateRoundWinRate: 0,
      clinchStrikeRatio: 0
    }
  }

  const totalFights = fightStats.length
  const totalRounds = fightStats.reduce((sum, stat) => sum + (stat.round || 1), 0)
  const fightMinutes = totalRounds * 5 // Assuming 5 minutes per round

  // Calculate striking metrics
  const totalStrikesLanded = fightStats.reduce((sum, stat) => sum + stat.significant_strikes_landed, 0)
  const totalStrikesAttempted = fightStats.reduce((sum, stat) => sum + stat.significant_strikes_attempted, 0)
  const strikeAccuracy = totalStrikesAttempted > 0 
    ? totalStrikesLanded / totalStrikesAttempted 
    : 0

  // Calculate grappling metrics
  const totalTakedownsLanded = fightStats.reduce((sum, stat) => sum + stat.takedowns_landed, 0)
  const totalSubmissions = fightStats.reduce((sum, stat) => sum + stat.submission_attempts, 0)
  const totalKnockdowns = fightStats.reduce((sum, stat) => sum + stat.knockdowns, 0)

  // Calculate round performance
  const lateRoundWins = fightStats.filter(stat => 
    stat.round >= 3 && stat.fight_result === 'win'
  ).length
  const lateRoundFights = fightStats.filter(stat => stat.round >= 3).length

  // Calculate clinch work
  const clinchStrikes = fightStats.reduce((sum, stat) => sum + (stat.strikes_to_body || 0), 0)
  const clinchStrikeRatio = totalStrikesLanded > 0 
    ? clinchStrikes / totalStrikesLanded 
    : 0

  return {
    strikeAccuracy,
    strikesPerMinute: fightMinutes > 0 ? totalStrikesLanded / (fightMinutes / 60) : 0,
    knockdownsPerFight: totalFights > 0 ? totalKnockdowns / totalFights : 0,
    takedownsPer15Min: fightMinutes > 0 ? (totalTakedownsLanded / fightMinutes) * 15 : 0,
    submissionsPerFight: totalFights > 0 ? totalSubmissions / totalFights : 0,
    lateRoundWinRate: lateRoundFights > 0 ? lateRoundWins / lateRoundFights : 0,
    clinchStrikeRatio
  }
}

function determineStrengths(metrics) {
  return Object.entries(STRENGTHS)
    .filter(([key, { threshold }]) => {
      const metricKey = key.toLowerCase().replace(/_/g, '')
      return metrics[metricKey] >= threshold
    })
    .map(([_, { description }]) => description)
}

function generateSummary(fighter, strengths, metrics) {
  const name = `${fighter.first_name} ${fighter.last_name}`
  const weightClass = fighter.weight_class
  const record = `${fighter.wins}-${fighter.losses}-${fighter.draws}`

  if (strengths.length === 0) {
    return `${name} (${weightClass}, ${record}) is a well-rounded fighter without dominant specialized skills.`
  }

  const primaryStrength = strengths[0]
  const secondaryStrengths = strengths.slice(1)

  let summary = `${name} (${weightClass}, ${record}) is primarily a ${primaryStrength.toLowerCase()}`

  if (secondaryStrengths.length > 0) {
    summary += ` who also shows ${secondaryStrengths.length > 1 
      ? 'traits of ' + secondaryStrengths.slice(0, -1).join(', ') + ' and ' + secondaryStrengths.slice(-1)
      : secondaryStrengths[0].toLowerCase()
    }`
  }

  // Add notable metrics
  const notableMetrics = []
  if (metrics.strikesPerMinute > 5) notableMetrics.push(`high output (${metrics.strikesPerMinute.toFixed(1)} sig. strikes/min)`)
  if (metrics.strikeAccuracy > 0.55) notableMetrics.push(`accuracy (${(metrics.strikeAccuracy * 100).toFixed(0)}%)`)
  if (metrics.takedownsPer15Min > 3) notableMetrics.push(`grappling volume (${metrics.takedownsPer15Min.toFixed(1)} TD/15min)`)

  if (notableMetrics.length > 0) {
    summary += `. Notable metrics include ${notableMetrics.join(', ')}.`
  } else {
    summary += '.'
  }

  return summary
}