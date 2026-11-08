import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import '@fontsource-variable/unbounded';
import '@fontsource-variable/instrument-sans';
import './styles/base.css';
import './styles/ui.css';
import './styles/landing.css';
import './styles/cinematic-home.css';
import './styles/pages.css';
import './styles/account.css';
import './styles/admin.css';
import './styles/responsive.css';
import './styles/refine.css';
import './styles/refresh.css';
import App from './App';
import SmoothScroll from './components/system/SmoothScroll';
import { ToastProvider } from './contexts/ToastContext';
import { ConfigProvider } from './contexts/ConfigContext';
import { AuthProvider } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import { CartProvider } from './contexts/CartContext';

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <ConfigProvider>
      <ToastProvider>
        <AuthProvider>
          <SocketProvider>
            <CartProvider>
              <SmoothScroll />
              <App />
            </CartProvider>
          </SocketProvider>
        </AuthProvider>
      </ToastProvider>
    </ConfigProvider>
  </BrowserRouter>
);
