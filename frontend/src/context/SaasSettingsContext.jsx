import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { isAiAnalysisEnabled, loadSaasAiSettings, saveSaasAiSettings } from '../utils/saasAiSettings';

const SaasSettingsContext = createContext(null);

export function SaasSettingsProvider({ children }) {
  const [settings, setSettings] = useState(() => loadSaasAiSettings());

  const setAiAnalysisEnabled = useCallback((enabled) => {
    const next = saveSaasAiSettings({ aiAnalysisEnabled: enabled });
    setSettings(next);
    return next;
  }, []);

  const value = useMemo(
    () => ({
      settings,
      aiAnalysisEnabled: settings.aiAnalysisEnabled !== false,
      setAiAnalysisEnabled,
      refreshSettings: () => setSettings(loadSaasAiSettings()),
    }),
    [settings, setAiAnalysisEnabled],
  );

  return (
    <SaasSettingsContext.Provider value={value}>{children}</SaasSettingsContext.Provider>
  );
}

export function useSaasSettings() {
  const ctx = useContext(SaasSettingsContext);
  if (!ctx) {
    return {
      settings: loadSaasAiSettings(),
      aiAnalysisEnabled: isAiAnalysisEnabled(),
      setAiAnalysisEnabled: (enabled) => saveSaasAiSettings({ aiAnalysisEnabled: enabled }),
      refreshSettings: () => loadSaasAiSettings(),
    };
  }
  return ctx;
}
