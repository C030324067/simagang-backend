import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiRequest, getToken, setToken } from '../api';

const AuthContext = createContext(null);

export const DEMO_ACCOUNTS = {
  intern: {
    email: 'intern@diskominfo.go.id',
    label: 'Pemohon Magang',
    badge: 'Intern / Mahasiswa',
    icon: 'GraduationCap',
  },
  admin_kepegawaian: {
    email: 'kepegawaian@diskominfo.go.id',
    label: 'Admin Kepegawaian',
    badge: 'Verifikator Tahap 1',
    icon: 'Building2',
  },
  kabid: {
    email: 'kabid@diskominfo.go.id',
    label: 'Kepala Bidang (Aptika)',
    badge: 'Verifikator Tahap 2',
    icon: 'Briefcase',
  },
  kadis: {
    email: 'kadis@diskominfo.go.id',
    label: 'Kepala Diskominfo',
    badge: 'Otorisasi Akhir Tahap 3',
    icon: 'Award',
  },
  mentor: {
    email: 'mentor@diskominfo.go.id',
    label: 'Pembimbing Lapangan',
    badge: 'Mentor Aptika',
    icon: 'Users',
  },
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setTokenState] = useState(getToken());
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    if (!getToken()) {
      setUser(null);
      setLoading(false);
      return;
    }

    const res = await apiRequest('/auth/me');
    if (res.success && res.data) {
      setUser(res.data);
    } else {
      setUser(null);
      setToken(null);
      setTokenState('');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const login = async (email, password) => {
    const res = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (res.success && res.data) {
      setToken(res.data.token);
      setTokenState(res.data.token);
      setUser(res.data.user);
      return { success: true };
    }

    return { success: false, message: res.message || 'Login gagal' };
  };

  const logout = async () => {
    await apiRequest('/auth/logout', { method: 'POST' });
    setToken(null);
    setTokenState('');
    setUser(null);
  };

  const quickSwitchRole = async (roleKey) => {
    const target = DEMO_ACCOUNTS[roleKey];
    if (!target) return;
    setLoading(true);
    const res = await login(target.email, 'password123');
    setLoading(false);
    return res;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        fetchProfile,
        quickSwitchRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

