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
  const supabase = useSupabaseClient();
  const [fighters, setFighters] = useState<Record<string, Fighter[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDivision, setSelectedDivision] = useState<string>('all');

  useEffect(() => {
    const fetchFighters = async () => {
      setIsLoading(true);
      try {
        let query = supabase
          .from('fighters')
          .select('*')
          .order('last_name');

        if (searchTerm) {
          query = query.or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%`);
        }

        if (selectedDivision !== 'all') {
          query = query.eq('weight_class', selectedDivision);
        }

        const { data, error } = await query;
        
        if (error) throw error;

        // Group fighters by weight class
        const groupedFighters = (data || []).reduce((acc, fighter) => {
          const weightClass = fighter.weight_class;
          if (!acc[weightClass]) {
            acc[weightClass] = [];
          }
          acc[weightClass].push(fighter);
          return acc;
        }, {} as Record<string, Fighter[]>);

        setFighters(groupedFighters);
      } catch (error) {
        console.error('Error fetching fighters:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFighters();
  }, [supabase, searchTerm, selectedDivision]);

  const getRecord = (fighter: Fighter) => {
    return `${fighter.wins}-${fighter.losses}${fighter.draws ? `-${fighter.draws}` : ''}`;
  };

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

      {isLoading ? (
        <div className="loading">Loading fighters...</div>
      ) : (
        <div className="divisions-grid">
          {WEIGHT_CLASSES.map(weightClass => {
            const divisionFighters = fighters[weightClass] || [];
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
                        <p className="record">Record: {getRecord(fighter)}</p>
                        <div className="fighter-details">
                          <span>{fighter.country}</span>
                          {fighter.team && <span>{fighter.team}</span>}
                        </div>
                      </div>
                      <div className="fighter-stats">
                        {fighter.height_cm && (
                          <div className="stat">
                            <span>Height</span>
                            <span>{Math.round(fighter.height_cm / 2.54)}"</span>
                          </div>
                        )}
                        {fighter.reach_cm && (
                          <div className="stat">
                            <span>Reach</span>
                            <span>{Math.round(fighter.reach_cm / 2.54)}"</span>
                          </div>
                        )}
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
      )}
    </div>
  );
};

export default Fighters;
