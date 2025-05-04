import React, { useState } from 'react';
import { Fighter } from '../types';
import { FighterStatsModal } from './FighterStatsModal';

interface FighterCardProps {
  fighter: Fighter;
  showStats?: boolean;
}

export const FighterCard: React.FC<FighterCardProps> = ({ fighter, showStats = true }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
        <div 
          className="p-4 border-b border-gray-200 cursor-pointer"
          onClick={() => setIsModalOpen(true)}
        >
          <h3 className="text-xl font-bold text-gray-900 hover:text-primary transition-colors">
            {fighter.first_name} {fighter.last_name}
            {fighter.nickname && (
              <span className="text-sm font-normal text-gray-600 ml-2">
                "{fighter.nickname}"
              </span>
            )}
          </h3>
          <p className="text-gray-600">{fighter.weight_class}</p>
        </div>

        <div className="p-4">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-sm text-gray-600">Record</p>
              <p className="text-lg font-semibold text-gray-900">
                {fighter.wins}-{fighter.losses}-{fighter.draws}
              </p>
            </div>
            {fighter.stance && (
              <div>
                <p className="text-sm text-gray-600">Stance</p>
                <p className="text-lg font-semibold text-gray-900">{fighter.stance}</p>
              </div>
            )}
          </div>

          {showStats && fighter.fight_stats && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-semibold text-gray-900">Quick Stats</h4>
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="text-sm text-primary hover:text-primary-dark transition-colors"
                >
                  View Details
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Strikes/Min</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {fighter.fight_stats.significant_strikes_per_min?.toFixed(1) ?? 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Strike Acc.</p>
                  <div className="flex items-center">
                    <div className="w-full h-2 bg-gray-200 rounded-full mr-2">
                      <div 
                        className="h-2 bg-primary rounded-full" 
                        style={{ 
                          width: `${(fighter.fight_stats.significant_strike_accuracy ?? 0) * 100}%` 
                        }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-gray-900">
                      {((fighter.fight_stats.significant_strike_accuracy ?? 0) * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <FighterStatsModal 
        fighter={fighter}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};