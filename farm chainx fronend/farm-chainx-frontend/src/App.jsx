// src/App.jsx
import React from "react";
import { Routes, Route } from "react-router-dom";

// Importing all pages
import HomePage from "./pages/HomePage";
import FarmerLogin from "./pages/FarmerLogin";
import DistributorLogin from "./pages/DistributorLogin";
import RetailerLogin from "./pages/RetailerLogin";
import ConsumerLogin from "./pages/ConsumerLogin";
import AdminLogin from "./pages/AdminLogin";
import RegisterPage from "./pages/RegisterPage";
import Dashboard from "./pages/Dashboard";

// Dashboards
import FarmerDashboard from "./pages/FarmerDashboard";
import DistributorDashboard from "./pages/DistributorDashboard";
import RetailerDashboard from "./pages/RetailerDashboard";
import ConsumerDashboard from "./pages/ConsumerDashboard";
import AdminDashboard from "./pages/AdminDashboard";



// ✅ No BrowserRouter here (it's already in main.jsx)
function App() {
  return (
    <Routes>
      {/* Home */}
      <Route path="/" element={<HomePage />} />

      {/* Logins */}
      <Route path="/farmer-login" element={<FarmerLogin />} />
      <Route path="/distributor-login" element={<DistributorLogin />} />
      <Route path="/retailer-login" element={<RetailerLogin />} />
      <Route path="/consumer-login" element={<ConsumerLogin />} />
      <Route path="/admin-login" element={<AdminLogin />} />

      {/* Dashboards */}
      <Route path="/farmer-dashboard" element={<FarmerDashboard />} />
      <Route path="/distributor-dashboard" element={<DistributorDashboard />} />
      <Route path="/retailer-dashboard" element={<RetailerDashboard />} />
      <Route path="/consumer-dashboard" element={<ConsumerDashboard />} />
      <Route path="/admin-dashboard" element={<AdminDashboard />} />

      {/* Registration */}
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/register/:role" element={<RegisterPage />} />

    

      {/* Common Dashboard route */}
      <Route path="/home" element={<Dashboard />} />
    </Routes>
  );
}

export default App;
