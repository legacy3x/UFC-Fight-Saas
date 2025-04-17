import { FC, useState, useEffect } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { UpcomingEvent, Fighter, FightCard } from '../types';
import './AdminEvents.css';

const CARD_TYPES = ['main_card', 'prelims', 'early_prelims'] as const;

const AdminEvents: FC = () => {
  const supabase = useSupabaseClient();
  const [events, setEvents] = useState<UpcomingEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<UpcomingEvent | null>(null);
  const [formData, setFormData] = useState<Partial<UpcomingEvent>>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Fight card state
  const [searchTerm1, setSearchTerm1] = useState('');
  const [searchTerm2, setSearchTerm2] = useState('');
  const [searchResults1, setSearchResults1] = useState<Fighter[]>([]);
  const [searchResults2, setSearchResults2] = useState<Fighter[]>([]);
  const [selectedFighter1, setSelectedFighter1] = useState<Fighter | null>(null);
  const [selectedFighter2, setSelectedFighter2] = useState<Fighter | null>(null);
  const [selectedCardType, setSelectedCardType] = useState<typeof CARD_TYPES[number]>('main_card');
  const [fightCards, setFightCards] = useState<FightCard[]>([]);
  const [fighters, setFighters] = useState<Fighter[]>([]);

  useEffect(() => {
    fetchEvents();
    fetchFighters();
  }, [supabase]);

  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('upcoming_events')
        .select('*')
        .order('date', { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
      setError('Failed to load events');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFighters = async () => {
    try {
      const { data, error } = await supabase
        .from('fighters')
        .select('*')
        .order('last_name');

      if (error) throw error;
      setFighters(data || []);
    } catch (error) {
      console.error('Error fetching fighters:', error);
    }
  };

  const fetchFightCard = async (eventId: number) => {
    try {
      const { data, error } = await supabase
        .from('fight_cards')
        .select(`
          *,
          fighter1:fighter1_id(*),
          fighter2:fighter2_id(*)
        `)
        .eq('event_id', eventId)
        .order('bout_order');

      if (error) throw error;
      setFightCards(data || []);
    } catch (error) {
      console.error('Error fetching fight card:', error);
    }
  };

  const searchFighters = async (term: string, isFirstFighter: boolean) => {
    if (term.length < 2) {
      if (isFirstFighter) {
        setSearchResults1([]);
      } else {
        setSearchResults2([]);
      }
      return;
    }

    const filtered = fighters.filter(fighter => 
      `${fighter.first_name} ${fighter.last_name}`.toLowerCase().includes(term.toLowerCase())
    );

    if (isFirstFighter) {
      setSearchResults1(filtered);
    } else {
      setSearchResults2(filtered);
    }
  };

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      searchFighters(searchTerm1, true);
    }, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm1]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      searchFighters(searchTerm2, false);
    }, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm2]);

  const handleAddFight = () => {
    if (!selectedFighter1 || !selectedFighter2) {
      setError('Please select both fighters');
      return;
    }

    const newFightCard: Partial<FightCard> = {
      fighter1_id: selectedFighter1.id,
      fighter2_id: selectedFighter2.id,
      card_type: selectedCardType,
      bout_order: fightCards.filter(fc => fc.card_type === selectedCardType).length + 1
    };

    setFightCards([...fightCards, { ...newFightCard, id: Date.now(), fighter1: selectedFighter1, fighter2: selectedFighter2 } as FightCard]);
    setSelectedFighter1(null);
    setSelectedFighter2(null);
    setSearchTerm1('');
    setSearchTerm2('');
  };

  const handleRemoveFight = (fightId: number) => {
    setFightCards(fightCards.filter(fight => fight.id !== fightId));
  };

  const handleAdd = () => {
    setSelectedEvent(null);
    setFormData({
      date: new Date().toISOString(),
      is_pay_per_view: false
    });
    setFightCards([]);
    setIsEditing(true);
  };

  const handleEdit = (event: UpcomingEvent) => {
    setSelectedEvent(event);
    setFormData({
      name: event.name,
      location: event.location,
      date: event.date,
      is_pay_per_view: event.is_pay_per_view
    });
    fetchFightCard(event.id);
    setIsEditing(true);
  };

  const handleDelete = async (event: UpcomingEvent) => {
    if (!window.confirm(`Are you sure you want to delete ${event.name}?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('upcoming_events')
        .delete()
        .eq('id', event.id);

      if (error) {
        console.error('Delete error:', error);
        setError('Failed to delete event. Please ensure you have admin permissions.');
        return;
      }

      setSuccess('Event deleted successfully');
      fetchEvents();
    } catch (error) {
      console.error('Error deleting event:', error);
      setError('Failed to delete event');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      let eventId: number;

      if (selectedEvent) {
        // Update existing event
        const updateData = {
          name: formData.name,
          location: formData.location,
          date: formData.date,
          is_pay_per_view: formData.is_pay_per_view
        };

        const { error, data } = await supabase
          .from('upcoming_events')
          .update(updateData)
          .eq('id', selectedEvent.id)
          .select()
          .single();

        if (error) {
          console.error('Update error:', error);
          setError('Failed to update event. Please ensure you have admin permissions.');
          return;
        }

        eventId = selectedEvent.id;

        // Delete existing fight cards
        await supabase
          .from('fight_cards')
          .delete()
          .eq('event_id', eventId);

      } else {
        // Add new event
        const { error, data } = await supabase
          .from('upcoming_events')
          .insert([formData])
          .select()
          .single();

        if (error) {
          console.error('Insert error:', error);
          setError('Failed to add event. Please ensure you have admin permissions.');
          return;
        }

        eventId = data.id;
      }

      // Insert fight cards
      if (fightCards.length > 0) {
        const fightCardsToInsert = fightCards.map(card => ({
          event_id: eventId,
          fighter1_id: card.fighter1_id,
          fighter2_id: card.fighter2_id,
          card_type: card.card_type,
          bout_order: card.bout_order
        }));

        const { error: fightCardError } = await supabase
          .from('fight_cards')
          .insert(fightCardsToInsert);

        if (fightCardError) {
          console.error('Error inserting fight cards:', fightCardError);
          setError('Failed to save fight cards');
          return;
        }
      }

      setSuccess(selectedEvent ? 'Event updated successfully' : 'Event added successfully');
      setIsEditing(false);
      fetchEvents();
    } catch (error) {
      console.error('Error saving event:', error);
      setError('Failed to save event');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="admin-events">
      <div className="admin-events-header">
        <h1>Event Management</h1>
        <button onClick={handleAdd} className="add-button">
          Add New Event
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      {isEditing ? (
        <div className="event-form-container">
          <h2>{selectedEvent ? 'Edit Event' : 'Add New Event'}</h2>
          <form onSubmit={handleSubmit} className="event-form">
            <div className="form-group">
              <label htmlFor="name">Event Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name || ''}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="location">Location</label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location || ''}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="date">Date and Time</label>
              <input
                type="datetime-local"
                id="date"
                name="date"
                value={formData.date ? new Date(formData.date).toISOString().slice(0, 16) : ''}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group checkbox">
              <label>
                <input
                  type="checkbox"
                  name="is_pay_per_view"
                  checked={formData.is_pay_per_view || false}
                  onChange={handleInputChange}
                />
                Pay-Per-View Event
              </label>
            </div>

            <div className="fight-card-section">
              <h3>Fight Card</h3>
              
              <div className="add-fight-form">
                <div className="fighter-search">
                  <div className="fighter-select">
                    <label>Fighter 1</label>
                    <input
                      type="text"
                      value={searchTerm1}
                      onChange={(e) => setSearchTerm1(e.target.value)}
                      placeholder="Search fighter..."
                    />
                    {searchResults1.length > 0 && (
                      <div className="search-results">
                        {searchResults1.map(fighter => (
                          <div
                            key={fighter.id}
                            className="fighter-result"
                            onClick={() => {
                              setSelectedFighter1(fighter);
                              setSearchResults1([]);
                              setSearchTerm1(`${fighter.first_name} ${fighter.last_name}`);
                            }}
                          >
                            {fighter.first_name} {fighter.last_name}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="fighter-select">
                    <label>Fighter 2</label>
                    <input
                      type="text"
                      value={searchTerm2}
                      onChange={(e) => setSearchTerm2(e.target.value)}
                      placeholder="Search fighter..."
                    />
                    {searchResults2.length > 0 && (
                      <div className="search-results">
                        {searchResults2.map(fighter => (
                          <div
                            key={fighter.id}
                            className="fighter-result"
                            onClick={() => {
                              setSelectedFighter2(fighter);
                              setSearchResults2([]);
                              setSearchTerm2(`${fighter.first_name} ${fighter.last_name}`);
                            }}
                          >
                            {fighter.first_name} {fighter.last_name}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="card-type-select">
                    <label>Card Type</label>
                    <select
                      value={selectedCardType}
                      onChange={(e) => setSelectedCardType(e.target.value as typeof CARD_TYPES[number])}
                    >
                      <option value="main_card">Main Card</option>
                      <option value="prelims">Preliminary Card</option>
                      <option value="early_prelims">Early Prelims</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddFight}
                    className="add-fight-button"
                    disabled={!selectedFighter1 || !selectedFighter2}
                  >
                    Add Fight
                  </button>
                </div>
              </div>

              <div className="fight-cards">
                {CARD_TYPES.map(cardType => {
                  const cardFights = fightCards.filter(fight => fight.card_type === cardType);
                  if (cardFights.length === 0) return null;

                  return (
                    <div key={cardType} className="card-section">
                      <h3>{cardType.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}</h3>
                      <div className="fights-list">
                        {cardFights.map(fight => (
                          <div key={fight.id} className="fight-item">
                            <span className="fighter">{fight.fighter1?.first_name} {fight.fighter1?.last_name}</span>
                            <span className="vs">vs</span>
                            <span className="fighter">{fight.fighter2?.first_name} {fight.fighter2?.last_name}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveFight(fight.id)}
                              className="remove-fight"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="save-button">
                {selectedEvent ? 'Update Event' : 'Add Event'}
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="cancel-button"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="events-table-container">
          {isLoading ? (
            <div className="loading">Loading events...</div>
          ) : (
            <table className="events-table">
              <thead>
                <tr>
                  <th>Event Name</th>
                  <th>Date</th>
                  <th>Location</th>
                  <th>PPV</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {events.map(event => (
                  <tr key={event.id}>
                    <td>{event.name}</td>
                    <td>{formatDate(event.date)}</td>
                    <td>{event.location}</td>
                    <td>
                      <span className={`ppv-status ${event.is_pay_per_view ? 'is-ppv' : ''}`}>
                        {event.is_pay_per_view ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button
                          onClick={() => handleEdit(event)}
                          className="edit-button"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(event)}
                          className="delete-button"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminEvents;