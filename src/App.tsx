import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import { Suspense, lazy } from 'react';
import './App.css';

// Lazy load pages
const Dashboard = lazy(() => import('./pages/Dashboard'));
const RequestList = lazy(() => import('./pages/RequestList'));
const RequestDetail = lazy(() => import('./pages/RequestDetail'));
const ApprovalPage = lazy(() => import('./pages/ApprovalPage'));
const ExportPage = lazy(() => import('./pages/ExportPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const UpdatePasswordPage = lazy(() => import('./pages/UpdatePasswordPage'));

function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const { currentUser, hasRole } = useAuth();
  if (!currentUser) return <Navigate to="/login" replace />;
  if (roles && !hasRole(...(roles as ('user' | 'approver' | 'admin')[]))) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

function PageLoader() {
  return (
    <div className="page-loading">
      <div className="spinner spinner--lg" />
      <p>กำลังโหลด...</p>
    </div>
  );
}

export default function App() {
  const { currentUser } = useAuth();

  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/login" element={currentUser ? <Navigate to="/" replace /> : <LoginPage />} />
          <Route path="/update-password" element={<UpdatePasswordPage />} />
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
      </Suspense>
    </BrowserRouter>
  );
}
