import { FC, useState, useEffect } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { PredictionLog } from '../types';
import './AdminPredictions.css';

const AdminPredictions: FC = () => {
  const supabase = useSupabaseClient();
  const [predictions, setPredictions] = useState<PredictionLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState({
    confidence: 'all',
    timeFrame: '7days'
  });

  useEffect(() => {
    const fetchPredictions = async () => {
      setIsLoading(true);
      try {
        let query = supabase
          .from('prediction_logs')
          .select('*')
          .order('created_at', { ascending: false });

        // Apply confidence filter
        if (filter.confidence !== 'all') {
          const confidenceValue = parseFloat(filter.confidence);
          query = query.gte('confidence', confidenceValue);
        }

        // Apply time frame filter
        if (filter.timeFrame !== 'all') {
          const days = parseInt(filter.timeFrame);
          const date = new Date();
          date.setDate(date.getDate() - days);
          query = query.gte('created_at', date.toISOString());
        }

        const { data, error } = await query;
        
        if (error) throw error;
        setPredictions(data || []);
      } catch (error) {
        console.error('Error fetching predictions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPredictions();
  }, [supabase, filter]);

  const getConfidenceClass = (confidence: number) => {
    if (confidence >= 0.8) return 'high-confidence';
    if (confidence >= 0.6) return 'medium-confidence';
    return 'low-confidence';
  };

  return (
    <div className="admin-predictions">
      <div className="predictions-header">
        <h1>Prediction Logs</h1>
        <div className="filters">
          <div className="filter-group">
            <label>Confidence:</label>
            <select 
              value={filter.confidence}
              onChange={(e) => setFilter(prev => ({ ...prev, confidence: e.target.value }))}
            >
              <option value="all">All</option>
              <option value="0.8">High (≥80%)</option>
              <option value="0.6">Medium (≥60%)</option>
              <option value="0.4">Low (≥40%)</option>
            </select>
          </div>
          <div className="filter-group">
            <label>Time Frame:</label>
            <select
              value={filter.timeFrame}
              onChange={(e) => setFilter(prev => ({ ...prev, timeFrame: e.target.value }))}
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="all">All time</option>
            </select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="loading">Loading predictions...</div>
      ) : (
        <div className="predictions-table">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Fighter 1</th>
                <th>Fighter 2</th>
                <th>Predicted Winner</th>
                <th>Method</th>
                <th>Confidence</th>
              </tr>
            </thead>
            <tbody>
              {predictions.map(prediction => (
                <tr key={prediction.id}>
                  <td>{new Date(prediction.created_at).toLocaleDateString()}</td>
                  <td>{prediction.fighter1_name}</td>
                  <td>{prediction.fighter2_name}</td>
                  <td>{prediction.predicted_winner}</td>
                  <td>{prediction.predicted_method.replace('_', '/')}</td>
                  <td>
                    <span className={`confidence-badge ${getConfidenceClass(prediction.confidence)}`}>
                      {Math.round(prediction.confidence * 100)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminPredictions;
