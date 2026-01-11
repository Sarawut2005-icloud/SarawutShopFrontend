'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AuthContextType {
  isLoggedIn: boolean;
  isAdmin: boolean;
  userName: string;
  toggleAdminMode: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userName, setUserName] = useState('Guest');

  useEffect(() => {
    // โหลดจาก localStorage
    const token = localStorage.getItem('access_token');
    const role = localStorage.getItem('userRole');
    const name = localStorage.getItem('customerName');

    setIsLoggedIn(!!token);
    setIsAdmin(role === 'admin');
    setUserName(name || 'Guest');
  }, []);

  const toggleAdminMode = () => {
    const newState = !isAdmin;
    setIsAdmin(newState);
    localStorage.setItem('isAdminMode', newState.toString());
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('customerName');
    localStorage.removeItem('isAdminMode');
    setIsLoggedIn(false);
    setIsAdmin(false);
    setUserName('Guest');
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, isAdmin, userName, toggleAdminMode, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};