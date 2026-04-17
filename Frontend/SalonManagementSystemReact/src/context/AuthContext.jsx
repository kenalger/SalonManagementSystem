import { createContext, useContext, useState, useCallback } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    const org = localStorage.getItem('org');
    return {
      token: token || null,
      user: user ? JSON.parse(user) : null,
      organization: org ? JSON.parse(org) : null,
    };
  });

  const login = useCallback((tokenData) => {
    const user = {
      id: tokenData.userId,
      email: tokenData.email,
      fullName: tokenData.fullName,
    };
    localStorage.setItem('token', tokenData.token);
    localStorage.setItem('user', JSON.stringify(user));
    setAuth((prev) => ({ ...prev, token: tokenData.token, user }));
  }, []);

  const setOrganization = useCallback((org) => {
    localStorage.setItem('org', JSON.stringify(org));
    setAuth((prev) => ({ ...prev, organization: org }));
  }, []);

  const logout = useCallback(() => {
    localStorage.clear();
    setAuth({ token: null, user: null, organization: null });
  }, []);

  return (
    <AuthContext.Provider value={{ ...auth, login, logout, setOrganization }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
