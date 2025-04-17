import { FC, useState, useEffect } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { UpcomingEvent } from '../types';
import './Events.css';

const Events: FC = () => {
  const supabase = useSupabaseClient();
  const [events, setEvents] = useState<UpcomingEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('upcoming');

  useEffect(() => {
    const fetchEvents = async () => {
      setIsLoading(true);
      try {
        let query = supabase
          .from('upcoming_events')
          .select('*')
          .order('date', { ascending: true });

        if (filter === 'upcoming') {
          query = query.gte('date', new Date().toISOString());
        } else if (filter === 'ppv') {
          query = query
            .eq('is_pay_per_view', true)
            .gte('date', new Date().toISOString());
        }

        const { data, error } = await query;
        if (error) throw error;
        setEvents(data || []);
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
  }, [supabase, filter]);

  const formatDate = (date: string) => {
    const eventDate = new Date(date);
    return {
      day: eventDate.getDate(),
      month: eventDate.toLocaleString('default', { month: 'short' }),
      time: eventDate.toLocaleString('default', { 
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })
    };
  };

  return (
    <div className="events-page">
      <div className="events-header">
        <h1>UFC Events</h1>
        <div className="events-filters">
          <button 
            className={filter === 'upcoming' ? 'active' : ''}
            onClick={() => setFilter('upcoming')}
          >
            All Upcoming
          </button>
          <button 
            className={filter === 'ppv' ? 'active' : ''}
            onClick={() => setFilter('ppv')}
          >
            PPV Only
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="loading">Loading events...</div>
      ) : (
        <div className="events-grid">
          {events.length === 0 ? (
            <div className="no-events">
              <p>No upcoming events found</p>
            </div>
          ) : (
            events.map(event => {
              const date = formatDate(event.date);
              return (
                <div key={event.id} className="event-card">
                  <div className="event-date">
                    <span className="month">{date.month}</span>
                    <span className="day">{date.day}</span>
                    <span className="time">{date.time}</span>
                  </div>
                  <div className="event-details">
                    <h2>{event.name}</h2>
                    <p className="location">{event.location}</p>
                    {event.is_pay_per_view && (
                      <span className="ppv-badge">PPV</span>
                    )}
                  </div>
                  <div className="event-actions">
                    <button className="view-predictions">
                      View Predictions
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default Events;