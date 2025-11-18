// src/pages/AdminLogin.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import LoginCard from "../components/ui/LoginCard";

export default function AdminLogin() {
  const navigate = useNavigate();

  const handleLogin = ({ email }) => {
    console.log("Admin logged in:", email);
    navigate("/admin-dashboard");
  };

  return (
    <LoginCard
      title="Admin Login"
      onSubmit={handleLogin}
      showBack={true}
      primaryColor="#dc2626" // red
      linkColor="#dc2626"
      registerPath="/register?role=admin"
      
    />
  );
}

