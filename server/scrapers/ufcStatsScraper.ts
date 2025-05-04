import { UFCStatsScraper } from './UFCStatsScraper';
import cron from 'node-cron';
import 'dotenv/config';

async function main() {
  console.log('Starting UFC stats scraper...');
  console.log('Supabase URL:', process.env.VITE_SUPABASE_URL ? 'configured' : 'missing');
  console.log('Supabase Key:', process.env.VITE_SUPABASE_ANON_KEY ? 'configured' : 'missing');
  
  const scraper = new UFCStatsScraper();
  const isAutoMode = process.argv.includes('--auto');
  
  if (isAutoMode) {
    console.log('Running in automatic mode with cron schedule');
    
    // Run scraper every 6 hours
    cron.schedule('0 */6 * * *', async () => {
      try {
        console.log('Running scheduled scrape:', new Date().toISOString());
        const result = await scraper.updateFighterDatabase();
        console.log('Scheduled scraping completed:', result);
      } catch (error) {
        console.error('Error in scheduled scrape:', error);
      }
    });

    // Run initial scrape
    try {
      console.log('Running initial scrape');
      const result = await scraper.updateFighterDatabase();
      console.log('Initial scraping completed:', result);
    } catch (error) {
      console.error('Error in initial scrape:', error);
    }
  } else {
    try {
      const result = await scraper.updateFighterDatabase();
      console.log('One-time scraping completed:', result);
      process.exit(0);
    } catch (error) {
      console.error('Error running scraper:', error);
      process.exit(1);
    }
  }
}

main();