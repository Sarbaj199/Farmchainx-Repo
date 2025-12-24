import React from "react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer style={footerStyle}>
      <div style={containerStyle}>
        
        {/* Main Content */}
        <div style={contentStyle}>
          <div style={brandStyle}>
            <h3 style={titleStyle}>🌿 Farm ChainX</h3>
            <p style={descriptionStyle}>
              Transforming agriculture through transparent supply chains
            </p>
          </div>

          {/* Quick Links */}
          <div style={linksStyle}>
            <Link to="/farmer-login" style={linkStyle}>Farmers</Link>
            <Link to="/distributor-login" style={linkStyle}>Distributors</Link>
            <Link to="/retailer-login" style={linkStyle}>Retailers</Link>
            <Link to="/consumer-login" style={linkStyle}>Consumers</Link>
          </div>
        </div>

        {/* Bottom Bar */}
        <div style={bottomStyle}>
          <p style={copyrightStyle}>
            © {new Date().getFullYear()} Farm ChainX. All rights reserved.
          </p>
          <div style={linksBottomStyle}>
            <Link to="/privacy" style={bottomLinkStyle}>Privacy</Link>
            <span style={separatorStyle}>•</span>
            <Link to="/terms" style={bottomLinkStyle}>Terms</Link>
            <span style={separatorStyle}>•</span>
            <Link to="/contact" style={bottomLinkStyle}>Contact</Link>
          </div>
        </div>

      </div>
    </footer>
  );
};

// Styles
const footerStyle = {
  background: "linear-gradient(135deg, #1f7a45 0%, #2e7d32 100%)",
  color: "white",
  padding: "30px 20px 20px 20px",
  marginTop: "20px"
};

const containerStyle = {
  maxWidth: "1200px",
  margin: "0 auto"
};

const contentStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "20px",
  flexWrap: "wrap",
  gap: "20px"
};

const brandStyle = {
  flex: "1",
  minWidth: "200px"
};

const titleStyle = {
  fontSize: "1.5rem",
  fontWeight: "700",
  margin: "0 0 8px 0"
};

const descriptionStyle = {
  margin: "0",
  fontSize: "14px",
  opacity: "0.9"
};

const linksStyle = {
  display: "flex",
  gap: "20px",
  flexWrap: "wrap"
};

const linkStyle = {
  color: "white",
  textDecoration: "none",
  fontSize: "14px",
  fontWeight: "500",
  opacity: "0.9",
  transition: "opacity 0.2s"
};

const bottomStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  paddingTop: "20px",
  borderTop: "1px solid rgba(255,255,255,0.2)",
  flexWrap: "wrap",
  gap: "10px"
};

const copyrightStyle = {
  margin: "0",
  fontSize: "14px",
  opacity: "0.8"
};

const linksBottomStyle = {
  display: "flex",
  gap: "10px",
  alignItems: "center"
};

const bottomLinkStyle = {
  color: "white",
  textDecoration: "none",
  fontSize: "13px",
  opacity: "0.7",
  transition: "opacity 0.2s"
};

const separatorStyle = {
  opacity: "0.5",
  fontSize: "12px"
};

// Add hover effects
Object.assign(linkStyle, {
  ':hover': {
    opacity: "1"
  }
});

Object.assign(bottomLinkStyle, {
  ':hover': {
    opacity: "1"
  }
});

export default Footer;