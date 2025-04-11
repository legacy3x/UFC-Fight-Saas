import { FC, useState, useEffect, useRef } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { Fighter } from '../types';
import './AdminFighters.css';

const WEIGHT_CLASSES = [
  'Heavyweight',
  'Light Heavyweight',
  'Middleweight',
  'Welterweight',
  'Lightweight',
  'Featherweight',
  'Bantamweight',
  'Flyweight',
  'Women\'s Featherweight',
  'Women\'s Bantamweight',
  'Women\'s Flyweight',
  'Women\'s Strawweight'
];

const STANCES = ['Orthodox', 'Southpaw', 'Switch'];

const AdminFighters: FC = () => {
  const supabase = useSupabaseClient();
  const [fighters, setFighters] = useState<Fighter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFighter, setSelectedFighter] = useState<Fighter | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Fighter>>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchFighters();
  }, [supabase]);

  const fetchFighters = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('fighters')
        .select('*')
        .order('last_name');

      if (searchTerm) {
        query = query.or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      setFighters(data || []);
    } catch (error) {
      console.error('Error fetching fighters:', error);
      setError('Failed to load fighters');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportCSV = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      const text = await file.text();
      const rows = text.split('\n');
      const headers = rows[0].split(',').map(header => header.trim().toLowerCase());

      const fighters = rows.slice(1)
        .filter(row => row.trim())
        .map(row => {
          const values = row.split(',').map(value => value.trim());
          const fighter: Record<string, any> = {};
          
          headers.forEach((header, index) => {
            if (header === 'height_cm' || header === 'reach_cm' || 
                header === 'wins' || header === 'losses' || header === 'draws') {
              fighter[header] = parseInt(values[index]) || 0;
            } else {
              fighter[header] = values[index] || null;
            }
          });

          return fighter;
        });

      // Validate required fields and data types
      const validFighters = fighters.filter(fighter => {
        return (
          fighter.first_name &&
          fighter.last_name &&
          fighter.weight_class &&
          WEIGHT_CLASSES.includes(fighter.weight_class) &&
          (!fighter.stance || STANCES.includes(fighter.stance))
        );
      });

      if (validFighters.length === 0) {
        throw new Error('No valid fighter data found in CSV');
      }

      const { error: upsertError } = await supabase
        .from('fighters')
        .upsert(validFighters, {
          onConflict: 'first_name,last_name',
          ignoreDuplicates: false
        });

      if (upsertError) throw upsertError;

      setSuccess(`Successfully imported ${validFighters.length} fighters`);
      fetchFighters();
    } catch (error) {
      console.error('Error importing CSV:', error);
      setError('Failed to import CSV file. Please check the file format.');
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleEdit = (fighter: Fighter) => {
    setSelectedFighter(fighter);
    setFormData(fighter);
    setIsEditing(true);
  };

  const handleAdd = () => {
    setSelectedFighter(null);
    setFormData({});
    setIsEditing(true);
  };

  const handleDelete = async (fighter: Fighter) => {
    if (!window.confirm(`Are you sure you want to delete ${fighter.first_name} ${fighter.last_name}?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('fighters')
        .delete()
        .eq('id', fighter.id);

      if (error) throw error;

      setSuccess('Fighter deleted successfully');
      fetchFighters();
    } catch (error) {
      console.error('Error deleting fighter:', error);
      setError('Failed to delete fighter');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      if (selectedFighter) {
        // Update existing fighter
        const { error } = await supabase
          .from('fighters')
          .update(formData)
          .eq('id', selectedFighter.id);

        if (error) throw error;
        setSuccess('Fighter updated successfully');
      } else {
        // Add new fighter
        const { error } = await supabase
          .from('fighters')
          .insert([formData]);

        if (error) throw error;
        setSuccess('Fighter added successfully');
      }

      setIsEditing(false);
      fetchFighters();
    } catch (error) {
      console.error('Error saving fighter:', error);
      setError('Failed to save fighter');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const downloadSampleCSV = () => {
    const headers = [
      'first_name',
      'last_name',
      'nickname',
      'weight_class',
      'country',
      'team',
      'height_cm',
      'reach_cm',
      'stance',
      'wins',
      'losses',
      'draws'
    ].join(',');

    const sampleData = [
      'John,Doe,The Beast,Heavyweight,USA,Team Alpha,188,200,Orthodox,10,2,0',
      'Jane,Smith,Lightning,Bantamweight,Canada,Team Beta,165,170,Southpaw,8,1,1'
    ].join('\n');

    const csvContent = `${headers}\n${sampleData}`;
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'fighters_sample.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="admin-fighters">
      <div className="admin-fighters-header">
        <h1>Fighter Management</h1>
        <div className="header-actions">
          <input
            type="text"
            placeholder="Search fighters..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <div className="import-actions">
            <input
              type="file"
              accept=".csv"
              onChange={handleImportCSV}
              ref={fileInputRef}
              style={{ display: 'none' }}
            />
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
            Add New Fighter
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      {isEditing ? (
        <div className="fighter-form-container">
          <h2>{selectedFighter ? 'Edit Fighter' : 'Add New Fighter'}</h2>
          <form onSubmit={handleSubmit} className="fighter-form">
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="first_name">First Name</label>
                <input
                  type="text"
                  id="first_name"
                  name="first_name"
                  value={formData.first_name || ''}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="last_name">Last Name</label>
                <input
                  type="text"
                  id="last_name"
                  name="last_name"
                  value={formData.last_name || ''}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="nickname">Nickname</label>
                <input
                  type="text"
                  id="nickname"
                  name="nickname"
                  value={formData.nickname || ''}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="weight_class">Weight Class</label>
                <select
                  id="weight_class"
                  name="weight_class"
                  value={formData.weight_class || ''}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Weight Class</option>
                  {WEIGHT_CLASSES.map(weightClass => (
                    <option key={weightClass} value={weightClass}>
                      {weightClass}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="country">Country</label>
                <input
                  type="text"
                  id="country"
                  name="country"
                  value={formData.country || ''}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="team">Team</label>
                <input
                  type="text"
                  id="team"
                  name="team"
                  value={formData.team || ''}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="height_cm">Height (cm)</label>
                <input
                  type="number"
                  id="height_cm"
                  name="height_cm"
                  value={formData.height_cm || ''}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="reach_cm">Reach (cm)</label>
                <input
                  type="number"
                  id="reach_cm"
                  name="reach_cm"
                  value={formData.reach_cm || ''}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="stance">Stance</label>
                <select
                  id="stance"
                  name="stance"
                  value={formData.stance || ''}
                  onChange={handleInputChange}
                >
                  <option value="">Select Stance</option>
                  {STANCES.map(stance => (
                    <option key={stance} value={stance}>
                      {stance}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="wins">Wins</label>
                <input
                  type="number"
                  id="wins"
                  name="wins"
                  value={formData.wins || 0}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="losses">Losses</label>
                <input
                  type="number"
                  id="losses"
                  name="losses"
                  value={formData.losses || 0}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="draws">Draws</label>
                <input
                  type="number"
                  id="draws"
                  name="draws"
                  value={formData.draws || 0}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="save-button">
                {selectedFighter ? 'Update Fighter' : 'Add Fighter'}
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
        <div className="fighters-table-container">
          {isLoading ? (
            <div className="loading">Loading fighters...</div>
          ) : (
            <table className="fighters-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Weight Class</th>
                  <th>Record</th>
                  <th>Country</th>
                  <th>Team</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {fighters.map(fighter => (
                  <tr key={fighter.id}>
                    <td>
                      {fighter.first_name} {fighter.last_name}
                      {fighter.nickname && (
                        <span className="nickname">"{fighter.nickname}"</span>
                      )}
                    </td>
                    <td>{fighter.weight_class}</td>
                    <td>{`${fighter.wins}-${fighter.losses}-${fighter.draws}`}</td>
                    <td>{fighter.country}</td>
                    <td>{fighter.team || '-'}</td>
                    <td>
                      <div className="table-actions">
                        <button
                          onClick={() => handleEdit(fighter)}
                          className="edit-button"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(fighter)}
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

export default AdminFighters;
