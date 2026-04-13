import { createContext, useContext, useMemo, useState } from 'react';

const AuthContext = createContext(null);

const initialUser = (() => {
  const stored = localStorage.getItem('cardwise_user');
  return stored ? JSON.parse(stored) : null;
})();

const initialToken = localStorage.getItem('cardwise_token');

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(initialUser);
  const [token, setToken] = useState(initialToken);

  const login = ({ user: userData, token: authToken }) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('cardwise_user', JSON.stringify(userData));
    localStorage.setItem('cardwise_token', authToken);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('cardwise_user');
    localStorage.removeItem('cardwise_token');
  };

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token),
      login,
      logout,
    }),
    [user, token]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
