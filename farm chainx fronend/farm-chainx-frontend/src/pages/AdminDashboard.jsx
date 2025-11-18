// src/pages/AdminDashboard.jsx
import React, { useEffect, useState } from "react";

/**
 * Admin Dashboard
 * - Manage users (add/edit/delete)
 * - Approve pending registrations (mock)
 * - Simple analytics + logs
 * - CSV export for users
 * - LocalStorage persistence
 *
 * Drop into src/pages/ and wire to /admin-dashboard
 */

const LS_USERS = "farmchainx_admin_users_v1";
const LS_LOGS = "farmchainx_admin_logs_v1";

export default function AdminDashboard() {
  const [users, setUsers] = useState(() => {
    try {
      const raw = localStorage.getItem(LS_USERS);
      return raw ? JSON.parse(raw) : sampleUsers();
    } catch {
      return sampleUsers();
    }
  });

  const [logs, setLogs] = useState(() => {
    try {
      const raw = localStorage.getItem(LS_LOGS);
      return raw ? JSON.parse(raw) : sampleLogs();
    } catch {
      return sampleLogs();
    }
  });

  // form for adding/editing user
  const [form, setForm] = useState({ id: "", name: "", email: "", role: "farmer", approved: false });
  const [editing, setEditing] = useState(false);

  // UI
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [toast, setToast] = useState("");

  useEffect(() => {
    try {
      localStorage.setItem(LS_USERS, JSON.stringify(users));
      localStorage.setItem(LS_LOGS, JSON.stringify(logs));
    } catch (e) {
      console.warn("Failed to persist admin state", e);
    }
  }, [users, logs]);

  /* ----- helpers ----- */
  const newId = () => `U${1000 + users.length + 1}`;

  const pushLog = (text) => {
    setLogs((l) => [ `${new Date().toLocaleString()} — ${text}`, ...l ].slice(0, 30));
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  };

  /* ----- CRUD ----- */
  const handleAddOrUpdate = (e) => {
    e.preventDefault();
    if (!form.name || !form.email) return alert("Please provide name & email.");

    if (editing) {
      setUsers((prev) => prev.map((u) => (u.id === form.id ? { ...u, ...form } : u)));
      pushLog(`User ${form.email} updated`);
      showToast("User updated");
      setEditing(false);
    } else {
      const user = { ...form, id: newId(), approved: false, createdAt: new Date().toISOString() };
      setUsers((prev) => [user, ...prev]);
      pushLog(`New user ${user.email} added`);
      showToast("User added");
    }

    setForm({ id: "", name: "", email: "", role: "farmer", approved: false });
  };

  const handleEdit = (id) => {
    const u = users.find((x) => x.id === id);
    if (!u) return;
    setForm({ id: u.id, name: u.name, email: u.email, role: u.role, approved: u.approved });
    setEditing(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = (id) => {
    if (!window.confirm("Delete this user?")) return;
    const u = users.find((x) => x.id === id);
    setUsers((prev) => prev.filter((x) => x.id !== id));
    pushLog(`User ${u?.email || id} deleted`);
    showToast("User deleted");
    if (selectedId === id) setSelectedId(null);
  };

  const toggleSelect = (id) => setSelectedId((s) => (s === id ? null : id));

  /* ----- Approvals ----- */
  const approveSelected = () => {
    if (!selectedId) return alert("Select a user to approve.");
    setUsers((prev) => prev.map((u) => (u.id === selectedId ? { ...u, approved: true } : u)));
    const u = users.find((p) => p.id === selectedId);
    pushLog(`User ${u?.email || selectedId} approved`);
    showToast("User approved");
  };

  /* ----- CSV export ----- */
  const exportUsersCSV = () => {
    const rows = users;
    if (!rows || rows.length === 0) return alert("No users to export.");
    const header = ["ID","Name","Email","Role","Approved","Created At"];
    const csv = [header.join(","), ...rows.map(u => [
      u.id,
      `"${(u.name||"").replace(/"/g,'""')}"`,
      `"${(u.email||"").replace(/"/g,'""')}"`,
      u.role,
      u.approved ? "Yes":"No",
      u.createdAt || ""
    ].join(","))].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `farmchainx-users-${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(a.href);
    pushLog("Users exported to CSV");
    showToast("CSV downloaded");
  };

  /* ----- analytics ----- */
  const stats = {
    totalUsers: users.length,
    farmers: users.filter(u => u.role === "farmer").length,
    distributors: users.filter(u => u.role === "distributor").length,
    retailers: users.filter(u => u.role === "retailer").length,
    admins: users.filter(u => u.role === "admin").length,
    pendingApprovals: users.filter(u => !u.approved).length,
  };

  const filtered = users.filter(u => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (u.name || "").toLowerCase().includes(q) ||
      (u.email || "").toLowerCase().includes(q) ||
      (u.role || "").toLowerCase().includes(q) ||
      (u.id || "").toLowerCase().includes(q);
  });

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>🧑‍💼 Admin Dashboard</h1>
          <div style={styles.subtitle}>Manage users, approvals and system logs</div>
        </div>

        <div style={styles.headerRight}>
          <div style={{ color: "#333" }}>Hello, Admin</div>
        </div>
      </header>

      <main style={styles.container}>
        <section style={{ flex: 1 }}>
          {/* Add / Edit form */}
          <form style={styles.card} onSubmit={handleAddOrUpdate}>
            <h3 style={{ marginTop: 0 }}>{editing ? "Edit User" : "Add New User"}</h3>

            <div style={styles.row}>
              <label style={styles.field}>
                Name
                <input style={styles.input} value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} placeholder="Full name"/>
              </label>

              <label style={styles.field}>
                Email
                <input style={styles.input} value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} placeholder="email@example.com" />
              </label>
            </div>

            <div style={styles.row}>
              <label style={styles.field}>
                Role
                <select style={styles.input} value={form.role} onChange={(e) => setForm({...form, role: e.target.value})}>
                  <option value="farmer">Farmer</option>
                  <option value="distributor">Distributor</option>
                  <option value="retailer">Retailer</option>
                  <option value="consumer">Consumer</option>
                  <option value="admin">Admin</option>
                </select>
              </label>

              <label style={styles.field}>
                Approved
                <select style={styles.input} value={form.approved ? "yes":"no"} onChange={(e) => setForm({...form, approved: e.target.value === "yes"})}>
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </select>
              </label>
            </div>

            <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
              <button type="submit" style={styles.primaryBtn}>{editing ? "Save" : "Add User"}</button>
              {editing && <button type="button" style={styles.smallBtn} onClick={() => { setEditing(false); setForm({ id: "", name: "", email: "", role: "farmer", approved: false }); }}>Cancel</button>}
            </div>
          </form>

          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 12, marginBottom: 12 }}>
            <div style={styles.stat}><div style={{fontSize:12,color:"#666"}}>Total Users</div><div style={{fontSize:20,fontWeight:700}}>{stats.totalUsers}</div></div>
            <div style={styles.stat}><div style={{fontSize:12,color:"#666"}}>Farmers</div><div style={{fontSize:20,fontWeight:700}}>{stats.farmers}</div></div>
            <div style={styles.stat}><div style={{fontSize:12,color:"#666"}}>Distributors</div><div style={{fontSize:20,fontWeight:700}}>{stats.distributors}</div></div>
            <div style={styles.stat}><div style={{fontSize:12,color:"#666"}}>Retailers</div><div style={{fontSize:20,fontWeight:700}}>{stats.retailers}</div></div>
            <div style={styles.stat}><div style={{fontSize:12,color:"#666"}}>Pending Approvals</div><div style={{fontSize:20,fontWeight:700}}>{stats.pendingApprovals}</div></div>
          </div>

          {/* Users table */}
          <div style={styles.card}>
            <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10}}>
              <h3 style={{margin:0}}>Users</h3>
              <div style={{display:"flex", gap:8, alignItems:"center"}}>
                <input style={styles.search} placeholder="Search by name, email, role or id" value={search} onChange={(e) => setSearch(e.target.value)} />
                <button style={styles.smallBtn} onClick={exportUsersCSV}>Export CSV</button>
              </div>
            </div>

            <div style={{overflowX:"auto"}}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Select</th>
                    <th style={styles.th}>ID</th>
                    <th style={styles.th}>Name</th>
                    <th style={styles.th}>Email</th>
                    <th style={styles.th}>Role</th>
                    <th style={styles.th}>Approved</th>
                    <th style={styles.th}>Created</th>
                    <th style={styles.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(u => (
                    <tr key={u.id}>
                      <td style={styles.tdCenter}><input type="checkbox" checked={selectedId === u.id} onChange={() => toggleSelect(u.id)} /></td>
                      <td style={styles.tdEllipsis}>{u.id}</td>
                      <td style={styles.tdEllipsis}>{u.name}</td>
                      <td style={styles.tdEllipsis}>{u.email}</td>
                      <td style={styles.td}>{u.role}</td>
                      <td style={styles.td}>{u.approved ? <span style={{color:"#0a8a3a",fontWeight:700}}>Yes</span> : <span style={{color:"#d46a00",fontWeight:700}}>No</span>}</td>
                      <td style={styles.tdEllipsis}>{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—"}</td>
                      <td style={styles.td}>
                        <button style={styles.linkBtn} onClick={() => handleEdit(u.id)}>Edit</button>
                        <button style={{...styles.linkBtn, color:"#b50000"}} onClick={() => handleDelete(u.id)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && <tr><td colSpan="8" style={{padding:12,color:"#666"}}>No users found.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <aside style={styles.sidebar}>
          <div style={styles.sideCard}>
            <h4 style={{marginTop:0}}>Quick Actions</h4>
            <button style={styles.smallBtn} onClick={approveSelected}>Approve Selected</button>
            <button style={styles.smallBtn} onClick={() => { setLogs([]); pushLog("Logs cleared by admin"); showToast("Logs cleared"); }}>Clear Logs</button>
          </div>

          <div style={styles.sideCard}>
            <h4 style={{marginTop:0}}>System Logs</h4>
            <ul style={{paddingLeft:16, maxHeight:260, overflowY:"auto"}}>
              {logs.map((l,i) => <li key={i} style={{marginBottom:8, fontSize:13}}>{l}</li>)}
            </ul>
          </div>

          {toast && <div style={styles.toast}>{toast}</div>}
        </aside>
      </main>
    </div>
  );
}

/* ---------- Sample data & helpers ---------- */
function sampleUsers() {
  return [
    { id: "U1001", name: "Rajesh Farmer", email: "rajesh@example.com", role: "farmer", approved: true, createdAt: new Date().toISOString() },
    { id: "U1002", name: "Suresh Distributor", email: "suresh@example.com", role: "distributor", approved: true, createdAt: new Date().toISOString() },
    { id: "U1003", name: "Ravi Retailer", email: "ravi@example.com", role: "retailer", approved: false, createdAt: new Date().toISOString() },
  ];
}

function sampleLogs() {
  return [
    `${new Date().toLocaleString()} — System initialized.`,
    `${new Date().toLocaleString()} — Sample users loaded.`,
  ];
}

/* ---------- Styles ---------- */
const styles = {
  page: { minHeight: "100vh", background: "#f9f9fb", fontFamily: "Inter, system-ui, Arial, sans-serif", padding: 20 },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 },
  title: { margin: 0, color: "#b50000" },
  subtitle: { color: "#555", fontSize: 13, marginTop: 4 },
  headerRight: { display: "flex", gap: 12, alignItems: "center" },

  container: { display: "grid", gridTemplateColumns: "1fr 340px", gap: 20 },

  card: { background: "#fff", padding: 16, borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.06)", marginBottom: 14 },

  row: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
  field: { display: "block" },
  input: { width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #eee", boxSizing: "border-box" },

  primaryBtn: { background: "#b50000", color: "#fff", border: "none", padding: "10px 14px", borderRadius: 8, cursor: "pointer" },
  smallBtn: { padding: "8px 10px", borderRadius: 8, border: "1px solid #eee", background: "#fff", cursor: "pointer", width: "100%", textAlign: "left" },

  stat: { background: "#fff", padding: 12, borderRadius: 8, boxShadow: "0 6px 16px rgba(0,0,0,0.04)", textAlign: "center" },

  search: { padding: "8px 10px", borderRadius: 8, border: "1px solid #ddd" },

  table: { width: "100%", minWidth: 760, borderCollapse: "collapse" },
  th: { textAlign: "left", padding: "10px 8px", borderBottom: "1px solid #eee", fontSize: 13, whiteSpace: "nowrap" },
  td: { padding: "10px 8px", borderTop: "1px solid #f6f8fa", fontSize: 14 },
  tdEllipsis: { padding: "10px 8px", borderTop: "1px solid #f6f8fa", fontSize: 14, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  tdCenter: { padding: "10px 8px", borderTop: "1px solid #f6f8fa", textAlign: "center" },

  linkBtn: { background: "transparent", border: "none", color: "#b50000", cursor: "pointer", marginRight: 8 },

  sidebar: {},
  sideCard: { background: "#fff", padding: 14, borderRadius: 10, boxShadow: "0 8px 20px rgba(0,0,0,0.06)", marginBottom: 12 },

  toast: { marginTop: 12, background: "#fff0f0", color: "#b50000", padding: "8px 10px", borderRadius: 8, fontWeight: 700 },
};
