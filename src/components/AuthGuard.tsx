import { FC, ReactNode, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSession } from '@supabase/auth-helpers-react'

interface AuthGuardProps {
  children: ReactNode
}

const AuthGuard: FC<AuthGuardProps> = ({ children }) => {
  const session = useSession()
  const navigate = useNavigate()

  useEffect(() => {
    if (!session) {
      navigate('/login')
    }
  }, [session, navigate])

  if (!session) {
    return null
  }

  return <>{children}</>
}

export default AuthGuard