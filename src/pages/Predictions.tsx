import { FC, useState, useEffect } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { Fighter, UpcomingEvent, PredictionLog } from '../types';
import './Predictions.css';

const Predictions: FC = () => {
  const supabase = useSupabaseClient();
  const [upcomingEvents, setUpcomingEvents] = useState<UpcomingEvent[]>([]);
  const [fighters, setFighters] = useState<Fighter[]>([]);
  const [selectedFighter1, setSelectedFighter1] = useState<Fighter | null>(null);
  const [selectedFighter2, setSelectedFighter2] = useState<Fighter | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [prediction, setPrediction] = useState<PredictionLog | null>(null);

  useEffect(() => {
    const fetchUpcomingEvents = async () => {
      try {
        const { data } = await supabase
          .from('upcoming_events')
          .select('*')
          .order('date', { ascending: true })
          .limit(5);
        
        setUpcomingEvents(data || []);
      } catch (error) {
        console.error('Error fetching events:', error);
      }
    };

    fetchUpcomingEvents();
  }, [supabase]);

  useEffect(() => {
    const searchFighters = async () => {
      if (searchTerm.length < 2) {
        setFighters([]);
        return;
      }

      try {
        const { data } = await supabase
          .from('fighters')
          .select('*')
          .or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%`)
          .limit(10);

        setFighters(data || []);
      } catch (error) {
        console.error('Error searching fighters:', error);
      }
    };

    const debounceTimer = setTimeout(searchFighters, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm, supabase]);

  const handleFighterSelect = (fighter: Fighter, position: 'fighter1' | 'fighter2') => {
    if (position === 'fighter1') {
      setSelectedFighter1(fighter);
    } else {
      setSelectedFighter2(fighter);
    }
    setSearchTerm('');
    setFighters([]);
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
              <button onClick={() => setSelectedFighter1(null)}>Change Fighter</button>
            </div>
          ) : (
            <div className="fighter-search">
              <input
                type="text"
                placeholder="Search fighters..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {fighters.length > 0 && (
                <div className="search-results">
                  {fighters.map(fighter => (
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
              <button onClick={() => setSelectedFighter2(null)}>Change Fighter</button>
            </div>
          ) : (
            <div className="fighter-search">
              <input
                type="text"
                placeholder="Search fighters..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {fighters.length > 0 && (
                <div className="search-results">
                  {fighters.map(fighter => (
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

      <div className="upcoming-events">
        <h2>Upcoming Events</h2>
        <div className="events-grid">
          {upcomingEvents.map(event => (
            <div key={event.id} className="event-card">
              <div className="event-date">
                {new Date(event.date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric'
                })}
              </div>
              <div className="event-details">
                <h3>{event.name}</h3>
                <p>{event.location}</p>
                {event.is_pay_per_view && <span className="ppv-badge">PPV</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Predictions;
