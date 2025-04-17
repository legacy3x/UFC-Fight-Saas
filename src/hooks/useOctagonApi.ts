import { useState, useCallback } from 'react';
import { OctagonAPI, Fighter, Ranking } from '../services/octagonApi';

export const useOctagonApi = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const getRankings = useCallback(async (): Promise<Ranking[]> => {
    setIsLoading(true);
    setError(null);
    try {
      const rankings = await OctagonAPI.getRankings();
      return rankings;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getFighters = useCallback(async (): Promise<Fighter[]> => {
    setIsLoading(true);
    setError(null);
    try {
      const fighters = await OctagonAPI.getFighters();
      return fighters;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getFighter = useCallback(async (fighterId: string): Promise<Fighter> => {
    setIsLoading(true);
    setError(null);
    try {
      const fighter = await OctagonAPI.getFighter(fighterId);
      return fighter;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const searchFighters = useCallback(async (query: string): Promise<Fighter[]> => {
    setIsLoading(true);
    setError(null);
    try {
      const fighters = await OctagonAPI.searchFighters(query);
      return fighters;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    getRankings,
    getFighters,
    getFighter,
    searchFighters,
    isLoading,
    error
  };
};