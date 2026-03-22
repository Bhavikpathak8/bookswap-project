import { useState, useEffect } from "react";
import {
  getAdminDashboard, deleteUser, banUser, unbanUser,
  getPendingBooks, approveBook, getAdminDisputes, resolveDispute,
  getCommission, updateCommission, featureBook, getFeaturedBooks
} from "../api";
import { Btn, Card, Badge, StatCard, Spinner, Empty, Textarea } from "../components/UI";

// ── Revenue Bar Chart ─────────────────────────────────────────
function RevenueChart({ labels, values }) {
  const CHART_HEIGHT = 180; // px
  const BAR_MIN_PX   = 6;

  if (!values || values.length === 0) {
    return (
      <div style={{ textAlign: "center", color: "var(--muted)", padding: "40px 0", fontSize: 14 }}>
        No revenue data yet. Make some sales!
      </div>
    );
  }

  const maxVal = Math.max(...values, 1);

  // If only one month, pad with zero months to look nicer
  const display = values.length === 1
    ? { labels: ["", "", labels[0], "", ""], values: [0, 0, values[0], 0, 0] }
    : { labels, values };

  return (
    <div>
      {/* Chart area */}
      <div style={{
        display: "flex", gap: 8, alignItems: "flex-end",
        height: CHART_HEIGHT, padding: "0 4px"
      }}>
        {display.values.map((val, i) => {
          const barPx = val === 0
            ? BAR_MIN_PX
            : Math.max(BAR_MIN_PX, Math.round((val / maxVal) * (CHART_HEIGHT - 40)));

          return (
            <div key={i} style={{
              flex: 1, display: "flex", flexDirection: "column",
              alignItems: "center", gap: 4, justifyContent: "flex-end",
              height: "100%"
            }}>
              {/* Value label on top of bar */}
              {val > 0 && (
                <div style={{
                  fontSize: 10, color: "var(--accent)", fontWeight: 600,
                  whiteSpace: "nowrap"
                }}>₹{val.toFixed(0)}</div>
              )}

              {/* The bar itself */}
              <div style={{
                width: "100%",
                height: barPx,
                background: val > 0
                  ? "linear-gradient(180deg, #f5c842, #e8a020, #b87d18)"
                  : "var(--border)",
                borderRadius: "5px 5px 0 0",
                transition: "height 0.7s cubic-bezier(0.4,0,0.2,1)",
                animation: `fadeUp 0.5s ${i * 0.08}s both`,
                boxShadow: val > 0 ? "0 0 12px rgba(232,160,32,0.25)" : "none",
                cursor: "default",
                position: "relative",
              }}
              onMouseEnter={e => {
                if (val > 0) e.currentTarget.style.filter = "brightness(1.2)";
              }}
              onMouseLeave={e => e.currentTarget.style.filter = ""}
              />
            </div>
          );
        })}
      </div>

      {/* X-axis line */}
      <div style={{ height: 1, background: "var(--border)", margin: "0 4px" }} />

      {/* Month labels */}
      <div style={{ display: "flex", gap: 8, padding: "6px 4px 0" }}>
        {display.labels.map((label, i) => (
          <div key={i} style={{
            flex: 1, textAlign: "center",
            fontSize: 11, color: "var(--muted)", fontWeight: 500
          }}>{label}</div>
        ))}
      </div>
    </div>
  );
}

export default function AdminDashboard({ showToast }) {
  const [data, setData]       = useState(null);
  const [tab, setTab]         = useState("overview");
  const [loading, setLoading] = useState(true);

  // Pending books
  const [pending, setPending]       = useState([]);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectingId, setRejectingId]   = useState(null);

  // Disputes
  const [disputes, setDisputes]   = useState([]);
  const [resolvingId, setResolvingId] = useState(null);
  const [resolveNote, setResolveNote] = useState("");

  // Commission
  const [commRate, setCommRate] = useState(10);
  const [savingComm, setSavingComm] = useState(false);

  // Featured books
  const [featured, setFeatured] = useState([]);

  const load = async () => {
    setLoading(true);
    const d = await getAdminDashboard();
    setData(d);
    setCommRate(d.commission_rate || 10);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (tab === "books") getPendingBooks().then(d => setPending(Array.isArray(d) ? d : []));
    if (tab === "disputes") getAdminDisputes().then(d => setDisputes(Array.isArray(d) ? d : []));
    if (tab === "featured") {
      getFeaturedBooks().then(d => setFeatured(Array.isArray(d) ? d : []));
    }
  }, [tab]);

  const handleBan = async (id, isBanned, username) => {
    const fn = isBanned ? unbanUser : banUser;
    const res = await fn(id);
    if (res.message) { showToast(res.message); load(); }
    else showToast(res.error, "error");
  };

  const handleDelete = async (id) => {
    if (!confirm("Permanently delete this user?")) return;
    const res = await deleteUser(id);
    if (res.message) { showToast("User deleted"); load(); }
    else showToast(res.error, "error");
  };

  const handleApprove = async (id, title) => {
    const res = await approveBook(id, "approve");
    if (res.message) { showToast(`"${title}" approved ✓`); getPendingBooks().then(d => setPending(d)); }
    else showToast(res.error, "error");
  };

  const handleReject = async (id) => {
    const res = await approveBook(id, "reject", rejectReason);
    if (res.message) { showToast("Book rejected"); setRejectingId(null); setRejectReason(""); getPendingBooks().then(d => setPending(d)); }
    else showToast(res.error, "error");
  };

  const handleResolve = async (id, action) => {
    const res = await resolveDispute(id, action, resolveNote);
    if (res.message) { showToast(`Dispute ${action}`); setResolvingId(null); setResolveNote(""); getAdminDisputes().then(d => setDisputes(d)); }
    else showToast(res.error, "error");
  };

  const handleSaveComm = async () => {
    setSavingComm(true);
    const res = await updateCommission(commRate);
    setSavingComm(false);
    if (res.message) showToast(res.message);
    else showToast(res.error, "error");
  };

  if (loading) return <div style={{ display: "flex", justifyContent: "center", padding: 100 }}><Spinner size={48} /></div>;

  const TABS = ["overview", "users", "books", "disputes", "featured", "settings"];
  const statusColor = { open: "var(--danger)", resolved: "var(--success)", rejected: "var(--muted)" };

  return (
    <div className="page">
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 32, flexWrap: "wrap" }}>
        <div style={{ background: "var(--accent)", color: "#0c0a08", borderRadius: 6, padding: "4px 12px", fontSize: 11, fontWeight: 800, letterSpacing: "0.08em" }}>
          ⚙ ADMIN
        </div>
        <h1 style={{ fontFamily: "var(--font-serif)", fontSize: 36, fontWeight: 700 }}>Control Panel</h1>
        {data?.pending_books > 0 && (
          <Badge color="var(--danger)" style={{ animation: "badgePop 0.3s ease" }}>
            {data.pending_books} pending approval
          </Badge>
        )}
        {data?.open_disputes > 0 && (
          <Badge color="var(--danger)">
            {data.open_disputes} open disputes
          </Badge>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 28, borderBottom: "1px solid var(--border)", flexWrap: "wrap" }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{
              background: "none", border: "none", cursor: "pointer",
              padding: "10px 18px", fontSize: 13, fontWeight: tab === t ? 600 : 400,
              color: tab === t ? "var(--accent)" : "var(--muted)",
              borderBottom: `2px solid ${tab === t ? "var(--accent)" : "transparent"}`,
              marginBottom: -1, transition: "var(--transition)",
              textTransform: "capitalize"
            }}>{t}
            {t === "books" && data?.pending_books > 0 && (
              <span style={{ marginLeft: 6, background: "var(--danger)", color: "#fff", borderRadius: 10, padding: "1px 6px", fontSize: 10, fontWeight: 700 }}>{data.pending_books}</span>
            )}
            {t === "disputes" && data?.open_disputes > 0 && (
              <span style={{ marginLeft: 6, background: "var(--danger)", color: "#fff", borderRadius: 10, padding: "1px 6px", fontSize: 10, fontWeight: 700 }}>{data.open_disputes}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ─────────────────────────────────── */}
      {tab === "overview" && (
        <div style={{ animation: "fadeUp 0.3s ease" }}>
          <div className="grid-stats" style={{ marginBottom: 32 }}>
            <StatCard icon="👥" label="Total Users"   value={data?.total_users}   color="var(--info)"    delay={0} />
            <StatCard icon="📚" label="Total Books"   value={data?.total_books}   color="var(--accent)"  delay={0.1} />
            <StatCard icon="📦" label="Total Orders"  value={data?.total_orders}  color="var(--success)" delay={0.2} />
            <StatCard icon="💰" label="Total Revenue" value={`₹${(data?.total_revenue || 0).toFixed(0)}`} color="var(--purple)" delay={0.3} />
          </div>

          {/* Revenue Chart */}
          <Card hover={false} style={{ padding: 28, marginBottom: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h3 style={{ fontWeight: 700, fontSize: 18 }}>Monthly Revenue</h3>
              <span style={{ fontSize: 12, color: "var(--muted)" }}>
                Total: ₹{(data?.total_revenue || 0).toFixed(2)}
              </span>
            </div>
            <RevenueChart
              labels={data?.month_labels || []}
              values={data?.monthly_revenue || []}
            />
          </Card>
        </div>
      )}

      {/* ── USERS ────────────────────────────────────── */}
      {tab === "users" && (
        <div style={{ animation: "fadeUp 0.3s ease" }}>
          <div style={{ overflowX: "auto", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)" }}>
            <table>
              <thead>
                <tr>
                  {["ID","Username","Email","City","Wallet","Status","Actions"].map(h=>(
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(data?.users || []).map(u => (
                  <tr key={u.id}>
                    <td style={{ color: "var(--muted)", fontSize: 12 }}>#{u.id}</td>
                    <td style={{ fontWeight: 600 }}>
                      {u.username}
                      {u.is_admin && <Badge color="var(--accent)" style={{ marginLeft: 6, fontSize: 10 }}>Admin</Badge>}
                    </td>
                    <td style={{ color: "var(--muted)", fontSize: 13 }}>{u.email}</td>
                    <td style={{ color: "var(--muted)", fontSize: 13 }}>{u.city || "—"}</td>
                    <td style={{ color: "var(--accent)", fontWeight: 600 }}>₹{u.wallet_balance}</td>
                    <td>
                      <Badge color={u.is_banned ? "var(--danger)" : "var(--success)"}>
                        {u.is_banned ? "Banned" : "Active"}
                      </Badge>
                    </td>
                    <td>
                      {!u.is_admin && (
                        <div style={{ display: "flex", gap: 6 }}>
                          <Btn size="sm" variant={u.is_banned ? "success" : "subtle"} onClick={() => handleBan(u.id, u.is_banned, u.username)}>
                            {u.is_banned ? "Unban" : "Ban"}
                          </Btn>
                          <Btn size="sm" variant="danger" onClick={() => handleDelete(u.id)}>Delete</Btn>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── PENDING BOOKS ─────────────────────────── */}
      {tab === "books" && (
        <div style={{ animation: "fadeUp 0.3s ease" }}>
          {pending.length === 0 ? (
            <Empty icon="✅" title="No pending books" subtitle="All caught up!" />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {pending.map((b, i) => (
                <Card key={b.id} hover={false} style={{ animation: `fadeUp 0.4s ${i * 0.06}s both` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 16 }}>{b.title}</div>
                      <div style={{ color: "var(--muted)", fontSize: 13, marginTop: 2 }}>
                        by {b.author} · {b.category} · ₹{b.price}
                      </div>
                      {b.location && <div style={{ color: "var(--muted)", fontSize: 12, marginTop: 2 }}>📍 {b.location}</div>}
                      <div style={{ color: "var(--muted)", fontSize: 12, marginTop: 2 }}>Seller ID: #{b.seller_id}</div>
                    </div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <Btn size="sm" variant="success" onClick={() => handleApprove(b.id, b.title)}>✓ Approve</Btn>
                      <Btn size="sm" variant="subtle" onClick={async () => { const res = await featureBook(b.id, "feature"); if(res.message) showToast("Book featured ⭐"); }}>⭐ Feature</Btn>
                      <Btn size="sm" variant="danger" onClick={() => setRejectingId(b.id)}>✕ Reject</Btn>
                    </div>
                  </div>
                  {rejectingId === b.id && (
                    <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--border)", animation: "fadeUp 0.2s ease" }}>
                      <Textarea value={rejectReason} onChange={setRejectReason} placeholder="Reason for rejection..." rows={2} />
                      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                        <Btn size="sm" variant="danger" onClick={() => handleReject(b.id)}>Confirm Reject</Btn>
                        <Btn size="sm" variant="subtle" onClick={() => setRejectingId(null)}>Cancel</Btn>
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── DISPUTES ─────────────────────────────── */}
      {tab === "disputes" && (
        <div style={{ animation: "fadeUp 0.3s ease" }}>
          {disputes.length === 0 ? (
            <Empty icon="🤝" title="No disputes" subtitle="All orders running smoothly!" />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {disputes.map((d, i) => (
                <Card key={d.id} hover={false} style={{ animation: `fadeUp 0.4s ${i * 0.06}s both` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 12 }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <span style={{ fontWeight: 600 }}>Dispute #{d.id}</span>
                        <Badge color={statusColor[d.status]}>{d.status}</Badge>
                      </div>
                      <div style={{ color: "var(--muted)", fontSize: 13, marginTop: 4 }}>
                        Book: <b style={{ color: "var(--text)" }}>{d.book_title}</b> · Order #{d.order_id} · by {d.user}
                      </div>
                    </div>
                    <div style={{ color: "var(--muted)", fontSize: 12 }}>{new Date(d.created_at).toLocaleDateString()}</div>
                  </div>

                  <div style={{ background: "var(--surface)", borderRadius: 8, padding: "10px 14px", fontSize: 13, marginBottom: 12, color: "var(--text2)", lineHeight: 1.6 }}>
                    {d.issue}
                  </div>

                  {d.resolution_note && (
                    <div style={{ background: "var(--success)11", border: "1px solid var(--success)33", borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "var(--success)", marginBottom: 12 }}>
                      Admin note: {d.resolution_note}
                    </div>
                  )}

                  {d.status === "open" && (
                    <>
                      {resolvingId === d.id ? (
                        <div style={{ animation: "fadeUp 0.2s ease" }}>
                          <Textarea value={resolveNote} onChange={setResolveNote} placeholder="Admin resolution note..." rows={2} />
                          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                            <Btn size="sm" variant="success" onClick={() => handleResolve(d.id, "resolved")}>✓ Resolve</Btn>
                            <Btn size="sm" variant="danger" onClick={() => handleResolve(d.id, "rejected")}>✕ Reject</Btn>
                            <Btn size="sm" variant="subtle" onClick={() => setResolvingId(null)}>Cancel</Btn>
                          </div>
                        </div>
                      ) : (
                        <Btn size="sm" onClick={() => setResolvingId(d.id)}>Respond to Dispute</Btn>
                      )}
                    </>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "featured" && (
        <div style={{ animation: "fadeUp 0.3s ease" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div>
              <h2 style={{ fontFamily: "var(--font-serif)", fontSize: 24, fontWeight: 700 }}>Featured Books</h2>
              <p style={{ color: "var(--muted)", fontSize: 13, marginTop: 4 }}>Pin books to the homepage. Feature them from the Books tab.</p>
            </div>
          </div>
          {featured.length === 0 ? (
            <Card hover={false} style={{ padding: 40, textAlign: "center" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>⭐</div>
              <p style={{ color: "var(--muted)" }}>No featured books yet. Go to Books tab → approve a book → feature it.</p>
            </Card>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
              {featured.map(b => (
                <Card key={b.id} hover style={{ overflow: "hidden", padding: 0 }}>
                  <div style={{ aspectRatio: "16/9", background: "var(--surface)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40, color: "var(--muted)" }}>
                    📚
                  </div>
                  <div style={{ padding: "14px 16px" }}>
                    <div style={{ fontWeight: 600, marginBottom: 2, fontSize: 14 }}>{b.title}</div>
                    <div style={{ color: "var(--muted)", fontSize: 12, marginBottom: 10 }}>by {b.author} · ₹{b.price}</div>
                    <Btn size="sm" variant="danger" onClick={async () => {
                      const res = await featureBook(b.id, "unfeature");
                      if (res.message) { showToast("Unfeatured"); getFeaturedBooks().then(d => setFeatured(Array.isArray(d) ? d : [])); }
                    }}>⭐ Unfeature</Btn>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "settings" && (
        <div style={{ animation: "fadeUp 0.3s ease", maxWidth: 600 }}>
          <Card hover={false} style={{ padding: 28 }}>
            <h3 style={{ fontWeight: 700, marginBottom: 6, fontSize: 18 }}>Commission Rate</h3>
            <p style={{ color: "var(--muted)", fontSize: 13, marginBottom: 20 }}>
              Percentage the platform takes from each sale
            </p>
            <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
              <input
                type="range" min="0" max="50" step="0.5"
                value={commRate} onChange={e => setCommRate(parseFloat(e.target.value))}
                style={{ flex: 1, accentColor: "var(--accent)" }}
              />
              <div style={{
                width: 70, textAlign: "center",
                background: "var(--accent-glow)", border: "1px solid var(--accent)44",
                borderRadius: 8, padding: "8px", color: "var(--accent)",
                fontWeight: 700, fontSize: 16
              }}>{commRate}%</div>
            </div>
            <div style={{ color: "var(--muted)", fontSize: 12, marginBottom: 16 }}>
              On a ₹200 book: seller gets ₹{(200 * (1 - commRate/100)).toFixed(2)}, platform earns ₹{(200 * commRate/100).toFixed(2)}
            </div>
            <Btn onClick={handleSaveComm} disabled={savingComm}>
              {savingComm ? "Saving..." : "Save Commission Rate"}
            </Btn>
          </Card>
        </div>
      )}
    </div>
  );
}