import { FC, useState, useEffect } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { format, parse, setHours, setMinutes } from 'date-fns';
import { Fighter, UpcomingEvent, PredictionLog } from '../types';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import './Admin.css';

const Admin: FC = () => {
  const supabase = useSupabaseClient();
  const [activeTab, setActiveTab] = useState('tools');
  const [fighters, setFighters] = useState<Fighter[]>([]);
  const [events, setEvents] = useState<UpcomingEvent[]>([]);
  const [logs, setLogs] = useState<PredictionLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState({ message: '', type: '' });

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        switch (activeTab) {
          case 'fighters':
            const { data: fightersData } = await supabase
              .from('fighters')
              .select('*')
              .order('last_name', { ascending: true });
            setFighters(fightersData || []);
            break;
          case 'events':
            const { data: eventsData } = await supabase
              .from('upcoming_events')
              .select('*')
              .order('date', { ascending: true });
            setEvents(eventsData || []);
            break;
          case 'logs':
            const { data: logsData } = await supabase
              .from('prediction_logs')
              .select('*')
              .order('created_at', { ascending: false })
              .limit(50);
            setLogs(logsData || []);
            break;
        }
      } catch (error) {
        showNotification('Failed to fetch data', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [activeTab, supabase]);

  const showNotification = (message: string, type: string) => {
    setNotification({ message, type });
    setTimeout(() => setNotification({ message: '', type: '' }), 5000);
  };

  return (
    <div className="admin-dashboard">
      {notification.message && (
        <div className={`notification ${notification.type}`}>
          {notification.message}
        </div>
      )}

      {activeTab === 'tools' && (
        <h2 className="text-2xl font-bold text-white mt-5 mb-5 ml-6">System Tools</h2>
      )}

      <div className="admin-content">
        {isLoading ? (
          <div className="loading-spinner">Loading...</div>
        ) : (
          <>
            {activeTab === 'fighters' && (
              <FightersTable fighters={fighters} />
            )}

            {activeTab === 'events' && (
              <EventsTable events={events} />
            )}

            {activeTab === 'logs' && (
              <PredictionLogs logs={logs} />
            )}

            {activeTab === 'tools' && (
              <SystemTools />
            )}
          </>
        )}
      </div>
    </div>
  );
};

const FightersTable: FC<{ fighters: Fighter[] }> = ({ fighters }) => {
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
          </tr>
        </thead>
        <tbody>
          {fighters.map(fighter => (
            <tr key={fighter.id}>
              <td>{`${fighter.first_name} ${fighter.last_name}`}</td>
              <td>{fighter.weight_class}</td>
              <td>{`${fighter.wins}-${fighter.losses}-${fighter.draws}`}</td>
              <td>{fighter.team || '-'}</td>
              <td>{fighter.country}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

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
          </tr>
        </thead>
        <tbody>
          {events.map(event => (
            <tr key={event.id}>
              <td>{event.name}</td>
              <td>{new Date(event.date).toLocaleDateString()}</td>
              <td>{event.location}</td>
              <td>{event.is_pay_per_view ? 'Yes' : 'No'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

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
              <td>{log.fighter1_name} vs {log.fighter2_name}</td>
              <td>{log.predicted_winner}</td>
              <td>{Math.round(log.confidence * 100)}%</td>
              <td>{log.predicted_method.replace('_', '/')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const SystemTools: FC = () => {
  const supabase = useSupabaseClient();
  const [schedules, setSchedules] = useState({
    fighters: new Date(),
    roster: new Date(),
    events: new Date(),
    odds: new Date()
  });
  const [times, setTimes] = useState({
    fighters: '00:00',
    roster: '00:00',
    events: '00:00',
    odds: '00:00'
  });
  const [progress, setProgress] = useState({
    fighters: 0,
    roster: 0,
    events: 0,
    odds: 0
  });
  const [isRunning, setIsRunning] = useState({
    fighters: false,
    roster: false,
    events: false,
    odds: false
  });

  const timeOptions = Array.from({ length: 24 * 4 }, (_, i) => {
    const hours = Math.floor(i / 4);
    const minutes = (i % 4) * 15;
    return format(setMinutes(setHours(new Date(), hours), minutes), 'HH:mm');
  });

  useEffect(() => {
    const loadSchedules = async () => {
      const { data } = await supabase
        .from('scraper_schedules')
        .select('type, cron_expression');

      if (data) {
        const scheduleMap = data.reduce((acc, curr) => {
          if (curr.cron_expression) {
            const [minute, hour, , , ] = curr.cron_expression.split(' ');
            const time = `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`;
            acc[curr.type] = {
              date: new Date(),
              time
            };
          }
          return acc;
        }, {});
        
        Object.entries(scheduleMap).forEach(([type, value]) => {
          setSchedules(prev => ({ ...prev, [type]: value.date }));
          setTimes(prev => ({ ...prev, [type]: value.time }));
        });
      }
    };

    loadSchedules();
  }, [supabase]);

  const handleDateChange = (type: string, date: Date) => {
    setSchedules(prev => ({ ...prev, [type]: date }));
  };

  const handleTimeChange = (type: string, time: string) => {
    setTimes(prev => ({ ...prev, [type]: time }));
  };

  const saveSchedule = async (type: string) => {
    try {
      const date = schedules[type];
      const [hours, minutes] = times[type].split(':');
      const cronExpression = `${minutes} ${hours} * * *`;

      const { error } = await supabase
        .from('scraper_schedules')
        .upsert({
          type,
          cron_expression: cronExpression,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      
      alert(`Schedule saved for ${type}`);
    } catch (error) {
      console.error('Error saving schedule:', error);
      alert('Failed to save schedule');
    }
  };

  const runScraper = async (type: string) => {
    try {
      setIsRunning(prev => ({ ...prev, [type]: true }));
      setProgress(prev => ({ ...prev, [type]: 0 }));

      const response = await fetch(`/api/admin/scrape/${type}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      });

      if (!response.ok) throw new Error('Scraper failed');

      const progressInterval = setInterval(async () => {
        const { data } = await supabase
          .from('scraper_logs')
          .select('status, records_processed')
          .eq('type', type)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (data) {
          const progress = data.status === 'completed' ? 100 : 
            data.records_processed ? Math.min((data.records_processed / 100) * 100, 99) : 0;
          
          setProgress(prev => ({ ...prev, [type]: progress }));

          if (data.status === 'completed') {
            clearInterval(progressInterval);
            setIsRunning(prev => ({ ...prev, [type]: false }));
          }
        }
      }, 1000);

    } catch (error) {
      console.error('Error running scraper:', error);
      alert('Failed to run scraper');
      setIsRunning(prev => ({ ...prev, [type]: false }));
    }
  };

  return (
    <div className="system-tools">
      <div className="scraper-controls bg-white rounded-lg shadow-md p-6 mb-6">
        <h3 className="text-xl font-semibold mb-4 text-black">Data Scrapers</h3>
        
        <div className="grid gap-6">
          {['fighters', 'roster', 'events', 'odds'].map(type => (
            <div key={type} className="scraper-item">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-black">
                  {type.charAt(0).toUpperCase() + type.slice(1)} Data
                </h4>
                <button 
                  onClick={() => runScraper(type)}
                  disabled={isRunning[type]}
                  className="bg-primary text-white px-4 py-2 rounded hover:bg-red-600 disabled:bg-gray-400"
                >
                  {isRunning[type] ? 'Running...' : 'Scrape Now'}
                </button>
              </div>
              
              <div className="date-time-picker">
                <DatePicker
                  selected={schedules[type]}
                  onChange={(date) => handleDateChange(type, date as Date)}
                  dateFormat="MM/dd/yyyy"
                  className="text-black"
                />
                
                <select
                  value={times[type]}
                  onChange={(e) => handleTimeChange(type, e.target.value)}
                  className="time-select"
                >
                  {timeOptions.map(time => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>

                <button 
                  onClick={() => saveSchedule(type)}
                  className="bg-secondary text-white px-4 py-2 rounded hover:bg-gray-800"
                >
                  Save Schedule
                </button>
              </div>

              {isRunning[type] && (
                <div className="progress-bar">
                  <div 
                    className="progress-fill bg-primary"
                    style={{ width: `${progress[type]}%` }}
                  />
                  <span className="progress-text text-black">
                    {Math.round(progress[type])}%
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="help-section bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-semibold mb-4 text-black">Schedule Help</h3>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <h4 className="font-semibold mb-2 text-black">Tips</h4>
            <ul className="space-y-2 text-black">
              <li>• Select a date and time for each scraper to run automatically</li>
              <li>• Times are in 24-hour format</li>
              <li>• Scrapers will run daily at the selected time</li>
              <li>• You can also run scrapers manually using the "Scrape Now" button</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;
