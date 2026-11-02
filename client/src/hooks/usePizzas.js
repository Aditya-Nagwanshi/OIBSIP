import { useCallback, useEffect, useState } from 'react';
import api from '../lib/api';

export default function usePizzas() {
  const [pizzas, setPizzas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api('/catalog/pizzas');
      setPizzas(data.pizzas || []);
    } catch (caught) {
      setError(caught.message || 'Could not load the menu.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { pizzas, loading, error, reload: load };
}
