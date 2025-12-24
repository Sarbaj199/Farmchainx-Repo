import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Footer from "./Footer";
import { 
  ArrowRight, 
  Shield, 
  TrendingUp, 
  Users, 
  Star,
  CheckCircle,
  ArrowRightCircle,
  Leaf,
  Truck,
  Store,
  ShoppingCart,
  Settings
} from "lucide-react";

export default function HomePage() {
  const navigate = useNavigate();
  const [hoveredCard, setHoveredCard] = useState(null);

  const roles = [
    {
      title: "Farmer",
      emoji: "🌾",
      icon: <Leaf size={24} />,
      desc: "Manage crops, track production, and sell directly to distributors.",
      path: "/farmer-login",
      color: "#2e7d32",
      features: ["Crop Management", "Direct Sales", "Price Tracking", "Production Analytics"]
    },
    {
      title: "Distributor",
      emoji: "🚚",
      icon: <Truck size={24} />,
      desc: "Source from farmers and efficiently distribute to retail networks.",
      path: "/distributor-login",
      color: "#0277bd",
      features: ["Bulk Purchasing", "Logistics", "Inventory Management", "Quality Control"]
    },
    {
      title: "Retailer",
      emoji: "🏪",
      icon: <Store size={24} />,
      desc: "Access fresh produce from trusted distributors for your customers.",
      path: "/retailer-login",
      color: "#f57c00",
      features: ["Fresh Produce", "Direct Supply", "Quality Assurance", "Stock Management"]
    },
    {
      title: "Consumer",
      emoji: "🛒",
      icon: <ShoppingCart size={24} />,
      desc: "Purchase traceable, quality produce with full supply chain transparency.",
      path: "/consumer-login",
      color: "#6a1b9a",
      features: ["Product Tracing", "Quality Check", "Direct Source", "Reviews & Ratings"]
    },
    {
      title: "Admin",
      emoji: "👨‍💼",
      icon: <Settings size={24} />,
      desc: "Oversee and optimize the entire agricultural supply chain ecosystem.",
      path: "/admin-login",
      color: "#c62828",
      features: ["User Management", "Analytics", "System Oversight", "Verification"]
    },
  ];

  const supplyChainSteps = [
    {
      step: 1,
      title: "Farming",
      description: "Farmers harvests fresh produce using sustainable practices",
      icon: "🌱",
      color: "#2e7d32"
    },
    {
      step: 2,
      title: "Distribution",
      description: "Distributors collect, quality-check, and transport to retailers",
      icon: "🚛",
      color: "#0277bd"
    },
    {
      step: 3,
      title: "Retail",
      description: "Retailers stock fresh produce for consumer accessibility",
      icon: "🏪",
      color: "#f57c00"
    },
    {
      step: 4,
      title: "Consumption",
      description: "Consumers purchase traceable, quality-assured products",
      icon: "🛒",
      color: "#6a1b9a"
    }
  ];

  const features = [
    {
      icon: <TrendingUp size={32} />,
      title: "Fair Pricing",
      description: "Direct connections eliminate middlemen, ensuring better prices for farmers and consumers"
    },
    {
      icon: <Users size={32} />,
      title: "Community Ecosystem",
      description: "Building a sustainable agricultural community that benefits all stakeholders"
    },
    {
      icon: <Star size={32} />,
      title: "Quality Assurance",
      description: "Rigorous quality checks at every stage of the supply chain"
    }
  ];

  const benefits = [
    {
      for: "Farmers",
      points: [
        "Direct market access without intermediaries",
        "Fair and transparent pricing",
        "Real-time market demand insights",
        "Reduced post-harvest losses"
      ]
    },
    {
      for: "Distributors",
      points: [
        "Reliable supply from verified farmers",
        "Efficient inventory management",
        "Quality-controlled products",
        "Expanded retail network"
      ]
    },
    {
      for: "Retailers",
      points: [
        "Fresh produce with guaranteed quality",
        "Stable supply chain",
        "Transparent sourcing",
        "Customer trust and loyalty"
      ]
    },
    {
      for: "Consumers",
      points: [
        "Traceable product journey",
        "Assured quality and freshness",
        "Support for local agriculture",
        "Competitive pricing"
      ]
    }
  ];

  const containerStyle = {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #f8fdf8 0%, #e8f5e8 100%)",
    fontFamily: "'Inter', sans-serif",
    paddingTop: "40px",
    width: "100%",
    margin: 0,
    boxSizing: "border-box"
  };

  const headerStyle = {
    textAlign: "center",
    marginBottom: "80px" // Increased margin for more space
  };

  const titleStyle = {
    background: "linear-gradient(135deg, #1f7a45 0%, #2e7d32 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
    fontSize: "3.5rem",
    fontWeight: "800",
    marginBottom: "20px", // Increased margin
    letterSpacing: "-0.02em"
  };

  const subtitleStyle = {
    color: "#4b5563",
    fontSize: "1.20rem",
    maxWidth: "800px",
    margin: "0 auto 60px", // Increased margin
    lineHeight: "1.6"
  };

  // Hero Image Section
  const heroImageStyle = {
    width: "100%",
    maxWidth: "1000px",
    height: "400px",
    borderRadius: "20px",
    objectFit: "cover",
    boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
    margin: "0 auto",
    display: "block"
  };

  // Divider Line
  const dividerStyle = {
    width: "100px",
    height: "4px",
    background: "linear-gradient(90deg, #1f7a45 0%, #2e7d32 100%)",
    margin: "60px auto",
    borderRadius: "2px"
  };

  // Supply Chain Visualization Styles
  const supplyChainStyle = {
    background: "white",
    borderRadius: "24px",
    padding: "50px 40px",
    margin: "60px auto",
    maxWidth: "1200px",
    boxShadow: "0 10px 40px rgba(0,0,0,0.08)",
    border: "1px solid #e5e7eb"
  };

  const stepContainerStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(4, 1fr)",
  gap: "30px",
  alignItems: "center",
  position: "relative" // Added this
};

  const stepStyle = (color) => ({
    textAlign: "center",
    padding: "30px 20px",
    borderRadius: "16px",
    background: "white",
    border: `2px solid ${color}20`,
    position: "relative",
    zIndex: 2
  });

  const arrowStyle = {
    position: "absolute",
    top: "50%",
    transform: "translateY(-50%)",
    color: "#9ca3af",
    zIndex: 1
  };

  // Split roles into two rows: first 3, then last 2
  const firstRowRoles = roles.slice(0, 3);
  const secondRowRoles = roles.slice(3, 5);

  return (
    <div style={containerStyle}>
      {/* Header Section */}
      <div style={headerStyle}>
        <h1 style={titleStyle}>
          🌿 Farm ChainX Portal
        </h1>
        <p style={subtitleStyle}>
          Revolutionizing agriculture through a transparent, efficient, and connected supply chain. 
          From farm to table, we bridge the gap between producers and consumers.
        </p>
        <img 
          src="https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=1000&h=400&fit=crop&crop=center" 
          alt="Farm to Table Supply Chain"
          style={heroImageStyle}
        />

        {/* Hero Image */}

        {/* Divider Line */}
        <div style={dividerStyle}></div>
      </div>

      {/* Supply Chain Visualization */}
<div style={supplyChainStyle}>
  <h2 style={{ 
    textAlign: "center",
    fontSize: "2.5rem", 
    fontWeight: "700", 
    color: "#1f2937",
    marginBottom: "10px"
  }}>
    The Farm ChainX Journey
  </h2>
  <p style={{ 
    textAlign: "center",
    color: "#6b7280", 
    fontSize: "1.125rem",
    maxWidth: "700px",
    margin: "0 auto 50px"
  }}>
    Follow the journey of fresh produce from farm to consumer through our integrated supply chain
  </p>

  <div style={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    position: "relative",
    padding: "0 20px"
  }}>
    {supplyChainSteps.map((step, index) => (
      <React.Fragment key={step.step}>
        {/* Step Card */}
        <div style={{
          ...stepStyle(step.color),
          flex: "1",
          maxWidth: "250px",
          margin: "0 10px"
        }}>
          <div style={{
            width: "60px",
            height: "60px",
            borderRadius: "50%",
            background: `${step.color}20`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 20px",
            fontSize: "1.8rem"
          }}>
            {step.icon}
          </div>
          <div style={{
            fontSize: "0.875rem",
            fontWeight: "600",
            color: step.color,
            marginBottom: "8px"
          }}>
            STEP {step.step}
          </div>
          <h3 style={{
            fontSize: "1.25rem",
            fontWeight: "700",
            color: "#1f2937",
            marginBottom: "12px"
          }}>
            {step.title}
          </h3>
          <p style={{
            color: "#6b7280",
            fontSize: "0.9rem",
            lineHeight: "1.5"
          }}>
            {step.description}
          </p>
        </div>
        
        {/* Arrow between steps */}
        {index < supplyChainSteps.length - 1 && (
          <div style={{
            flex: "0 0 auto",
            margin: "0 10px",
            color: "#9ca3af"
          }}>
            <ArrowRightCircle size={32} />
          </div>
        )}
      </React.Fragment>
    ))}
  </div>
</div>
      {/* Benefits Section */}
      <div style={{
        background: "white",
        borderRadius: "24px",
        padding: "50px 40px",
        margin: "60px auto",
        maxWidth: "1200px",
        boxShadow: "0 10px 40px rgba(0,0,0,0.08)",
        border: "1px solid #e5e7eb"
      }}>
        <h2 style={{ 
          textAlign: "center",
          fontSize: "2.5rem", 
          fontWeight: "700", 
          color: "#1f2937",
          marginBottom: "50px"
        }}>
          Benefits for Every Stakeholder
        </h2>
        
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: "30px"
        }}>
          {benefits.map((benefit, index) => (
            <div key={index} style={{
              padding: "30px",
              borderRadius: "16px",
              background: "#f8fdf8",
              border: "1px solid #e5e7eb"
            }}>
              <h3 style={{
                fontSize: "1.5rem",
                fontWeight: "700",
                color: "#1f7a45",
                marginBottom: "20px",
                textAlign: "center"
              }}>
                {benefit.for}
              </h3>
              <div>
                {benefit.points.map((point, pointIndex) => (
                  <div key={pointIndex} style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "12px",
                    marginBottom: "12px",
                    fontSize: "0.95rem",
                    color: "#4b5563"
                  }}>
                    <CheckCircle size={18} color="#1f7a45" style={{ flexShrink: 0, marginTop: "2px" }} />
                    <span>{point}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Features Section */}
      <div style={{ textAlign: "center", marginBottom: "40px" }}>
        <h2 style={{ 
          fontSize: "2.5rem", 
          fontWeight: "700", 
          color: "#1f2937",
          marginBottom: "16px"
        }}>
          Why Choose Farm ChainX?
        </h2>
        <p style={{ 
          color: "#6b7280", 
          fontSize: "1.125rem",
          maxWidth: "600px",
          margin: "0 auto"
        }}>
          Building the future of agriculture with technology, transparency, and trust
        </p>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: "30px",
        maxWidth: "1200px",
        margin: "0 auto 60px",
        padding: "0 20px"
      }}>
        {features.map((feature, index) => (
          <div key={index} style={{
            background: "white",
            padding: "40px 30px",
            borderRadius: "20px",
            textAlign: "center",
            boxShadow: "0 8px 30px rgba(0,0,0,0.08)",
            border: "1px solid #f1f5f9",
            transition: "transform 0.2s ease"
          }}>
            <div style={{ 
              color: "#1f7a45", 
              marginBottom: "25px",
              display: "flex",
              justifyContent: "center"
            }}>
              {feature.icon}
            </div>
            <h3 style={{ 
              fontSize: "1.5rem", 
              fontWeight: "700", 
              color: "#1f2937",
              marginBottom: "16px"
            }}>
              {feature.title}
            </h3>
            <p style={{ 
              color: "#6b7280", 
              lineHeight: "1.6",
              fontSize: "1rem"
            }}>
              {feature.description}
            </p>
          </div>
        ))}
      </div>

      {/* Roles Section */}
      <div style={{ textAlign: "center", marginBottom: "40px" }}>
        <h2 style={{ 
          fontSize: "2.5rem", 
          fontWeight: "700", 
          color: "#1f2937",
          marginBottom: "16px"
        }}>
          Join the Agricultural Revolution
        </h2>
        <p style={{ 
          color: "#6b7280", 
          fontSize: "1.125rem",
          maxWidth: "700px",
          margin: "0 auto"
        }}>
          Choose your role and become part of the connected agricultural ecosystem
        </p>
      </div>

      {/* First Row - 3 Cards */}
      <div style={{
        display: "flex",
        justifyContent: "center",
        gap: "30px",
        marginBottom: "30px",
        flexWrap: "wrap"
      }}>
        {firstRowRoles.map((role, index) => (
          <div
            key={index}
            style={{
              background: "white",
              borderRadius: "20px",
              padding: "30px 25px",
              width: "320px",
              boxShadow: hoveredCard === index 
                ? `0 20px 40px rgba(0,0,0,0.15), 0 0 0 1px ${role.color}20`
                : "0 8px 30px rgba(0,0,0,0.08)",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              cursor: "pointer",
              position: "relative",
              overflow: "hidden",
              border: `1px solid ${role.color}10`
            }}
            onClick={() => navigate(role.path)}
            onMouseEnter={() => setHoveredCard(index)}
            onMouseLeave={() => setHoveredCard(null)}
          >
            {/* Background Accent */}
            <div style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "4px",
              background: `linear-gradient(90deg, ${role.color} 0%, ${role.color}80 100%)`
            }} />
            
            {/* Header */}
            <div style={{
              textAlign: "center",
              marginBottom: "20px"
            }}>
              <div style={{ 
                fontSize: "3.5rem",
                marginBottom: "15px"
              }}>
                {role.emoji}
              </div>
              <h3 style={{ 
                color: role.color, 
                fontSize: "1.5rem",
                fontWeight: "700",
                margin: 0
              }}>
                {role.title}
              </h3>
            </div>
            
            {/* Description */}
            <p style={{ 
              color: "#6b7280", 
              fontSize: "0.95rem", 
              lineHeight: "1.6",
              marginBottom: "25px",
              textAlign: "center"
            }}>
              {role.desc}
            </p>
            
            {/* Features */}
            <div style={{ marginBottom: "25px" }}>
              {role.features.map((feature, featureIndex) => (
                <div key={featureIndex} style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  marginBottom: "10px",
                  fontSize: "0.875rem",
                  color: "#4b5563",
                  justifyContent: "center"
                }}>
                  <CheckCircle size={16} color={role.color} />
                  {feature}
                </div>
              ))}
            </div>
            
            {/* Button */}
            <button
              style={{
                width: "100%",
                padding: "14px 24px",
                border: "none",
                background: `linear-gradient(135deg, ${role.color} 0%, ${role.color}dd 100%)`,
                color: "white",
                borderRadius: "12px",
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "1rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
                transition: "all 0.2s ease"
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = "translateY(-2px)";
                e.target.style.boxShadow = "0 8px 20px rgba(0,0,0,0.15)";
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow = "none";
              }}
            >
              Enter Portal
              <ArrowRight size={18} />
            </button>
          </div>
        ))}
      </div>

      {/* Second Row - 2 Cards (Centered) */}
      <div style={{
        display: "flex",
        justifyContent: "center",
        gap: "30px",
        flexWrap: "wrap"
      }}>
        {secondRowRoles.map((role, index) => (
          <div
            key={index + 3}
            style={{
              background: "white",
              borderRadius: "20px",
              padding: "30px 25px",
              width: "320px",
              boxShadow: hoveredCard === index + 3
                ? `0 20px 40px rgba(0,0,0,0.15), 0 0 0 1px ${role.color}20`
                : "0 8px 30px rgba(0,0,0,0.08)",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              cursor: "pointer",
              position: "relative",
              overflow: "hidden",
              border: `1px solid ${role.color}10`
            }}
            onClick={() => navigate(role.path)}
            onMouseEnter={() => setHoveredCard(index + 3)}
            onMouseLeave={() => setHoveredCard(null)}
          >
            {/* Background Accent */}
            <div style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "4px",
              background: `linear-gradient(90deg, ${role.color} 0%, ${role.color}80 100%)`
            }} />
            
            {/* Header */}
            <div style={{
              textAlign: "center",
              marginBottom: "20px"
            }}>
              <div style={{ 
                fontSize: "3.5rem",
                marginBottom: "15px"
              }}>
                {role.emoji}
              </div>
              <h3 style={{ 
                color: role.color, 
                fontSize: "1.5rem",
                fontWeight: "700",
                margin: 0
              }}>
                {role.title}
              </h3>
            </div>
            
            {/* Description */}
            <p style={{ 
              color: "#6b7280", 
              fontSize: "0.95rem", 
              lineHeight: "1.6",
              marginBottom: "25px",
              textAlign: "center"
            }}>
              {role.desc}
            </p>
            
            {/* Features */}
            <div style={{ marginBottom: "25px" }}>
              {role.features.map((feature, featureIndex) => (
                <div key={featureIndex} style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  marginBottom: "10px",
                  fontSize: "0.875rem",
                  color: "#4b5563",
                  justifyContent: "center"
                }}>
                  <CheckCircle size={16} color={role.color} />
                  {feature}
                </div>
              ))}
            </div>
            
            {/* Button */}
            <button
              style={{
                width: "100%",
                padding: "14px 24px",
                border: "none",
                background: `linear-gradient(135deg, ${role.color} 0%, ${role.color}dd 100%)`,
                color: "white",
                borderRadius: "12px",
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "1rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
                transition: "all 0.2s ease"
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = "translateY(-2px)";
                e.target.style.boxShadow = "0 8px 20px rgba(0,0,0,0.15)";
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow = "none";
              }}
            >
              Enter Portal
              <ArrowRight size={18} />
            </button>
          </div>
        ))}
      </div>
        <Footer />
    </div>
  );
}