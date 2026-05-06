import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import DeveloperRoute from './components/DeveloperRoute';

const LoginPage      = lazy(() => import('./pages/LoginPage'));
const OnboardingPage = lazy(() => import('./pages/OnboardingPage'));
const DashboardPage  = lazy(() => import('./pages/DashboardPage'));
const DashboardHome  = lazy(() => import('./pages/Dashboard/DashboardHome'));
const AppointmentsPage = lazy(() => import('./pages/Appointments/AppointmentsPage'));
const ClientsPage    = lazy(() => import('./pages/Customers/ClientsPage'));
const ServicesPage   = lazy(() => import('./pages/Services/ServicesPage'));
const ReportsPage    = lazy(() => import('./pages/Reports/ReportsPage'));
const SettingsPage   = lazy(() => import('./pages/Settings/SettingsPage'));
const StaffPage      = lazy(() => import('./pages/Staff/StaffPage'));
const KpiPage        = lazy(() => import('./pages/KPI/KpiPage'));
const DeveloperPage  = lazy(() => import('./pages/DeveloperPage'));

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route
                path="/onboarding"
                element={
                  <ProtectedRoute>
                    <OnboardingPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              >
                <Route index element={<DashboardHome />} />
                <Route path="appointments" element={<AppointmentsPage />} />
                <Route path="clients" element={<ClientsPage />} />
                <Route path="services" element={<ServicesPage />} />
                <Route path="reports" element={<ReportsPage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="staff" element={<StaffPage />} />
                <Route path="kpi" element={<KpiPage />} />
              </Route>
              <Route
                path="/developer"
                element={
                  <DeveloperRoute>
                    <DeveloperPage />
                  </DeveloperRoute>
                }
              />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
