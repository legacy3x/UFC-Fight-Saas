import axios from 'axios';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';
import { Fighter, FightStats, FightHistory } from '../types';
import { delay } from '../utils';
import 'dotenv/config';

if (!process.env.VITE_SUPABASE_URL || !process.env.VITE_SUPABASE_ANON_KEY) {
  throw new Error('Missing required environment variables');
}

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

interface UFCStatsResponse {
  success: boolean;
  message?: string;
  data?: any;
}

interface CircuitBreakerState {
  failures: number;
  lastFailure: number;
  isOpen: boolean;
}

interface RequestQueue {
  pending: number;
  maxConcurrent: number;
}

export class UFCStatsScraper {
  private baseUrl = 'http://ufcstats.com/statistics/fighters';
  private detailBaseUrl = 'http://ufcstats.com/fighter-details';
  private maxRetries = 8;
  private initialDelay = 3000;
  private maxDelay = 60000;
  private circuitBreaker: CircuitBreakerState = {
    failures: 0,
    lastFailure: 0,
    isOpen: false
  };
  private failureThreshold = 5;
  private resetTimeout = 3600000;
  private requestQueue: RequestQueue = {
    pending: 0,
    maxConcurrent: 2
  };

  private async waitForQueue(): Promise<void> {
    while (this.requestQueue.pending >= this.requestQueue.maxConcurrent) {
      await delay(1000);
    }
    this.requestQueue.pending++;
  }

  private releaseQueue(): void {
    this.requestQueue.pending = Math.max(0, this.requestQueue.pending - 1);
  }

  private shouldRetry(error: any, retryCount: number): boolean {
    if (retryCount >= this.maxRetries) return false;
    if (this.circuitBreaker.isOpen) return false;
    if (!error.response || error.code === 'ECONNABORTED') return true;

    const status = error.response.status;

    switch (status) {
      case 429:
        return true;
      case 500:
      case 502:
      case 503:
      case 504:
        return true;
      default:
        return status >= 500 && status < 600;
    }
  }

  private updateCircuitBreaker(error: any) {
    const now = Date.now();
    
    if (now - this.circuitBreaker.lastFailure > this.resetTimeout) {
      this.circuitBreaker.failures = 0;
      this.circuitBreaker.isOpen = false;
    }
    
    this.circuitBreaker.failures++;
    this.circuitBreaker.lastFailure = now;

    if (this.circuitBreaker.failures >= this.failureThreshold) {
      console.log(`Circuit breaker opened after ${this.circuitBreaker.failures} failures`);
      this.circuitBreaker.isOpen = true;
      
      setTimeout(() => {
        console.log('Resetting circuit breaker');
        this.circuitBreaker = {
          failures: 0,
          lastFailure: 0,
          isOpen: false
        };
      }, this.resetTimeout);
    }
  }

  private calculateDelay(retryCount: number, status?: number): number {
    let delayTime = this.initialDelay * Math.pow(2, retryCount);
    const jitter = delayTime * 0.3 * (Math.random() * 2 - 1);
    delayTime += jitter;
    
    if (status === 429) delayTime *= 2;
    if (status >= 500) delayTime *= 1.5;
    
    return Math.min(delayTime, this.maxDelay);
  }

  private async fetchPage(url: string, retryCount = 0): Promise<string> {
    try {
      if (this.circuitBreaker.isOpen) {
        throw new Error('Circuit breaker is open, requests are blocked');
      }

      await this.waitForQueue();

      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
          'Cache-Control': 'max-age=0'
        },
        timeout: 45000,
        validateStatus: (status) => status === 200
      });

      this.releaseQueue();

      if (this.circuitBreaker.failures > 0) {
        this.circuitBreaker.failures = Math.max(0, this.circuitBreaker.failures - 1);
      }

      return response.data;
    } catch (error: any) {
      this.releaseQueue();
      
      console.error(`Error fetching ${url} (Attempt ${retryCount + 1}/${this.maxRetries}):`, 
        error.response?.status || error.message);
      
      this.updateCircuitBreaker(error);

      if (this.shouldRetry(error, retryCount)) {
        const status = error.response?.status;
        const delayTime = this.calculateDelay(retryCount, status);
        
        console.log(`Retrying in ${Math.round(delayTime/1000)}s... (Attempt ${retryCount + 1} of ${this.maxRetries})`);
        await delay(delayTime);
        return this.fetchPage(url, retryCount + 1);
      }

      throw error;
    }
  }

  private async getFighterLinks(): Promise<string[]> {
    const links: string[] = [];
    let currentPage = 1;
    let hasNextPage = true;
    let consecutiveErrors = 0;
    const maxConsecutiveErrors = 3;

    while (hasNextPage && !this.circuitBreaker.isOpen) {
      const url = `${this.baseUrl}/search?char=&page=${currentPage}`;
      console.log(`Fetching page ${currentPage}...`);
      
      try {
        const html = await this.fetchPage(url);
        const $ = cheerio.load(html);

        const newLinks = $('td.b-statistics__table-col a')
          .map((_, element) => $(element).attr('href'))
          .get()
          .filter(link => link && link.includes('/fighter-details/'));

        if (newLinks.length === 0) {
          console.log('No fighter links found on page, might be at the end');
          hasNextPage = false;
        } else {
          links.push(...newLinks);
          hasNextPage = $('.b-statistics__pagination-item_next:not(.b-statistics__pagination-item_disabled)').length > 0;
          currentPage++;
          consecutiveErrors = 0;
        }

        await delay(this.initialDelay);
      } catch (error) {
        console.error(`Error on page ${currentPage}:`, error);
        consecutiveErrors++;

        if (consecutiveErrors >= maxConsecutiveErrors) {
          console.error(`Stopping after ${maxConsecutiveErrors} consecutive errors`);
          hasNextPage = false;
        } else {
          await delay(this.calculateDelay(consecutiveErrors));
        }
      }
    }

    return [...new Set(links)];
  }

  private parseStats($: cheerio.Root): any {
    const stats = {
      strikes_per_min: parseFloat($('.b-list__box-list-item:contains("Strikes Landed per Min.") .b-list__box-list-text').text().trim()) || 0,
      strike_accuracy: parseFloat($('.b-list__box-list-item:contains("Striking Accuracy") .b-list__box-list-text').text().replace('%', '').trim()) / 100 || 0,
      strikes_absorbed_per_min: parseFloat($('.b-list__box-list-item:contains("Strikes Absorbed per Min.") .b-list__box-list-text').text().trim()) || 0,
      strike_defense: parseFloat($('.b-list__box-list-item:contains("Strike Defence") .b-list__box-list-text').text().replace('%', '').trim()) / 100 || 0,
      takedown_avg: parseFloat($('.b-list__box-list-item:contains("Takedowns Average/15 min.") .b-list__box-list-text').text().trim()) || 0,
      takedown_accuracy: parseFloat($('.b-list__box-list-item:contains("Takedown Accuracy") .b-list__box-list-text').text().replace('%', '').trim()) / 100 || 0,
      takedown_defense: parseFloat($('.b-list__box-list-item:contains("Takedown Defense") .b-list__box-list-text').text().replace('%', '').trim()) / 100 || 0,
      submission_avg: parseFloat($('.b-list__box-list-item:contains("Submission Average/15 min.") .b-list__box-list-text').text().trim()) || 0
    };

    return stats;
  }

  private parseFightHistory($: cheerio.Root): FightHistory[] {
    const fights: FightHistory[] = [];

    $('.b-fight-details__table-body tr').each((_, row) => {
      const $row = $(row);
      const result = $row.find('.b-fight-details__table-col:nth-child(1)').text().trim();
      const opponent = $row.find('.b-fight-details__table-col:nth-child(2)').text().trim();
      const event = $row.find('.b-fight-details__table-col:nth-child(3)').text().trim();
      const method = $row.find('.b-fight-details__table-col:nth-child(4)').text().trim();
      const round = parseInt($row.find('.b-fight-details__table-col:nth-child(5)').text().trim());
      const time = $row.find('.b-fight-details__table-col:nth-child(6)').text().trim();

      fights.push({
        result,
        opponent,
        event,
        method,
        round,
        time,
        date: new Date()
      });
    });

    return fights;
  }

  private async scrapeFighterDetails(url: string): Promise<any> {
    console.log(`Scraping fighter details from ${url}`);
    const html = await this.fetchPage(url);
    const $ = cheerio.load(html);

    const name = $('.b-content__title-highlight').text().trim();
    const [firstName, ...lastNameParts] = name.split(' ');
    const lastName = lastNameParts.join(' ');

    const record = $('.b-content__title-record').text().trim();
    const [wins, losses, draws] = record.match(/\d+/g)?.map(Number) || [0, 0, 0];

    const details = {
      first_name: firstName,
      last_name: lastName,
      nickname: $('.b-content__Nickname').text().trim() || null,
      height_cm: parseInt($('.b-list__box-list-item:contains("Height:") .b-list__box-list-text').text().trim()) || null,
      weight_class: $('.b-list__box-list-item:contains("Weight class:") .b-list__box-list-text').text().trim(),
      reach_cm: parseInt($('.b-list__box-list-item:contains("Reach:") .b-list__box-list-text').text().trim()) || null,
      stance: $('.b-list__box-list-item:contains("Stance:") .b-list__box-list-text').text().trim() || null,
      wins,
      losses,
      draws,
      stats: this.parseStats($),
      fight_history: this.parseFightHistory($)
    };

    return details;
  }

  public async updateFighterDatabase(): Promise<UFCStatsResponse> {
    try {
      console.log('Starting fighter database update...');
      console.log('Fetching fighter links...');
      
      const fighterLinks = await this.getFighterLinks();
      console.log(`Found ${fighterLinks.length} fighters to process`);

      let successCount = 0;
      let errorCount = 0;
      let processedCount = 0;

      for (const link of fighterLinks) {
        try {
          if (this.circuitBreaker.isOpen) {
            console.log('Circuit breaker is open, pausing processing...');
            break;
          }

          const fighterDetails = await this.scrapeFighterDetails(link);
          console.log(`Processing ${fighterDetails.first_name} ${fighterDetails.last_name}...`);
          
          const { data: fighter, error: fighterError } = await supabase
            .from('fighters')
            .upsert({
              first_name: fighterDetails.first_name,
              last_name: fighterDetails.last_name,
              nickname: fighterDetails.nickname,
              height_cm: fighterDetails.height_cm,
              reach_cm: fighterDetails.reach_cm,
              stance: fighterDetails.stance,
              wins: fighterDetails.wins,
              losses: fighterDetails.losses,
              draws: fighterDetails.draws,
              weight_class: fighterDetails.weight_class,
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'first_name,last_name'
            })
            .select()
            .single();

          if (fighterError) throw fighterError;

          if (fighter) {
            const { error: statsError } = await supabase
              .from('fight_stats')
              .upsert({
                fighter_id: fighter.id,
                significant_strikes_per_min: fighterDetails.stats.strikes_per_min,
                significant_strike_accuracy: fighterDetails.stats.strike_accuracy,
                significant_strikes_absorbed_per_min: fighterDetails.stats.strikes_absorbed_per_min,
                significant_strike_defense: fighterDetails.stats.strike_defense,
                takedown_avg: fighterDetails.stats.takedown_avg,
                takedown_accuracy: fighterDetails.stats.takedown_accuracy,
                takedown_defense: fighterDetails.stats.takedown_defense,
                submission_avg: fighterDetails.stats.submission_avg,
                updated_at: new Date().toISOString()
              }, {
                onConflict: 'fighter_id'
              });

            if (statsError) throw statsError;
          }

          successCount++;
          processedCount++;
          
          if (processedCount % 10 === 0) {
            console.log(`Progress: ${processedCount}/${fighterLinks.length} fighters processed`);
          }
          
          await delay(this.initialDelay);
        } catch (error) {
          console.error(`Error processing fighter ${link}:`, error);
          errorCount++;
          processedCount++;
          
          if (this.circuitBreaker.isOpen) {
            console.log('Circuit breaker is open, pausing fighter processing');
            break;
          }
          
          continue;
        }
      }

      const completionStatus = this.circuitBreaker.isOpen ? ' (stopped early due to circuit breaker)' : '';
      return {
        success: true,
        message: `Processed ${processedCount}/${fighterLinks.length} fighters. ${successCount} successful, ${errorCount} errors${completionStatus}`
      };
    } catch (error) {
      console.error('Error updating fighter database:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}