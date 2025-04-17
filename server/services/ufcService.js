import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

const UFC_API_BASE = 'https://api.sherdog.com/v1';

const convertHeight = (heightStr) => {
  if (!heightStr) return null;
  const [feet, inches] = heightStr.replace('"', '').split('\'').map(Number);
  return Math.round((feet * 12 + inches) * 2.54); // Convert to cm
};

const parseRecord = (wins) => {
  if (!wins) return { total: 0, ko: 0, submissions: 0, decisions: 0 };
  return {
    total: parseInt(wins.total) || 0,
    ko: parseInt(wins['ko/tko']) || 0,
    submissions: parseInt(wins.submissions) || 0,
    decisions: parseInt(wins.decisions) || 0
  };
};

export const updateFighterData = async (fighterName) => {
  try {
    const response = await axios.get(`${UFC_API_BASE}/fighter/${encodeURIComponent(fighterName)}`);
    const data = response.data;

    if (!data) {
      throw new Error('Fighter not found');
    }

    const wins = parseRecord(data.wins);
    const losses = parseRecord(data.losses);

    const fighterData = {
      first_name: data.name.split(' ')[0],
      last_name: data.name.split(' ').slice(1).join(' '),
      nickname: data.nickname || null,
      weight_class: data.weight_class,
      country: data.nationality,
      team: data.association,
      height_cm: convertHeight(data.height),
      stance: data.stance || null,
      wins: wins.total,
      losses: losses.total,
      draws: parseInt(data.draws) || 0,
      no_contests: parseInt(data.no_contests) || 0,
      updated_at: new Date().toISOString()
    };

    // Update or insert fighter data
    const { data: updatedFighter, error } = await supabase
      .from('fighters')
      .upsert(fighterData)
      .select()
      .single();

    if (error) throw error;

    return updatedFighter;
  } catch (error) {
    console.error('Error updating fighter data:', error);
    throw error;
  }
};

export const searchUfcFighter = async (query) => {
  try {
    const response = await axios.get(`${UFC_API_BASE}/search/fighters?q=${encodeURIComponent(query)}`);
    return response.data.results || [];
  } catch (error) {
    console.error('Error searching UFC fighters:', error);
    throw error;
  }
};

export const getEventData = async (eventName) => {
  try {
    const response = await axios.get(`${UFC_API_BASE}/event/${encodeURIComponent(eventName)}`);
    const data = response.data;

    if (!data) {
      throw new Error('Event not found');
    }

    // Process fights data and update fighter records
    const processedFights = await Promise.all(data.fights.map(async (fight) => {
      // Update fighter data for both corners
      const redCornerFighter = await updateFighterData(fight['red corner'].name).catch(() => null);
      const blueCornerFighter = await updateFighterData(fight['blue corner'].name).catch(() => null);

      return {
        weightclass: fight.weightclass,
        round: parseInt(fight.round),
        time: fight.time,
        method: fight.method,
        red_corner: {
          fighter_id: redCornerFighter?.id,
          name: fight['red corner'].name,
          ranking: fight['red corner'].ranking,
          odds: fight['red corner'].odds,
          result: fight['red corner'].result
        },
        blue_corner: {
          fighter_id: blueCornerFighter?.id,
          name: fight['blue corner'].name,
          ranking: fight['blue corner'].ranking,
          odds: fight['blue corner'].odds,
          result: fight['blue corner'].result
        }
      };
    }));

    // Create event data
    const eventData = {
      name: data.name,
      date: new Date(data.date).toISOString(),
      location: data.location,
      venue: data.venue,
      is_pay_per_view: data.name.toLowerCase().includes('ufc'),
      fights: processedFights
    };

    // Update or insert event data
    const { data: updatedEvent, error: eventError } = await supabase
      .from('upcoming_events')
      .upsert({
        name: eventData.name,
        date: eventData.date,
        location: eventData.location,
        is_pay_per_view: eventData.is_pay_per_view
      })
      .select()
      .single();

    if (eventError) throw eventError;

    // Create fight cards
    const fightCards = processedFights.map((fight, index) => ({
      event_id: updatedEvent.id,
      fighter1_id: fight.red_corner.fighter_id,
      fighter2_id: fight.blue_corner.fighter_id,
      card_type: index < 3 ? 'main_card' : index < 8 ? 'prelims' : 'early_prelims',
      bout_order: index + 1
    }));

    const { error: fightCardError } = await supabase
      .from('fight_cards')
      .upsert(fightCards);

    if (fightCardError) throw fightCardError;

    return {
      ...eventData,
      id: updatedEvent.id,
      fight_cards: fightCards
    };
  } catch (error) {
    console.error('Error fetching event data:', error);
    throw error;
  }
};

export const searchEvents = async (query) => {
  try {
    const response = await axios.get(`${UFC_API_BASE}/search/events?q=${encodeURIComponent(query)}`);
    return response.data.results || [];
  } catch (error) {
    console.error('Error searching events:', error);
    throw error;
  }
};