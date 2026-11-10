import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { PlatformProvider } from './context/PlatformContext';
import { Layout } from './components/layout/Layout';

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

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <PlatformProvider>
          <Layout>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/explore" element={<ExplorePage />} />
              <Route path="/categories" element={<CategoriesPage />} />
              <Route path="/creations/:slug" element={<CreationDetailPage />} />
              <Route path="/collections" element={<CollectionsPage />} />
              <Route path="/collections/:slug" element={<CollectionDetailPage />} />
              <Route path="/creators" element={<CreatorsPage />} />
              <Route path="/creators/:username" element={<CreatorProfilePage />} />
              <Route path="/submit" element={<SubmitPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/moderation" element={<ModerationPage />} />
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
