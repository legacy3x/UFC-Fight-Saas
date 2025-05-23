import { FC, useState, useEffect } from 'react'
import { useSupabaseClient } from '@supabase/auth-helpers-react'
import { useNavigate } from 'react-router-dom'
import { Fighter, UpcomingEvent, PredictionLog } from '../types'
import './Home.css'

const Home: FC = () => {
  const supabase = useSupabaseClient()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('events')
  const [fighters, setFighters] = useState<Fighter[]>([])
  const [events, setEvents] = useState<UpcomingEvent[]>([])
  const [predictions, setPredictions] = useState<PredictionLog[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [savedPredictions, setSavedPredictions] = useState<PredictionLog[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        switch (activeTab) {
          case 'predictions':
            const { data: predictionsData } = await supabase
              .from('prediction_logs')
              .select('*')
              .order('created_at', { ascending: false })
              .limit(20)
            setPredictions(predictionsData || [])
            break
          case 'events':
            const { data: eventsData } = await supabase
              .from('upcoming_events')
              .select(`
                *,
                fight_cards (
                  *,
                  fighter1:fighter1_id(*),
                  fighter2:fighter2_id(*)
                )
              `)
              .order('date', { ascending: true })
              .limit(10)
            setEvents(eventsData || [])
            break
          case 'saved':
            const { data: savedData } = await supabase
              .from('user_predictions')
              .select('*')
              .order('created_at', { ascending: false })
            setSavedPredictions(savedData || [])
            break
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [activeTab, supabase])

  useEffect(() => {
    const searchFighters = async () => {
      if (searchTerm.length < 2) {
        setFighters([])
        return
      }

      setIsLoading(true)
      try {
        const { data } = await supabase
          .from('fighters')
          .select('*')
          .or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%`)
          .limit(10)

        setFighters(data || [])
      } catch (error) {
        console.error('Error searching fighters:', error)
      } finally {
        setIsLoading(false)
      }
    }

    const debounceTimer = setTimeout(searchFighters, 300)
    return () => clearTimeout(debounceTimer)
  }, [searchTerm, supabase])

  const savePrediction = async (prediction: PredictionLog) => {
    try {
      const { error } = await supabase
        .from('user_predictions')
        .upsert({
          ...prediction,
          user_id: (await supabase.auth.getUser()).data.user?.id
        })

      if (error) throw error

      setSavedPredictions(prev => [...prev, prediction])
    } catch (error) {
      console.error('Error saving prediction:', error)
    }
  }

  const handleAnalyzeFight = (fighter1Id: number, fighter2Id: number) => {
    navigate('/predictions', { 
      state: { 
        fighter1Id,
        fighter2Id
      }
    })
  }

  return (
    <div className="user-dashboard">
      <div className="dashboard-header">
        <h1>UFC Predictions Dashboard</h1>
        
        <div className="search-container">
          <input
            type="text"
            placeholder="Search fighters..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {isLoading && <div className="search-loading">Searching...</div>}
        </div>
      </div>

      {fighters.length > 0 && (
        <div className="search-results">
          <h3>Fighter Results</h3>
          <div className="fighter-cards">
            {fighters.map(fighter => (
              <div key={fighter.id} className="fighter-card">
                <div className="fighter-info">
                  <h4>{fighter.first_name} {fighter.last_name}</h4>
                  <p>{fighter.weight_class}</p>
                  <p>Record: {fighter.wins}-{fighter.losses}-{fighter.draws}</p>
                </div>
                <button 
                  className="view-button"
                  onClick={() => setActiveTab('predictions')}
                >
                  View Predictions
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="dashboard-tabs">
        <button 
          className={activeTab === 'events' ? 'active' : ''}
          onClick={() => setActiveTab('events')}
        >
          Upcoming Fights
        </button>
        <button 
          className={activeTab === 'predictions' ? 'active' : ''}
          onClick={() => setActiveTab('predictions')}
        >
          Latest Predictions
        </button>
        <button 
          className={activeTab === 'saved' ? 'active' : ''}
          onClick={() => setActiveTab('saved')}
        >
          My Saved Predictions
        </button>
      </div>

      <div className="dashboard-content">
        {isLoading ? (
          <div className="loading-spinner">Loading...</div>
        ) : (
          <>
            {activeTab === 'predictions' && (
              <PredictionsList 
                predictions={predictions} 
                onSave={savePrediction} 
              />
            )}

            {activeTab === 'events' && (
              <EventsList events={events} onAnalyze={handleAnalyzeFight} />
            )}

            {activeTab === 'saved' && (
              <SavedPredictions predictions={savedPredictions} />
            )}
          </>
        )}
      </div>
    </div>
  )
}

const PredictionsList: FC<{ 
  predictions: PredictionLog[],
  onSave: (prediction: PredictionLog) => void
}> = ({ predictions, onSave }) => {
  return (
    <div className="predictions-container">
      <h2>Latest Fight Predictions</h2>
      <div className="predictions-grid">
        {predictions.map(prediction => (
          <div key={prediction.id} className="prediction-card">
            <div className="prediction-header">
              <h3>{prediction.fighter1_name} vs {prediction.fighter2_name}</h3>
              <span className="confidence-badge">
                {Math.round(prediction.confidence * 100)}% Confidence
              </span>
            </div>
            
            <div className="prediction-details">
              <div className="prediction-outcome">
                <span className="predicted-winner">{prediction.predicted_winner}</span>
                <span>by {prediction.predicted_method.replace('_', '/')}</span>
              </div>
              
              <div className="prediction-meta">
                <span>{new Date(prediction.created_at).toLocaleString()}</span>
                <button 
                  onClick={() => onSave(prediction)}
                  className="save-button"
                >
                  Save to Profile
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const EventsList: FC<{ 
  events: UpcomingEvent[],
  onAnalyze: (fighter1Id: number, fighter2Id: number) => void
}> = ({ events, onAnalyze }) => {
  return (
    <div className="events-container">
      {events.map(event => (
        <div key={event.id} className="event-section">
          <div className="event-header">
            <h2>
              {event.name} | {new Date(event.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} | {event.location}
              {event.is_pay_per_view && <span className="ppv-badge">PPV Event</span>}
            </h2>
          </div>
          
          {event.fight_cards && event.fight_cards
            .filter(card => card.card_type === 'main_card')
            .sort((a, b) => a.bout_order - b.bout_order)
            .map(fight => (
              <div key={fight.id} className="fight-row">
                <div className="fighters">
                  <span className="fighter-name">
                    {fight.fighter1?.first_name} {fight.fighter1?.last_name}
                  </span>
                  <span className="vs">VS</span>
                  <span className="fighter-name">
                    {fight.fighter2?.first_name} {fight.fighter2?.last_name}
                  </span>
                </div>
                <button 
                  className="analyze-button"
                  onClick={() => onAnalyze(fight.fighter1_id, fight.fighter2_id)}
                >
                  Analyze Fight
                </button>
              </div>
            ))
          }
        </div>
      ))}
    </div>
  )
}

const SavedPredictions: FC<{ predictions: PredictionLog[] }> = ({ predictions }) => {
  return (
    <div className="saved-container">
      <h2>My Saved Predictions</h2>
      {predictions.length === 0 ? (
        <div className="empty-state">
          <p>You haven't saved any predictions yet.</p>
          <p>Browse the latest predictions and save your favorites!</p>
        </div>
      ) : (
        <div className="saved-grid">
          {predictions.map(prediction => (
            <div key={prediction.id} className="saved-card">
              <div className="saved-header">
                <h3>{prediction.fighter1_name} vs {prediction.fighter2_name}</h3>
                <span className="saved-date">
                  Saved on {new Date(prediction.created_at).toLocaleDateString()}
                </span>
              </div>
              
              <div className="saved-details">
                <div className="saved-outcome">
                  <span className="predicted-winner">{prediction.predicted_winner}</span>
                  <span>by {prediction.predicted_method.replace('_', '/')}</span>
                </div>
                
                <div className="confidence-meter">
                  <div 
                    className="confidence-fill"
                    style={{ width: `${Math.round(prediction.confidence * 100)}%` }}
                  />
                  <span>{Math.round(prediction.confidence * 100)}% Confidence</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Home