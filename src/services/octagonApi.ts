import axios from 'axios';

export interface Fighter {
  id: string;
  name: string;
  nickname?: string;
  weightClass: string;
  record: {
    wins: number;
    losses: number;
    draws: number;
    noContests: number;
  };
  stats: {
    height: string;
    weight: string;
    reach: string;
    stance: string;
  };
}

export interface Ranking {
  weightClass: string;
  champion: Fighter;
  contenders: Fighter[];
}

// API client instance
const apiClient = axios.create({
  headers: {
    'Content-Type': 'application/json',
  },
});

// Error handler
const handleError = (error: any) => {
  console.error('API Error:', error);
  throw error?.response?.data || error;
};

// API methods
export const OctagonAPI = {
  // Fetch all rankings across weight classes
  getRankings: async (): Promise<Ranking[]> => {
    try {
      const { data } = await apiClient.get('/api/rankings');
      return data;
    } catch (error) {
      return handleError(error);
    }
  },

  // Fetch all fighters
  getFighters: async (): Promise<Fighter[]> => {
    try {
      const { data } = await apiClient.get('/api/fighters');
      return Array.isArray(data) ? data : [];
    } catch (error) {
      return handleError(error);
    }
  },

  // Fetch specific fighter by ID
  getFighter: async (fighterId: string): Promise<Fighter> => {
    try {
      const { data } = await apiClient.get(`/api/fighters/${fighterId}`);
      return data;
    } catch (error) {
      return handleError(error);
    }
  },

  // Search fighters by name
  searchFighters: async (query: string): Promise<Fighter[]> => {
    try {
      const { data } = await apiClient.get(`/api/fighters/search?query=${encodeURIComponent(query)}`);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      return handleError(error);
    }
  }
};