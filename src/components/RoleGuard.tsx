import { FC, ReactNode, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSupabaseClient } from '@supabase/auth-helpers-react'

interface RoleGuardProps {
  children: ReactNode
  requiredRoles: string[]
}

const RoleGuard: FC<RoleGuardProps> = ({ children, requiredRoles }) => {
  const supabase = useSupabaseClient()
  const navigate = useNavigate()

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        navigate('/login')
        return
      }

      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)

      const hasRole = roles?.some(role => requiredRoles.includes(role.role))
      
      if (!hasRole) {
        navigate('/unauthorized')
      }
    }

    checkAuth()
  }, [supabase, navigate, requiredRoles])

  return <>{children}</>
}

export default RoleGuard
