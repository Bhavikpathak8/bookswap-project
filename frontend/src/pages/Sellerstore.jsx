import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getSellerStore, imageUrl } from "../api";
import { Card, Badge, Spinner, Empty } from "../components/UI";

export default function SellerStore({ showToast }) {
  const { sellerId } = useParams();
  const navigate     = useNavigate();
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]       = useState("books"); // books | reviews

  useEffect(() => {
    getSellerStore(sellerId)
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [sellerId]);

  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
      <Spinner size={48} />
    </div>
  );
  if (!data) return <div className="page"><Empty icon="🏪" title="Store not found" /></div>;

  const { seller, books, reviews } = data;
  const stars = (n) => Array.from({ length: 5 }, (_, i) => (
    <span key={i} style={{ color: i < Math.round(n) ? "var(--accent)" : "var(--border2)", fontSize: 14 }}>★</span>
  ));

  const joinedDate = seller.joined
    ? new Date(seller.joined).toLocaleDateString("en-IN", { month: "long", year: "numeric" })
    : "Recently";

  return (
    <div className="page" style={{ maxWidth: 1000 }}>
      {/* Store header */}
      <Card hover={false} style={{
        padding: "36px 32px", marginBottom: 28,
        background: "linear-gradient(135deg, var(--card), var(--card2))",
        border: "1px solid var(--border2)", position: "relative", overflow: "hidden"
      }}>
        {/* Background glow */}
        <div style={{ position: "absolute", top: -60, right: -60, width: 200, height: 200, borderRadius: "50%", background: "var(--accent-glow)", pointerEvents: "none" }} />

        <div style={{ display: "flex", gap: 24, alignItems: "flex-start", flexWrap: "wrap" }}>
          {/* Avatar */}
          <div style={{
            width: 80, height: 80, borderRadius: "50%", flexShrink: 0,
            background: "linear-gradient(135deg, #e8a020, #b87d18)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 32, fontWeight: 900, color: "#0c0a08",
            boxShadow: "0 4px 20px rgba(232,160,32,0.3)",
          }}>{seller.username[0].toUpperCase()}</div>

          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
              <h1 style={{ fontFamily: "var(--font-serif)", fontSize: 28, fontWeight: 800 }}>{seller.username}</h1>
              {seller.email_verified && (
                <span style={{ background: "rgba(76,175,125,0.15)", color: "var(--success)", border: "1px solid rgba(76,175,125,0.3)", borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 600 }}>
                  ✓ Verified
                </span>
              )}
            </div>

            {/* Rating */}
            {seller.avg_rating && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <div>{stars(seller.avg_rating)}</div>
                <span style={{ fontWeight: 700, color: "var(--accent)" }}>{seller.avg_rating}</span>
                <span style={{ color: "var(--muted)", fontSize: 13 }}>({seller.total_reviews} reviews)</span>
              </div>
            )}

            {/* Meta info */}
            <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
              {seller.city && (
                <span style={{ color: "var(--muted)", fontSize: 13, display: "flex", alignItems: "center", gap: 4 }}>
                  📍 {seller.city}{seller.state ? `, ${seller.state}` : ""}
                </span>
              )}
              <span style={{ color: "var(--muted)", fontSize: 13 }}>📅 Joined {joinedDate}</span>
              <span style={{ color: "var(--muted)", fontSize: 13 }}>📦 {seller.total_sales} sold</span>
              <span style={{ color: "var(--muted)", fontSize: 13 }}>📚 {books.length} listed</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 24, borderBottom: "1px solid var(--border)" }}>
        {[["books", `📚 Books (${books.length})`], ["reviews", `⭐ Reviews (${reviews.length})`]].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            style={{
              background: "none", border: "none", cursor: "pointer",
              padding: "10px 20px", fontSize: 14, fontWeight: tab === id ? 600 : 400,
              color: tab === id ? "var(--accent)" : "var(--muted)",
              borderBottom: `2px solid ${tab === id ? "var(--accent)" : "transparent"}`,
              marginBottom: -1, transition: "all 0.2s"
            }}>{label}</button>
        ))}
      </div>

      {/* Books tab */}
      {tab === "books" && (
        <div style={{ animation: "fadeUp 0.3s ease" }}>
          {books.length === 0 ? (
            <Empty icon="📚" title="No books listed yet" />
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px,1fr))", gap: 18 }}>
              {books.map((b, i) => (
                <div key={b.id} onClick={() => navigate(`/book/${b.id}`)}
                  style={{
                    background: "var(--card)", border: "1px solid var(--border)",
                    borderRadius: "var(--radius-lg)", overflow: "hidden", cursor: "pointer",
                    transition: "var(--transition)", animation: `fadeUp 0.4s ${i*0.06}s both`
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.borderColor = "var(--border2)"; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.borderColor = "var(--border)"; }}>
                  {/* Book image */}
                  <div style={{ aspectRatio: "3/4", background: "var(--surface)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                    {imageUrl(b.image)
                      ? <img src={imageUrl(b.image)} alt={b.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : <div style={{ fontSize: 48, opacity: 0.3 }}>📚</div>
                    }
                    {!b.available && (
                      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ background: "var(--danger)", color: "#fff", padding: "4px 14px", borderRadius: 20, fontSize: 12, fontWeight: 700 }}>SOLD</span>
                      </div>
                    )}
                    {b.views > 0 && (
                      <div style={{ position: "absolute", top: 8, right: 8, background: "rgba(0,0,0,0.7)", color: "var(--info)", padding: "2px 8px", borderRadius: 20, fontSize: 10, fontWeight: 600 }}>
                        👁 {b.views}
                      </div>
                    )}
                  </div>
                  <div style={{ padding: "12px 14px" }}>
                    <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.title}</div>
                    <div style={{ color: "var(--muted)", fontSize: 11, marginBottom: 8, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>by {b.author}</div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontWeight: 800, color: "var(--accent)", fontSize: 15 }}>₹{b.price}</span>
                      {b.condition && <span style={{ fontSize: 10, color: "var(--muted)", background: "var(--surface)", padding: "2px 6px", borderRadius: 4 }}>{b.condition}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Reviews tab */}
      {tab === "reviews" && (
        <div style={{ animation: "fadeUp 0.3s ease" }}>
          {reviews.length === 0 ? (
            <Empty icon="⭐" title="No reviews yet" subtitle="This seller hasn't received any reviews yet" />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {/* Rating summary */}
              {seller.avg_rating && (
                <Card hover={false} style={{ padding: "20px 24px", display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontFamily: "var(--font-serif)", fontSize: 48, fontWeight: 900, color: "var(--accent)", lineHeight: 1 }}>{seller.avg_rating}</div>
                    <div style={{ marginTop: 6 }}>{stars(seller.avg_rating)}</div>
                    <div style={{ color: "var(--muted)", fontSize: 12, marginTop: 4 }}>{seller.total_reviews} reviews</div>
                  </div>
                </Card>
              )}

              {reviews.map((r, i) => (
                <Card key={i} hover={false} style={{ padding: "18px 22px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 34, height: 34, borderRadius: "50%", background: "var(--surface)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14 }}>
                        {r.reviewer[0].toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{r.reviewer}</div>
                        <div style={{ fontSize: 11, color: "var(--muted)" }}>
                          {new Date(r.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </div>
                      </div>
                    </div>
                    <div>{stars(r.rating)}</div>
                  </div>
                  {r.comment && <p style={{ color: "var(--text2)", fontSize: 14, lineHeight: 1.6 }}>{r.comment}</p>}
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}