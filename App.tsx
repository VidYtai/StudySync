
import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, useLocation, Navigate, Outlet } from 'react-router';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { TimerProvider } from './contexts/TimerContext';
import { TutorialProvider } from './contexts/TutorialContext';

import Layout from './components/Layout';
import LandingPage from './pages/LandingPage';
import DashboardPage from './pages/DashboardPage';
import TimetablePage from './pages/TimetablePage';
import TodoPage from './pages/TodoPage';
import RemindersPage from './pages/RemindersPage';
import StudyRoomPage from './pages/StudyRoomPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import SettingsPage from './pages/SettingsPage';

const ScrollToTop = (): null => {
  const { pathname } = useLocation();
  useEffect(() => {
    document.querySelector('.main-content')?.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const ProtectedRoute: React.FC = () => {
    const { user } = useAuth();
    // A real app might have a loading state here
    return user ? <Outlet /> : <Navigate to="/login" replace />;
};

const PublicRoute: React.FC = () => {
    const { user } = useAuth();
    return user ? <Navigate to="/app/dashboard" replace /> : <Outlet />;
};

const AppContent: React.FC = () => {
    return (
        <>
            <ScrollToTop />
            <Routes>
                <Route element={<PublicRoute />}>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/signup" element={<SignupPage />} />
                    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                </Route>

                <Route element={<ProtectedRoute />}>
                    <Route path="/app" element={<Layout />}>
                        <Route index element={<Navigate to="/app/dashboard" replace />} />
                        <Route path="dashboard" element={<DashboardPage />} />
                        <Route path="timetable" element={<TimetablePage />} />
                        <Route path="todo" element={<TodoPage />} />
                        <Route path="reminders" element={<RemindersPage />} />
                        <Route path="study-room" element={<StudyRoomPage />} />
                        <Route path="settings" element={<SettingsPage />} />
                    </Route>
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </>
    );
}

const App: React.FC = () => {
  return (
    <HashRouter>
      <AuthProvider>
        <TimerProvider>
          <TutorialProvider>
            <AppContent />
          </TutorialProvider>
        </TimerProvider>
      </AuthProvider>
    </HashRouter>
  );
};

export default App;