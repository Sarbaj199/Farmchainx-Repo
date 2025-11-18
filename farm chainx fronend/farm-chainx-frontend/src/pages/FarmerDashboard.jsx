// src/pages/FarmerDashboard.jsx
import React, { useEffect, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";

/**
 * FarmerDashboard (full) — enhanced + QR generation
 * - localStorage persistence (products & updates)
 * - harvest date saved & displayed
 * - success toast
 * - search/filter
 * - select a batch and Generate QR (modal + download PNG)
 *
 * Drop into src/pages/ and import in App.jsx
 */

const LS_PRODUCTS = "farmchainx_products_v1";
const LS_UPDATES = "farmchainx_updates_v1";

export default function FarmerDashboard() {
  // Load from localStorage (or use defaults)
  const [products, setProducts] = useState(() => {
    try {
      const raw = localStorage.getItem(LS_PRODUCTS);
      return raw ? JSON.parse(raw) : sampleProducts();
    } catch {
      return sampleProducts();
    }
  });

  const [updates, setUpdates] = useState(() => {
    try {
      const raw = localStorage.getItem(LS_UPDATES);
      return raw ? JSON.parse(raw) : sampleUpdates();
    } catch {
      return sampleUpdates();
    }
  });

  // Form state
  const [form, setForm] = useState({
    cropName: "",
    description: "",
    cropType: "",
    quantity: "",
    quality: "Grade A",
    harvestDate: "",
    farmLocation: "",
  });

  // UI state
  const [successMsg, setSuccessMsg] = useState("");
  const [search, setSearch] = useState("");

  // QR state
  const [selectedId, setSelectedId] = useState(null); // selected batch for QR
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrPayload, setQrPayload] = useState("");

  // Persist products & updates to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(LS_PRODUCTS, JSON.stringify(products));
      localStorage.setItem(LS_UPDATES, JSON.stringify(updates));
    } catch (e) {
      console.warn("Failed to save to localStorage:", e);
    }
  }, [products, updates]);

  // Derived stats
  const stats = {
    activeCrops: products.length,
    batchesInTransit: products.filter((p) => p.status === "In Transit").length,
    pendingInspections: products.filter((p) => p.status === "Pending").length,
    completedShipments: products.filter((p) => p.status === "Approved").length,
  };

  // Generic input handler
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  };

  // Add new crop
  const handleAdd = (e) => {
    e.preventDefault();
    if (!form.cropName.trim() || !form.quantity.trim()) {
      setSuccessMsg("Please enter crop name & quantity.");
      setTimeout(() => setSuccessMsg(""), 2200);
      return;
    }

    const idNumber = 1000 + products.length + 1;
    const newCrop = {
      id: `C${idNumber}`,
      name: form.cropName.trim(),
      description: form.description.trim(),
      cropType: form.cropType.trim(),
      quantity: `${form.quantity.trim()} kg`,
      quality: form.quality,
      harvestDate: form.harvestDate || "—",
      farmLocation: form.farmLocation.trim(),
      status: "Pending",
      createdAt: new Date().toISOString(),
    };

    setProducts((p) => [newCrop, ...p]);
    setUpdates((u) => [`New crop '${newCrop.name}' added.`, ...u].slice(0, 8));
    setSuccessMsg(`✅ ${newCrop.name} added`);
    setForm({
      cropName: "",
      description: "",
      cropType: "",
      quantity: "",
      quality: "Grade A",
      harvestDate: "",
      farmLocation: "",
    });

    // clear toast after 2.5s
    setTimeout(() => setSuccessMsg(""), 2500);
  };

  // Delete crop
  const handleDelete = (id) => {
    if (!window.confirm("Delete this batch?")) return;
    setProducts((p) => p.filter((x) => x.id !== id));
    setUpdates((u) => [`Batch ${id} removed.`, ...u].slice(0, 8));
    if (selectedId === id) setSelectedId(null);
    setSuccessMsg("Batch removed");
    setTimeout(() => setSuccessMsg(""), 1800);
  };

  // Toggle select (single-select behavior)
  const toggleSelect = (id) => {
    setSelectedId((s) => (s === id ? null : id));
  };

  // Prepare and open QR modal
  const handleGenerateQR = () => {
    if (!selectedId) {
      alert("Please select a batch to generate QR for.");
      return;
    }
    const p = products.find((x) => x.id === selectedId);
    if (!p) return alert("Selected batch not found.");

    // Keep encoded payload compact; here we use a JSON string.
    // In production, prefer a short verification URL.
    const payload = {
      batchId: p.id,
      name: p.name,
      qty: p.quantity,
      harvestDate: p.harvestDate || "—",
      location: p.farmLocation || "—",
      createdAt: p.createdAt || new Date().toISOString(),
    };

    setQrPayload(JSON.stringify(payload));
    setQrModalOpen(true);
  };

  // Download QR canvas as PNG
  const handleDownloadQR = () => {
    const canvas = document.getElementById("qr-canvas");
    if (!canvas) return alert("QR canvas not found.");
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedId || "batch"}-qr.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  // Filtered products based on search
  const filtered = products.filter((p) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      p.id.toLowerCase().includes(q) ||
      p.name.toLowerCase().includes(q) ||
      (p.cropType && p.cropType.toLowerCase().includes(q)) ||
      (p.status && p.status.toLowerCase().includes(q))
    );
  });

  return (
    <div style={styles.page}>
      {/* Header */}
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>🌿 Farmer Control Panel</h1>
          <div style={styles.subtitle}>Manage crop batches, shipments & insights</div>
        </div>

        <div style={styles.headerRight}>
          <div style={styles.user}>Hello, Rajesh</div>
          <button style={styles.logoutBtn}>Logout</button>
        </div>
      </header>

      <main style={styles.container}>
        {/* LEFT */}
        <section>
          <div style={styles.statsGrid}>
            <Stat title="Active Crops" value={stats.activeCrops} />
            <Stat title="Batches In Transit" value={stats.batchesInTransit} />
            <Stat title="Pending Inspections" value={stats.pendingInspections} />
            <Stat title="Completed Shipments" value={stats.completedShipments} />
          </div>

          {/* Form */}
          <form style={styles.card} onSubmit={handleAdd} aria-label="Register crop form">
            <h3 style={{ marginTop: 0 }}>Register New Crop</h3>

            <label style={styles.label}>
              Crop name
              <input
                name="cropName"
                value={form.cropName}
                onChange={handleChange}
                placeholder="e.g. Sweet Corn"
                style={styles.input}
                aria-required="true"
              />
            </label>

            <label style={styles.label}>
              Description
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Short note about this batch (optional)"
                style={styles.textarea}
              />
            </label>

            <div style={styles.row}>
              <label style={styles.field}>
                Crop Type
                <input
                  name="cropType"
                  value={form.cropType}
                  onChange={handleChange}
                  placeholder="e.g. vegetable"
                  style={styles.input}
                />
              </label>

              <label style={styles.field}>
                Quantity (kg)
                <input
                  name="quantity"
                  value={form.quantity}
                  onChange={handleChange}
                  placeholder="100"
                  style={styles.input}
                  inputMode="numeric"
                />
              </label>
            </div>

            <div style={styles.row}>
              <label style={styles.field}>
                Quality
                <select name="quality" value={form.quality} onChange={handleChange} style={styles.input}>
                  <option>Grade A</option>
                  <option>Grade B</option>
                  <option>Grade C</option>
                </select>
              </label>

              <label style={styles.field}>
                Harvest date
                <input type="date" name="harvestDate" value={form.harvestDate} onChange={handleChange} style={styles.input} />
              </label>
            </div>

            <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 8 }}>
              <label style={{ flex: 1 }}>
                Farm Location
                <input name="farmLocation" value={form.farmLocation} onChange={handleChange} placeholder="e.g. Block A" style={styles.input} />
              </label>

              <button type="submit" style={styles.primaryBtn}>
                Add Crop
              </button>
            </div>

            {successMsg && <div style={styles.toast}>{successMsg}</div>}
          </form>

          {/* Search + Table */}
          <div style={styles.card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <h3 style={{ margin: 0 }}>Crop Batches</h3>
              <input
                placeholder="Search by id, name, type or status"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={styles.search}
              />
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Select</th>
                    <th style={styles.th}>Batch</th>
                    <th style={styles.th}>Name</th>
                    <th style={styles.th}>Type</th>
                    <th style={styles.th}>Qty</th>
                    <th style={styles.th}>Quality</th>
                    <th style={styles.th}>Harvest</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={9} style={{ padding: 16, color: "#666" }}>
                        No batches match your search.
                      </td>
                    </tr>
                  )}

                  {filtered.map((p) => (
                    <tr key={p.id}>
                      <td style={styles.td}>
                        <input type="checkbox" checked={selectedId === p.id} onChange={() => toggleSelect(p.id)} aria-label={`Select ${p.id}`} />
                      </td>
                      <td style={styles.td}>{p.id}</td>
                      <td style={styles.td}>{p.name}</td>
                      <td style={styles.td}>{p.cropType || "—"}</td>
                      <td style={styles.td}>{p.quantity}</td>
                      <td style={styles.td}>{p.quality}</td>
                      <td style={styles.td}>{p.harvestDate || "—"}</td>
                      <td style={styles.td}>
                        <StatusBadge status={p.status} />
                      </td>
                      <td style={styles.td}>
                        <button style={styles.linkBtn} onClick={() => alert(JSON.stringify(p, null, 2))}>
                          Details
                        </button>
                        <button style={{ ...styles.linkBtn, color: "#b50000" }} onClick={() => handleDelete(p.id)}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* RIGHT SIDEBAR */}
        <aside style={styles.right}>
          <div style={styles.sideCard}>
            <h4 style={{ marginTop: 0 }}>Smart Crop Insights</h4>
            <div style={{ fontSize: 13, color: "#555" }}>Quality index</div>
            <div style={{ marginTop: 8 }}>
              <div style={styles.progressBg}>
                <div style={{ ...styles.progressFill, width: "92%" }} />
              </div>
              <div style={{ marginTop: 6, fontWeight: 700 }}>92% — Excellent</div>
            </div>

            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 13 }}>
                <strong>Best harvest window:</strong> Nov 5–10, 2025
              </div>
              <div style={{ fontSize: 13, marginTop: 6 }}>
                <strong>Next action:</strong> Schedule transport
              </div>
            </div>
          </div>

          <div style={styles.sideCard}>
            <h4 style={{ marginTop: 0 }}>Recent Updates</h4>
            <ul style={{ paddingLeft: 16 }}>
              {updates.map((u, i) => (
                <li key={i} style={{ marginBottom: 8 }}>
                  {u}
                </li>
              ))}
            </ul>
          </div>

          <div style={styles.sideCard}>
            <h4 style={{ marginTop: 0 }}>Quick Actions</h4>
            <div style={{ display: "grid", gap: 8 }}>
              <button style={styles.smallBtn} onClick={handleGenerateQR}>
                Generate QR for selected
              </button>
              <button style={styles.smallBtn} onClick={() => alert("Download report (mock)")}>
                Download Report
              </button>
              <button style={styles.smallBtn} onClick={() => alert("Request inspection (mock)")}>
                Request Inspection
              </button>
            </div>
          </div>
        </aside>
      </main>

      {/* QR Modal */}
      {qrModalOpen && (
        <div style={styles.modalBackdrop} onClick={() => setQrModalOpen(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0 }}>QR for {selectedId}</h3>

            <div style={{ textAlign: "center", padding: 12 }}>
              <QRCodeCanvas id="qr-canvas" value={qrPayload} size={220} level="H" includeMargin={true} />
              <div style={{ marginTop: 10, fontSize: 13, color: "#444", wordBreak: "break-all" }}>{qrPayload}</div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12 }}>
              <div>
                <button style={styles.primaryBtn} onClick={handleDownloadQR}>
                  Download PNG
                </button>
              </div>
              <div>
                <button style={styles.smallBtn} onClick={() => setQrModalOpen(false)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- Helpers & components ---------- */

function sampleProducts() {
  return [
    {
      id: "C101",
      name: "Sweet Corn",
      description: "Yellow sweet corn batch",
      cropType: "Vegetable",
      quantity: "200 kg",
      quality: "Grade A",
      harvestDate: "2025-11-01",
      farmLocation: "Block A",
      status: "Pending",
      createdAt: new Date().toISOString(),
    },
    {
      id: "C102",
      name: "Groundnut",
      description: "Drying groundnut batch",
      cropType: "Legume",
      quantity: "500 kg",
      quality: "Grade B",
      harvestDate: "2025-10-25",
      farmLocation: "Block C",
      status: "Approved",
      createdAt: new Date().toISOString(),
    },
    {
      id: "C103",
      name: "Onions",
      description: "Red onions",
      cropType: "Vegetable",
      quantity: "300 kg",
      quality: "Grade A",
      harvestDate: "2025-10-28",
      farmLocation: "Block B",
      status: "In Transit",
      createdAt: new Date().toISOString(),
    },
  ];
}

function sampleUpdates() {
  return ["Shipment for Groundnut dispatched.", "New crop 'Sweet Corn' registered.", "Inspection scheduled for Onions"];
}

const Stat = ({ title, value }) => (
  <div style={styles.stat}>
    <div style={{ fontSize: 12, color: "#666" }}>{title}</div>
    <div style={{ fontSize: 20, fontWeight: 700 }}>{value}</div>
  </div>
);

const StatusBadge = ({ status }) => {
  const color = status === "Approved" ? "#0a8a3a" : status === "In Transit" ? "#f57c00" : "#d78a00";
  return <span style={{ padding: "6px 10px", borderRadius: 999, background: "#fff", color, fontWeight: 700 }}>{status}</span>;
};

/* ---------- Inline styles ---------- */
const styles = {
  page: {
    minHeight: "100vh",
    background: "#f5faf6",
    fontFamily: "Inter, system-ui, Arial, sans-serif",
    padding: 20,
    boxSizing: "border-box",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },
  title: { margin: 0, color: "#147a48" },
  subtitle: { color: "#555", fontSize: 13, marginTop: 4 },
  headerRight: { display: "flex", alignItems: "center", gap: 12 },
  user: { color: "#333" },
  logoutBtn: {
    background: "#c62828",
    color: "#fff",
    border: "none",
    padding: "8px 12px",
    borderRadius: 8,
    cursor: "pointer",
  },

  container: { display: "grid", gridTemplateColumns: "1fr 320px", gap: 20, alignItems: "start" },

  statsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 12 },
  stat: { background: "#fff", padding: 12, borderRadius: 8, boxShadow: "0 6px 16px rgba(0,0,0,0.06)", textAlign: "center" },

  card: { background: "#fff", padding: 16, borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.06)", marginBottom: 14 },

  label: { display: "block", marginBottom: 8, fontSize: 13, color: "#333" },
  input: { width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #e6efe9", marginTop: 6, boxSizing: "border-box" },
  textarea: { width: "100%", minHeight: 80, padding: 10, borderRadius: 8, border: "1px solid #e6efe9", marginTop: 6, boxSizing: "border-box" },

  row: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
  field: { display: "block" },

  primaryBtn: { background: "#147a48", color: "#fff", border: "none", padding: "10px 14px", borderRadius: 8, cursor: "pointer" },

  search: { padding: "8px 10px", borderRadius: 8, border: "1px solid #ddd", width: 260 },

  table: { width: "100%", borderCollapse: "collapse", marginTop: 8 },
  th: { fontSize: 13, fontWeight: 700, textAlign: "left", padding: "10px 8px", color: "#444" },
  td: { padding: "10px 8px", borderTop: "1px solid #f1f6f2", fontSize: 14 },

  tdSmall: { padding: "6px 8px", fontSize: 13 },

  linkBtn: { border: "none", background: "transparent", color: "#147a48", cursor: "pointer", marginRight: 8 },

  right: {},
  sideCard: { background: "#fff", padding: 14, borderRadius: 10, boxShadow: "0 8px 20px rgba(0,0,0,0.06)", marginBottom: 12 },

  progressBg: { height: 10, background: "#e6f6ea", borderRadius: 8, overflow: "hidden" },
  progressFill: { height: "100%", background: "#17a461" },

  smallBtn: { padding: "8px 10px", borderRadius: 8, border: "1px solid #e6efe9", background: "#fff", cursor: "pointer", textAlign: "left" },

  toast: { marginTop: 12, background: "#e9f7ee", color: "#0a8a3a", padding: "8px 10px", borderRadius: 8, fontWeight: 600 },

  /* modal */
  modalBackdrop: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.35)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 80,
  },
  modal: { width: 460, maxWidth: "95%", background: "#fff", padding: 18, borderRadius: 10, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" },
};

styles.td = styles.td; // keep linter happy
