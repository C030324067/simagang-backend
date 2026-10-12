import { useCallback, useEffect, useState } from 'react';
import { apiRequest } from '../api';

export default function useInternshipPeriodStatus() {
  const [period, setPeriod] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    const response = await apiRequest('/internship-periods/current-status');
    if (!response.success) {
      setError(response.message || 'Status kuota pendaftaran gagal dimuat.');
      setPeriod(null);
      setLoading(false);
      return;
    }

    setPeriod(response.data);
    setError('');
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
    const interval = window.setInterval(refresh, 30000);

    return () => window.clearInterval(interval);
  }, [refresh]);

  return { period, loading, error, refresh };
}
