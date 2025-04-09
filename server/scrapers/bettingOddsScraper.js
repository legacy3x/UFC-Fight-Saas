import { createClient } from '@supabase/supabase-js'
import axios from 'axios'
import 'dotenv/config'

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

export async function scrapeBettingOdds() {
  try {
    console.log('Fetching betting odds...')
    const { data } = await axios.get('https://api.the-odds-api.com/v4/sports/mma_mixed_martial_arts/odds', {
      params: {
        apiKey: process.env.ODDS_API_KEY,
        regions: 'us',
        markets: 'h2h',
        oddsFormat: 'decimal'
      }
    })

    const oddsData = data.map(event => ({
      fight_id: event.id,
      fighter1_odds: event.bookmakers[0]?.markets[0]?.outcomes[0]?.price,
      fighter2_odds: event.bookmakers[0]?.markets[0]?.outcomes[1]?.price,
      last_updated: new Date().toISOString(),
      source: 'OddsAPI'
    }))

    const { error } = await supabase
      .from('betting_odds')
      .upsert(oddsData, { onConflict: ['fight_id'] })
    
    if (error) throw error
    console.log(`Updated ${oddsData.length} betting odds records`)
    return { success: true, count: oddsData.length }
  } catch (error) {
    console.error('Odds scraping failed:', error)
    return { success: false, error: error.message }
  }
}
