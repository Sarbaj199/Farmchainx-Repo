// src/pages/ConsumerLogin.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import LoginCard from "../components/ui/LoginCard";

export default function ConsumerLogin() {
  const navigate = useNavigate();

  const handleLogin = ({ email }) => {
    console.log("Consumer logged in:", email);
    navigate("/consumer-dashboard");
  };

  return (
    <LoginCard
      title="Consumer Login"
      onSubmit={handleLogin}
      showBack={true}
      primaryColor="#7c3aed" // purple
      linkColor="#7c3aed"
      registerPath="/register?role=consumer"
    />
  );
}
