// src/App.tsx
import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import { Link as RouterLink } from 'react-router-dom';

// Lazy load pages for better initial load time
const FeedPage = lazy(() => import('./pages/FeedPage'));
const AuthPage = lazy(() => import('./pages/AuthPage'));
const UserProfilePage = lazy(() => import('./pages/UserProfilePage'));
const PostDetailPage = lazy(() => import('./pages/PostDetailPage'));
const SearchResultsPage = lazy(() => import('./pages/SearchResultsPage'));

const LoadingFallback: React.FC = () => (
  <div className="flex justify-center items-center h-screen">
    <p className="text-xl text-gray-500">Loading page...</p>
  </div>
);

// Layout component to conditionally render Navbar
const Layout: React.FC<{children: React.ReactNode}> = ({ children }) => {
    const location = useLocation();
    // Paths where Navbar should not be shown
    const noNavPaths = ['/auth']; 

    return (
        <>
            {!noNavPaths.includes(location.pathname.toLowerCase()) && <Navbar />}
            <main className={`pb-8 ${!noNavPaths.includes(location.pathname.toLowerCase()) ? 'pt-4' : ''}`}>
              {children}
            </main>
        </>
    );
}

// Redirect if logged in and trying to access /auth
const AuthRedirect: React.FC = () => {
  const { user, isLoading } = useAuth();
  if (isLoading) return <LoadingFallback />;
  return user ? <Navigate to="/" replace /> : <AuthPage />;
};


const AppRoutes: React.FC = () => (
  <Layout>
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<FeedPage />} />
        <Route path="/auth" element={<AuthRedirect />} /> {/* Handles redirect for logged-in users */}
        <Route path="/search" element={<SearchResultsPage />} />
        <Route path="/profile/:userId" element={<UserProfilePage />} />
        <Route path="/post/:postId" element={<PostDetailPage />} />

        {/* Example of a page that requires login:
        <Route path="/create" element={<ProtectedRoute />}>
          <Route index element={<CreateSomethingPage />} />
        </Route>
        */}
        
        {/* Fallback for unmatched routes */}
        <Route path="*" element={
          <div className="text-center p-10">
            <h1 className="text-3xl font-bold">404 - Page Not Found</h1>
            <p className="mt-4">The page you are looking for does not exist.</p>
            <RouterLink to="/" className="mt-6 inline-block bg-pink-500 text-white px-6 py-2 rounded hover:bg-pink-600">
              Go to Homepage
            </RouterLink>
          </div>
        } />
      </Routes>
    </Suspense>
  </Layout>
);

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
};

export default App;