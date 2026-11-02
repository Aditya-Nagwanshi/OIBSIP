import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import PublicLayout from './components/layout/PublicLayout';
import RequireAuth from './components/RequireAuth';
import ScrollToTop from './components/ScrollToTop';
import PageLoader from './components/ui/PageLoader';

const LandingPage = lazy(() => import('./pages/LandingPage'));
const MenuPage = lazy(() => import('./pages/MenuPage'));
const BuilderPage = lazy(() => import('./pages/BuilderPage'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const VerifyEmailPage = lazy(() => import('./pages/VerifyEmailPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const OrderDetailPage = lazy(() => import('./pages/OrderDetailPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const AdminLoginPage = lazy(() => import('./pages/admin/AdminLoginPage'));
const AdminLayout = lazy(() => import('./components/admin/AdminLayout'));
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage'));
const AdminOrdersPage = lazy(() => import('./pages/admin/AdminOrdersPage'));
const AdminInventoryPage = lazy(() => import('./pages/admin/AdminInventoryPage'));
const AdminAlertsPage = lazy(() => import('./pages/admin/AdminAlertsPage'));

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route index element={<LandingPage />} />
            <Route path="menu" element={<MenuPage />} />
            <Route path="build" element={<BuilderPage />} />
            <Route
              path="checkout"
              element={(
                <RequireAuth>
                  <CheckoutPage />
                </RequireAuth>
              )}
            />
            <Route path="login" element={<LoginPage />} />
            <Route path="register" element={<RegisterPage />} />
            <Route path="verify-email" element={<VerifyEmailPage />} />
            <Route path="forgot-password" element={<ForgotPasswordPage />} />
            <Route path="reset-password" element={<ResetPasswordPage />} />
            <Route
              path="dashboard"
              element={(
                <RequireAuth>
                  <DashboardPage />
                </RequireAuth>
              )}
            />
            <Route
              path="orders/:id"
              element={(
                <RequireAuth>
                  <OrderDetailPage />
                </RequireAuth>
              )}
            />
            <Route path="*" element={<NotFoundPage />} />
          </Route>

          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route
            path="/admin"
            element={(
              <RequireAuth admin>
                <AdminLayout />
              </RequireAuth>
            )}
          >
            <Route index element={<AdminDashboardPage />} />
            <Route path="orders" element={<AdminOrdersPage />} />
            <Route path="inventory" element={<AdminInventoryPage />} />
            <Route path="alerts" element={<AdminAlertsPage />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Route>
        </Routes>
      </Suspense>
    </>
  );
}
