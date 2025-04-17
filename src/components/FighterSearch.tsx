import React, { useState, useEffect } from 'react';
import { useOctagonApi } from '../hooks/useOctagonApi';
import { Fighter } from '../services/octagonApi';

interface FighterSearchProps {
  onSelect: (fighter: Fighter) => void;
}

export const FighterSearch: React.FC<FighterSearchProps> = ({ onSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<Fighter[]>([]);
  const { searchFighters, isLoading, error } = useOctagonApi();

  useEffect(() => {
    const searchTimeout = setTimeout(async () => {
      if (searchTerm.length >= 2) {
        try {
          const fighters = await searchFighters(searchTerm);
          setResults(fighters);
        } catch (err) {
          console.error('Search error:', err);
        }
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [searchTerm, searchFighters]);

  return (
    <div className="fighter-search">
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search fighters..."
        className="w-full p-2 border rounded"
      />
      
      {isLoading && <div className="text-gray-500">Searching...</div>}
      
      {error && <div className="text-red-500">Error: {error.message}</div>}
      
      {results.length > 0 && (
        <div className="mt-2 border rounded max-h-60 overflow-y-auto">
          {results.map((fighter) => (
            <div
              key={fighter.id}
              onClick={() => onSelect(fighter)}
              className="p-2 hover:bg-gray-100 cursor-pointer"
            >
              <div className="font-medium">{fighter.name}</div>
              {fighter.nickname && (
                <div className="text-sm text-gray-500">"{fighter.nickname}"</div>
              )}
              <div className="text-sm text-gray-600">
                {fighter.weightClass} • {fighter.record.wins}-{fighter.record.losses}
                {fighter.record.draws > 0 ? `-${fighter.record.draws}` : ''}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};