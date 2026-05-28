import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import NotebookLayout from './components/NotebookLayout';
import AdminLayout from './components/AdminLayout';
import CMSDashboard from './pages/CMSDashboard';
import VaultExplorer from './pages/VaultExplorer';
import NotePage from './pages/NotePage';
import GraphView from './pages/GraphView';
import Home from './pages/Home';
import JournalTimeline from './pages/JournalTimeline';
import Login from './pages/Login';
import { AuthProvider, useAuth } from './contexts/AuthContext';

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          {/* PUBLIC ROUTES - Accessible to everyone, shows only public notes */}
          <Route path="/" element={
            <NotebookLayout>
              <Home />
            </NotebookLayout>
          } />
          <Route path="/timeline" element={
            <NotebookLayout>
              <JournalTimeline />
            </NotebookLayout>
          } />
          <Route path="/explore" element={
            <NotebookLayout>
              <VaultExplorer />
            </NotebookLayout>
          } />
          <Route path="/graph" element={
            <NotebookLayout>
              <GraphView />
            </NotebookLayout>
          } />
          <Route path="/note/*" element={
            <NotebookLayout>
              <NotePage />
            </NotebookLayout>
          } />

          {/* ADMIN ROUTES - Protected, shows all notes */}
          <Route path="/admin" element={
            <ProtectedRoute>
              <AdminLayout>
                <CMSDashboard />
              </AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/graph" element={
            <ProtectedRoute>
              <AdminLayout>
                <GraphView />
              </AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/note/*" element={
            <ProtectedRoute>
              <AdminLayout>
                <NotePage />
              </AdminLayout>
            </ProtectedRoute>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
