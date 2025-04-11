import { FC } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react';

const Navbar: FC = () => {
  const location = useLocation();
  const session = useSession();
  const supabase = useSupabaseClient();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  if (!session) {
    return null;
  }

  return (
    <nav className="navbar">
      <ul>
        {session && (
          <>
            <li>
              <Link to="/" className={location.pathname === '/' ? 'active' : ''}>
                Dashboard
              </Link>
            </li>
            <li>
              <Link 
                to="/predictions" 
                className={location.pathname === '/predictions' ? 'active' : ''}
              >
                Predictions
              </Link>
            </li>
            <li>
              <Link 
                to="/fighters" 
                className={location.pathname === '/fighters' ? 'active' : ''}
              >
                Fighters
              </Link>
            </li>
            <li>
              <Link 
                to="/events" 
                className={location.pathname === '/events' ? 'active' : ''}
              >
                Events
              </Link>
            </li>
            <li>
              <Link 
                to="/admin/fighters" 
                className={location.pathname === '/admin/fighters' ? 'active' : ''}
              >
                Admin Fighters
              </Link>
            </li>
            <li>
              <Link 
                to="/admin/events" 
                className={location.pathname === '/admin/events' ? 'active' : ''}
              >
                Admin Events
              </Link>
            </li>
            <li>
              <Link 
                to="/admin/predictions" 
                className={location.pathname === '/admin/predictions' ? 'active' : ''}
              >
                Prediction Logs
              </Link>
            </li>
            <li>
              <Link 
                to="/admin/tools" 
                className={location.pathname === '/admin/tools' ? 'active' : ''}
              >
                System Tools
              </Link>
            </li>
            <li className="ml-auto">
              <button 
                onClick={handleLogout}
                className="text-white hover:text-red-200"
              >
                Logout
              </button>
            </li>
          </>
        )}
      </ul>
    </nav>
  );
};

export default Navbar;
