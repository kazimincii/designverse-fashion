import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { PhotoSessionProvider } from './contexts/PhotoSessionContext';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import HomePage from './pages/HomePage';
import WorkspacePage from './pages/WorkspacePage';
import StoryEditorPage from './pages/StoryEditorPage';
import StoryViewPage from './pages/StoryViewPage';
import ProfilePage from './pages/ProfilePage';
import FeedPage from './pages/FeedPage';

// Premium Photo Steps
import UploadStep from './pages/premium-photo/UploadStep';
import EnhanceStep from './pages/premium-photo/EnhanceStep';
import VariationsStep from './pages/premium-photo/VariationsStep';
import UpscaleStep from './pages/premium-photo/UpscaleStep';
import AnimateStep from './pages/premium-photo/AnimateStep';

// Reference Management
import ReferenceManagementPage from './pages/ReferenceManagementPage';
import CreateReferencePage from './pages/CreateReferencePage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/workspace" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
            <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
            <Route path="/feed" element={<FeedPage />} />
            <Route path="/story/:id" element={<StoryViewPage />} />
            <Route path="/profile/:handle" element={<ProfilePage />} />

            {/* Protected Routes */}
            <Route path="/workspace" element={<ProtectedRoute><WorkspacePage /></ProtectedRoute>} />
            <Route path="/editor/:storyId?" element={<ProtectedRoute><StoryEditorPage /></ProtectedRoute>} />

            {/* Premium Photo Mode - Multi-step Workflow */}
            <Route path="/premium-photo" element={<ProtectedRoute><PhotoSessionProvider><Navigate to="/premium-photo/upload" replace /></PhotoSessionProvider></ProtectedRoute>} />
            <Route path="/premium-photo/upload" element={<ProtectedRoute><PhotoSessionProvider><UploadStep /></PhotoSessionProvider></ProtectedRoute>} />
            <Route path="/premium-photo/enhance" element={<ProtectedRoute><PhotoSessionProvider><EnhanceStep /></PhotoSessionProvider></ProtectedRoute>} />
            <Route path="/premium-photo/variations" element={<ProtectedRoute><PhotoSessionProvider><VariationsStep /></PhotoSessionProvider></ProtectedRoute>} />
            <Route path="/premium-photo/upscale" element={<ProtectedRoute><PhotoSessionProvider><UpscaleStep /></PhotoSessionProvider></ProtectedRoute>} />
            <Route path="/premium-photo/animate" element={<ProtectedRoute><PhotoSessionProvider><AnimateStep /></PhotoSessionProvider></ProtectedRoute>} />

            {/* Reference Management */}
            <Route path="/references/manage" element={<ProtectedRoute><PhotoSessionProvider><ReferenceManagementPage /></PhotoSessionProvider></ProtectedRoute>} />
            <Route path="/references/create" element={<ProtectedRoute><PhotoSessionProvider><CreateReferencePage /></PhotoSessionProvider></ProtectedRoute>} />
          </Routes>
        </Router>
        <Toaster position="top-right" />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
