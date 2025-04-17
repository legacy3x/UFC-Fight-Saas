import { createClient } from '@supabase/supabase-js'
import axios from 'axios'
import cheerio from 'cheerio'
import 'dotenv/config'

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY)

export async function scrapeFighterStats() {
  try {
    console.log('Starting fighter stats scrape...')
    const { data } = await axios.get('https://www.ufcstats.com/statistics/fighters')
    const $ = cheerio.load(data)
    
    const fighters = []
    $('tbody tr').each((i, row) => {
      const cols = $(row).find('td')
      if (cols.length > 0) {
        fighters.push({
          first_name: $(cols[0]).text().trim(),
          last_name: $(cols[1]).text().trim(),
          nickname: $(cols[2]).text().trim(),
          wins: parseInt($(cols[3]).text().trim()),
          losses: parseInt($(cols[4]).text().trim()),
          draws: parseInt($(cols[5]).text().trim()),
          weight_class: $(cols[6]).text().trim(),
          strikes_landed: parseInt($(cols[7]).text().trim()),
          strikes_attempted: parseInt($(cols[8]).text().trim()),
          takedown_accuracy: parseFloat($(cols[9]).text().trim())
        })
      }
    })

    // Upsert to Supabase
    const { error } = await supabase
      .from('fighters')
      .upsert(fighters, { onConflict: ['first_name', 'last_name'] })
    
    if (error) throw error
    console.log(`Updated ${fighters.length} fighter records`)
    return { success: true, count: fighters.length }
  } catch (error) {
    console.error('Scraping failed:', error)
    return { success: false, error: error.message }
  }
}