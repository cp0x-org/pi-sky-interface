import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import App from 'App';
import { store } from 'store';
import * as serviceWorker from 'serviceWorker';
import reportWebVitals from 'reportWebVitals';
import { ConfigProvider } from 'contexts/ConfigContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { Buffer } from 'buffer';
import RainbowKitThemeProvider from 'components/RainbowKitThemeProvider';

import 'assets/scss/style.scss';
import 'mapbox-gl/dist/mapbox-gl.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/700.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import '@fontsource/poppins/400.css';
import '@fontsource/poppins/500.css';
import '@fontsource/poppins/600.css';
import '@fontsource/poppins/700.css';
import { createWagmiConfig } from './wagmi-config';

globalThis.Buffer = Buffer;
const queryClient = new QueryClient();

async function init() {
  try {
    const wagmiConfig = await createWagmiConfig();

    const container = document.getElementById('root');
    const root = createRoot(container!);

    root.render(
      <Provider store={store}>
        <ConfigProvider>
          <WagmiProvider reconnectOnMount={false} config={wagmiConfig}>
            <QueryClientProvider client={queryClient}>
              <RainbowKitThemeProvider>
                <App />
              </RainbowKitThemeProvider>
            </QueryClientProvider>
          </WagmiProvider>
        </ConfigProvider>
      </Provider>
    );
  } catch (err) {
    console.error('Failed to start app:', err);
  }
}

init();

// сервис воркер
serviceWorker.unregister();
reportWebVitals();
