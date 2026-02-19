import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import RequestList from './pages/RequestList';
import RequestDetail from './pages/RequestDetail';
import ApprovalPage from './pages/ApprovalPage';
import ExportPage from './pages/ExportPage';
import AdminPage from './pages/AdminPage';
import LoginPage from './pages/LoginPage';
import './App.css';

function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const { currentUser, hasRole } = useAuth();
  if (!currentUser) return <Navigate to="/login" replace />;
  if (roles && !hasRole(...(roles as ('user' | 'approver' | 'admin')[]))) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

export default function App() {
  const { currentUser } = useAuth();

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={currentUser ? <Navigate to="/" replace /> : <LoginPage />} />
        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/requests" element={<RequestList />} />
          <Route path="/requests/:id" element={<RequestDetail />} />
          <Route path="/approvals" element={
            <ProtectedRoute roles={['approver', 'admin']}><ApprovalPage /></ProtectedRoute>
          } />
          <Route path="/export" element={
            <ProtectedRoute roles={['approver', 'admin']}><ExportPage /></ProtectedRoute>
          } />
          <Route path="/admin" element={
            <ProtectedRoute roles={['admin']}><AdminPage /></ProtectedRoute>
          } />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
