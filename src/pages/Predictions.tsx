import { FC, useState, useEffect } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { useLocation } from 'react-router-dom';
import { Fighter, PredictionLog } from '../types';
import './Predictions.css';

const Predictions: FC = () => {
  const supabase = useSupabaseClient();
  const location = useLocation();
  const [selectedFighter1, setSelectedFighter1] = useState<Fighter | null>(null);
  const [selectedFighter2, setSelectedFighter2] = useState<Fighter | null>(null);
  const [searchTerm1, setSearchTerm1] = useState('');
  const [searchTerm2, setSearchTerm2] = useState('');
  const [searchResults1, setSearchResults1] = useState<Fighter[]>([]);
  const [searchResults2, setSearchResults2] = useState<Fighter[]>([]);
  const [recommendations, setRecommendations] = useState<Fighter[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [prediction, setPrediction] = useState<PredictionLog | null>(null);

  // Load fighters from state if provided
  useEffect(() => {
    const loadFighters = async () => {
      const { fighter1Id, fighter2Id } = location.state || {};
      
      if (fighter1Id && fighter2Id) {
        try {
          const [{ data: fighter1 }, { data: fighter2 }] = await Promise.all([
            supabase.from('fighters').select('*').eq('id', fighter1Id).single(),
            supabase.from('fighters').select('*').eq('id', fighter2Id).single()
          ]);

          if (fighter1) {
            setSelectedFighter1(fighter1);
            setSearchTerm1(`${fighter1.first_name} ${fighter1.last_name}`);
          }
          
          if (fighter2) {
            setSelectedFighter2(fighter2);
            setSearchTerm2(`${fighter2.first_name} ${fighter2.last_name}`);
          }
        } catch (error) {
          console.error('Error loading fighters:', error);
        }
      }
    };

    loadFighters();
  }, [location.state, supabase]);

  // Load recommendations when a fighter is selected
  useEffect(() => {
    const loadRecommendations = async () => {
      if (!selectedFighter1 && !selectedFighter2) {
        setRecommendations([]);
        return;
      }

      const selectedFighter = selectedFighter1 || selectedFighter2;
      const otherFighter = selectedFighter1 ? selectedFighter2 : selectedFighter1;

      if (!selectedFighter || otherFighter) {
        setRecommendations([]);
        return;
      }

      try {
        const { data } = await supabase
          .from('fighters')
          .select('*')
          .eq('weight_class', selectedFighter.weight_class)
          .neq('id', selectedFighter.id)
          .order('wins', { ascending: false })
          .limit(5);

        setRecommendations(data || []);
      } catch (error) {
        console.error('Error loading recommendations:', error);
      }
    };

    loadRecommendations();
  }, [selectedFighter1, selectedFighter2, supabase]);

  // Search fighters in database
  const searchFighters = async (searchTerm: string, isFirstFighter: boolean) => {
    if (searchTerm.length < 2) {
      if (isFirstFighter) setSearchResults1([]);
      else setSearchResults2([]);
      return;
    }

    try {
      const { data } = await supabase
        .from('fighters')
        .select('*')
        .or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%`)
        .order('last_name')
        .limit(10);

      if (isFirstFighter) {
        setSearchResults1(data || []);
      } else {
        setSearchResults2(data || []);
      }
    } catch (error) {
      console.error('Error searching fighters:', error);
    }
  };

  // Debounced search for Fighter 1
  useEffect(() => {
    const timer = setTimeout(() => {
      searchFighters(searchTerm1, true);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm1]);

  // Debounced search for Fighter 2
  useEffect(() => {
    const timer = setTimeout(() => {
      searchFighters(searchTerm2, false);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm2]);

  const handleFighterSelect = (fighter: Fighter, position: 'fighter1' | 'fighter2') => {
    if (position === 'fighter1') {
      setSelectedFighter1(fighter);
      setSearchTerm1(`${fighter.first_name} ${fighter.last_name}`);
      setSearchResults1([]);
    } else {
      setSelectedFighter2(fighter);
      setSearchTerm2(`${fighter.first_name} ${fighter.last_name}`);
      setSearchResults2([]);
    }
  };

  const getPrediction = async () => {
    if (!selectedFighter1 || !selectedFighter2) return;

    setIsLoading(true);
    try {
      const { data } = await supabase
        .rpc('predict_fight', {
          fighter1_id: selectedFighter1.id,
          fighter2_id: selectedFighter2.id
        });

      setPrediction(data);
    } catch (error) {
      console.error('Error getting prediction:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const savePrediction = async () => {
    if (!prediction) return;

    try {
      await supabase
        .from('user_predictions')
        .insert({
          ...prediction,
          user_id: (await supabase.auth.getUser()).data.user?.id
        });

      alert('Prediction saved successfully!');
    } catch (error) {
      console.error('Error saving prediction:', error);
      alert('Failed to save prediction');
    }
  };

  return (
    <div className="predictions-page">
      <div className="predictions-header">
        <h1>Fight Predictions</h1>
        <p>Select two fighters to get a prediction for their matchup</p>
      </div>

      <div className="fighter-selection">
        <div className="fighter-picker">
          <h3>Fighter 1</h3>
          {selectedFighter1 ? (
            <div className="selected-fighter">
              <h4>{selectedFighter1.first_name} {selectedFighter1.last_name}</h4>
              <p>{selectedFighter1.weight_class}</p>
              <p>Record: {selectedFighter1.wins}-{selectedFighter1.losses}-{selectedFighter1.draws}</p>
              <button onClick={() => {
                setSelectedFighter1(null);
                setSearchTerm1('');
              }}>Change Fighter</button>
            </div>
          ) : (
            <div className="fighter-search">
              {selectedFighter2 && !searchTerm1 && recommendations.length > 0 && (
                <div className="fighter-recommendations">
                  <h4>Recommended Opponents</h4>
                  {recommendations.map(fighter => (
                    <div
                      key={fighter.id}
                      className="recommendation-item"
                      onClick={() => handleFighterSelect(fighter, 'fighter1')}
                    >
                      <div className="recommendation-info">
                        <span className="recommendation-name">
                          {fighter.first_name} {fighter.last_name}
                        </span>
                        <span className="recommendation-record">
                          {fighter.wins}-{fighter.losses}-{fighter.draws}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <input
                type="text"
                placeholder="Search fighters..."
                value={searchTerm1}
                onChange={(e) => setSearchTerm1(e.target.value)}
                autoComplete="off"
              />
              {searchResults1.length > 0 && (
                <div className="search-results">
                  {searchResults1.map(fighter => (
                    <div
                      key={fighter.id}
                      className="fighter-result"
                      onClick={() => handleFighterSelect(fighter, 'fighter1')}
                    >
                      <span>{fighter.first_name} {fighter.last_name}</span>
                      <span>{fighter.weight_class}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="vs-badge">VS</div>

        <div className="fighter-picker">
          <h3>Fighter 2</h3>
          {selectedFighter2 ? (
            <div className="selected-fighter">
              <h4>{selectedFighter2.first_name} {selectedFighter2.last_name}</h4>
              <p>{selectedFighter2.weight_class}</p>
              <p>Record: {selectedFighter2.wins}-{selectedFighter2.losses}-{selectedFighter2.draws}</p>
              <button onClick={() => {
                setSelectedFighter2(null);
                setSearchTerm2('');
              }}>Change Fighter</button>
            </div>
          ) : (
            <div className="fighter-search">
              {selectedFighter1 && !searchTerm2 && recommendations.length > 0 && (
                <div className="fighter-recommendations">
                  <h4>Recommended Opponents</h4>
                  {recommendations.map(fighter => (
                    <div
                      key={fighter.id}
                      className="recommendation-item"
                      onClick={() => handleFighterSelect(fighter, 'fighter2')}
                    >
                      <div className="recommendation-info">
                        <span className="recommendation-name">
                          {fighter.first_name} {fighter.last_name}
                        </span>
                        <span className="recommendation-record">
                          {fighter.wins}-{fighter.losses}-{fighter.draws}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <input
                type="text"
                placeholder="Search fighters..."
                value={searchTerm2}
                onChange={(e) => setSearchTerm2(e.target.value)}
                autoComplete="off"
              />
              {searchResults2.length > 0 && (
                <div className="search-results">
                  {searchResults2.map(fighter => (
                    <div
                      key={fighter.id}
                      className="fighter-result"
                      onClick={() => handleFighterSelect(fighter, 'fighter2')}
                    >
                      <span>{fighter.first_name} {fighter.last_name}</span>
                      <span>{fighter.weight_class}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {selectedFighter1 && selectedFighter2 && (
        <div className="prediction-actions">
          <button
            onClick={getPrediction}
            disabled={isLoading}
            className="predict-button"
          >
            {isLoading ? 'Getting Prediction...' : 'Get Prediction'}
          </button>
        </div>
      )}

      {prediction && (
        <div className="prediction-result">
          <h2>Fight Prediction</h2>
          <div className="prediction-card">
            <div className="prediction-header">
              <h3>{prediction.fighter1_name} vs {prediction.fighter2_name}</h3>
              <span className="confidence-badge">
                {Math.round(prediction.confidence * 100)}% Confidence
              </span>
            </div>
            <div className="prediction-details">
              <p>
                Predicted Winner: <span className="winner">{prediction.predicted_winner}</span>
              </p>
              <p>
                Method: <span className="method">{prediction.predicted_method.replace('_', '/')}</span>
              </p>
              <button onClick={savePrediction} className="save-button">
                Save Prediction
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Predictions;