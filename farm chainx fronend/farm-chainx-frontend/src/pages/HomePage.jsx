

import React from "react";
import { useNavigate } from "react-router-dom";

export default function HomePage() {
  const navigate = useNavigate();

  const roles = [
    {
      title: "Farmer",
      emoji: "🌾",
      desc: "Manage your crops, track sales, and connect with distributors.",
      path: "/farmer-login",
      color: "#2e7d32",
    },
    {
      title: "Distributor",
      emoji: "🚚",
      desc: "Buy from farmers and distribute to retailers seamlessly.",
      path: "/distributor-login",
      color: "#0277bd",
    },
    {
      title: "Retailer",
      emoji: "🏪",
      desc: "Access fresh produce directly from trusted distributors.",
      path: "/retailer-login",
      color: "#f57c00",
    },
    {
      title: "Consumer",
      emoji: "🛒",
      desc: "Buy quality produce and trace its source with transparency.",
      path: "/consumer-login",
      color: "#6a1b9a",
    },
    {
      title: "Admin",
      emoji: "🧑‍💼",
      desc: "Monitor and manage the entire supply chain efficiently.",
      path: "/admin-login",
      color: "#c62828",
    },
  ];

  const containerStyle = {
    textAlign: "center",
    marginTop: 50,
  };

  const gridStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "25px",
    marginTop: 40,
    padding: "0 40px",
  };

  const cardStyle = (color) => ({
    background: "#fff",
    borderRadius: 12,
    padding: "25px 20px",
    boxShadow: "0 6px 16px rgba(0,0,0,0.1)",
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
    cursor: "pointer",
    borderTop: `5px solid ${color}`,
  });

  const cardHover = {
    transform: "translateY(-6px)",
    boxShadow: "0 10px 22px rgba(0,0,0,0.15)",
  };

  return (
    <div style={containerStyle}>
      <h1 style={{ color: "#1f7a45", fontSize: 36, fontWeight: "700" }}>
        🌿 Farm ChainX Portal
      </h1>
      <p style={{ color: "#666", fontSize: 16, maxWidth: 700, margin: "12px auto" }}>
        Connect all stakeholders — from farmers to consumers — in a transparent
        and efficient supply chain network.
      </p>
      <h2 style={{ marginTop: 20, color: "#333", fontSize: 22, fontWeight: "600" }}>
        Choose your role to continue in the Farm ChainX network
      </h2>


      <div style={gridStyle}>
        {roles.map((role, index) => (
          <div
            key={index}
            style={cardStyle(role.color)}
            onClick={() => navigate(role.path)}
            onMouseEnter={(e) => Object.assign(e.currentTarget.style, cardHover)}
            onMouseLeave={(e) =>
              Object.assign(e.currentTarget.style, cardStyle(role.color))
            }
          >
            <div style={{ fontSize: 45 }}>{role.emoji}</div>
            <h3 style={{ color: role.color, marginTop: 10 }}>{role.title}</h3>
            <p style={{ color: "#555", fontSize: 14, lineHeight: 1.5 }}>
              {role.desc}
            </p>
            <button
              style={{
                marginTop: 15,
                padding: "10px 16px",
                border: "none",
                background: role.color,
                color: "#fff",
                borderRadius: 8,
                cursor: "pointer",
                fontWeight: 500,
              }}
            >
              Login
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
