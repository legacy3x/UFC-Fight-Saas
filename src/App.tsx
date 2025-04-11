import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Predictions from './pages/Predictions';
import Events from './pages/Events';
import Fighters from './pages/Fighters';
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
          <Route path="/login" element={<Login />} />
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
          <Route path="/events" element={
            <RoleGuard>
              <Events />
            </RoleGuard>
          } />
          <Route path="/fighters" element={
            <RoleGuard>
              <Fighters />
            </RoleGuard>
          } />
          <Route path="/admin" element={<RoleGuard><Admin /></RoleGuard>} />
          <Route path="/admin/dashboard" element={<RoleGuard><AdminDashboard /></RoleGuard>} />
          <Route path="/admin/predictions" element={<RoleGuard><AdminPredictions /></RoleGuard>} />
          <Route path="/admin/fighters" element={<RoleGuard><AdminFighters /></RoleGuard>} />
          <Route path="/admin/events" element={<RoleGuard><AdminEvents /></RoleGuard>} />
          <Route path="/admin/tools" element={<RoleGuard><Admin activeTab="tools" /></RoleGuard>} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
