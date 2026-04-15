import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getBooks, getFeaturedBooks } from "../api";
import { useAuth } from "../context/AuthContext";
import BookCard from "../components/BookCard";

const CATEGORIES = [
  { name: "Fiction",     icon: "📖", color: "#e8a020" },
  { name: "Science",     icon: "🔬", color: "#60a5fa" },
  { name: "Technology",  icon: "💻", color: "#a78bfa" },
  { name: "Self-Help",   icon: "🌱", color: "#4caf7d" },
  { name: "History",     icon: "🏛️", color: "#f97316" },
  { name: "Finance",     icon: "💰", color: "#e8a020" },
  { name: "Children",    icon: "🧒", color: "#ec4899" },
  { name: "Non-Fiction", icon: "📰", color: "#60a5fa" },
];

const HOW_IT_WORKS = [
  {
    step: "1",
    icon: "📸",
    title: "List Your Book",
    desc: "Take a photo, set your price. Listing takes under 2 minutes. Admin approves within 24 hours.",
    color: "#e8a020",
  },
  {
    step: "2",
    icon: "💬",
    title: "Buyer Contacts You",
    desc: "Interested buyers chat with you directly. Discuss condition, meetup spot, or shipping details.",
    color: "#60a5fa",
  },
  {
    step: "3",
    icon: "🤝",
    title: "Meet or Ship",
    desc: "Meet at a safe public spot nearby, or ship the book and update tracking — buyer gets notified.",
    color: "#4caf7d",
  },
  {
    step: "4",
    icon: "✅",
    title: "Confirm & Get Paid",
    desc: "Buyer confirms delivery. Payment instantly lands in your BookSwap wallet. Withdraw anytime.",
    color: "#a78bfa",
  },
];

const WHY_USE_US = [
  { icon: "🛡️", title: "Buyer Protection",    desc: "Didn't receive the book? Raise a dispute. We refund you — no questions asked." },
  { icon: "⭐", title: "Verified Sellers",     desc: "All books are admin-approved. Sellers have public ratings and reviews." },
  { icon: "💬", title: "Chat History",         desc: "All conversations are saved. Proof of agreement if any issue arises." },
  { icon: "📍", title: "Local Discovery",      desc: "Find books in your city. Meet nearby. No shipping needed for local deals." },
  { icon: "💰", title: "Earn from Old Books",  desc: "Sell books you've already read. Turn your shelf into cash instantly." },
  { icon: "🎁", title: "Referral Bonuses",     desc: "Invite friends and earn wallet bonus. They get bonus too — everyone wins." },
];

const STATS = [
  { label: "Books Listed",  value: "12,400+", icon: "📚" },
  { label: "Happy Readers", value: "3,200+",  icon: "😊" },
  { label: "Cities Covered",value: "80+",     icon: "📍" },
  { label: "Books Swapped", value: "9,100+",  icon: "🔄" },
];

export default function Home() {
  const navigate        = useNavigate();
  const { user }        = useAuth();
  const [books, setBooks]       = useState([]);
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    getBooks({ limit: 8 }).then(d => { if (Array.isArray(d)) setBooks(d.slice(0, 8)); setLoading(false); });
    getFeaturedBooks().then(d => { if (Array.isArray(d)) setFeatured(d.slice(0, 4)); });
  }, []);

  return (
    <div>
      {/* ── HERO ─────────────────────────────────────────────── */}
      <section style={{
        position: "relative", overflow: "hidden",
        minHeight: "88vh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        textAlign: "center", padding: "80px 24px 60px",
      }} className="dot-bg">
        <div className="glow-orb" style={{ width: 700, height: 700, top: -250, left: "50%", transform: "translateX(-50%)", opacity: 0.7 }}/>
        <div className="glow-orb" style={{ width: 300, height: 300, bottom: 0, left: "5%", opacity: 0.3 }}/>
        <div className="glow-orb" style={{ width: 200, height: 200, bottom: 80, right: "8%", opacity: 0.25 }}/>

        <div style={{ position: "relative", zIndex: 1, maxWidth: 760 }}>
          {/* Badge */}
          <div className="fade-up" style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "var(--accent-glow)", border: "1px solid var(--accent)44",
            borderRadius: 30, padding: "6px 18px", marginBottom: 32,
          }}>
            <span style={{ fontSize: 14 }}>📚</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--accent)" }}>India's Book Exchange Community</span>
          </div>

          <h1 className="fade-up-1 hero-title" style={{
            fontFamily: "var(--font-serif)",
            fontSize: "clamp(40px, 7vw, 72px)",
            fontWeight: 800, lineHeight: 1.1,
            marginBottom: 24, letterSpacing: "-1px",
          }}>
            Buy & Sell Books<br/>
            <span style={{
              background: "linear-gradient(135deg, #e8a020, #f5c842, #b87d18)",
              backgroundSize: "200% auto",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              animation: "gradientShift 3s ease infinite",
            }}>Near You</span>
          </h1>

          <p className="fade-up-2 hero-sub" style={{
            fontSize: 18, color: "var(--text2)", maxWidth: 520,
            margin: "0 auto 40px", lineHeight: 1.7,
          }}>
            Connect with readers in your city. Buy affordable second-hand books or earn by selling ones you've finished.
          </p>

          <div className="fade-up-3" style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={() => navigate("/books")} style={{
              background: "var(--accent)", border: "none",
              borderRadius: 12, padding: "14px 32px",
              fontSize: 15, fontWeight: 700, color: "#0c0a08",
              cursor: "pointer", transition: "var(--transition)",
              boxShadow: "0 4px 20px rgba(232,160,32,0.4)",
            }}
            onMouseEnter={e => { e.currentTarget.style.transform="translateY(-2px)"; e.currentTarget.style.boxShadow="0 8px 30px rgba(232,160,32,0.5)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform=""; e.currentTarget.style.boxShadow="0 4px 20px rgba(232,160,32,0.4)"; }}>
              Browse Books →
            </button>
            <button onClick={() => navigate(user ? "/dashboard" : "/register")} style={{
              background: "transparent", border: "2px solid var(--border2)",
              borderRadius: 12, padding: "14px 32px",
              fontSize: 15, fontWeight: 600, color: "var(--text)",
              cursor: "pointer", transition: "var(--transition)",
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor="var(--accent)44"; e.currentTarget.style.background="var(--card)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor="var(--border2)"; e.currentTarget.style.background="transparent"; }}>
              {user ? "List a Book" : "Join for Free"}
            </button>
          </div>

          {/* Trust badges */}
          <div className="fade-up-4" style={{ display: "flex", gap: 24, justifyContent: "center", marginTop: 48, flexWrap: "wrap" }}>
            {["🔒 Buyer Protection", "⭐ Verified Sellers", "📍 Local Meetups", "💬 Live Chat"].map(t => (
              <div key={t} style={{ fontSize: 13, color: "var(--muted)", display: "flex", alignItems: "center", gap: 4 }}>
                {t}
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="section-divider"/>

      {/* ── STATS ─────────────────────────────────────────────── */}
      <section style={{ padding: "60px 24px", background: "var(--surface)" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px,1fr))", gap: 24 }}>
          {STATS.map((s, i) => (
            <div key={s.label} className="fade-up" style={{ textAlign: "center", animation: `fadeUp 0.5s ${i*0.1}s both` }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>{s.icon}</div>
              <div style={{ fontFamily: "var(--font-serif)", fontSize: 36, fontWeight: 800, color: "var(--accent)", lineHeight: 1 }}>{s.value}</div>
              <div style={{ color: "var(--muted)", fontSize: 13, marginTop: 6 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      <div className="section-divider"/>

      {/* ── HOW IT WORKS ──────────────────────────────────────── */}
      <section style={{ padding: "80px 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.12em", color: "var(--accent)", marginBottom: 12, textTransform: "uppercase" }}>
              Simple Process
            </div>
            <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(28px,4vw,42px)", fontWeight: 800, marginBottom: 14 }}>
              How BookSwap Works
            </h2>
            <p style={{ color: "var(--muted)", fontSize: 16, maxWidth: 500, margin: "0 auto" }}>
              From listing to earning — the whole process takes less than 5 minutes.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px,1fr))", gap: 24, position: "relative" }}>
            {HOW_IT_WORKS.map((step, i) => (
              <div key={step.step} style={{
                background: "var(--card)", border: "1px solid var(--border)",
                borderRadius: "var(--radius-lg)", padding: "28px 24px",
                position: "relative", overflow: "hidden",
                animation: `fadeUp 0.5s ${i*0.12}s both`,
                transition: "var(--transition)",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor=step.color+"66"; e.currentTarget.style.transform="translateY(-4px)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor="var(--border)"; e.currentTarget.style.transform=""; }}>
                {/* Background number */}
                <div style={{
                  position: "absolute", top: -10, right: 16,
                  fontSize: 80, fontWeight: 900, color: step.color,
                  opacity: 0.06, fontFamily: "var(--font-serif)", lineHeight: 1,
                  pointerEvents: "none",
                }}>{step.step}</div>

                <div style={{
                  width: 52, height: 52, borderRadius: 14,
                  background: step.color + "20",
                  border: `1px solid ${step.color}33`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 24, marginBottom: 18,
                }}>{step.icon}</div>

                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <span style={{
                    width: 22, height: 22, borderRadius: "50%",
                    background: step.color, color: "#0c0a08",
                    fontSize: 11, fontWeight: 800,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                  }}>{step.step}</span>
                  <h3 style={{ fontFamily: "var(--font-sans)", fontSize: 15, fontWeight: 700 }}>{step.title}</h3>
                </div>
                <p style={{ color: "var(--muted)", fontSize: 13, lineHeight: 1.6 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="section-divider"/>

      {/* ── WHY USE BOOKSWAP (answers the commission question) ── */}
      <section style={{ padding: "80px 24px", background: "var(--surface)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.12em", color: "var(--accent)", marginBottom: 12, textTransform: "uppercase" }}>
              Why Choose Us
            </div>
            <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(28px,4vw,42px)", fontWeight: 800, marginBottom: 14 }}>
              More Than Just a Listing Site
            </h2>
            <p style={{ color: "var(--muted)", fontSize: 16, maxWidth: 520, margin: "0 auto" }}>
              Anyone can meet and exchange books. But BookSwap gives you safety, trust, and protection — that's what the small platform fee covers.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px,1fr))", gap: 20 }}>
            {WHY_USE_US.map((item, i) => (
              <div key={item.title} style={{
                display: "flex", gap: 16, padding: "20px 22px",
                background: "var(--card)", border: "1px solid var(--border)",
                borderRadius: "var(--radius)", animation: `fadeUp 0.5s ${i*0.08}s both`,
                transition: "var(--transition)",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor="var(--accent)44"; e.currentTarget.style.transform="translateY(-2px)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor="var(--border)"; e.currentTarget.style.transform=""; }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                  background: "var(--accent-glow)", border: "1px solid var(--accent)22",
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
                }}>{item.icon}</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 5 }}>{item.title}</div>
                  <div style={{ color: "var(--muted)", fontSize: 13, lineHeight: 1.5 }}>{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="section-divider"/>

      {/* ── CATEGORIES ────────────────────────────────────────── */}
      <section style={{ padding: "80px 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 40, flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.12em", color: "var(--accent)", marginBottom: 8, textTransform: "uppercase" }}>Browse by Topic</div>
              <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(24px,3vw,36px)", fontWeight: 800 }}>Popular Categories</h2>
            </div>
            <button onClick={() => navigate("/books")} style={{
              background: "transparent", border: "1px solid var(--border2)",
              borderRadius: 10, padding: "9px 20px", fontSize: 13,
              color: "var(--muted)", cursor: "pointer",
            }}>View All →</button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px,1fr))", gap: 14 }}>
            {CATEGORIES.map((cat, i) => (
              <button key={cat.name} onClick={() => navigate(`/books?category=${cat.name}`)}
                style={{
                  background: "var(--card)", border: "1px solid var(--border)",
                  borderRadius: "var(--radius)", padding: "22px 12px",
                  cursor: "pointer", textAlign: "center", transition: "var(--transition)",
                  animation: `fadeUp 0.5s ${i*0.07}s both`,
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor=cat.color+"66"; e.currentTarget.style.background="var(--card2)"; e.currentTarget.style.transform="translateY(-3px)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor="var(--border)"; e.currentTarget.style.background="var(--card)"; e.currentTarget.style.transform=""; }}>
                <div style={{ fontSize: 28, marginBottom: 10 }}>{cat.icon}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text2)" }}>{cat.name}</div>
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="section-divider"/>

      {/* ── FEATURED BOOKS ────────────────────────────────────── */}
      {featured.length > 0 && (
        <>
          <section style={{ padding: "80px 24px", background: "var(--surface)" }}>
            <div style={{ maxWidth: 1100, margin: "0 auto" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 40, flexWrap: "wrap", gap: 12 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.12em", color: "var(--accent)", marginBottom: 8, textTransform: "uppercase" }}>Editor's Pick</div>
                  <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(24px,3vw,36px)", fontWeight: 800 }}>⭐ Featured Books</h2>
                </div>
                <button onClick={() => navigate("/books")} style={{
                  background: "transparent", border: "1px solid var(--border2)",
                  borderRadius: 10, padding: "9px 20px", fontSize: 13, color: "var(--muted)", cursor: "pointer",
                }}>Browse All →</button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px,1fr))", gap: 20 }}>
                {featured.map((book, i) => (
                  <BookCard key={book.id} book={book} index={i} onClick={() => navigate(`/book/${book.id}`)}/>
                ))}
              </div>
            </div>
          </section>
          <div className="section-divider"/>
        </>
      )}

      {/* ── RECENT BOOKS ──────────────────────────────────────── */}
      <section style={{ padding: "80px 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 40, flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.12em", color: "var(--accent)", marginBottom: 8, textTransform: "uppercase" }}>Just Listed</div>
              <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(24px,3vw,36px)", fontWeight: 800 }}>Recent Books</h2>
            </div>
            <button onClick={() => navigate("/books")} style={{
              background: "transparent", border: "1px solid var(--border2)",
              borderRadius: 10, padding: "9px 20px", fontSize: 13, color: "var(--muted)", cursor: "pointer",
            }}>See More →</button>
          </div>

          {loading ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px,1fr))", gap: 20 }}>
              {[...Array(8)].map((_, i) => (
                <div key={i} className="skeleton" style={{ height: 280, borderRadius: "var(--radius-lg)" }}/>
              ))}
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px,1fr))", gap: 20 }}>
              {books.map((book, i) => (
                <BookCard key={book.id} book={book} index={i} onClick={() => navigate(`/book/${book.id}`)}/>
              ))}
            </div>
          )}
        </div>
      </section>

      <div className="section-divider"/>

      {/* ── CTA BANNER ────────────────────────────────────────── */}
      {!user && (
        <section style={{
          padding: "80px 24px",
          background: "linear-gradient(135deg, var(--card2), var(--surface))",
          textAlign: "center",
        }}>
          <div style={{ maxWidth: 600, margin: "0 auto" }}>
            <div style={{ fontSize: 48, marginBottom: 20 }}>📚</div>
            <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(26px,4vw,40px)", fontWeight: 800, marginBottom: 16 }}>
              Start Buying & Selling Today
            </h2>
            <p style={{ color: "var(--muted)", fontSize: 16, marginBottom: 36, lineHeight: 1.7 }}>
              Join thousands of readers in your city. Get ₹100 welcome bonus on signup.
            </p>
            <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
              <button onClick={() => navigate("/register")} style={{
                background: "var(--accent)", border: "none",
                borderRadius: 12, padding: "14px 36px",
                fontSize: 15, fontWeight: 700, color: "#0c0a08",
                cursor: "pointer", boxShadow: "0 4px 20px rgba(232,160,32,0.4)",
              }}>
                Create Free Account →
              </button>
              <button onClick={() => navigate("/books")} style={{
                background: "transparent", border: "2px solid var(--border2)",
                borderRadius: 12, padding: "14px 36px",
                fontSize: 15, fontWeight: 600, color: "var(--text)", cursor: "pointer",
              }}>
                Browse First
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ── FOOTER ────────────────────────────────────────────── */}
      <footer style={{
        background: "var(--surface)", borderTop: "1px solid var(--border)",
        padding: "40px 24px 60px",
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px,1fr))", gap: 36, marginBottom: 40 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <div style={{ width: 28, height: 28, borderRadius: 6, background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, color: "#0c0a08", fontSize: 14 }}>B</div>
                <span style={{ fontFamily: "var(--font-serif)", fontWeight: 700, fontSize: 16 }}>BookSwap</span>
              </div>
              <p style={{ color: "var(--muted)", fontSize: 13, lineHeight: 1.6 }}>
                India's community for buying and selling second-hand books. Built with ❤️ for readers.
              </p>
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 14, color: "var(--text2)" }}>Platform</div>
              {["Browse Books","Sell a Book","How it Works","Pricing"].map(l => (
                <div key={l} style={{ color: "var(--muted)", fontSize: 13, marginBottom: 9, cursor: "pointer" }}
                  onClick={() => navigate("/books")}>{l}</div>
              ))}
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 14, color: "var(--text2)" }}>Support</div>
              {["Buyer Protection","Dispute Resolution","Seller Guidelines","Contact Us"].map(l => (
                <div key={l} style={{ color: "var(--muted)", fontSize: 13, marginBottom: 9 }}>{l}</div>
              ))}
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 14, color: "var(--text2)" }}>For Students</div>
              <div style={{ color: "var(--muted)", fontSize: 13, lineHeight: 1.7 }}>
                Perfect for college textbook exchange. Save up to 70% on books. Earn back after semester ends.
              </div>
            </div>
          </div>
          <div style={{ borderTop: "1px solid var(--border)", paddingTop: 24, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <div style={{ color: "var(--muted)", fontSize: 12 }}>© 2026 BookSwap. Made for readers, by readers.</div>
            <div style={{ display: "flex", gap: 20 }}>
              {["Privacy Policy","Terms of Use","Refund Policy"].map(l => (
                <div key={l} style={{ color: "var(--muted)", fontSize: 12, cursor: "pointer" }}>{l}</div>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}