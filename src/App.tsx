import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { WorkLogProvider } from './context/WorkLogContext';
import { Home } from './pages/Home';
import { AppLayout } from './components/layout/AppLayout';
import { DashboardPage } from './pages/DashboardPage';
import { RecordPage } from './pages/RecordPage';
import { CalendarPage } from './pages/CalendarPage';
import { SearchPage } from './pages/SearchPage';
import { FollowUpsPage } from './pages/FollowUpsPage';
import { CustomFieldsPage } from './pages/CustomFieldsPage';
import { SettingsPage } from './pages/SettingsPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { Loader2 } from 'lucide-react';

const AppRoutes: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F8F5] flex items-center justify-center text-[#737C74]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-forest-600" />
          <p className="text-xs font-semibold uppercase tracking-wider text-[#737C74]">
            Loading WorkTrace...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  return (
    <WorkLogProvider>
      <Routes>
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route element={<AppLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/home" element={<Home />} />
          <Route path="/records" element={<RecordPage />} />
          <Route path="/journal" element={<Navigate to="/records" replace />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/followups" element={<FollowUpsPage />} />
          <Route path="/custom-fields" element={<CustomFieldsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </WorkLogProvider>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
