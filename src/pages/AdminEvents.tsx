import { FC, useState, useEffect, useRef } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { UpcomingEvent, Fighter, FightCard } from '../types';
import { parse, isValid } from 'date-fns';
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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

  const parseDateString = (dateStr: string): Date | null => {
    const formats = [
      'yyyy-MM-dd HH:mm',
      'yyyy-MM-dd HH:mm:ss',
      'yyyy-MM-ddTHH:mm:ss',
      'yyyy-MM-ddTHH:mm:ssX',
      'MM/dd/yyyy HH:mm',
      'MM/dd/yyyy HH:mm:ss',
      'yyyy-MM-dd',
      'MM/dd/yyyy'
    ];

    for (const format of formats) {
      const parsed = parse(dateStr, format, new Date());
      if (isValid(parsed)) {
        return parsed;
      }
    }

    const isoDate = new Date(dateStr);
    if (isValid(isoDate)) {
      return isoDate;
    }

    return null;
  };

  const isDateString = (str: string): boolean => {
    const datePatterns = [
      /^\d{4}-\d{2}-\d{2}/,
      /^\d{2}\/\d{2}\/\d{4}/,
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/,
      /^\d{2}-\d{2}-\d{4}/
    ];
    return datePatterns.some(pattern => pattern.test(str.trim()));
  };

  const parseCSVRow = (row: string): string[] => {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < row.length; i++) {
      const char = row[i];
      
      if (char === '"') {
        if (inQuotes && row[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  };

  const handleImportCSV = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      const text = await file.text();
      const rows = text.split('\n').filter(row => row.trim());
      
      if (rows.length < 2) {
        throw new Error('CSV file must contain at least a header row and one data row');
      }

      const headers = parseCSVRow(rows[0]).map(header => 
        header.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_')
      );

      const requiredHeaders = ['name', 'location', 'date'];
      const missingHeaders = requiredHeaders.filter(header => !headers.includes(header));
      
      if (missingHeaders.length > 0) {
        throw new Error(`Missing required columns: ${missingHeaders.join(', ')}`);
      }

      const nameIndex = headers.indexOf('name');
      const locationIndex = headers.indexOf('location');
      const dateIndex = headers.indexOf('date');
      const isPPVIndex = headers.indexOf('is_pay_per_view');
      const fightsIndex = headers.indexOf('fights');

      const validEvents = [];
      const skippedRows = [];

      for (let rowIndex = 1; rowIndex < rows.length; rowIndex++) {
        const row = rows[rowIndex].trim();
        if (!row) continue;

        try {
          const values = parseCSVRow(row);
          
          if (values.length < Math.min(3, headers.length)) {
            skippedRows.push({ row: rowIndex + 1, reason: 'Insufficient columns' });
            continue;
          }

          const name = values[nameIndex]?.trim();
          const location = values[locationIndex]?.trim();
          const dateStr = values[dateIndex]?.trim();
          const isPPVStr = values[isPPVIndex]?.trim().toLowerCase();
          const fightsStr = fightsIndex !== -1 ? values[fightsIndex]?.trim() : '';

          if (!name || !location || !dateStr) {
            skippedRows.push({ row: rowIndex + 1, reason: `Missing required fields: ${[
              !name && 'name',
              !location && 'location',
              !dateStr && 'date'
            ].filter(Boolean).join(', ')}` });
            continue;
          }

          const parsedDate = parseDateString(dateStr);
          if (!parsedDate) {
            skippedRows.push({ 
              row: rowIndex + 1, 
              reason: `Invalid date format: ${dateStr}` 
            });
            continue;
          }

          const event = {
            name,
            location,
            date: parsedDate.toISOString(),
            is_pay_per_view: isPPVStr === 'true' || isPPVStr === '1' || isPPVStr === 'yes',
            fights: []
          };

          if (fightsStr) {
            try {
              const fights = fightsStr.startsWith('[') ? 
                JSON.parse(fightsStr) :
                JSON.parse(`[${fightsStr}]`);

              if (Array.isArray(fights)) {
                event.fights = fights.map(fight => ({
                  fighter1_name: fight.fighter1,
                  fighter2_name: fight.fighter2,
                  card_type: fight.card_type || 'main_card',
                  bout_order: fight.bout_order || 1
                }));
              }
            } catch (e) {
              console.warn(`Could not parse fights for row ${rowIndex + 1}:`, e);
            }
          }

          validEvents.push(event);
        } catch (error) {
          skippedRows.push({ 
            row: rowIndex + 1, 
            reason: error instanceof Error ? error.message : 'Unknown error parsing row' 
          });
          continue;
        }
      }

      if (validEvents.length === 0) {
        if (skippedRows.length > 0) {
          throw new Error(`No valid events found in CSV. Issues found:\n${skippedRows.map(
            row => `Row ${row.row}: ${row.reason}`
          ).join('\n')}`);
        } else {
          throw new Error('No valid events found in CSV');
        }
      }

      for (const event of validEvents) {
        const { data: eventData, error: eventError } = await supabase
          .from('upcoming_events')
          .insert([{
            name: event.name,
            location: event.location,
            date: event.date,
            is_pay_per_view: event.is_pay_per_view
          }])
          .select()
          .single();

        if (eventError) throw eventError;

        if (event.fights.length > 0 && eventData) {
          const fightCards = event.fights.map((fight, index) => ({
            event_id: eventData.id,
            card_type: fight.card_type,
            bout_order: fight.bout_order || index + 1,
            fighter1_id: null,
            fighter2_id: null
          }));

          const { error: fightCardError } = await supabase
            .from('fight_cards')
            .insert(fightCards);

          if (fightCardError) {
            console.warn(`Could not insert fight cards for event ${event.name}:`, fightCardError);
          }
        }
      }

      let message = `Successfully imported ${validEvents.length} events`;
      if (skippedRows.length > 0) {
        message += `\nSkipped ${skippedRows.length} rows due to format issues`;
      }
      setSuccess(message);
      fetchEvents();
    } catch (error) {
      console.error('Error importing CSV:', error);
      setError(error instanceof Error ? error.message : 'Failed to import CSV file');
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const downloadSampleCSV = () => {
    const headers = [
      'name',
      'location',
      'date',
      'is_pay_per_view',
      'fights'
    ].join(',');

    const sampleFights1 = JSON.stringify([
      {
        fighter1: "Jon Jones",
        fighter2: "Ciryl Gane",
        card_type: "main_card",
        bout_order: 1
      },
      {
        fighter1: "Alexa Grasso",
        fighter2: "Valentina Shevchenko",
        card_type: "main_card",
        bout_order: 2
      }
    ]);

    const sampleFights2 = JSON.stringify([
      {
        fighter1: "Sean O'Malley",
        fighter2: "Marlon Vera",
        card_type: "main_card",
        bout_order: 1
      }
    ]);

    const sampleData = [
      `"UFC 300: Legacy","T-Mobile Arena Las Vegas","2025-04-13 22:00",true,${sampleFights1}`,
      `"UFC Fight Night: O'Malley vs Vera 2","UFC APEX Las Vegas","2025-04-20 22:00",false,${sampleFights2}`
    ].join('\n');

    const csvContent = `${headers}\n${sampleData}`;
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'events_sample.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

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

      if (error) throw error;

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
        const { error, data } = await supabase
          .from('upcoming_events')
          .update({
            name: formData.name,
            location: formData.location,
            date: formData.date,
            is_pay_per_view: formData.is_pay_per_view
          })
          .eq('id', selectedEvent.id)
          .select()
          .single();

        if (error) throw error;
        eventId = selectedEvent.id;

        await supabase
          .from('fight_cards')
          .delete()
          .eq('event_id', eventId);
      } else {
        const { error, data } = await supabase
          .from('upcoming_events')
          .insert([formData])
          .select()
          .single();

        if (error) throw error;
        eventId = data.id;
      }

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

        if (fightCardError) throw fightCardError;
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
        <div className="header-actions">
          <input
            type="file"
            accept=".csv"
            onChange={handleImportCSV}
            ref={fileInputRef}
            style={{ display: 'none' }}
          />
          <div className="import-actions">
            <button 
              onClick={() => fileInputRef.current?.click()} 
              className="import-button"
            >
              Import CSV
            </button>
            <button 
              onClick={downloadSampleCSV}
              className="sample-button"
            >
              Download Sample
            </button>
          </div>
          <button onClick={handleAdd} className="add-button">
            Add New Event
          </button>
        </div>
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