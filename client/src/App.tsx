import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { AppLayout } from './components/layout/AppLayout';

// Lazy Loaded Feature Pages
const OverviewPage = React.lazy(() =>
  import('./features/overview/OverviewPage').then((m) => ({ default: m.OverviewPage }))
);
const OrdersListPage = React.lazy(() =>
  import('./features/orders/OrdersListPage').then((m) => ({ default: m.OrdersListPage }))
);
const ProductsListPage = React.lazy(() =>
  import('./features/products/ProductsListPage').then((m) => ({ default: m.ProductsListPage }))
);
const ReturnsListPage = React.lazy(() =>
  import('./features/returns/ReturnsListPage').then((m) => ({ default: m.ReturnsListPage }))
);
const ShippingListPage = React.lazy(() =>
  import('./features/shipping/ShippingListPage').then((m) => ({ default: m.ShippingListPage }))
);
const ExpensesListPage = React.lazy(() =>
  import('./features/expenses/ExpensesListPage').then((m) => ({ default: m.ExpensesListPage }))
);
const AnalyticsPage = React.lazy(() =>
  import('./features/analytics/AnalyticsPage').then((m) => ({ default: m.AnalyticsPage }))
);
const AiInsightsPage = React.lazy(() =>
  import('./features/ai-insights/AiInsightsPage').then((m) => ({ default: m.AiInsightsPage }))
);
const ReportsPage = React.lazy(() =>
  import('./features/reports/ReportsPage').then((m) => ({ default: m.ReportsPage }))
);
const SettingsPage = React.lazy(() =>
  import('./features/settings/SettingsPage').then((m) => ({ default: m.SettingsPage }))
);

// Lazy Loaded Auth & Landing Pages
const LandingPage = React.lazy(() =>
  import('./features/landing/LandingPage').then((m) => ({ default: m.LandingPage }))
);
const LoginPage = React.lazy(() =>
  import('./features/auth/LoginPage').then((m) => ({ default: m.LoginPage }))
);
const RegisterPage = React.lazy(() =>
  import('./features/auth/RegisterPage').then((m) => ({ default: m.RegisterPage }))
);
const ForgotPasswordPage = React.lazy(() =>
  import('./features/auth/ForgotPasswordPage').then((m) => ({ default: m.ForgotPasswordPage }))
);
const ResetPasswordPage = React.lazy(() =>
  import('./features/auth/ResetPasswordPage').then((m) => ({ default: m.ResetPasswordPage }))
);

const PageFallbackSpinner: React.FC = () => (
  <div className="min-h-[50vh] flex items-center justify-center">
    <div className="w-7 h-7 border-3 border-[#176B57] border-t-transparent rounded-full animate-spin" />
  </div>
);

const GlobalLoadingSpinner: React.FC = () => (
  <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center">
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-3 border-[#176B57] border-t-transparent rounded-full animate-spin" />
      <span className="text-xs font-semibold text-[#737983]">Loading ProfitPilot...</span>
    </div>
  </div>
);

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <GlobalLoadingSpinner />;
  }

  if (!user) {
    return <Navigate to="/welcome" replace />;
  }

  return <>{children}</>;
};

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <GlobalLoadingSpinner />;
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Suspense fallback={<GlobalLoadingSpinner />}>
            <Routes>
              {/* Public Marketing Landing Route */}
              <Route path="/welcome" element={<LandingPage />} />

              {/* Public Auth Routes */}
              <Route
                path="/login"
                element={
                  <PublicRoute>
                    <LoginPage />
                  </PublicRoute>
                }
              />
              <Route
                path="/register"
                element={
                  <PublicRoute>
                    <RegisterPage />
                  </PublicRoute>
                }
              />
              <Route
                path="/forgot-password"
                element={
                  <PublicRoute>
                    <ForgotPasswordPage />
                  </PublicRoute>
                }
              />
              <Route
                path="/reset-password"
                element={
                  <PublicRoute>
                    <ResetPasswordPage />
                  </PublicRoute>
                }
              />

              {/* Protected Application Routes */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                <Route
                  index
                  element={
                    <Suspense fallback={<PageFallbackSpinner />}>
                      <OverviewPage />
                    </Suspense>
                  }
                />
                <Route
                  path="orders"
                  element={
                    <Suspense fallback={<PageFallbackSpinner />}>
                      <OrdersListPage />
                    </Suspense>
                  }
                />
                <Route
                  path="products"
                  element={
                    <Suspense fallback={<PageFallbackSpinner />}>
                      <ProductsListPage />
                    </Suspense>
                  }
                />
                <Route
                  path="returns"
                  element={
                    <Suspense fallback={<PageFallbackSpinner />}>
                      <ReturnsListPage />
                    </Suspense>
                  }
                />
                <Route
                  path="shipping"
                  element={
                    <Suspense fallback={<PageFallbackSpinner />}>
                      <ShippingListPage />
                    </Suspense>
                  }
                />
                <Route
                  path="expenses"
                  element={
                    <Suspense fallback={<PageFallbackSpinner />}>
                      <ExpensesListPage />
                    </Suspense>
                  }
                />
                <Route
                  path="analytics"
                  element={
                    <Suspense fallback={<PageFallbackSpinner />}>
                      <AnalyticsPage />
                    </Suspense>
                  }
                />
                <Route
                  path="ai-insights"
                  element={
                    <Suspense fallback={<PageFallbackSpinner />}>
                      <AiInsightsPage />
                    </Suspense>
                  }
                />
                <Route
                  path="reports"
                  element={
                    <Suspense fallback={<PageFallbackSpinner />}>
                      <ReportsPage />
                    </Suspense>
                  }
                />
                <Route
                  path="settings"
                  element={
                    <Suspense fallback={<PageFallbackSpinner />}>
                      <SettingsPage />
                    </Suspense>
                  }
                />
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
};

export default App;
