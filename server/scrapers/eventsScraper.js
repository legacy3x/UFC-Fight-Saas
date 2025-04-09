import { createClient } from '@supabase/supabase-js'
import axios from 'axios'
import cheerio from 'cheerio'
import 'dotenv/config'

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

export async function scrapeUpcomingEvents() {
  try {
    console.log('Scraping upcoming events...')
    const { data } = await axios.get('https://www.ufc.com/events')
    const $ = cheerio.load(data)
    
    const events = []
    $('.l-listing__item').each((i, el) => {
      const name = $(el).find('.c-card-event--result__headline').text().trim()
      const date = $(el).find('.c-card-event--result__date').text().trim()
      const location = $(el).find('.c-card-event--result__location').text().trim()
      
      events.push({
        name,
        date: new Date(date).toISOString(),
        location,
        is_pay_per_view: name.toLowerCase().includes('ppv')
      })
    })

    const { error } = await supabase
      .from('upcoming_events')
      .upsert(events, { onConflict: ['name', 'date'] })
    
    if (error) throw error
    console.log(`Updated ${events.length} event records`)
    return { success: true, count: events.length }
  } catch (error) {
    console.error('Event scraping failed:', error)
    return { success: false, error: error.message }
  }
}
