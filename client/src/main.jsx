import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import '@fontsource/fredoka/400.css';
import '@fontsource/fredoka/500.css';
import '@fontsource/fredoka/600.css';
import '@fontsource/fredoka/700.css';
import '@fontsource/manrope/300.css';
import '@fontsource/manrope/400.css';
import '@fontsource/manrope/500.css';
import '@fontsource/manrope/600.css';
import '@fontsource/manrope/700.css';
import './styles/base.css';
import './styles/ui.css';
import './styles/landing.css';
import './styles/cinematic-home.css';
import './styles/pages.css';
import './styles/account.css';
import './styles/admin.css';
import './styles/responsive.css';
import './styles/refine.css';
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
