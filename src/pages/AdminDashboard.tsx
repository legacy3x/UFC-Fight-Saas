import { FC, useEffect, useState } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';

const AdminDashboard: FC = () => {
  const supabase = useSupabaseClient();
  const [stats, setStats] = useState({
    totalFighters: 0,
    totalPredictions: 0,
    totalEvents: 0,
    accuracyRate: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [fighters, predictions, events] = await Promise.all([
          supabase.from('fighters').select('count').single(),
          supabase.from('prediction_logs').select('count').single(),
          supabase.from('upcoming_events').select('count').single()
        ]);

        setStats({
          totalFighters: fighters.data?.count || 0,
          totalPredictions: predictions.data?.count || 0,
          totalEvents: events.data?.count || 0,
          accuracyRate: 0 // TODO: Calculate from actual results
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [supabase]);

  if (isLoading) {
    return <div className="loading-spinner">Loading dashboard stats...</div>;
  }

  return (
    <div className="admin-dashboard p-6">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="stat-card">
          <h3 className="text-lg font-semibold mb-2">Total Fighters</h3>
          <p className="text-3xl font-bold text-primary">{stats.totalFighters}</p>
        </div>
        
        <div className="stat-card">
          <h3 className="text-lg font-semibold mb-2">Total Predictions</h3>
          <p className="text-3xl font-bold text-primary">{stats.totalPredictions}</p>
        </div>
        
        <div className="stat-card">
          <h3 className="text-lg font-semibold mb-2">Upcoming Events</h3>
          <p className="text-3xl font-bold text-primary">{stats.totalEvents}</p>
        </div>
        
        <div className="stat-card">
          <h3 className="text-lg font-semibold mb-2">Prediction Accuracy</h3>
          <p className="text-3xl font-bold text-primary">{stats.accuracyRate}%</p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
