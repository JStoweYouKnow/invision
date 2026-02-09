import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ToastProvider } from './contexts/ToastContext';
import { SoundProvider } from './contexts/SoundContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { TooltipProvider } from './components/TooltipSystem';
import { LandingPage } from './pages/LandingPage';
import { Dashboard } from './pages/Dashboard';
import { PlanDetailsPage } from './pages/PlanDetailsPage';
import { CommunityFeed } from './pages/CommunityFeed';
import { ProfilePage } from './pages/ProfilePage';
import { MessagingProvider } from './contexts/MessagingContext';
import { MessagingDrawer } from './components/MessagingDrawer';

// Protected Route Component
const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) return null; // Or a loading spinner

  if (!user) {
    return <Navigate to="/" />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ThemeProvider>
          <ToastProvider>
            <SoundProvider>
              <TooltipProvider>
                <MessagingProvider>
                  <Router>
                    <MessagingDrawer />
                    <Routes>
                      <Route path="/" element={<LandingPage />} />
                      <Route
                        path="/dashboard"
                        element={
                          <PrivateRoute>
                            <Dashboard />
                          </PrivateRoute>
                        }
                      />
                      <Route
                        path="/plan/:id"
                        element={
                          <PrivateRoute>
                            <PlanDetailsPage />
                          </PrivateRoute>
                        }
                      />
                      <Route
                        path="/profile"
                        element={
                          <PrivateRoute>
                            <ProfilePage />
                          </PrivateRoute>
                        }
                      />
                      <Route path="/community" element={<CommunityFeed />} />
                      <Route path="/demo/community" element={<CommunityFeed demoMode={true} />} />
                      <Route path="/demo/profile" element={<ProfilePage demoMode={true} />} />
                      {/* Demo Route for testing */}
                      <Route path="/demo" element={<Dashboard demoMode={true} />} />
                    </Routes>
                  </Router>
                </MessagingProvider>
              </TooltipProvider>
            </SoundProvider>
          </ToastProvider>
        </ThemeProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
