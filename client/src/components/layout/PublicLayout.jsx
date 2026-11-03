import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import MobileDock from './MobileDock';
import CartDrawer from './CartDrawer';
import ScrollProgress from '../ui/ScrollProgress';

export default function PublicLayout() {
  const location = useLocation();
  const hideFooter = ['/checkout'].includes(location.pathname);
  const isHome = location.pathname === '/';

  return (
    <div className={`public-layout${isHome ? ' public-layout--home' : ''}`}>
      <ScrollProgress />
      <Navbar />
      <main id="main-content">
        <Outlet />
      </main>
      {hideFooter ? null : <Footer />}
      <MobileDock />
      <CartDrawer />
      <div className="mobile-dock-spacer" aria-hidden="true" />
    </div>
  );
}
