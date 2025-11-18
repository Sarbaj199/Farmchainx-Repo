// src/pages/RetailerLogin.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import LoginCard from "../components/ui/LoginCard";

export default function RetailerLogin() {
  const navigate = useNavigate();

  const handleLogin = ({ email }) => {
    console.log("Retailer logged in:", email);
    navigate("/retailer-dashboard");
  };

  return (
    <LoginCard
      title="Retailer Login"
      onSubmit={handleLogin}
      showBack={true}
      primaryColor="#f97316" // orange-500
      linkColor="#f97316"
      registerPath="/register?role=retailer"
    />
  );
}
