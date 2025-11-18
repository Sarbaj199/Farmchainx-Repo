// src/components/ui/LoginCard.jsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";

/**
 * LoginCard
 * Props:
 *  - title (string)
 *  - onSubmit ({email,password}) => void
 *  - showBack (bool)
 *  - onBack (fn)
 *  - registerPath (string)
 *  - primaryColor (string)    // main accent color (button + title + top stripe)
 *  - linkColor (string)       // color for links (defaults to primaryColor)
 */
export default function LoginCard({
  title = "Login",
  onSubmit,
  showBack = true,
  onBack,
  registerPath = "/register",
  primaryColor = "#1f7a45", // default green
  linkColor,
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const accent = primaryColor || "#1f7a45";
  const linkCol = linkColor || accent;

  const submit = (e) => {
    e?.preventDefault();
    if (!email || !password) return alert("Please enter email and password");
    if (typeof onSubmit === "function") onSubmit({ email, password });
  };

  const cardStyle = {
    maxWidth: 420,
    margin: "40px auto",
    padding: 28,
    borderRadius: 12,
    boxShadow: "0 8px 20px rgba(0,0,0,0.08)",
    background: "#fff",
    textAlign: "center",
    fontFamily:
      "Inter, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial",
    position: "relative",
    overflow: "visible",
  };

  // small top stripe like in screenshot
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

  const inputStyle = {
    width: "100%",
    padding: "10px 12px",
    margin: "10px 0",
    borderRadius: 6,
    border: "1px solid #e1e5e9",
    fontSize: 14,
    boxSizing: "border-box",
    outline: "none",
  };

  const primaryBtn = {
    width: "100%",
    padding: "12px 16px",
    background: accent,
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontSize: 16,
    cursor: "pointer",
  };

  const secondaryBtn = {
    width: "100%",
    padding: "10px 16px",
    background: "#f8faf8",
    color: "#333",
    border: "1px solid #e6efea",
    borderRadius: 8,
    marginTop: 10,
    cursor: "pointer",
  };

  const smallText = {
    marginTop: 12,
    fontSize: 13,
    color: "#666",
  };

  return (
    <div style={{ paddingTop: 40 }}>
      <div style={cardStyle}>
        <div style={topStripe} aria-hidden />
        <h2 style={{ color: accent, marginBottom: 8, fontSize: 22 }}>{title}</h2>

        <p style={{ color: "#586069", marginTop: 0, marginBottom: 18, fontSize: 14 }}>
          Enter your credentials to continue
        </p>

        <form onSubmit={submit} style={{ textAlign: "left" }}>
          <label style={{ display: "block", fontSize: 13, color: "#333", marginBottom: 6 }}>
            Email
          </label>
          <input
            style={inputStyle}
            type="email"
            placeholder="you@farmchainx.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <label
            style={{
              display: "block",
              fontSize: 13,
              color: "#333",
              marginTop: 8,
              marginBottom: 6,
            }}
          >
            Password
          </label>

          <div style={{ position: "relative" }}>
            <input
              style={{ ...inputStyle, paddingRight: "44px" }}
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              title={showPassword ? "Hide password" : "Show password"}
              style={{
                position: "absolute",
                right: 8,
                top: "50%",
                transform: "translateY(-50%)",
                border: "none",
                background: "transparent",
                cursor: "pointer",
                color: "#4b5563",
                padding: 6,
              }}
            >
              {showPassword ? <FaEye size={18} /> : <FaEyeSlash size={18} />}
            </button>
          </div>

          <div style={{ textAlign: "right", marginTop: 10 }}>
            <a
              href="#"
              onClick={(ev) => ev.preventDefault()}
              style={{ color: linkCol, fontSize: 13 }}
            >
              Forgot password?
            </a>
          </div>

          <div style={{ marginTop: 16 }}>
            <button type="submit" style={primaryBtn}>
              Login
            </button>
          </div>
        </form>

        {showBack && (
          <button
            onClick={() => (typeof onBack === "function" ? onBack() : window.history.back())}
            style={secondaryBtn}
          >
            ← Back to Home Page
          </button>
        )}

        <div style={smallText}>
          Don’t have an account?{" "}
          <Link to={registerPath} style={{ color: linkCol, textDecoration: "none", fontWeight: 600 }}>
            Register now
          </Link>
        </div>
      </div>
    </div>
  );
}
