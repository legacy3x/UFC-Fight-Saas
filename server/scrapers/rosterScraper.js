import { createClient } from '@supabase/supabase-js'
import axios from 'axios'
import cheerio from 'cheerio'
import 'dotenv/config'

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

export async function scrapeUfcRoster() {
  try {
    console.log('Starting roster scrape...')
    const { data } = await axios.get('https://www.ufc.com/athletes/all')
    const $ = cheerio.load(data)
    
    const fighters = []
    $('.l-flex__item').each((i, el) => {
      const name = $(el).find('.c-athlete__name').text().trim()
      const [first_name, last_name] = name.split(' ').map(s => s.trim())
      const weight_class = $(el).find('.c-athlete__title').text().trim()
      
      fighters.push({
        first_name,
        last_name,
        weight_class,
        active: true
      })
    })

    // Deactivate all fighters first
    await supabase
      .from('fighters')
      .update({ active: false })
      .neq('id', 0)

    // Upsert current roster
    const { error } = await supabase
      .from('fighters')
      .upsert(fighters, { onConflict: ['first_name', 'last_name'] })
    
    if (error) throw error
    console.log(`Updated ${fighters.length} roster entries`)
    return { success: true, count: fighters.length }
  } catch (error) {
    console.error('Roster scrape failed:', error)
    return { success: false, error: error.message }
  }
}
