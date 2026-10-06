import { useCallback, useEffect, useState } from 'react';
import { apiRequest } from '../api';

export default function useDivisions() {
  const [divisions, setDivisions] = useState([]);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    const response = await apiRequest('/divisions');
    if (!response.success) {
      setError(response.message || 'Data kuota bidang gagal diperbarui.');
      return;
    }

    setDivisions(response.data || []);
    setError('');
  }, []);

  useEffect(() => {
    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') {
        refresh();
      }
    };
    const interval = window.setInterval(refreshWhenVisible, 15000);

    refresh();
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refreshWhenVisible);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
    };
  }, [refresh]);

  return { divisions, error, refresh };
}
