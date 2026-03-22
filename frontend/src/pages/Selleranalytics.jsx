import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getSellerAnalytics, imageUrl } from "../api";
import { useAuth } from "../context/AuthContext";
import { Card, Spinner, Empty } from "../components/UI";

// Mini bar chart component
function MiniBarChart({ data, valueKey, labelKey, color = "var(--accent)" }) {
  const max = Math.max(...data.map(d => d[valueKey]), 1);
  const H = 120;
  return (
    <div>
      <div style={{ display: "flex", gap: 6, alignItems: "flex-end", height: H }}>
        {data.map((d, i) => {
          const px = Math.max(4, Math.round((d[valueKey] / max) * (H - 24)));
          return (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, justifyContent: "flex-end", height: "100%" }}>
              {d[valueKey] > 0 && (
                <div style={{ fontSize: 9, color, fontWeight: 600, whiteSpace: "nowrap" }}>
                  {valueKey === "earnings" ? `₹${d[valueKey]}` : d[valueKey]}
                </div>
              )}
              <div style={{
                width: "100%", height: px,
                background: d[valueKey] > 0 ? `linear-gradient(180deg, ${color}, ${color}99)` : "var(--border)",
                borderRadius: "4px 4px 0 0",
                transition: "height 0.6s cubic-bezier(0.4,0,0.2,1)",
                boxShadow: d[valueKey] > 0 ? `0 0 8px ${color}44` : "none",
              }}
              onMouseEnter={e => { if (d[valueKey] > 0) e.currentTarget.style.filter = "brightness(1.2)"; }}
              onMouseLeave={e => e.currentTarget.style.filter = ""}
              />
            </div>
          );
        })}
      </div>
      <div style={{ height: 1, background: "var(--border)", margin: "0 2px" }} />
      <div style={{ display: "flex", gap: 6, marginTop: 5 }}>
        {data.map((d, i) => (
          <div key={i} style={{ flex: 1, textAlign: "center", fontSize: 10, color: "var(--muted)" }}>{d[labelKey]}</div>
        ))}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color = "var(--accent)", sub }) {
  return (
    <Card hover={false} style={{ padding: "20px 22px", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: -20, right: -10, fontSize: 64, opacity: 0.05, pointerEvents: "none" }}>{icon}</div>
      <div style={{ fontSize: 26, marginBottom: 10 }}>{icon}</div>
      <div style={{ fontFamily: "var(--font-serif)", fontSize: 30, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
      <div style={{ color: "var(--muted)", fontSize: 12, marginTop: 6, fontWeight: 500 }}>{label}</div>
      {sub && <div style={{ color: "var(--muted)", fontSize: 11, marginTop: 2 }}>{sub}</div>}
    </Card>
  );
}

export default function SellerAnalytics({ showToast }) {
  const navigate        = useNavigate();
  const { user }        = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chartMode, setChartMode] = useState("earnings"); // earnings | sales

  useEffect(() => {
    getSellerAnalytics()
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
      <Spinner size={48} />
    </div>
  );

  if (!data) return (
    <div className="page"><Empty icon="📊" title="Could not load analytics" /></div>
  );

  const stars = (n) => "★".repeat(Math.round(n || 0)) + "☆".repeat(5 - Math.round(n || 0));

  return (
    <div className="page" style={{ maxWidth: 1000 }}>
      {/* Header */}
      <div style={{ marginBottom: 36 }}>
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", color: "var(--accent)", marginBottom: 8, textTransform: "uppercase" }}>
          Seller Dashboard
        </div>
        <h1 style={{ fontFamily: "var(--font-serif)", fontSize: 36, fontWeight: 800, marginBottom: 6 }}>
          Your Analytics
        </h1>
        <p style={{ color: "var(--muted)", fontSize: 14 }}>
          Track your book performance, views, and earnings.
        </p>
      </div>

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px,1fr))", gap: 16, marginBottom: 32 }}>
        <StatCard icon="📚" label="Books Listed"   value={data.total_books}    color="var(--accent)" />
        <StatCard icon="👁️" label="Total Views"    value={data.total_views}    color="var(--info)" />
        <StatCard icon="📦" label="Books Sold"      value={data.total_sales}    color="var(--success)" />
        <StatCard icon="💰" label="Total Earnings"  value={`₹${data.total_earnings}`} color="var(--success)"
          sub={data.total_sales > 0 ? `Avg ₹${(data.total_earnings / data.total_sales).toFixed(0)}/sale` : ""} />
        <StatCard icon="⭐" label="Avg Rating"      value={data.avg_rating > 0 ? `${data.avg_rating}/5` : "—"} color="var(--purple)" />
      </div>

      {/* Earnings chart */}
      <Card hover={false} style={{ padding: 28, marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
          <h3 style={{ fontWeight: 700, fontSize: 17 }}>Monthly Performance</h3>
          <div style={{ display: "flex", gap: 6, background: "var(--surface)", borderRadius: 8, padding: 4 }}>
            {[["earnings", "💰 Earnings"], ["sales", "📦 Sales"]].map(([mode, label]) => (
              <button key={mode} onClick={() => setChartMode(mode)}
                style={{ padding: "6px 14px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600,
                  background: chartMode === mode ? "var(--accent)" : "transparent",
                  color: chartMode === mode ? "#0c0a08" : "var(--muted)",
                  transition: "all 0.2s"
                }}>{label}</button>
            ))}
          </div>
        </div>
        <MiniBarChart
          data={data.monthly} valueKey={chartMode} labelKey="month"
          color={chartMode === "earnings" ? "var(--accent)" : "var(--success)"}
        />
        {data.monthly.every(m => m[chartMode] === 0) && (
          <p style={{ textAlign: "center", color: "var(--muted)", fontSize: 13, marginTop: 16 }}>
            No {chartMode} data yet. Start selling!
          </p>
        )}
      </Card>

      {/* Per-book table */}
      <Card hover={false} style={{ padding: 28 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
          <h3 style={{ fontWeight: 700, fontSize: 17 }}>Book Performance</h3>
          <div style={{ fontSize: 12, color: "var(--muted)" }}>Sorted by most viewed</div>
        </div>

        {data.book_stats.length === 0 ? (
          <Empty icon="📚" title="No books yet" subtitle="List your first book to see analytics"
            action={{ label: "List a Book →", onClick: () => navigate("/add_book") }} />
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr>
                  {["Book", "Status", "Views", "Sales", "Earnings", "Listed"].map(h => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.book_stats.map(b => (
                  <tr key={b.id} style={{ cursor: "pointer" }} onClick={() => navigate(`/book/${b.id}`)}>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: 14, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {b.title}
                      </div>
                      <div style={{ color: "var(--muted)", fontSize: 12 }}>₹{b.price}</div>
                    </td>
                    <td>
                      <span style={{
                        padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600,
                        background: !b.is_approved ? "rgba(90,90,90,0.2)" : b.available ? "rgba(76,175,125,0.15)" : "rgba(217,79,79,0.15)",
                        color: !b.is_approved ? "var(--muted)" : b.available ? "var(--success)" : "var(--danger)",
                      }}>
                        {!b.is_approved ? "Pending" : b.available ? "Available" : "Sold"}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ color: "var(--info)", fontWeight: 600 }}>{b.views}</span>
                        <div style={{ flex: 1, height: 4, background: "var(--border)", borderRadius: 2, minWidth: 40 }}>
                          <div style={{
                            height: "100%", borderRadius: 2, background: "var(--info)",
                            width: `${Math.min(100, (b.views / Math.max(...data.book_stats.map(x => x.views), 1)) * 100)}%`
                          }} />
                        </div>
                      </div>
                    </td>
                    <td style={{ fontWeight: 600, color: b.sales > 0 ? "var(--success)" : "var(--muted)" }}>{b.sales}</td>
                    <td style={{ fontWeight: 700, color: "var(--accent)" }}>
                      {b.earnings > 0 ? `₹${b.earnings}` : "—"}
                    </td>
                    <td style={{ color: "var(--muted)", fontSize: 12 }}>
                      {b.created_at ? new Date(b.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* View your public store */}
      <div style={{ marginTop: 24, padding: "18px 22px", background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--radius)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: 14 }}>Your Public Store Page</div>
          <div style={{ color: "var(--muted)", fontSize: 13, marginTop: 2 }}>See how buyers see your profile and listings</div>
        </div>
        <button onClick={() => navigate(`/seller/${user?.id}`)}
          style={{ background: "var(--accent)", border: "none", borderRadius: 9, padding: "10px 20px", fontWeight: 600, fontSize: 13, color: "#0c0a08", cursor: "pointer" }}>
          View My Store →
        </button>
      </div>
    </div>
  );
}