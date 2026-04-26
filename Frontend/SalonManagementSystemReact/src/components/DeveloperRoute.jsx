import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function DeveloperRoute({ children }) {
  const { token, isDeveloper } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  if (!isDeveloper) return <Navigate to="/dashboard" replace />;
  return children;
}
