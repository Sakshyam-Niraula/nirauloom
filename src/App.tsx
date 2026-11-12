import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { PlatformProvider } from './context/PlatformContext';
import { Layout } from './components/layout/Layout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

// Pages
import { HomePage } from './pages/HomePage';
import { ExplorePage } from './pages/ExplorePage';
import { CategoriesPage } from './pages/CategoriesPage';
import { CreationDetailPage } from './pages/CreationDetailPage';
import { CollectionsPage } from './pages/CollectionsPage';
import { CollectionDetailPage } from './pages/CollectionDetailPage';
import { CreatorsPage } from './pages/CreatorsPage';
import { CreatorProfilePage } from './pages/CreatorProfilePage';
import { SubmitPage } from './pages/SubmitPage';
import { DashboardPage } from './pages/DashboardPage';
import { ModerationPage } from './pages/ModerationPage';
import { AIDiscoverPage } from './pages/AIDiscoverPage';
import { AuthPage } from './pages/AuthPage';
import { AuthCallbackPage } from './pages/AuthCallbackPage';
import { CommunityPage } from './pages/CommunityPage';
import { GrowthScoutPage } from './pages/GrowthScoutPage';

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <PlatformProvider>
          <Layout>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/explore" element={<ExplorePage />} />
              <Route path="/community" element={<CommunityPage />} />
              <Route path="/categories" element={<CategoriesPage />} />
              <Route path="/creations/:slug" element={<CreationDetailPage />} />
              <Route path="/collections" element={<CollectionsPage />} />
              <Route path="/collections/:slug" element={<CollectionDetailPage />} />
              <Route path="/creators" element={<CreatorsPage />} />
              <Route path="/creators/:username" element={<CreatorProfilePage />} />
              
              {/* Protected Authenticated Routes */}
              <Route 
                path="/submit" 
                element={
                  <ProtectedRoute>
                    <SubmitPage />
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
              />
              <Route 
                path="/moderation" 
                element={
                  <ProtectedRoute adminOnly>
                    <ModerationPage />
                  </ProtectedRoute>
                } 
              />
              
              <Route
                path="/growth-scout"
                element={
                  <ProtectedRoute adminOnly>
                    <Navigate to="/moderation" replace />
                  </ProtectedRoute>
                }
              />
              <Route path="/ai-discover" element={<AIDiscoverPage />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/auth/callback" element={<AuthCallbackPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Layout>
        </PlatformProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
