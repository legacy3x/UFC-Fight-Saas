import express from 'express'
import { scheduleScrapers } from './scrapers/runAllScrapers.js'
import 'dotenv/config'

const app = express()
const PORT = process.env.PORT || 3001

app.use(express.json())

// Initialize scrapers scheduling
scheduleScrapers()

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy' })
})

// Individual scraper endpoints
app.post('/api/admin/scrape/:type', async (req, res) => {
  if (process.env.NODE_ENV === 'production' && !req.headers['x-admin-secret']) {
    return res.status(403).json({ error: 'Unauthorized' })
  }

  const { type } = req.params
  const scraperMap = {
    fighters: 'runFighterStatsScraper',
    roster: 'runRosterScraper',
    odds: 'runBettingOddsScraper',
    events: 'runEventsScraper'
  }

  const scraperFunction = scraperMap[type]
  if (!scraperFunction) {
    return res.status(400).json({ error: 'Invalid scraper type' })
  }

  try {
    const { [scraperFunction]: runScraper } = await import('./scrapers/runAllScrapers.js')
    const result = await runScraper()
    
    if (!result.success) {
      return res.status(500).json({ 
        error: result.error,
        details: result.details
      })
    }
    
    res.json({ 
      success: true, 
      result: {
        message: result.message,
        count: result.count
      }
    })
  } catch (error) {
    console.error(`Error running ${type} scraper:`, error)
    res.status(500).json({ 
      error: error.message,
      details: error.stack
    })
  }
})

// Manual trigger endpoint (protected in production)
app.post('/trigger-scrapers', async (req, res) => {
  if (process.env.NODE_ENV === 'production' && !req.headers['x-admin-secret']) {
    return res.status(403).json({ error: 'Unauthorized' })
  }

  try {
    const { runFighterStatsScraper, runRosterScraper, runBettingOddsScraper, runEventsScraper } = await import('./scrapers/runAllScrapers.js')
    
    const results = await Promise.allSettled([
      runFighterStatsScraper(),
      runRosterScraper(),
      runBettingOddsScraper(),
      runEventsScraper()
    ])

    res.json({
      success: true,
      results: results.map(r => r.status === 'fulfilled' ? r.value : r.reason)
    })
  } catch (error) {
    console.error('Error running scrapers:', error)
    res.status(500).json({ error: error.message })
  }
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
  console.log('Scraper automation system initialized')
})
