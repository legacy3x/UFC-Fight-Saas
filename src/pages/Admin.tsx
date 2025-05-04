import { FC, useState, useEffect } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { Fighter } from '../types';
import AdminFighters from './AdminFighters';
import AdminEvents from './AdminEvents';
import AdminPredictions from './AdminPredictions';
import './Admin.css';

interface AdminProps {
  activeTab: string;
}

interface ScrapingLog {
  timestamp: string;
  division?: string;
  gender?: string;
  recordsProcessed: number;
  status: 'success' | 'error';
  message: string;
}

const Admin: FC<AdminProps> = ({ activeTab }) => {
  const supabase = useSupabaseClient();
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState({ message: '', type: '' });
  const [selectedDivision, setSelectedDivision] = useState('all');
  const [selectedGender, setSelectedGender] = useState('all');
  const [selectedFighter, setSelectedFighter] = useState<Fighter | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isScraping, setIsScraping] = useState(false);
  const [scrapeProgress, setScrapeProgress] = useState(0);
  const [showScrapingLog, setShowScrapingLog] = useState(false);
  const [scrapingLog, setScrapingLog] = useState<ScrapingLog | null>(null);

  const WEIGHT_CLASSES = {
    male: [
      'Heavyweight',
      'Light Heavyweight',
      'Middleweight',
      'Welterweight',
      'Lightweight',
      'Featherweight',
      'Bantamweight',
      'Flyweight'
    ],
    female: [
      "Women's Featherweight",
      "Women's Bantamweight",
      "Women's Flyweight",
      "Women's Strawweight"
    ]
  };

  const startScraping = async () => {
    setIsScraping(true);
    setScrapeProgress(0);
    
    try {
      const response = await fetch('/api/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          division: selectedDivision === 'all' ? null : selectedDivision,
          gender: selectedGender === 'all' ? null : selectedGender,
          fighterId: selectedFighter?.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to start scraping');
      }

      const data = await response.json();
      
      setScrapingLog({
        timestamp: new Date().toISOString(),
        division: selectedDivision,
        gender: selectedGender,
        recordsProcessed: data.recordsProcessed || 0,
        status: 'success',
        message: 'Scraping completed successfully'
      });
      
      setShowScrapingLog(true);
      setNotification({ message: 'Scraping completed successfully', type: 'success' });
    } catch (error) {
      console.error('Scraping error:', error);
      
      setScrapingLog({
        timestamp: new Date().toISOString(),
        division: selectedDivision,
        gender: selectedGender,
        recordsProcessed: 0,
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      });
      
      setShowScrapingLog(true);
      setNotification({ message: 'Error during scraping process', type: 'error' });
    } finally {
      setIsScraping(false);
      setScrapeProgress(100);
    }
  };

  return (
    <div className="admin-dashboard">
      {notification.message && (
        <div className={`notification ${notification.type}`}>
          {notification.message}
        </div>
      )}

      {activeTab === 'tools' && (
        <>
          <h2 className="text-2xl font-bold text-white mt-5 mb-5 ml-6">System Tools</h2>
          
          <div className="system-tools">
            <div className="help-section bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold mb-4 text-black">System Information</h3>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <h4 className="font-semibold mb-2 text-black">System Status</h4>
                  <ul className="space-y-2 text-black">
                    <li>• Application is running normally</li>
                    <li>• Database connection is active</li>
                    <li>• Authentication services are operational</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="scraper-controls bg-white rounded-lg shadow-md p-6 mt-6">
              <h3 className="text-xl font-semibold mb-4 text-black">UFC Stats Scraper</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="filter-section">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Gender
                  </label>
                  <select
                    value={selectedGender}
                    onChange={(e) => setSelectedGender(e.target.value)}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="all">All Genders</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>

                <div className="filter-section">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Division
                  </label>
                  <select
                    value={selectedDivision}
                    onChange={(e) => setSelectedDivision(e.target.value)}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="all">All Divisions</option>
                    {selectedGender === 'all' ? (
                      <>
                        {WEIGHT_CLASSES.male.map(division => (
                          <option key={division} value={division}>{division}</option>
                        ))}
                        {WEIGHT_CLASSES.female.map(division => (
                          <option key={division} value={division}>{division}</option>
                        ))}
                      </>
                    ) : selectedGender === 'male' ? (
                      WEIGHT_CLASSES.male.map(division => (
                        <option key={division} value={division}>{division}</option>
                      ))
                    ) : (
                      WEIGHT_CLASSES.female.map(division => (
                        <option key={division} value={division}>{division}</option>
                      ))
                    )}
                  </select>
                </div>

                <div className="filter-section">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Search Fighter (Optional)
                  </label>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by fighter name"
                    className="w-full p-2 border rounded-md"
                  />
                </div>
              </div>

              <div className="mt-6">
                <button
                  onClick={startScraping}
                  disabled={isScraping}
                  className={`w-full bg-primary text-white py-2 px-4 rounded-md ${
                    isScraping ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-600'
                  }`}
                >
                  {isScraping ? 'Scraping in Progress...' : 'Start Scraping'}
                </button>

                {isScraping && (
                  <div className="mt-4">
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-primary h-2.5 rounded-full transition-all duration-500"
                        style={{ width: `${scrapeProgress}%` }}
                      ></div>
                    </div>
                    <p className="text-sm text-gray-600 mt-2 text-center">
                      {scrapeProgress}% Complete
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      <div className="admin-content">
        {isLoading ? (
          <div className="loading-spinner">Loading...</div>
        ) : (
          <>
            {activeTab === 'fighters' && <AdminFighters />}
            {activeTab === 'events' && <AdminEvents />}
            {activeTab === 'predictions' && <AdminPredictions />}
          </>
        )}
      </div>

      {/* Scraping Log Modal */}
      {showScrapingLog && scrapingLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-900">
                Scraping Results
              </h3>
              <button
                onClick={() => setShowScrapingLog(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500">
                  Timestamp: {new Date(scrapingLog.timestamp).toLocaleString()}
                </p>
                {scrapingLog.division && (
                  <p className="text-sm text-gray-500">
                    Division: {scrapingLog.division}
                  </p>
                )}
                {scrapingLog.gender && (
                  <p className="text-sm text-gray-500">
                    Gender: {scrapingLog.gender}
                  </p>
                )}
                <p className="text-sm text-gray-500">
                  Records Processed: {scrapingLog.recordsProcessed}
                </p>
                <p className={`text-sm ${
                  scrapingLog.status === 'success' ? 'text-green-600' : 'text-red-600'
                }`}>
                  Status: {scrapingLog.status.toUpperCase()}
                </p>
                <p className="text-sm text-gray-700 mt-2">
                  {scrapingLog.message}
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowScrapingLog(false)}
                className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;