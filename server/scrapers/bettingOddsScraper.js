import { createClient } from '@supabase/supabase-js'
import axios from 'axios'
import 'dotenv/config'

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY)

export async function scrapeBettingOdds() {
  try {
    console.log('Fetching betting odds...')
    
    if (!process.env.ODDS_API_KEY) {
      throw new Error('ODDS_API_KEY is not configured')
    }

    const response = await axios.get('https://api.the-odds-api.com/v4/sports/mma_mixed_martial_arts/odds', {
      params: {
        apiKey: process.env.ODDS_API_KEY,
        regions: 'us',
        markets: 'h2h',
        oddsFormat: 'decimal'
      },
      validateStatus: (status) => status === 200
    })

    if (!response.data || !Array.isArray(response.data)) {
      throw new Error('Invalid response from Odds API')
    }

    console.log(`Retrieved ${response.data.length} odds entries`)

    const oddsData = response.data.map(event => {
      if (!event.bookmakers || !event.bookmakers[0]?.markets?.[0]?.outcomes) {
        console.warn(`Skipping event ${event.id} due to missing odds data`)
        return null
      }

      return {
        fight_id: event.id,
        fighter1_odds: event.bookmakers[0].markets[0].outcomes[0]?.price,
        fighter2_odds: event.bookmakers[0].markets[0].outcomes[1]?.price,
        last_updated: new Date().toISOString(),
        source: 'OddsAPI'
      }
    }).filter(Boolean)

    if (oddsData.length === 0) {
      throw new Error('No valid odds data found')
    }

    const { error } = await supabase
      .from('betting_odds')
      .upsert(oddsData, { 
        onConflict: ['fight_id'],
        ignoreDuplicates: false
      })
    
    if (error) throw error

    console.log(`Successfully updated ${oddsData.length} betting odds records`)
    return { 
      success: true, 
      count: oddsData.length,
      message: `Updated ${oddsData.length} betting odds records`
    }
  } catch (error) {
    console.error('Odds scraping failed:', error.message)
    return { 
      success: false, 
      error: error.message,
      details: error.response?.data || 'No additional error details'
    }
  }
}
