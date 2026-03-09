import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import HomePage from './pages/HomePage';
import BookPage from './pages/BookPage';
import TrackingPage from './pages/TrackingPage';
import OrdersPage from './pages/OrdersPage';
import DriverDashboard from './pages/DriverDashboard';
import Layout from './components/Layout';

const PrivateRoute = ({ children, role }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (role && user.role !== role) return <Navigate to="/" />;
  return children;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={<HomePage />} />
        <Route path="book" element={<BookPage />} />
        <Route path="track/:orderId" element={<TrackingPage />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="driver" element={<PrivateRoute role="DRIVER"><DriverDashboard /></PrivateRoute>} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            style: { background: '#13131A', color: '#F0F0F8', border: '1px solid #2A2A38', borderRadius: '12px', fontFamily: 'DM Sans, sans-serif' },
            success: { iconTheme: { primary: '#00E599', secondary: '#13131A' } },
            error: { iconTheme: { primary: '#FF4560', secondary: '#13131A' } },
          }}
        />
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
