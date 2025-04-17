import React from 'react';
import { Ranking } from '../services/octagonApi';

interface RankingsListProps {
  rankings: Ranking[];
}

export const RankingsList: React.FC<RankingsListProps> = ({ rankings }) => {
  return (
    <div className="space-y-6">
      {rankings.map((ranking) => (
        <div key={ranking.weightClass} className="bg-white rounded-lg shadow p-4">
          <h3 className="text-xl font-bold mb-4">{ranking.weightClass}</h3>
          
          <div className="mb-4 p-4 bg-gradient-to-r from-yellow-100 to-yellow-200 rounded">
            <div className="font-bold text-lg mb-1">Champion</div>
            <div className="flex justify-between items-center">
              <div>
                <div className="font-medium">{ranking.champion.name}</div>
                {ranking.champion.nickname && (
                  <div className="text-sm text-gray-600">"{ranking.champion.nickname}"</div>
                )}
              </div>
              <div className="text-sm">
                {ranking.champion.record.wins}-{ranking.champion.record.losses}
                {ranking.champion.record.draws > 0 ? `-${ranking.champion.record.draws}` : ''}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            {ranking.contenders.map((fighter, index) => (
              <div key={fighter.id} className="p-3 hover:bg-gray-50 rounded">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <span className="font-bold mr-4 text-gray-500">#{index + 1}</span>
                    <div>
                      <div className="font-medium">{fighter.name}</div>
                      {fighter.nickname && (
                        <div className="text-sm text-gray-600">"{fighter.nickname}"</div>
                      )}
                    </div>
                  </div>
                  <div className="text-sm">
                    {fighter.record.wins}-{fighter.record.losses}
                    {fighter.record.draws > 0 ? `-${fighter.record.draws}` : ''}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};