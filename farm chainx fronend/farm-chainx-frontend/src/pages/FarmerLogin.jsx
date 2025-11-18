// src/pages/FarmerLogin.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import LoginCard from "../components/ui/LoginCard";

export default function FarmerLogin() {
  const navigate = useNavigate();

  const handleLogin = ({ email }) => {
    console.log("Farmer logged in:", email);
    navigate("/farmer-dashboard");
  };

  return (
    <LoginCard
      title="Farmer Login"
      onSubmit={handleLogin}
      showBack={true}
      primaryColor="#1f7a45" // green (default)
      linkColor="#1f7a45"
      registerPath="/register?role=farmer" 
    />
  );
}

