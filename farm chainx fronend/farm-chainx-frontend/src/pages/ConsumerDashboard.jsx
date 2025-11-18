// src/pages/ConsumerDashboard.jsx
import React, { useEffect, useState } from "react";

/**
 * Consumer Dashboard — Responsive table tweaks
 * - Improved table responsiveness & truncation to avoid layout breakage
 * - Keeps previous behavior: verify QR, save history, feedback, localStorage
 */

const LS_PRODUCTS = "farmchainx_consumer_products_v1";
const LS_FEEDBACK = "farmchainx_consumer_feedback_v1";

export default function ConsumerDashboard() {
  const [verified, setVerified] = useState(() => {
    try {
      const raw = localStorage.getItem(LS_PRODUCTS);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const [feedback, setFeedback] = useState(() => {
    try {
      const raw = localStorage.getItem(LS_FEEDBACK);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const [qrInput, setQrInput] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [userRating, setUserRating] = useState(5);
  const [comment, setComment] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    localStorage.setItem(LS_PRODUCTS, JSON.stringify(verified));
    localStorage.setItem(LS_FEEDBACK, JSON.stringify(feedback));
  }, [verified, feedback]);

  /** Simulated QR verification */
  const handleVerifyQR = () => {
    if (!qrInput.trim()) return alert("Please paste QR data or code.");
    try {
      const data = JSON.parse(qrInput);
      if (!data.batchId) throw new Error("Invalid QR data");
      const exists = verified.find((v) => v.batchId === data.batchId);
      if (exists) return alert("This product is already verified ✅");

      // Normalize common fields (safe defaults)
      const normalized = {
        batchId: data.batchId,
        name: data.name || data.batchId,
        qty: data.qty || data.quantity || "—",
        harvestDate: data.harvestDate || data.harvest || "—",
        location: data.location || data.farmLocation || "—",
        verifiedAt: new Date().toISOString(),
        raw: data,
      };

      setVerified((v) => [normalized, ...v]);
      setSuccessMsg(`✅ Verified ${normalized.name}`);
      setQrInput("");
      setTimeout(() => setSuccessMsg(""), 2000);
    } catch {
      alert("Invalid or corrupted QR payload.");
    }
  };

  /** Submit feedback */
  const handleFeedback = (e) => {
    e.preventDefault();
    if (!selectedId) return alert("Select a product first!");
    const fb = { id: selectedId, rating: Number(userRating), comment, date: new Date().toISOString() };
    setFeedback((f) => [fb, ...f].slice(0, 10));
    setComment("");
    setSuccessMsg("⭐ Feedback submitted!");
    setTimeout(() => setSuccessMsg(""), 2000);
  };

  /** Filter for search */
  const filtered = verified.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.batchId || "").toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    verifiedCount: verified.length,
    avgRating:
      feedback.length > 0
        ? (feedback.reduce((s, f) => s + Number(f.rating), 0) / feedback.length).toFixed(1)
        : "—",
    feedbackCount: feedback.length,
  };

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>🛒 Consumer Dashboard</h1>
          <p style={styles.subtitle}>Verify product authenticity & give feedback</p>
        </div>
        <button style={styles.logout}>Logout</button>
      </header>

      <main style={styles.container}>
        {/* LEFT SIDE */}
        <section>
          {/* STATS */}
          <div style={styles.statsGrid}>
            <Stat title="Products Verified" value={stats.verifiedCount} />
            <Stat title="Total Feedback" value={stats.feedbackCount} />
            <Stat title="Avg Rating" value={stats.avgRating} />
          </div>

          {/* QR INPUT */}
          <div style={styles.card}>
            <h3 style={{ marginTop: 0 }}>Verify Product via QR</h3>
            <textarea
              style={styles.textarea}
              value={qrInput}
              onChange={(e) => setQrInput(e.target.value)}
              placeholder='Paste QR data (JSON payload from farmer QR)'
            />
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <button style={styles.primaryBtn} onClick={handleVerifyQR}>
                Verify Product
              </button>
              <button
                style={styles.smallBtn}
                onClick={() =>
                  setQrInput(JSON.stringify({
                    batchId: "C101",
                    name: "Sample Corn",
                    qty: "200 kg",
                    harvestDate: "2025-11-01",
                    location: "Block A"
                  }, null, 0))
                }
                title="Insert sample payload"
              >
                Insert Sample
              </button>
            </div>
            {successMsg && <div style={{ marginTop: 10, color: "#0a8a3a", fontWeight: 700 }}>{successMsg}</div>}
          </div>

          {/* VERIFIED PRODUCTS TABLE */}
          <div style={styles.card}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
              <h3 style={{ margin: 0 }}>Verified Products</h3>
              <input
                style={styles.search}
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Responsive wrapper: horizontal scroll on small screens */}
            <div style={{ overflowX: "auto" }}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={{ ...styles.th, width: 60 }}>Select</th>
                    <th style={{ ...styles.th, width: 120 }}>Batch</th>
                    <th style={{ ...styles.th, minWidth: 180 }}>Name</th>
                    <th style={{ ...styles.th, width: 100 }}>Qty</th>
                    <th style={{ ...styles.th, width: 120 }}>Harvest</th>
                    <th style={{ ...styles.th, minWidth: 140 }}>Location</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan="6" style={{ padding: 12, color: "#666" }}>
                        No verified products yet.
                      </td>
                    </tr>
                  )}

                  {filtered.map((p) => (
                    <tr key={p.batchId}>
                      <td style={styles.tdCenter}>
                        <input
                          type="checkbox"
                          checked={selectedId === p.batchId}
                          onChange={() => setSelectedId(selectedId === p.batchId ? null : p.batchId)}
                        />
                      </td>

                      <td style={styles.tdEllipsis}>{p.batchId}</td>
                      <td style={{ ...styles.tdEllipsis, minWidth: 180 }}>{p.name}</td>
                      <td style={styles.tdEllipsis}>{p.qty}</td>
                      <td style={styles.tdEllipsis}>{p.harvestDate}</td>
                      <td style={styles.tdEllipsis}>{p.location}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* FEEDBACK FORM */}
          <form style={styles.card} onSubmit={handleFeedback}>
            <h3 style={{ marginTop: 0 }}>Rate a Product</h3>
            <p style={{ fontSize: 13, marginBottom: 6 }}>Select a product above before rating.</p>

            <label style={styles.label}>
              Rating (1–5)
              <input
                type="number"
                min="1"
                max="5"
                value={userRating}
                onChange={(e) => setUserRating(e.target.value)}
                style={styles.input}
              />
            </label>

            <label style={styles.label}>
              Comment
              <textarea
                style={styles.textarea}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your feedback..."
              />
            </label>

            <button type="submit" style={styles.primaryBtn}>
              Submit Feedback
            </button>
          </form>
        </section>

        {/* RIGHT SIDE */}
        <aside style={styles.sidebar}>
          <div style={styles.sideCard}>
            <h4 style={{ marginTop: 0 }}>Smart Insights</h4>
            <p style={{ fontSize: 13 }}>
              <strong>Most Rated Product:</strong> {feedback[0]?.id || "—"}
            </p>
            <p style={{ fontSize: 13 }}>
              <strong>Recent Feedback:</strong> {feedback[0]?.comment || "No feedback yet"}
            </p>
          </div>

          <div style={styles.sideCard}>
            <h4 style={{ marginTop: 0 }}>Quick Actions</h4>
            <button style={styles.smallBtn} onClick={() => alert("Report downloaded (mock)")}>
              Download Report
            </button>
            <button style={styles.smallBtn} onClick={() => alert("View top-rated products coming soon!")}>
              View Top Rated
            </button>
          </div>

          {successMsg && <div style={styles.toast}>{successMsg}</div>}
        </aside>
      </main>
    </div>
  );
}

/* ---------- Components ---------- */
const Stat = ({ title, value }) => (
  <div style={styles.statCard}>
    <div style={{ fontSize: 12, color: "#555" }}>{title}</div>
    <div style={{ fontSize: 20, fontWeight: 700 }}>{value}</div>
  </div>
);

/* ---------- Styles ---------- */
const styles = {
  page: {
    minHeight: "100vh",
    background: "#f6f4ff",
    fontFamily: "Inter, system-ui, Arial, sans-serif",
    padding: 20,
  },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 },
  title: { margin: 0, color: "#5a00d4" },
  subtitle: { color: "#555", marginTop: 4 },
  logout: { background: "#b50000", color: "#fff", border: "none", padding: "8px 12px", borderRadius: 8, cursor: "pointer" },

  container: { display: "grid", gridTemplateColumns: "1fr 320px", gap: 20 },

  statsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 12 },
  statCard: { background: "#fff", padding: 12, borderRadius: 8, boxShadow: "0 6px 16px rgba(0,0,0,0.06)", textAlign: "center" },

  card: { background: "#fff", padding: 16, borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.06)", marginBottom: 14 },
  textarea: { width: "100%", minHeight: 80, padding: 10, borderRadius: 8, border: "1px solid #ddd", marginBottom: 8 },
  input: { width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #ddd", marginBottom: 8 },

  primaryBtn: { background: "#5a00d4", color: "#fff", border: "none", padding: "10px 14px", borderRadius: 8, cursor: "pointer" },
  smallBtn: { padding: "8px 10px", borderRadius: 8, border: "1px solid #eee", background: "#fff", cursor: "pointer", textAlign: "left", width: "100%" },

  search: { padding: "8px 10px", borderRadius: 8, border: "1px solid #ddd" },

  /* table responsive + truncation */
  // table wrapper uses overflowX:auto (see JSX)
  table: {
    width: "100%",
    minWidth: 720, // ensures reasonable column widths on desktop but allows horizontal scroll on small screens
    borderCollapse: "collapse",
  },
  th: { textAlign: "left", padding: "8px 10px", fontSize: 13, whiteSpace: "nowrap" },
  td: { padding: "8px 10px", borderTop: "1px solid #eee", fontSize: 14 },

  // helper cell styles
  tdEllipsis: {
    padding: "8px 10px",
    borderTop: "1px solid #eee",
    fontSize: 14,
    maxWidth: 220,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  tdCenter: {
    padding: "8px 10px",
    borderTop: "1px solid #eee",
    textAlign: "center",
    width: 60,
  },

  sidebar: {},
  sideCard: { background: "#fff", padding: 14, borderRadius: 10, boxShadow: "0 8px 20px rgba(0,0,0,0.06)", marginBottom: 12 },

  toast: { marginTop: 12, background: "#efe9ff", color: "#5a00d4", padding: "8px 10px", borderRadius: 8, fontWeight: 600 },
};
