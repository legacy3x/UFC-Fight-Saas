import { FC, useState, useEffect } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { Fighter } from '../types';
import { FighterCard } from '../components/FighterCard';
import './AdminFighters.css';

const AdminFighters: FC = () => {
  const supabase = useSupabaseClient();
  const [fighters, setFighters] = useState<Fighter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDivision, setSelectedDivision] = useState<string>('all');
  const [selectedGender, setSelectedGender] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const WEIGHT_CLASSES = {
    male: [
      'Heavyweight',
      'Light Heavyweight',
      'Middleweight',
      'Welterweight',
      'Lightweight',
      'Featherweight',
      'Bantamweight',
      'Flyweight'
    ],
    female: [
      "Women's Featherweight",
      "Women's Bantamweight",
      "Women's Flyweight",
      "Women's Strawweight"
    ]
  };

  useEffect(() => {
    fetchFighters();
  }, [supabase, searchTerm, selectedDivision, selectedGender]);

  const fetchFighters = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('fighters')
        .select(`
          *,
          fight_stats (*)
        `);

      if (searchTerm) {
        query = query.or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%`);
      }

      if (selectedDivision !== 'all') {
        query = query.eq('weight_class', selectedDivision);
      }

      if (selectedGender !== 'all') {
        if (selectedGender === 'male') {
          query = query.not('weight_class', 'ilike', 'Women%');
        } else {
          query = query.ilike('weight_class', 'Women%');
        }
      }

      const { data, error: fetchError } = await query;
      
      if (fetchError) throw fetchError;
      setFighters(data || []);
    } catch (error) {
      console.error('Error fetching fighters:', error);
      setError('Failed to load fighters');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="admin-fighters">
      <div className="admin-fighters-header">
        <h1>Fighter Management</h1>
        <div className="filters">
          <select
            value={selectedGender}
            onChange={(e) => setSelectedGender(e.target.value)}
            className="gender-select"
          >
            <option value="all">All Genders</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>

          <select
            value={selectedDivision}
            onChange={(e) => setSelectedDivision(e.target.value)}
            className="division-select"
          >
            <option value="all">All Divisions</option>
            {selectedGender === 'all' ? (
              <>
                {WEIGHT_CLASSES.male.map(division => (
                  <option key={division} value={division}>{division}</option>
                ))}
                {WEIGHT_CLASSES.female.map(division => (
                  <option key={division} value={division}>{division}</option>
                ))}
              </>
            ) : selectedGender === 'male' ? (
              WEIGHT_CLASSES.male.map(division => (
                <option key={division} value={division}>{division}</option>
              ))
            ) : (
              WEIGHT_CLASSES.female.map(division => (
                <option key={division} value={division}>{division}</option>
              ))
            )}
          </select>

          <input
            type="text"
            placeholder="Search fighters..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      {isLoading ? (
        <div className="loading">Loading fighters...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
          {fighters.map(fighter => (
            <FighterCard key={fighter.id} fighter={fighter} showStats={true} />
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminFighters;