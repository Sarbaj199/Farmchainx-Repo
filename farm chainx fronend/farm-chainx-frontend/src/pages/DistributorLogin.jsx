// src/pages/DistributorLogin.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import LoginCard from "../components/ui/LoginCard";

export default function DistributorLogin() {
  const navigate = useNavigate();

  const handleLogin = ({ email }) => {
    console.log("Distributor logged in:", email);
    navigate("/distributor-dashboard");
  };

  return (
    <LoginCard
      title="Distributor Login"
      onSubmit={handleLogin}
      showBack={true}
      primaryColor="#0b78d1" // blue
      linkColor="#0b78d1"
      registerPath="/register?role=distributor"
    />
  );
}

