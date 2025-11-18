// src/pages/RetailerDashboard.jsx
import React, { useEffect, useState } from "react";

/**
 * Retailer Dashboard — Clean UI + Smart Inventory
 * Features:
 * - Add / Delete / Mark Sold
 * - Expiry tracking & Low Stock alerts
 * - CSV report download
 * - LocalStorage persistence
 * - Smart insights & recent updates
 */

const LS_PRODUCTS = "farmchainx_retailer_products_v1";
const LS_UPDATES = "farmchainx_retailer_updates_v1";

export default function RetailerDashboard() {
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
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const [form, setForm] = useState({
    name: "",
    type: "",
    quantity: "",
    price: "",
    quality: "Grade A",
    receivedDate: "",
    expiryDate: "",
  });

  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [successMsg, setSuccessMsg] = useState("");

  // persist to localStorage
  useEffect(() => {
    localStorage.setItem(LS_PRODUCTS, JSON.stringify(products));
    localStorage.setItem(LS_UPDATES, JSON.stringify(updates));
  }, [products, updates]);

  // add new product
  const handleAdd = (e) => {
    e.preventDefault();
    if (!form.name || !form.quantity || !form.price) {
      alert("Please fill required fields.");
      return;
    }
    const newId = `R${100 + products.length + 1}`;
    const newItem = {
      id: newId,
      name: form.name,
      type: form.type,
      quantity: parseInt(form.quantity),
      price: parseFloat(form.price),
      quality: form.quality,
      receivedDate: form.receivedDate || "—",
      expiryDate: form.expiryDate || "—",
      status: "In Stock",
      createdAt: new Date().toISOString(),
    };
    setProducts((p) => [newItem, ...p]);
    setUpdates((u) => [`${newItem.name} added to inventory.`, ...u].slice(0, 8));
    setSuccessMsg(`✅ ${newItem.name} added`);
    setTimeout(() => setSuccessMsg(""), 2000);
    setForm({
      name: "",
      type: "",
      quantity: "",
      price: "",
      quality: "Grade A",
      receivedDate: "",
      expiryDate: "",
    });
  };

  // delete
  const handleDelete = (id) => {
    if (!window.confirm("Remove this product?")) return;
    setProducts((p) => p.filter((x) => x.id !== id));
    setUpdates((u) => [`${id} deleted.`, ...u].slice(0, 8));
    setSuccessMsg("🗑️ Product removed");
    setTimeout(() => setSuccessMsg(""), 2000);
  };

  // mark sold out
  const markSoldOut = () => {
    if (!selectedId) return alert("Select a product first.");
    setProducts((p) =>
      p.map((x) => (x.id === selectedId ? { ...x, status: "Sold Out" } : x))
    );
    const sel = products.find((p) => p.id === selectedId);
    setUpdates((u) => [`${sel?.name || selectedId} marked Sold Out.`, ...u].slice(0, 8));
    setSuccessMsg(`✅ ${sel?.name || selectedId} sold out`);
    setTimeout(() => setSuccessMsg(""), 2000);
  };

  // expiry alerts
  const checkExpiryAlerts = () => {
    const now = new Date();
    const expiring = products.filter((p) => {
      if (!p.expiryDate || p.expiryDate === "—") return false;
      const diff = (new Date(p.expiryDate) - now) / (1000 * 3600 * 24);
      return diff <= 3 && diff >= 0;
    });
    if (expiring.length === 0) alert("No products expiring soon 🎉");
    else alert(`⚠️ ${expiring.length} product(s) expiring within 3 days!`);
  };

  // CSV download (selected or all)
  const downloadCSVReport = () => {
    const rows = selectedId
      ? products.filter((p) => p.id === selectedId)
      : products;
    const header = [
      "ID",
      "Name",
      "Type",
      "Quantity",
      "Price/kg",
      "Quality",
      "Received",
      "Expiry",
      "Status",
    ];
    const csv = [
      header.join(","),
      ...rows.map((p) =>
        [
          p.id,
          `"${p.name}"`,
          p.type,
          p.quantity,
          p.price,
          p.quality,
          p.receivedDate,
          p.expiryDate,
          p.status,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "retailer-stock-report.csv";
    a.click();
    a.remove();
  };

  const toggleSelect = (id) => {
    setSelectedId((s) => (s === id ? null : id));
  };

  // filter products by search
  const filtered = products.filter((p) => {
    const q = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.id.toLowerCase().includes(q) ||
      p.status.toLowerCase().includes(q)
    );
  });

  // stats
  const stats = {
    inStock: products.filter((p) => p.status === "In Stock").length,
    lowStock: products.filter((p) => p.quantity < 100).length,
    soldOut: products.filter((p) => p.status === "Sold Out").length,
    totalSales: products
      .filter((p) => p.status === "Sold Out")
      .reduce((sum, p) => sum + p.quantity * p.price, 0),
  };

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>🏪 Retailer Control Panel</h1>
          <p style={styles.subtitle}>Manage your store inventory & sales</p>
        </div>
        <button style={styles.logout}>Logout</button>
      </header>

      <main style={styles.container}>
        {/* LEFT MAIN SECTION */}
        <section>
          <div style={styles.statsGrid}>
            <Stat title="Products In Stock" value={stats.inStock} />
            <Stat title="Low Stock" value={stats.lowStock} />
            <Stat title="Sold Out" value={stats.soldOut} />
            <Stat title="Total Sales (₹)" value={stats.totalSales.toFixed(2)} />
          </div>

          <form style={styles.card} onSubmit={handleAdd}>
            <h3 style={{ marginTop: 0 }}>Add New Product</h3>

            <div style={styles.row}>
              <label style={styles.field}>
                Product Name
                <input
                  style={styles.input}
                  name="name"
                  value={form.name}
                  onChange={(e) =>
                    setForm({ ...form, name: e.target.value })
                  }
                  placeholder="e.g. Bananas"
                />
              </label>
              <label style={styles.field}>
                Type
                <input
                  style={styles.input}
                  name="type"
                  value={form.type}
                  onChange={(e) =>
                    setForm({ ...form, type: e.target.value })
                  }
                  placeholder="Fruit/Vegetable"
                />
              </label>
            </div>

            <div style={styles.row}>
              <label style={styles.field}>
                Quantity (kg)
                <input
                  style={styles.input}
                  name="quantity"
                  type="number"
                  value={form.quantity}
                  onChange={(e) =>
                    setForm({ ...form, quantity: e.target.value })
                  }
                />
              </label>

              <label style={styles.field}>
                Price per kg (₹)
                <input
                  style={styles.input}
                  name="price"
                  type="number"
                  value={form.price}
                  onChange={(e) =>
                    setForm({ ...form, price: e.target.value })
                  }
                />
              </label>
            </div>

            <div style={styles.row}>
              <label style={styles.field}>
                Quality
                <select
                  style={styles.input}
                  name="quality"
                  value={form.quality}
                  onChange={(e) =>
                    setForm({ ...form, quality: e.target.value })
                  }
                >
                  <option>Grade A</option>
                  <option>Grade B</option>
                  <option>Grade C</option>
                </select>
              </label>
              <label style={styles.field}>
                Received Date
                <input
                  type="date"
                  style={styles.input}
                  value={form.receivedDate}
                  onChange={(e) =>
                    setForm({ ...form, receivedDate: e.target.value })
                  }
                />
              </label>
            </div>

            <div style={styles.row}>
              <label style={styles.field}>
                Expiry Date
                <input
                  type="date"
                  style={styles.input}
                  value={form.expiryDate}
                  onChange={(e) =>
                    setForm({ ...form, expiryDate: e.target.value })
                  }
                />
              </label>
              <button type="submit" style={styles.primaryBtn}>
                Add Product
              </button>
            </div>
          </form>

          {/* Table */}
          <div style={styles.card}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 10,
              }}
            >
              <h3 style={{ margin: 0 }}>Inventory</h3>
              <input
                style={styles.search}
                placeholder="Search products..."
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
                    <th style={styles.th}>Name</th>
                    <th style={styles.th}>Type</th>
                    <th style={styles.th}>Qty</th>
                    <th style={styles.th}>Price</th>
                    <th style={styles.th}>Received</th>
                    <th style={styles.th}>Expiry</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => (
                    <tr key={p.id}>
                      <td style={styles.td}>
                        <input
                          type="checkbox"
                          checked={selectedId === p.id}
                          onChange={() => toggleSelect(p.id)}
                        />
                      </td>
                      <td style={styles.td}>{p.id}</td>
                      <td style={styles.td}>{p.name}</td>
                      <td style={styles.td}>{p.type}</td>
                      <td style={styles.td}>{p.quantity}</td>
                      <td style={styles.td}>{p.price}</td>
                      <td style={styles.td}>{p.receivedDate}</td>
                      <td style={styles.td}>{p.expiryDate}</td>
                      <td style={styles.td}>
                        <StatusBadge status={p.status} />
                      </td>
                      <td style={styles.td}>
                        <button
                          style={styles.linkBtn}
                          onClick={() =>
                            alert(JSON.stringify(p, null, 2))
                          }
                        >
                          View
                        </button>
                        <button
                          style={{ ...styles.linkBtn, color: "#b50000" }}
                          onClick={() => handleDelete(p.id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan="10" style={{ padding: 12 }}>
                        No products found.
                      </td>
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
              <strong>Avg Price:</strong> ₹
              {(
                products.reduce((s, p) => s + p.price, 0) /
                (products.length || 1)
              ).toFixed(2)}
            </p>
            <p style={{ fontSize: 13 }}>
              <strong>Expiring Soon:</strong>{" "}
              {products.filter((p) => {
                if (!p.expiryDate || p.expiryDate === "—") return false;
                const diff =
                  (new Date(p.expiryDate) - new Date()) /
                  (1000 * 3600 * 24);
                return diff <= 3 && diff >= 0;
              }).length}
            </p>
          </div>

          <div style={styles.sideCard}>
            <h4 style={{ marginTop: 0 }}>Quick Actions</h4>
            <button style={styles.smallBtn} onClick={markSoldOut}>
              Mark as Sold Out
            </button>
            <button style={styles.smallBtn} onClick={downloadCSVReport}>
              Download Stock Report
            </button>
            <button style={styles.smallBtn} onClick={checkExpiryAlerts}>
              Check Expiry Alerts
            </button>
          </div>

          <div style={styles.sideCard}>
            <h4 style={{ marginTop: 0 }}>Recent Updates</h4>
            <ul style={{ paddingLeft: 16 }}>
              {updates.map((u, i) => (
                <li key={i}>{u}</li>
              ))}
            </ul>
          </div>

          {successMsg && <div style={styles.toast}>{successMsg}</div>}
        </aside>
      </main>
    </div>
  );
}

/* ---------- Sub Components ---------- */
const Stat = ({ title, value }) => (
  <div style={styles.statCard}>
    <div style={{ fontSize: 12, color: "#555" }}>{title}</div>
    <div style={{ fontSize: 20, fontWeight: 700 }}>{value}</div>
  </div>
);

const StatusBadge = ({ status }) => {
  const color =
    status === "Sold Out"
      ? "#b50000"
      : status === "Low Stock"
      ? "#f57c00"
      : "#0a8a3a";
  return (
    <span
      style={{
        padding: "6px 10px",
        borderRadius: 20,
        background: "#fff",
        color,
        fontWeight: 600,
      }}
    >
      {status}
    </span>
  );
};

/* ---------- Sample Data ---------- */
function sampleProducts() {
  return [
    {
      id: "R101",
      name: "Tomatoes",
      type: "Vegetable",
      quantity: 120,
      price: 25,
      quality: "Grade A",
      receivedDate: "2025-11-05",
      expiryDate: "2025-11-15",
      status: "In Stock",
    },
    {
      id: "R102",
      name: "Bananas",
      type: "Fruit",
      quantity: 80,
      price: 30,
      quality: "Grade A",
      receivedDate: "2025-11-03",
      expiryDate: "2025-11-09",
      status: "Low Stock",
    },
  ];
}

/* ---------- Styles ---------- */
const styles = {
  page: {
    minHeight: "100vh",
    background: "#fff9f4",
    fontFamily: "Inter, system-ui, Arial, sans-serif",
    padding: 20,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },
  title: { margin: 0, color: "#d46a00" },
  subtitle: { color: "#555", marginTop: 4 },
  logout: {
    background: "#c62828",
    color: "#fff",
    border: "none",
    padding: "8px 12px",
    borderRadius: 8,
    cursor: "pointer",
  },
  container: {
    display: "grid",
    gridTemplateColumns: "1fr 320px",
    gap: 20,
  },
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
  input: {
    width: "100%",
    padding: "8px 10px",
    borderRadius: 8,
    border: "1px solid #ddd",
  },
  row: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
  field: { display: "block" },
  primaryBtn: {
    background: "#d46a00",
    color: "#fff",
    border: "none",
    padding: "10px 14px",
    borderRadius: 8,
    cursor: "pointer",
  },
  table: { width: "100%", borderCollapse: "collapse", marginTop: 8 },
  th: { fontSize: 13, textAlign: "left", padding: "8px 10px" },
  td: { padding: "8px 10px", borderTop: "1px solid #f3eae3", fontSize: 14 },
  linkBtn: { border: "none", background: "transparent", color: "#d46a00", cursor: "pointer" },
  sidebar: {},
  sideCard: {
    background: "#fff",
    padding: 14,
    borderRadius: 10,
    boxShadow: "0 8px 20px rgba(0,0,0,0.06)",
    marginBottom: 12,
  },
  smallBtn: {
    padding: "8px 10px",
    borderRadius: 8,
    border: "1px solid #e6efe9",
    background: "#fff",
    cursor: "pointer",
    width: "100%",
    textAlign: "left",
  },
  search: {
    padding: "8px 10px",
    borderRadius: 8,
    border: "1px solid #ddd",
  },
  toast: {
    marginTop: 12,
    background: "#fdf1e6",
    color: "#d46a00",
    padding: "8px 10px",
    borderRadius: 8,
    fontWeight: 600,
  },
};
