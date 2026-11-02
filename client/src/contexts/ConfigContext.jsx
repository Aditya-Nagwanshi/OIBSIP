import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../lib/api';
import { DEFAULT_CONFIG } from '../lib/constants';

const ConfigContext = createContext({ config: DEFAULT_CONFIG, refreshConfig: () => {} });

export function ConfigProvider({ children }) {
  const [config, setConfig] = useState(DEFAULT_CONFIG);

  const refreshConfig = async () => {
    try {
      const data = await api('/catalog/config');
      setConfig((current) => ({ ...current, ...data }));
    } catch {
      // Keep the local defaults when the API is offline.
    }
  };

  useEffect(() => {
    refreshConfig();
  }, []);

  const value = useMemo(() => ({ config, refreshConfig }), [config]);

  return <ConfigContext.Provider value={value}>{children}</ConfigContext.Provider>;
}

export function useConfig() {
  return useContext(ConfigContext);
}
