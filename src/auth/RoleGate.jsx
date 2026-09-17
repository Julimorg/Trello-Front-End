import { Navigate } from 'react-router-dom'
import { useAuth } from './AuthContext'

export default function RoleGate({ roles, children }) {
  const { session } = useAuth()
  if (!session || !roles.includes(session.role)) {
    return <Navigate to="/" replace />
  }
  return children
}
