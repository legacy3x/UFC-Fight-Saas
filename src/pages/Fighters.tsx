import { FC, useState, useEffect } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { Fighter } from '../types';
import './Fighters.css';

const WEIGHT_CLASSES = [
  'Heavyweight',
  'Light Heavyweight',
  'Middleweight',
  'Welterweight',
  'Lightweight',
  'Featherweight',
  'Bantamweight',
  'Flyweight',
  'Women\'s Featherweight',
  'Women\'s Bantamweight',
  'Women\'s Flyweight',
  'Women\'s Strawweight'
];

const Fighters: FC = () => {
  const [fighters, setFighters] = useState<Fighter[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDivision, setSelectedDivision] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchFighters = async () => {
      try {
        const response = await fetch('/api/fighters');
        if (!response.ok) {
          throw new Error('Failed to fetch fighters');
        }
        const data = await response.json();
        setFighters(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('An error occurred'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchFighters();
  }, []);

  useEffect(() => {
    const searchFighters = async () => {
      if (searchTerm.length < 2) return;

      try {
        const response = await fetch(`/api/fighters/search?query=${encodeURIComponent(searchTerm)}`);
        if (!response.ok) {
          throw new Error('Failed to search fighters');
        }
        const data = await response.json();
        setFighters(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('An error occurred'));
      }
    };

    const debounceTimer = setTimeout(searchFighters, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  const groupedFighters = fighters.reduce((acc, fighter) => {
    if (!acc[fighter.weight_class]) {
      acc[fighter.weight_class] = [];
    }
    acc[fighter.weight_class].push(fighter);
    return acc;
  }, {} as Record<string, Fighter[]>);

  if (isLoading) {
    return <div className="loading">Loading fighters...</div>;
  }

  if (error) {
    return <div className="error-message">{error.message}</div>;
  }

  return (
    <div className="fighters-page">
      <div className="fighters-header">
        <h1>UFC Fighters</h1>
        <div className="filters">
          <input
            type="text"
            placeholder="Search fighters..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <select
            value={selectedDivision}
            onChange={(e) => setSelectedDivision(e.target.value)}
            className="division-select"
          >
            <option value="all">All Divisions</option>
            {WEIGHT_CLASSES.map(division => (
              <option key={division} value={division}>
                {division}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="divisions-grid">
        {WEIGHT_CLASSES.map(weightClass => {
          const divisionFighters = groupedFighters[weightClass] || [];
          if (selectedDivision !== 'all' && selectedDivision !== weightClass) {
            return null;
          }
          if (divisionFighters.length === 0 && selectedDivision === 'all') {
            return null;
          }

          return (
            <div key={weightClass} className="division-section">
              <h2 className="division-title">{weightClass}</h2>
              <div className="fighters-grid">
                {divisionFighters.map(fighter => (
                  <div key={fighter.id} className="fighter-card">
                    <div className="fighter-info">
                      <h3>{fighter.first_name} {fighter.last_name}</h3>
                      {fighter.nickname && (
                        <p className="nickname">"{fighter.nickname}"</p>
                      )}
                      <p className="record">{fighter.wins}-{fighter.losses}-{fighter.draws}</p>
                      <div className="fighter-details">
                        <span>{fighter.height_cm ? `${Math.round(fighter.height_cm / 2.54)}"` : 'N/A'}</span>
                        <span>{fighter.weight_class}</span>
                        {fighter.stance && <span>{fighter.stance}</span>}
                      </div>
                    </div>
                    <div className="fighter-stats">
                      <div className="stat">
                        <span>Height</span>
                        <span>{fighter.height_cm ? `${Math.round(fighter.height_cm / 2.54)}"` : 'N/A'}</span>
                      </div>
                      <div className="stat">
                        <span>Reach</span>
                        <span>{fighter.reach_cm ? `${Math.round(fighter.reach_cm / 2.54)}"` : 'N/A'}</span>
                      </div>
                      {fighter.stance && (
                        <div className="stat">
                          <span>Stance</span>
                          <span>{fighter.stance}</span>
                        </div>
                      )}
                    </div>
                    <button className="view-profile">
                      View Profile
                    </button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Fighters;