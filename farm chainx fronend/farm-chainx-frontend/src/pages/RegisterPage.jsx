// src/pages/RegisterPage.jsx
import React, { useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";

/**
 * RegisterPage
 * - reads role from route param (/register/:role) OR query param ?role=farmer
 * - maps role -> accent color and uses it for title, top stripe, button and links
 */
export default function RegisterPage() {
  const navigate = useNavigate();
  const params = useParams(); // for /register/:role
  const loc = useLocation();
  const qp = new URLSearchParams(loc.search);
  const roleFromQuery = qp.get("role");

  // determine role (defaults to 'user' if none provided)
  const defaultRole = (params.role || roleFromQuery || "user").toLowerCase();

  // map roles to colors (use the same palette as login)
  const ROLE_COLORS = {
    farmer: "#1f7a45",      // green
    retailer: "#f97316",    // orange
    distributor: "#0b78d1", // blue
    consumer: "#7c3aed",    // purple
    admin: "#dc2626",       // red
    user: "#1f7a45",        // fallback (green)
  };

  const accent = ROLE_COLORS[defaultRole] || ROLE_COLORS.user;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      return alert("Please fill all fields");
    }
    // TODO: call real register API
    alert(`Registered ${email} as ${defaultRole}. Redirecting to home...`);
    navigate("/home", { state: { role: defaultRole, email } });
  };

  // styles
  const container = {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    background: "#f6faf6",
    padding: "36px 16px",
  };

  const card = {
    width: 420,
    background: "#fff",
    padding: 28,
    borderRadius: 12,
    boxShadow: "0 8px 20px rgba(0,0,0,0.06)",
    position: "relative",
    overflow: "visible",
  };

  const topStripe = {
    position: "absolute",
    top: -6,
    left: 0,
    right: 0,
    height: 6,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    background: accent,
  };

  const input = {
    width: "100%",
    padding: 10,
    marginBottom: 10,
    borderRadius: 6,
    border: "1px solid #ddd",
    boxSizing: "border-box",
  };

  const submitBtn = {
    width: "100%",
    padding: 12,
    background: accent,
    color: "#fff",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 15,
  };

  // friendly display name for title
  const displayRole = defaultRole.charAt(0).toUpperCase() + defaultRole.slice(1);

  return (
    <div style={container}>
      <div style={card}>
        <div style={topStripe} aria-hidden />
        <h2 style={{ color: accent, marginBottom: 6 }}>
          Register as {displayRole}
        </h2>
        <p style={{ color: "#666", marginTop: 0, marginBottom: 18 }}>
          Create an account to continue
        </p>

        <form onSubmit={handleRegister}>
          <input
            style={input}
            placeholder="Full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <input
            style={input}
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            style={{ ...input, marginBottom: 14 }}
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button type="submit" style={submitBtn}>
            Register
          </button>
        </form>
      </div>
    </div>
  );
}
