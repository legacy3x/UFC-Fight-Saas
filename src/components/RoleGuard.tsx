import { FC, ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '@supabase/auth-helpers-react';

interface RoleGuardProps {
  children: ReactNode;
}

const RoleGuard: FC<RoleGuardProps> = ({ children }) => {
  const session = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (!session) {
      navigate('/login');
    }
  }, [session, navigate]);

  if (!session) {
    return null;
  }

  return <>{children}</>;
}

export default RoleGuard;
