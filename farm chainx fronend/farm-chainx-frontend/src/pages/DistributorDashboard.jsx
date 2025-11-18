// src/pages/DistributorDashboard.jsx
import React, { useEffect, useState } from "react";

/**
 * Distributor Dashboard
 * - Add, track, and manage shipments
 * - LocalStorage persistence
 * - Delay alerts + download manifest
 * - Smart insights & quick actions
 */

const LS_SHIPMENTS = "farmchainx_distributor_shipments_v1";
const LS_UPDATES = "farmchainx_distributor_updates_v1";

export default function DistributorDashboard() {
  const [shipments, setShipments] = useState(() => {
    try {
      const raw = localStorage.getItem(LS_SHIPMENTS);
      return raw ? JSON.parse(raw) : sampleShipments();
    } catch {
      return sampleShipments();
    }
  });

  const [updates, setUpdates] = useState(() => {
    try {
      const raw = localStorage.getItem(LS_UPDATES);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const [form, setForm] = useState({
    batchId: "",
    cropName: "",
    origin: "",
    destination: "",
    vehicleNo: "",
    driverName: "",
    expectedDate: "",
    status: "In Transit",
  });

  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    localStorage.setItem(LS_SHIPMENTS, JSON.stringify(shipments));
    localStorage.setItem(LS_UPDATES, JSON.stringify(updates));
  }, [shipments, updates]);

  /** Add shipment */
  const handleAdd = (e) => {
    e.preventDefault();
    if (!form.batchId || !form.cropName || !form.origin || !form.destination) {
      alert("Please fill all required fields.");
      return;
    }

    const newShip = {
      id: `S${1000 + shipments.length + 1}`,
      ...form,
      createdAt: new Date().toISOString(),
    };

    setShipments((s) => [newShip, ...s]);
    setUpdates((u) => [`Shipment ${newShip.id} created.`, ...u].slice(0, 8));
    setSuccessMsg(`✅ ${newShip.cropName} shipment added`);
    setForm({
      batchId: "",
      cropName: "",
      origin: "",
      destination: "",
      vehicleNo: "",
      driverName: "",
      expectedDate: "",
      status: "In Transit",
    });
    setTimeout(() => setSuccessMsg(""), 2000);
  };

  /** Delete shipment */
  const handleDelete = (id) => {
    if (!window.confirm("Delete this shipment?")) return;
    setShipments((s) => s.filter((x) => x.id !== id));
    setUpdates((u) => [`Shipment ${id} removed.`, ...u].slice(0, 8));
    setSuccessMsg("🗑️ Shipment removed");
    if (selectedId === id) setSelectedId(null);
    setTimeout(() => setSuccessMsg(""), 2000);
  };

  /** Mark as delivered */
  const markDelivered = () => {
    if (!selectedId) return alert("Select a shipment first.");
    setShipments((s) =>
      s.map((x) => (x.id === selectedId ? { ...x, status: "Delivered" } : x))
    );
    setUpdates((u) => [`Shipment ${selectedId} marked Delivered.`, ...u].slice(0, 8));
    setSuccessMsg("🚚 Shipment marked delivered");
    setTimeout(() => setSuccessMsg(""), 2000);
  };

  /** Download CSV */
  const downloadManifest = () => {
    const rows = selectedId ? shipments.filter((s) => s.id === selectedId) : shipments;
    if (!rows || rows.length === 0) {
      alert("No shipments to export.");
      return;
    }
    const header = [
      "ID",
      "Batch ID",
      "Crop Name",
      "Origin",
      "Destination",
      "Vehicle",
      "Driver",
      "Expected Date",
      "Status",
    ];
    const csv = [
      header.join(","),
      ...rows.map((s) =>
        [
          s.id,
          s.batchId,
          `"${(s.cropName || "").replace(/"/g, '""')}"`,
          `"${(s.origin || "").replace(/"/g, '""')}"`,
          `"${(s.destination || "").replace(/"/g, '""')}"`,
          s.vehicleNo,
          s.driverName,
          s.expectedDate,
          s.status,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `shipments-manifest${selectedId ? `-${selectedId}` : ""}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(a.href);
  };

  /** Delay check */
  const checkDelays = () => {
    const today = new Date();
    const delayed = shipments.filter(
      (s) => s.status === "In Transit" && s.expectedDate && new Date(s.expectedDate) < today
    );
    if (delayed.length === 0) alert("✅ No delayed shipments.");
    else alert(`⚠️ ${delayed.length} shipment(s) are delayed.`);
  };

  const toggleSelect = (id) => {
    setSelectedId((s) => (s === id ? null : id));
  };

  const filtered = shipments.filter((s) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      (s.cropName && s.cropName.toLowerCase().includes(q)) ||
      (s.id && s.id.toLowerCase().includes(q)) ||
      (s.status && s.status.toLowerCase().includes(q)) ||
      (s.batchId && s.batchId.toLowerCase().includes(q))
    );
  });

  const stats = {
    total: shipments.length,
    inTransit: shipments.filter((s) => s.status === "In Transit").length,
    delivered: shipments.filter((s) => s.status === "Delivered").length,
    delayed: shipments.filter(
      (s) => s.status === "In Transit" && s.expectedDate && new Date(s.expectedDate) < new Date()
    ).length,
  };

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>🚛 Distributor Control Panel</h1>
          <p style={styles.subtitle}>Manage shipments and logistics tracking</p>
        </div>
        <button style={styles.logout}>Logout</button>
      </header>

      <main style={styles.container}>
        {/* LEFT */}
        <section>
          <div style={styles.statsGrid}>
            <Stat title="Total Shipments" value={stats.total} />
            <Stat title="In Transit" value={stats.inTransit} />
            <Stat title="Delivered" value={stats.delivered} />
            <Stat title="Delayed" value={stats.delayed} />
          </div>

          {/* FORM */}
          <form style={styles.card} onSubmit={handleAdd}>
            <h3 style={{ marginTop: 0 }}>Register New Shipment</h3>

            <div style={styles.row}>
              <label style={styles.field}>
                Batch ID
                <input
                  style={styles.input}
                  name="batchId"
                  value={form.batchId}
                  onChange={(e) => setForm({ ...form, batchId: e.target.value })}
                  placeholder="e.g. C101"
                />
              </label>
              <label style={styles.field}>
                Crop Name
                <input
                  style={styles.input}
                  name="cropName"
                  value={form.cropName}
                  onChange={(e) => setForm({ ...form, cropName: e.target.value })}
                  placeholder="e.g. Wheat"
                />
              </label>
            </div>

            <div style={styles.row}>
              <label style={styles.field}>
                Origin
                <input
                  style={styles.input}
                  name="origin"
                  value={form.origin}
                  onChange={(e) => setForm({ ...form, origin: e.target.value })}
                  placeholder="Farmer A Location"
                />
              </label>
              <label style={styles.field}>
                Destination
                <input
                  style={styles.input}
                  name="destination"
                  value={form.destination}
                  onChange={(e) => setForm({ ...form, destination: e.target.value })}
                  placeholder="Retailer B Location"
                />
              </label>
            </div>

            <div style={styles.row}>
              <label style={styles.field}>
                Vehicle No.
                <input
                  style={styles.input}
                  value={form.vehicleNo}
                  onChange={(e) => setForm({ ...form, vehicleNo: e.target.value })}
                  placeholder="e.g. AP09 XY 5678"
                />
              </label>
              <label style={styles.field}>
                Driver Name
                <input
                  style={styles.input}
                  value={form.driverName}
                  onChange={(e) => setForm({ ...form, driverName: e.target.value })}
                  placeholder="e.g. Rajesh"
                />
              </label>
            </div>

            <div style={styles.row}>
              <label style={styles.field}>
                Expected Delivery
                <input
                  type="date"
                  style={styles.input}
                  value={form.expectedDate}
                  onChange={(e) => setForm({ ...form, expectedDate: e.target.value })}
                />
              </label>
              <button type="submit" style={styles.primaryBtn}>
                Add Shipment
              </button>
            </div>
          </form>

          {/* TABLE */}
          <div style={styles.card}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
              <h3 style={{ margin: 0 }}>Shipments</h3>
              <input
                style={styles.search}
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Select</th>
                    <th style={styles.th}>ID</th>
                    <th style={styles.th}>Batch</th>
                    <th style={styles.th}>Crop</th>
                    <th style={styles.th}>Origin</th>
                    <th style={styles.th}>Destination</th>
                    <th style={styles.th}>Vehicle</th>
                    <th style={styles.th}>Driver</th>
                    <th style={styles.th}>Expected</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s) => (
                    <tr key={s.id}>
                      <td style={styles.tdCenter}>
                        <input type="checkbox" checked={selectedId === s.id} onChange={() => toggleSelect(s.id)} />
                      </td>
                      <td style={styles.tdEllipsis}>{s.id}</td>
                      <td style={styles.tdEllipsis}>{s.batchId}</td>
                      <td style={styles.tdEllipsis}>{s.cropName}</td>
                      <td style={styles.tdEllipsis}>{s.origin}</td>
                      <td style={styles.tdEllipsis}>{s.destination}</td>
                      <td style={styles.tdEllipsis}>{s.vehicleNo || "—"}</td>
                      <td style={styles.tdEllipsis}>{s.driverName || "—"}</td>
                      <td style={styles.tdEllipsis}>{s.expectedDate || "—"}</td>
                      <td style={styles.td}>
                        <StatusBadge status={s.status} />
                      </td>
                      <td style={styles.td}>
                        <button style={styles.linkBtn} onClick={() => alert(JSON.stringify(s, null, 2))}>View</button>
                        <button style={{ ...styles.linkBtn, color: "#b50000" }} onClick={() => handleDelete(s.id)}>Delete</button>
                      </td>
                    </tr>
                  ))}

                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan="11" style={{ padding: 12, color: "#666" }}>No shipments found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* SIDEBAR */}
        <aside style={styles.sidebar}>
          <div style={styles.sideCard}>
            <h4 style={{ marginTop: 0 }}>Smart Insights</h4>
            <p style={{ fontSize: 13 }}>
              <strong>Upcoming Deliveries:</strong> {shipments.filter((s) => s.expectedDate && new Date(s.expectedDate) > new Date()).length}
            </p>
            <p style={{ fontSize: 13 }}>
              <strong>Delayed Shipments:</strong> {stats.delayed}
            </p>
          </div>

          <div style={styles.sideCard}>
            <h4 style={{ marginTop: 0 }}>Quick Actions</h4>
            <button style={styles.smallBtn} onClick={markDelivered}>Mark as Delivered</button>
            <button style={styles.smallBtn} onClick={downloadManifest}>Download Manifest</button>
            <button style={styles.smallBtn} onClick={checkDelays}>Check Delays</button>
          </div>

          <div style={styles.sideCard}>
            <h4 style={{ marginTop: 0 }}>Recent Updates</h4>
            <ul style={{ paddingLeft: 16 }}>
              {updates.map((u, i) => <li key={i} style={{ marginBottom: 8 }}>{u}</li>)}
            </ul>
          </div>

          {successMsg && <div style={styles.toast}>{successMsg}</div>}
        </aside>
      </main>
    </div>
  );
}

/* ---------- Helper Components ---------- */
const Stat = ({ title, value }) => (
  <div style={styles.statCard}>
    <div style={{ fontSize: 12, color: "#555" }}>{title}</div>
    <div style={{ fontSize: 20, fontWeight: 700 }}>{value}</div>
  </div>
);

const StatusBadge = ({ status }) => {
  const color = status === "Delivered" ? "#0a8a3a" : status === "In Transit" ? "#007b91" : "#f57c00";
  return (
    <span style={{ padding: "6px 10px", borderRadius: 20, background: "#fff", color, fontWeight: 600 }}>
      {status}
    </span>
  );
};

/* ---------- Sample Data ---------- */
function sampleShipments() {
  return [
    {
      id: "S1001",
      batchId: "C101",
      cropName: "Tomatoes",
      origin: "Farmer Rajesh",
      destination: "Retailer Suresh",
      vehicleNo: "AP09 XY 1234",
      driverName: "Vikram",
      expectedDate: "2025-11-12",
      status: "In Transit",
    },
    {
      id: "S1002",
      batchId: "C102",
      cropName: "Groundnut",
      origin: "Farmer Ramesh",
      destination: "Retailer Ravi",
      vehicleNo: "TS08 ZY 8765",
      driverName: "Arun",
      expectedDate: "2025-11-08",
      status: "Delivered",
    },
  ];
}

/* ---------- Styles ---------- */
const styles = {
  page: {
    minHeight: "100vh",
    background: "#f4fafd",
    fontFamily: "Inter, system-ui, Arial, sans-serif",
    padding: 20,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },
  title: { margin: 0, color: "#007b91" },
  subtitle: { color: "#555", marginTop: 4 },
  logout: {
    background: "#c62828",
    color: "#fff",
    border: "none",
    padding: "8px 12px",
    borderRadius: 8,
    cursor: "pointer",
  },
  container: { display: "grid", gridTemplateColumns: "1fr 320px", gap: 20 },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
    gap: 12,
    marginBottom: 12,
  },
  statCard: {
    background: "#fff",
    padding: 12,
    borderRadius: 8,
    boxShadow: "0 6px 16px rgba(0,0,0,0.06)",
    textAlign: "center",
  },
  card: {
    background: "#fff",
    padding: 16,
    borderRadius: 10,
    boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
    marginBottom: 14,
  },
  row: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
  field: { display: "block" },
  input: { width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #ddd", boxSizing: "border-box" },
  primaryBtn: { background: "#007b91", color: "#fff", border: "none", padding: "10px 14px", borderRadius: 8, cursor: "pointer" },
  search: { padding: "8px 10px", borderRadius: 8, border: "1px solid #ddd" },

  table: { width: "100%", minWidth: 900, borderCollapse: "collapse" },
  th: { textAlign: "left", padding: "8px 10px", borderBottom: "1px solid #eee", fontSize: 13, whiteSpace: "nowrap" },
  td: { padding: "8px 10px", borderTop: "1px solid #f6f8fa", fontSize: 14 },
  tdEllipsis: { padding: "8px 10px", borderTop: "1px solid #f6f8fa", fontSize: 14, maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  tdCenter: { padding: "8px 10px", borderTop: "1px solid #f6f8fa", textAlign: "center", width: 60 },

  linkBtn: { background: "transparent", border: "none", color: "#007b91", cursor: "pointer", marginRight: 8 },

  sidebar: {},
  sideCard: { background: "#fff", padding: 14, borderRadius: 10, boxShadow: "0 8px 20px rgba(0,0,0,0.06)", marginBottom: 12 },
  smallBtn: { padding: "8px 10px", borderRadius: 8, border: "1px solid #e6eef3", background: "#fff", cursor: "pointer", width: "100%", textAlign: "left" },

  toast: { marginTop: 12, background: "#e9fbfa", color: "#007b91", padding: "8px 10px", borderRadius: 8, fontWeight: 700 },
};
