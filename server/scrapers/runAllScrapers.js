import cron from 'node-cron'
import { scrapeFighterStats } from './fighterStatsScraper.js'
import { scrapeUfcRoster } from './rosterScraper.js'
import { scrapeBettingOdds } from './bettingOddsScraper.js'
import { scrapeUpcomingEvents } from './eventsScraper.js'
import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

// Main scheduler function
export async function scheduleScrapers() {
  // Weekly schedule - every Thursday at 23:59 (11:59 PM)
  cron.schedule('59 23 * * 4', async () => {
    console.log('🚀 Starting scheduled scrapers at', new Date().toISOString())
    
    try {
      // Log the start in database
      await supabase
        .from('scraper_logs')
        .insert({
          type: 'full_run',
          status: 'started',
          started_at: new Date().toISOString()
        })

      // Run all scrapers in sequence with error handling
      const results = {
        fighterStats: await runWithLogging(scrapeFighterStats, 'fighter_stats'),
        roster: await runWithLogging(scrapeUfcRoster, 'roster'),
        bettingOdds: await runWithLogging(scrapeBettingOdds, 'betting_odds'),
        events: await runWithLogging(scrapeUpcomingEvents, 'events')
      }

      // Log successful completion
      await supabase
        .from('scraper_logs')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          results: JSON.stringify(results)
        })
        .eq('status', 'started')
        .order('started_at', { ascending: false })
        .limit(1)

      console.log('✅ All scrapers completed successfully')
    } catch (error) {
      console.error('❌ Error in scheduled scrapers:', error)
      
      // Log error in database
      await supabase
        .from('scraper_logs')
        .update({
          status: 'failed',
          error: error.message,
          completed_at: new Date().toISOString()
        })
        .eq('status', 'started')
        .order('started_at', { ascending: false })
        .limit(1)
    }
  }, {
    scheduled: true,
    timezone: 'America/New_York'
  })

  console.log('⏰ Scrapers scheduled to run weekly on Thursdays at 23:59 (ET)')
}

// Helper function to run and log individual scrapers
async function runWithLogging(scraperFn, scraperType) {
  const startTime = new Date()
  console.log(`🔄 Starting ${scraperType} scraper...`)
  
  try {
    const result = await scraperFn()
    const duration = (new Date() - startTime) / 1000
    
    await supabase
      .from('scraper_logs')
      .insert({
        type: scraperType,
        status: 'completed',
        started_at: startTime.toISOString(),
        completed_at: new Date().toISOString(),
        duration_seconds: duration,
        records_processed: result.count || 0
      })

    console.log(`✅ ${scraperType} scraper completed in ${duration}s`)
    return result
  } catch (error) {
    console.error(`❌ ${scraperType} scraper failed:`, error)
    
    await supabase
      .from('scraper_logs')
      .insert({
        type: scraperType,
        status: 'failed',
        started_at: startTime.toISOString(),
        completed_at: new Date().toISOString(),
        error: error.message
      })

    throw error
  }
}

// Export functions to run individual scrapers on demand
export {
  scheduleScrapers,
  scrapeFighterStats as runFighterStatsScraper,
  scrapeUfcRoster as runRosterScraper,
  scrapeBettingOdds as runBettingOddsScraper,
  scrapeUpcomingEvents as runEventsScraper
}
