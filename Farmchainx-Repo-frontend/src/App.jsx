// src/App.jsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import "./App.css";

// --- 1. IMPORT THE CHATBOT WIDGET ---
// Adjust the path './components/' if your file is in a different folder
import FloatingChatbotWidget from './components/FloatingChatbotWidget'; 

// Importing all pages
import HomePage from "./pages/HomePage";
import FarmerLogin from "./pages/FarmerLogin";
import DistributorLogin from "./pages/DistributorLogin";
import RetailerLogin from "./pages/RetailerLogin";
import ConsumerLogin from "./pages/ConsumerLogin";
import AdminLogin from "./pages/AdminLogin";

// Dashboards
import FarmerDashboard from "./pages/FarmerDashboard";
import DistributorDashboard from "./pages/DistributorDashboard";
import RetailerDashboard from "./pages/RetailerDashboard";
import CustomerDashboard from "./pages/ConsumerDashboard";
import AdminDashboard from "./pages/AdminDashboard";

// Route Protection Component
const ProtectedRoute = ({ children, requiredRole = null }) => {
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('userRole');
  
  if (!token) return <Navigate to="/" replace />;
  
  if (requiredRole && userRole !== requiredRole) {
    switch (userRole) {
      case 'FARMER': return <Navigate to="/farmer-dashboard" replace />;
      case 'DISTRIBUTOR': return <Navigate to="/distributor-dashboard" replace />;
      case 'RETAILER': return <Navigate to="/retailer-dashboard" replace />;
      case 'CONSUMER': return <Navigate to="/consumer-dashboard" replace />;
      case 'ADMIN': return <Navigate to="/admin-dashboard" replace />;
      default: return <Navigate to="/" replace />;
    }
  }
  return children;
};

// Public Route Component
const PublicRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('userRole');
  
  if (token) {
    switch (userRole) {
      case 'FARMER': return <Navigate to="/farmer-dashboard" replace />;
      case 'DISTRIBUTOR': return <Navigate to="/distributor-dashboard" replace />;
      case 'RETAILER': return <Navigate to="/retailer-dashboard" replace />;
      case 'CONSUMER': return <Navigate to="/consumer-dashboard" replace />;
      case 'ADMIN': return <Navigate to="/admin-dashboard" replace />;
      default: return <Navigate to="/" replace />;
    }
  }
  return children;
};

function App() {
  return (
    <div className="app-wrapper">
      {/* --- 2. RENDER THE CHATBOT HERE --- */}
      {/* It is outside <Routes> so it never disappears during navigation */}
      <FloatingChatbotWidget />

      <Routes>
        {/* Home - Public */}
        <Route path="/" element={
          <PublicRoute>
            <HomePage />
          </PublicRoute>
        } />

        {/* Logins - Public */}
        <Route path="/farmer-login" element={<PublicRoute><FarmerLogin /></PublicRoute>} />
        <Route path="/distributor-login" element={<PublicRoute><DistributorLogin /></PublicRoute>} />
        <Route path="/retailer-login" element={<PublicRoute><RetailerLogin /></PublicRoute>} />
        <Route path="/consumer-login" element={<PublicRoute><ConsumerLogin /></PublicRoute>} />
        <Route path="/admin-login" element={<PublicRoute><AdminLogin /></PublicRoute>} />

        {/* Dashboards - Protected by role */}
        <Route path="/farmer-dashboard" element={
          <ProtectedRoute requiredRole="FARMER">
            <FarmerDashboard />
          </ProtectedRoute>
        } />
        <Route path="/distributor-dashboard" element={
          <ProtectedRoute requiredRole="DISTRIBUTOR">
            <DistributorDashboard />
          </ProtectedRoute>
        } />
        <Route path="/retailer-dashboard" element={
          <ProtectedRoute requiredRole="RETAILER">
            <RetailerDashboard />
          </ProtectedRoute>
        } />
        <Route path="/consumer-dashboard" element={
          <ProtectedRoute requiredRole="CONSUMER">
            <CustomerDashboard />
          </ProtectedRoute>
        } />
        <Route path="/admin-dashboard" element={
          <ProtectedRoute requiredRole="ADMIN">
            <AdminDashboard />
          </ProtectedRoute>
        } />
          
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;