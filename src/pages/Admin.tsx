import { FC, useState, useEffect } from 'react'
import RoleGuard from '../components/RoleGuard'
import { useSupabaseClient } from '@supabase/auth-helpers-react'
import { Fighter, UpcomingEvent, PredictionLog } from '../../types'
import './Admin.css'

const Admin: FC = () => {
  const supabase = useSupabaseClient()
  const [activeTab, setActiveTab] = useState('fighters')
  const [fighters, setFighters] = useState<Fighter[]>([])
  const [events, setEvents] = useState<UpcomingEvent[]>([])
  const [logs, setLogs] = useState<PredictionLog[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [notification, setNotification] = useState({ message: '', type: '' })

  // Fetch data based on active tab
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        switch (activeTab) {
          case 'fighters':
            const { data: fightersData } = await supabase
              .from('fighters')
              .select('*')
              .order('last_name', { ascending: true })
            setFighters(fightersData || [])
            break
          case 'events':
            const { data: eventsData } = await supabase
              .from('upcoming_events')
              .select('*')
              .order('date', { ascending: true })
            setEvents(eventsData || [])
            break
          case 'logs':
            const { data: logsData } = await supabase
              .from('prediction_logs')
              .select('*')
              .order('created_at', { ascending: false })
              .limit(50)
            setLogs(logsData || [])
            break
        }
      } catch (error) {
        showNotification('Failed to fetch data', 'error')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [activeTab, supabase])

  const triggerScraper = async (scraperType: string) => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/admin/scrape-${scraperType}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      })
      
      if (!response.ok) throw new Error('Scraper failed')
      
      showNotification(`${scraperType.replace('-', ' ')} scraper started successfully`, 'success')
    } catch (error) {
      showNotification('Failed to trigger scraper', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const showNotification = (message: string, type: string) => {
    setNotification({ message, type })
    setTimeout(() => setNotification({ message: '', type: '' }), 5000)
  }

  const updateFighter = async (fighter: Fighter) => {
    try {
      const { error } = await supabase
        .from('fighters')
        .update(fighter)
        .eq('id', fighter.id)
      
      if (error) throw error
      
      showNotification('Fighter updated successfully', 'success')
      setFighters(fighters.map(f => f.id === fighter.id ? fighter : f))
    } catch (error) {
      showNotification('Failed to update fighter', 'error')
    }
  }

  return (
    <RoleGuard requiredRoles={['admin']}>
      <div className="admin-dashboard">
        <h1>Admin Dashboard</h1>
        
        {notification.message && (
          <div className={`notification ${notification.type}`}>
            {notification.message}
          </div>
        )}

        <div className="admin-tabs">
          <button 
            className={activeTab === 'fighters' ? 'active' : ''}
            onClick={() => setActiveTab('fighters')}
          >
            Fighters
          </button>
          <button 
            className={activeTab === 'events' ? 'active' : ''}
            onClick={() => setActiveTab('events')}
          >
            Upcoming Events
          </button>
          <button 
            className={activeTab === 'logs' ? 'active' : ''}
            onClick={() => setActiveTab('logs')}
          >
            Prediction Logs
          </button>
          <button 
            className={activeTab === 'tools' ? 'active' : ''}
            onClick={() => setActiveTab('tools')}
          >
            System Tools
          </button>
        </div>

        <div className="admin-content">
          {isLoading ? (
            <div className="loading-spinner">Loading...</div>
          ) : (
            <>
              {activeTab === 'fighters' && (
                <FightersTable 
                  fighters={fighters} 
                  onUpdate={updateFighter} 
                />
              )}

              {activeTab === 'events' && (
                <EventsTable events={events} />
              )}

              {activeTab === 'logs' && (
                <PredictionLogs logs={logs} />
              )}

              {activeTab === 'tools' && (
                <SystemTools 
                  onScrape={triggerScraper} 
                  isLoading={isLoading}
                />
              )}
            </>
          )}
        </div>
      </div>
    </RoleGuard>
  )
}

// Component for fighters table
const FightersTable: FC<{ fighters: Fighter[], onUpdate: (fighter: Fighter) => void }> = ({ fighters, onUpdate }) => {
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState<Partial<Fighter>>({})

  const handleEdit = (fighter: Fighter) => {
    setEditingId(fighter.id)
    setEditForm({ ...fighter })
  }

  const handleSave = (id: number) => {
    onUpdate(editForm as Fighter)
    setEditingId(null)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setEditForm(prev => ({ ...prev, [name]: value }))
  }

  return (
    <div className="table-container">
      <h2>Fighters Management</h2>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Weight Class</th>
            <th>Record</th>
            <th>Team</th>
            <th>Country</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {fighters.map(fighter => (
            <tr key={fighter.id}>
              <td>
                {editingId === fighter.id ? (
                  <input 
                    name="first_name" 
                    value={editForm.first_name || ''} 
                    onChange={handleChange}
                  />
                ) : (
                  `${fighter.first_name} ${fighter.last_name}`
                )}
              </td>
              <td>
                {editingId === fighter.id ? (
                  <select 
                    name="weight_class" 
                    value={editForm.weight_class || ''} 
                    onChange={handleChange}
                  >
                    <option value="Strawweight">Strawweight</option>
                    <option value="Flyweight">Flyweight</option>
                    {/* Other weight classes */}
                  </select>
                ) : (
                  fighter.weight_class
                )}
              </td>
              <td>
                {editingId === fighter.id ? (
                  <div className="record-edit">
                    <input 
                      name="wins" 
                      type="number" 
                      value={editForm.wins || 0} 
                      onChange={handleChange}
                    />
                    -
                    <input 
                      name="losses" 
                      type="number" 
                      value={editForm.losses || 0} 
                      onChange={handleChange}
                    />
                    -
                    <input 
                      name="draws" 
                      type="number" 
                      value={editForm.draws || 0} 
                      onChange={handleChange}
                    />
                  </div>
                ) : (
                  `${fighter.wins}-${fighter.losses}-${fighter.draws}`
                )}
              </td>
              <td>
                {editingId === fighter.id ? (
                  <input 
                    name="team" 
                    value={editForm.team || ''} 
                    onChange={handleChange}
                  />
                ) : (
                  fighter.team || '-'
                )}
              </td>
              <td>
                {editingId === fighter.id ? (
                  <input 
                    name="country" 
                    value={editForm.country || ''} 
                    onChange={handleChange}
                  />
                ) : (
                  fighter.country
                )}
              </td>
              <td>
                {editingId === fighter.id ? (
                  <button onClick={() => handleSave(fighter.id)}>Save</button>
                ) : (
                  <button onClick={() => handleEdit(fighter)}>Edit</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// Component for events table
const EventsTable: FC<{ events: UpcomingEvent[] }> = ({ events }) => {
  return (
    <div className="table-container">
      <h2>Upcoming Events</h2>
      <table>
        <thead>
          <tr>
            <th>Event Name</th>
            <th>Date</th>
            <th>Location</th>
            <th>PPV</th>
            <th>Main Event</th>
          </tr>
        </thead>
        <tbody>
          {events.map(event => (
            <tr key={event.id}>
              <td>{event.name}</td>
              <td>{new Date(event.date).toLocaleDateString()}</td>
              <td>{event.location}</td>
              <td>{event.is_pay_per_view ? 'Yes' : 'No'}</td>
              <td>{event.main_event_fight_id ? 'Set' : 'Not Set'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// Component for prediction logs
const PredictionLogs: FC<{ logs: PredictionLog[] }> = ({ logs }) => {
  return (
    <div className="table-container">
      <h2>Recent Predictions</h2>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Fighters</th>
            <th>Prediction</th>
            <th>Confidence</th>
            <th>Method</th>
          </tr>
        </thead>
        <tbody>
          {logs.map(log => (
            <tr key={log.id}>
              <td>{new Date(log.created_at).toLocaleString()}</td>
              <td>
                {log.fighter1_name} vs {log.fighter2_name}
              </td>
              <td>{log.predicted_winner}</td>
              <td>{Math.round(log.confidence * 100)}%</td>
              <td>{log.predicted_method.replace('_', '/')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// Component for system tools
const SystemTools: FC<{ 
  onScrape: (type: string) => void,
  isLoading: boolean
}> = ({ onScrape, isLoading }) => {
  return (
    <div className="system-tools">
      <h2>System Tools</h2>
      
      <div className="scraper-controls">
        <h3>Data Scrapers</h3>
        <div className="scraper-buttons">
          <button 
            onClick={() => onScrape('fighters')}
            disabled={isLoading}
          >
            Update Fighters
          </button>
          <button 
            onClick={() => onScrape('roster')}
            disabled={isLoading}
          >
            Update Roster
          </button>
          <button 
            onClick={() => onScrape('odds')}
            disabled={isLoading}
          >
            Update Betting Odds
          </button>
          <button 
            onClick={() => onScrape('events')}
            disabled={isLoading}
          >
            Update Events
          </button>
        </div>
      </div>

      <div className="system-stats">
        <h3>System Statistics</h3>
        <div className="stats-grid">
          <div className="stat-card">
            <h4>Total Fighters</h4>
            <p>Loading...</p>
          </div>
          <div className="stat-card">
            <h4>Upcoming Events</h4>
            <p>Loading...</p>
          </div>
          <div className="stat-card">
            <h4>Predictions Made</h4>
            <p>Loading...</p>
          </div>
          <div className="stat-card">
            <h4>System Health</h4>
            <p className="status-good">Good</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Admin
