import React from 'react';
import { Fighter } from '../types';

interface FighterStatsModalProps {
  fighter: Fighter;
  isOpen: boolean;
  onClose: () => void;
}

export const FighterStatsModal: React.FC<FighterStatsModalProps> = ({ 
  fighter, 
  isOpen, 
  onClose 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">
            {fighter.first_name} {fighter.last_name}
            {fighter.nickname && (
              <span className="text-lg font-normal text-gray-600 ml-2">
                "{fighter.nickname}"
              </span>
            )}
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Fighter Profile</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Weight Class</p>
                    <p className="text-base font-semibold text-gray-900">{fighter.weight_class}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Record</p>
                    <p className="text-base font-semibold text-gray-900">
                      {fighter.wins}-{fighter.losses}-{fighter.draws}
                    </p>
                  </div>
                  {fighter.height_cm && (
                    <div>
                      <p className="text-sm text-gray-600">Height</p>
                      <p className="text-base font-semibold text-gray-900">{fighter.height_cm} cm</p>
                    </div>
                  )}
                  {fighter.reach_cm && (
                    <div>
                      <p className="text-sm text-gray-600">Reach</p>
                      <p className="text-base font-semibold text-gray-900">{fighter.reach_cm} cm</p>
                    </div>
                  )}
                  {fighter.stance && (
                    <div>
                      <p className="text-sm text-gray-600">Stance</p>
                      <p className="text-base font-semibold text-gray-900">{fighter.stance}</p>
                    </div>
                  )}
                </div>
              </div>

              {fighter.fight_stats && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Striking Stats</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-gray-600">Strikes Per Minute</span>
                        <span className="text-sm font-semibold text-gray-900">
                          {(fighter.fight_stats?.significant_strikes_per_min ?? 0).toFixed(1)}
                        </span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full">
                        <div 
                          className="h-2 bg-primary rounded-full" 
                          style={{ 
                            width: `${Math.min((fighter.fight_stats?.significant_strikes_per_min ?? 0) / 10 * 100, 100)}%` 
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-gray-600">Strike Accuracy</span>
                        <span className="text-sm font-semibold text-gray-900">
                          {((fighter.fight_stats?.significant_strike_accuracy ?? 0) * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full">
                        <div 
                          className="h-2 bg-primary rounded-full" 
                          style={{ 
                            width: `${(fighter.fight_stats?.significant_strike_accuracy ?? 0) * 100}%` 
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-gray-600">Strike Defense</span>
                        <span className="text-sm font-semibold text-gray-900">
                          {((fighter.fight_stats?.significant_strike_defense ?? 0) * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full">
                        <div 
                          className="h-2 bg-primary rounded-full" 
                          style={{ 
                            width: `${(fighter.fight_stats?.significant_strike_defense ?? 0) * 100}%` 
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {fighter.fight_stats && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Grappling Stats</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-gray-600">Takedowns Per 15 Min</span>
                        <span className="text-sm font-semibold text-gray-900">
                          {(fighter.fight_stats?.takedown_avg ?? 0).toFixed(1)}
                        </span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full">
                        <div 
                          className="h-2 bg-primary rounded-full" 
                          style={{ 
                            width: `${Math.min((fighter.fight_stats?.takedown_avg ?? 0) / 5 * 100, 100)}%` 
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-gray-600">Takedown Accuracy</span>
                        <span className="text-sm font-semibold text-gray-900">
                          {((fighter.fight_stats?.takedown_accuracy ?? 0) * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full">
                        <div 
                          className="h-2 bg-primary rounded-full" 
                          style={{ 
                            width: `${(fighter.fight_stats?.takedown_accuracy ?? 0) * 100}%` 
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-gray-600">Takedown Defense</span>
                        <span className="text-sm font-semibold text-gray-900">
                          {((fighter.fight_stats?.takedown_defense ?? 0) * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full">
                        <div 
                          className="h-2 bg-primary rounded-full" 
                          style={{ 
                            width: `${(fighter.fight_stats?.takedown_defense ?? 0) * 100}%` 
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-gray-600">Submissions Per 15 Min</span>
                        <span className="text-sm font-semibold text-gray-900">
                          {(fighter.fight_stats?.submission_avg ?? 0).toFixed(1)}
                        </span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full">
                        <div 
                          className="h-2 bg-primary rounded-full" 
                          style={{ 
                            width: `${Math.min((fighter.fight_stats?.submission_avg ?? 0) / 2 * 100, 100)}%` 
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Defense Stats</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-gray-600">Strikes Absorbed Per Min</span>
                        <span className="text-sm font-semibold text-gray-900">
                          {(fighter.fight_stats?.significant_strikes_absorbed_per_min ?? 0).toFixed(1)}
                        </span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full">
                        <div 
                          className="h-2 bg-red-500 rounded-full" 
                          style={{ 
                            width: `${Math.min((fighter.fight_stats?.significant_strikes_absorbed_per_min ?? 0) / 10 * 100, 100)}%` 
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};