import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Predictions from './pages/Predictions';
import Admin from './pages/Admin';
import AdminDashboard from './pages/AdminDashboard';
import AdminPredictions from './pages/AdminPredictions';
import AdminFighters from './pages/AdminFighters';
import AdminEvents from './pages/AdminEvents';
import Login from './pages/Login';
import Navbar from './components/Navbar';
import RoleGuard from './components/RoleGuard';

export default function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <Navbar />
        <Routes>
          <Route path="/" element={
            <RoleGuard>
              <Home />
            </RoleGuard>
          } />
          <Route path="/predictions" element={
            <RoleGuard>
              <Predictions />
            </RoleGuard>
          } />
          <Route path="/admin" element={<RoleGuard><Admin activeTab="dashboard" /></RoleGuard>} />
          <Route path="/admin/dashboard" element={<RoleGuard><Admin activeTab="dashboard" /></RoleGuard>} />
          <Route path="/admin/predictions" element={<RoleGuard><Admin activeTab="predictions" /></RoleGuard>} />
          <Route path="/admin/fighters" element={<RoleGuard><Admin activeTab="fighters" /></RoleGuard>} />
          <Route path="/admin/events" element={<RoleGuard><Admin activeTab="events" /></RoleGuard>} />
          <Route path="/admin/tools" element={<RoleGuard><Admin activeTab="tools" /></RoleGuard>} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}