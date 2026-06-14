import { AppProvider } from './context/AppContext';
import { BatchProvider } from './context/BatchContext';
import { CameraProvider } from './context/CameraContext';
import { HistoryProvider } from './context/HistoryContext';
import { SaasAssetsProvider } from './context/SaasAssetsContext';
import { SaasSettingsProvider } from './context/SaasSettingsContext';
import { V6Provider } from './context/V6SessionContext';
import { ToastContainer } from './components/ui/Toast';
import { AppRouter } from './router/AppRouter';
import { V6_DEMO_ENABLED, SAAS_MODULE_ENABLED } from './config/features';

function AppShell() {
  return (
    <>
      <AppRouter />
      <ToastContainer />
    </>
  );
}

function CoreProviders({ children }) {
  return (
    <AppProvider>
      <CameraProvider>
        <HistoryProvider>
          <BatchProvider>{children}</BatchProvider>
        </HistoryProvider>
      </CameraProvider>
    </AppProvider>
  );
}

export default function App() {
  let tree = <AppShell />;

  if (SAAS_MODULE_ENABLED) {
    tree = (
      <SaasSettingsProvider>
        <SaasAssetsProvider>{tree}</SaasAssetsProvider>
      </SaasSettingsProvider>
    );
  }
  if (V6_DEMO_ENABLED) {
    tree = <V6Provider>{tree}</V6Provider>;
  }

  return <CoreProviders>{tree}</CoreProviders>;
}
