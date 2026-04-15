import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getBook, buyBook, imageUrl, getOrders, cancelOrder,
  raiseDispute, getWallet, addCredit, checkWishlist,
  addToWishlist, removeWishlist, getSimilarBooks,
  updateTracking, getTracking
} from "../api";
import { useAuth } from "../context/AuthContext";
import { Btn, Card, Badge, Spinner, Empty } from "../components/UI";

// ── BOOK DETAIL ───────────────────────────────────────────────
export function BookDetail({ showToast }) {
  const { id }   = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [book, setBook]             = useState(null);
  const [loading, setLoading]       = useState(true);
  const [buying, setBuying]         = useState(false);
  const [wishlisted, setWishlisted] = useState(false);
  const [wLoading, setWLoading]     = useState(false);
  const [similar, setSimilar]       = useState([]);
  const [error, setError]           = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    getBook(id)
      .then(data => {
        if (!data || data.error) {
          setError(data?.error || "Book not found");
          setBook(null);
        } else {
          setBook(data);
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Cannot connect to server. Make sure Flask is running on port 5000.");
        setLoading(false);
      });

    getSimilarBooks(id).then(d => setSimilar(Array.isArray(d) ? d : [])).catch(() => {});
    if (user) {
      checkWishlist(id).then(d => setWishlisted(d?.wishlisted || false)).catch(() => {});
    }
  }, [id]);

  const handleBuy = async () => {
    if (!user) { navigate("/login"); return; }
    setBuying(true);
    const res = await buyBook(id);
    setBuying(false);
    if (res.message) {
      showToast("Book purchased! 🎉");
      getBook(id).then(d => { if (d && !d.error) setBook(d); });
    } else {
      showToast(res.error || "Purchase failed", "error");
    }
  };

  const handleWishlist = async () => {
    if (!user) { navigate("/login"); return; }
    setWLoading(true);
    if (wishlisted) {
      await removeWishlist(id);
      setWishlisted(false);
      showToast("Removed from wishlist");
    } else {
      await addToWishlist(id);
      setWishlisted(true);
      showToast("Added to wishlist ❤️");
    }
    setWLoading(false);
  };

  // ── Loading ──
  if (loading) return (
    <div style={{ display:"flex", justifyContent:"center", alignItems:"center", minHeight:"60vh" }}>
      <Spinner size={48}/>
    </div>
  );

  // ── Error ──
  if (error) return (
    <div className="page" style={{ textAlign:"center", paddingTop:60 }}>
      <div style={{ fontSize:48, marginBottom:16 }}>⚠️</div>
      <h2 style={{ fontFamily:"var(--font-serif)", marginBottom:8 }}>Could not load book</h2>
      <p style={{ color:"var(--muted)", marginBottom:8 }}>{error}</p>
      <p style={{ color:"var(--muted)", fontSize:13, marginBottom:24 }}>
        Book ID: {id} — Make sure Flask is running at localhost:5000
      </p>
      <div style={{ display:"flex", gap:12, justifyContent:"center" }}>
        <Btn onClick={() => window.location.reload()}>Try Again</Btn>
        <Btn variant="subtle" onClick={() => navigate("/books")}>← Back to Browse</Btn>
      </div>
    </div>
  );

  // ── Not found ──
  if (!book) return (
    <div className="page" style={{ textAlign:"center", paddingTop:60 }}>
      <Empty title="Book not found" subtitle="This book may have been removed"/>
      <Btn onClick={() => navigate("/books")} style={{ marginTop:20 }}>← Back to Browse</Btn>
    </div>
  );

  const isOwner = user && book.seller && user.username === book.seller.username;

  return (
    <div className="page" style={{ maxWidth: 900 }}>
      <button onClick={() => navigate("/books")}
        style={{ background:"none", border:"none", color:"var(--muted)", cursor:"pointer", marginBottom:28, fontSize:13 }}>
        ← Back to Browse
      </button>

      <div style={{
        display:"grid",
        gridTemplateColumns:"clamp(200px,30%,300px) 1fr",
        gap:40, alignItems:"start"
      }} className="fade-up">

        {/* Image */}
        <div style={{
          borderRadius:"var(--radius-lg)", overflow:"hidden",
          background:"var(--card)", border:"1px solid var(--border)",
          aspectRatio:"3/4", display:"flex", alignItems:"center",
          justifyContent:"center", position:"relative"
        }}>
          {imageUrl(book.image)
            ? <img src={imageUrl(book.image)} alt={book.title}
                style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
            : <div style={{ fontSize:80, opacity:0.3 }}>📚</div>}
          {book.is_featured && (
            <div style={{
              position:"absolute", top:10, left:10,
              background:"var(--accent)", color:"#0c0a08",
              padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:700
            }}>⭐ FEATURED</div>
          )}
        </div>

        {/* Details */}
        <div>
          <div style={{ display:"flex", gap:8, marginBottom:14, flexWrap:"wrap" }}>
            <Badge>{book.category}</Badge>
            {book.condition && <Badge color="var(--info)">{book.condition}</Badge>}
            {book.location  && <Badge color="var(--muted)">📍 {book.location}</Badge>}
            <Badge color={book.available ? "var(--success)" : "var(--danger)"}>
              {book.available ? "Available" : "Sold"}
            </Badge>
          </div>

          <h1 style={{
            fontFamily:"var(--font-serif)",
            fontSize:"clamp(22px,4vw,34px)",
            fontWeight:700, lineHeight:1.2, marginBottom:8
          }}>{book.title}</h1>

          <p style={{ color:"var(--text2)", fontSize:16, marginBottom:16 }}>
            by {book.author}
          </p>

          {book.description && (
            <p style={{ color:"var(--muted)", fontSize:14, lineHeight:1.7, marginBottom:24 }}>
              {book.description}
            </p>
          )}

          <div style={{
            fontSize:40, fontWeight:800, color:"var(--accent)",
            fontFamily:"var(--font-serif)", marginBottom:24
          }}>₹{book.price}</div>

          {/* Seller card */}
          {book.seller && (
            <div style={{
              display:"flex", alignItems:"center", gap:12, marginBottom:20,
              padding:"12px 14px", background:"var(--card)",
              border:"1px solid var(--border)", borderRadius:"var(--radius)"
            }}>
              <div style={{
                width:36, height:36, borderRadius:"50%", flexShrink:0,
                background:"linear-gradient(135deg,#e8a020,#b87d18)",
                display:"flex", alignItems:"center", justifyContent:"center",
                fontWeight:700, color:"#0c0a08", fontSize:14
              }}>{book.seller.username?.[0]?.toUpperCase() || "?"}</div>
              <div>
                <div style={{ fontWeight:600, fontSize:14 }}>{book.seller.username}</div>
                {book.seller.city && (
                  <div style={{ color:"var(--muted)", fontSize:12 }}>📍 {book.seller.city}</div>
                )}
                {book.seller.avg_rating && (
                  <div style={{ color:"var(--accent)", fontSize:12 }}>
                    ⭐ {book.seller.avg_rating}/5 ({book.seller.total_reviews} reviews)
                  </div>
                )}
              </div>
              {user && !isOwner && (
                <Btn size="sm" variant="ghost"
                  onClick={() => navigate(`/messages?user=${book.seller.id}`)}
                  style={{ marginLeft:"auto" }}>
                  💬 Chat
                </Btn>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
            {book.available && !isOwner && user ? (
              <Btn size="lg" onClick={handleBuy} disabled={buying} style={{ flex:1, minWidth:140 }}>
                {buying ? "Processing..." : `Buy Now — ₹${book.price}`}
              </Btn>
            ) : book.available && !user ? (
              <Btn size="lg" onClick={() => navigate("/login")} style={{ flex:1 }}>
                Login to Buy
              </Btn>
            ) : !book.available ? (
              <div style={{
                flex:1, padding:"14px", textAlign:"center",
                background:"var(--surface)", borderRadius:9,
                color:"var(--muted)", fontWeight:600
              }}>This book has been sold</div>
            ) : null}

            {/* Wishlist */}
            <button onClick={handleWishlist} disabled={wLoading}
              style={{
                padding:"12px 18px", borderRadius:9, flexShrink:0,
                border:`2px solid ${wishlisted ? "var(--danger)" : "var(--border)"}`,
                background: wishlisted ? "rgba(239,68,68,0.1)" : "transparent",
                color: wishlisted ? "var(--danger)" : "var(--muted)",
                cursor:"pointer", fontSize:20, transition:"all 0.2s"
              }}
              title={wishlisted ? "Remove from wishlist" : "Add to wishlist"}>
              {wishlisted ? "❤️" : "🤍"}
            </button>
          </div>

          {/* View count */}
          {book.view_count > 0 && (
            <div style={{ marginTop:12, color:"var(--muted)", fontSize:12 }}>
              👁 {book.view_count} {book.view_count === 1 ? "view" : "views"}
            </div>
          )}
        </div>
      </div>

      {/* Similar Books */}
      {similar.length > 0 && (
        <div style={{ marginTop:56 }}>
          <h2 style={{ fontFamily:"var(--font-serif)", fontSize:24, fontWeight:700, marginBottom:20 }}>
            You might also like
          </h2>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))", gap:14 }}>
            {similar.map(b => (
              <div key={b.id} onClick={() => navigate(`/book/${b.id}`)}
                style={{
                  background:"var(--card)", border:"1px solid var(--border)",
                  borderRadius:"var(--radius)", overflow:"hidden",
                  cursor:"pointer", transition:"var(--transition)"
                }}
                onMouseEnter={e => e.currentTarget.style.transform="translateY(-3px)"}
                onMouseLeave={e => e.currentTarget.style.transform=""}>
                <div style={{
                  aspectRatio:"3/4", background:"var(--surface)",
                  display:"flex", alignItems:"center", justifyContent:"center", fontSize:36
                }}>
                  {imageUrl(b.image)
                    ? <img src={imageUrl(b.image)} alt={b.title}
                        style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
                    : "📚"}
                </div>
                <div style={{ padding:"10px 12px" }}>
                  <div style={{ fontWeight:600, fontSize:12, marginBottom:2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{b.title}</div>
                  <div style={{ fontWeight:700, color:"var(--accent)", fontSize:13 }}>₹{b.price}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── ORDERS ────────────────────────────────────────────────────
export function Orders({ showToast }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [orders, setOrders]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [disputing, setDisputing] = useState(null);
  const [issue, setIssue]         = useState("");
  const [trackingOpen, setTrackingOpen] = useState(null);
  const [trackNote, setTrackNote] = useState("");

  const load = () => {
    setLoading(true);
    getOrders()
      .then(d => {
        if (Array.isArray(d)) { setOrders(d); setError(null); }
        else setError(d?.error || "Could not load orders");
      })
      .catch(() => setError("Cannot connect to server"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { if (user) load(); else setLoading(false); }, []);

  const handleCancel = async (id) => {
    if (!confirm("Cancel this order? You will be refunded.")) return;
    const res = await cancelOrder(id);
    if (res.message) { showToast("Order cancelled & refunded 💰"); load(); }
    else showToast(res.error || "Failed", "error");
  };

  const handleDispute = async (orderId) => {
    if (!issue.trim()) { showToast("Describe your issue", "error"); return; }
    const res = await raiseDispute(orderId, issue);
    if (res.message) { showToast("Dispute raised ✅"); setDisputing(null); setIssue(""); load(); }
    else showToast(res.error || "Failed", "error");
  };

  const handleTrackUpdate = async (orderId, status) => {
    const res = await updateTracking(orderId, status, trackNote);
    if (res.message) { showToast(`Tracking: ${status} ✅`); setTrackingOpen(null); setTrackNote(""); load(); }
    else showToast(res.error || "Failed", "error");
  };

  const statusColor = { paid:"var(--success)", cancelled:"var(--muted)", disputed:"var(--danger)", delivered:"var(--info)" };
  const trackIcon   = { pending:"📋", shipped:"🚚", delivered:"📦" };

  if (!user) return (
    <div className="page" style={{ textAlign:"center", paddingTop:80 }}>
      <Empty icon="🔒" title="Please login" subtitle="You need to be logged in to view orders"/>
      <Btn onClick={() => navigate("/login")} style={{ marginTop:20 }}>Go to Login</Btn>
    </div>
  );
  if (loading) return <div style={{ display:"flex", justifyContent:"center", alignItems:"center", minHeight:"60vh" }}><Spinner size={48}/></div>;
  if (error)   return (
    <div className="page" style={{ textAlign:"center" }}>
      <Empty icon="⚠️" title="Error" subtitle={error}/>
      <Btn onClick={load} style={{ marginTop:20 }}>Retry</Btn>
    </div>
  );

  return (
    <div className="page" style={{ maxWidth:860 }}>
      <h1 className="fade-up" style={{ fontFamily:"var(--font-serif)", fontSize:36, fontWeight:700, marginBottom:8 }}>My Orders</h1>
      <p className="fade-up-1" style={{ color:"var(--muted)", marginBottom:36 }}>Track your book purchases</p>

      {orders.length === 0
        ? <Empty icon="📦" title="No orders yet" subtitle="Buy your first book!"/>
        : (
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
            {orders.map((o, i) => (
              <Card key={o.order_id} hover={false} style={{ animation:`fadeUp 0.5s ${i*0.07}s both` }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:16 }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:600, fontSize:16, marginBottom:8 }}>📚 {o.book_title || `Book #${o.book_id}`}</div>
                    <div style={{ display:"flex", gap:20, color:"var(--muted)", fontSize:13, flexWrap:"wrap" }}>
                      <span>Paid: <b style={{ color:"var(--text)" }}>₹{o.amount}</b></span>
                      <span>Fee: <b style={{ color:"var(--danger)" }}>₹{o.commission}</b></span>
                      <span>Seller got: <b style={{ color:"var(--success)" }}>₹{o.net_amount}</b></span>
                    </div>
                    {o.date && <div style={{ color:"var(--muted)", fontSize:12, marginTop:6 }}>{new Date(o.date).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})}</div>}

                    {/* Tracking bar */}
                    <div style={{ marginTop:14, display:"flex", gap:0, alignItems:"center" }}>
                      {["pending","shipped","delivered"].map((step, si) => {
                        const steps=["pending","shipped","delivered"];
                        const cur=steps.indexOf(o.tracking_status||"pending");
                        const active=si<=cur;
                        return (
                          <div key={step} style={{ display:"flex", alignItems:"center", flex:si<2?1:0 }}>
                            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:3 }}>
                              <div style={{ width:26, height:26, borderRadius:"50%", background:active?"var(--accent)":"var(--border)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, color:active?"#0c0a08":"var(--muted)", fontWeight:700 }}>
                                {trackIcon[step]}
                              </div>
                              <div style={{ fontSize:9, color:active?"var(--accent)":"var(--muted)", fontWeight:active?600:400, whiteSpace:"nowrap" }}>
                                {step.charAt(0).toUpperCase()+step.slice(1)}
                              </div>
                            </div>
                            {si<2 && <div style={{ flex:1, height:2, background:si<cur?"var(--accent)":"var(--border)", margin:"0 6px", marginBottom:18 }}/>}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:8 }}>
                    <Badge color={statusColor[o.status]||"var(--muted)"}>{o.status||"paid"}</Badge>
                    {(o.status==="paid"||!o.status) && (
                      <div style={{ display:"flex", gap:8 }}>
                        <Btn size="sm" variant="subtle" onClick={() => setDisputing(disputing===o.order_id?null:o.order_id)}>Dispute</Btn>
                        <Btn size="sm" variant="danger" onClick={() => handleCancel(o.order_id)}>Cancel</Btn>
                      </div>
                    )}
                  </div>
                </div>

                {o.tracking_note && (
                  <div style={{ marginTop:10, padding:"8px 12px", background:"var(--surface)", borderRadius:8, fontSize:13, color:"var(--muted)" }}>
                    📝 {o.tracking_note}
                  </div>
                )}

                {disputing===o.order_id && (
                  <div style={{ marginTop:14, paddingTop:14, borderTop:"1px solid var(--border)" }}>
                    <textarea value={issue} onChange={e => setIssue(e.target.value)}
                      placeholder="Describe your issue..." rows={3}
                      style={{ width:"100%", background:"var(--surface)", border:"1px solid var(--border)", borderRadius:9, padding:"10px 14px", color:"var(--text)", fontSize:14, resize:"vertical" }}/>
                    <div style={{ display:"flex", gap:8, marginTop:10 }}>
                      <Btn size="sm" variant="danger" onClick={() => handleDispute(o.order_id)}>Submit Dispute</Btn>
                      <Btn size="sm" variant="subtle" onClick={() => { setDisputing(null); setIssue(""); }}>Cancel</Btn>
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )
      }
    </div>
  );
}

// ── WALLET ────────────────────────────────────────────────────
export function Wallet({ showToast }) {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [balance, setBalance]       = useState(0);
  const [amount, setAmount]         = useState("");
  const [loading, setLoading]       = useState(false);
  const [txns, setTxns]             = useState([]);
  const [txnLoading, setTxnLoading] = useState(true);
  const [refCode, setRefCode]       = useState("");
  const [myCode, setMyCode]         = useState(null);
  const [refStats, setRefStats]     = useState(null);
  const [tab, setTab]               = useState("topup");

  useEffect(() => {
    if (!user) return;
    getWallet().then(r => { if (r?.balance !== undefined) setBalance(r.balance); });
    import("../api").then(({ getWalletTransactions, getMyReferralCode, getReferralStats }) => {
      getWalletTransactions().then(d => { setTxns(Array.isArray(d) ? d : []); setTxnLoading(false); });
      getMyReferralCode().then(d => setMyCode(d));
      getReferralStats().then(d => setRefStats(d));
    });
  }, []);

  const handleTopup = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { showToast("Enter a valid amount", "error"); return; }
    setLoading(true);
    const { addCredit } = await import("../api");
    const res = await addCredit(amt);
    setLoading(false);
    if (res.new_balance !== undefined) {
      setBalance(res.new_balance);
      if (setUser) setUser(u => ({ ...u, wallet_balance: res.new_balance }));
      showToast(`₹${amt} added 💰`);
      setAmount("");
      const { getWalletTransactions } = await import("../api");
      getWalletTransactions().then(d => setTxns(Array.isArray(d) ? d : []));
    } else showToast(res.error || "Failed", "error");
  };

  const handleApplyReferral = async () => {
    if (!refCode.trim()) return;
    const { applyReferral } = await import("../api");
    const res = await applyReferral(refCode.trim());
    if (res.message) { showToast(res.message); setRefCode(""); getWallet().then(r => setBalance(r.balance)); }
    else showToast(res.error || "Invalid code", "error");
  };

  if (!user) return (
    <div className="page" style={{ textAlign:"center", paddingTop:80 }}>
      <Empty icon="🔒" title="Please login"/>
      <Btn onClick={() => navigate("/login")} style={{ marginTop:20 }}>Go to Login</Btn>
    </div>
  );

  const tabs = [{ id:"topup", label:"💳 Add Money" }, { id:"history", label:"📋 History" }, { id:"referral", label:"🎁 Referral" }];

  return (
    <div className="page" style={{ maxWidth:700 }}>
      <h1 className="fade-up" style={{ fontFamily:"var(--font-serif)", fontSize:36, fontWeight:700, marginBottom:8 }}>Wallet</h1>
      <p className="fade-up-1" style={{ color:"var(--muted)", marginBottom:28 }}>Manage your BookSwap balance</p>

      <Card hover={false} style={{ padding:"36px", textAlign:"center", marginBottom:28, background:"linear-gradient(135deg,var(--card),var(--card2))", border:"1px solid var(--accent)33", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:-40, right:-40, width:150, height:150, borderRadius:"50%", background:"var(--accent-glow)", pointerEvents:"none" }}/>
        <div style={{ color:"var(--muted)", fontSize:13, fontWeight:500, marginBottom:8 }}>AVAILABLE BALANCE</div>
        <div style={{ fontFamily:"var(--font-serif)", fontSize:52, fontWeight:900, color:"var(--accent)", lineHeight:1 }}>₹{balance.toFixed(2)}</div>
        <div style={{ color:"var(--muted)", fontSize:13, marginTop:8 }}>{user?.email}</div>
      </Card>

      <div style={{ display:"flex", gap:4, marginBottom:24, background:"var(--card)", borderRadius:10, padding:4 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ flex:1, padding:"9px 6px", borderRadius:8, border:"none", cursor:"pointer", fontWeight:600, fontSize:13, background:tab===t.id?"var(--accent)":"transparent", color:tab===t.id?"#0c0a08":"var(--muted)", transition:"all 0.2s" }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab==="topup" && (
        <Card hover={false} style={{ padding:24 }}>
          <h3 style={{ fontWeight:700, marginBottom:16, fontSize:18 }}>Add Money</h3>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:14 }}>
            {[100,250,500,1000].map(a => (
              <button key={a} onClick={() => setAmount(String(a))}
                style={{ padding:"8px 18px", borderRadius:8, cursor:"pointer", background:amount==a?"var(--accent-glow)":"var(--surface)", border:`1px solid ${amount==a?"var(--accent)":"var(--border)"}`, color:amount==a?"var(--accent)":"var(--muted)", fontWeight:600, fontSize:13 }}>
                ₹{a}
              </button>
            ))}
          </div>
          <div style={{ display:"flex", gap:10 }}>
            <input value={amount} onChange={e => setAmount(e.target.value)} type="number" placeholder="Custom amount"
              style={{ flex:1, background:"var(--surface)", border:"1px solid var(--border)", borderRadius:9, padding:"11px 14px", color:"var(--text)", fontSize:14, outline:"none" }}/>
            <Btn onClick={handleTopup} disabled={loading}>{loading?"...":"Add Money"}</Btn>
          </div>
        </Card>
      )}

      {tab==="history" && (
        <Card hover={false} style={{ padding:24 }}>
          <h3 style={{ fontWeight:700, marginBottom:16, fontSize:18 }}>Transaction History</h3>
          {txnLoading ? <Spinner/> : txns.length===0 ? (
            <Empty icon="📋" title="No transactions yet"/>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {txns.map(t => (
                <div key={t.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 0", borderBottom:"1px solid var(--border)" }}>
                  <div>
                    <div style={{ fontWeight:500, fontSize:14 }}>{t.description||t.type}</div>
                    <div style={{ color:"var(--muted)", fontSize:12, marginTop:2 }}>
                      {new Date(t.created_at).toLocaleString("en-IN",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"})}
                    </div>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontWeight:700, fontSize:16, color:t.type==="credit"?"var(--success)":"var(--danger)" }}>
                      {t.type==="credit"?"+":"-"}₹{Math.abs(t.amount).toFixed(2)}
                    </div>
                    {t.balance_after!=null && <div style={{ color:"var(--muted)", fontSize:11 }}>Bal: ₹{t.balance_after.toFixed(2)}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {tab==="referral" && (
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
          {myCode && (
            <Card hover={false} style={{ padding:24 }}>
              <h3 style={{ fontWeight:700, marginBottom:4, fontSize:18 }}>Your Referral Code</h3>
              <p style={{ color:"var(--muted)", fontSize:13, marginBottom:16 }}>
                Share this code — you both get ₹{refStats?.bonus_per_referral||50} when they register!
              </p>
              <div style={{ display:"flex", gap:10, alignItems:"center" }}>
                <div style={{ flex:1, padding:"14px 18px", background:"var(--surface)", borderRadius:10, border:"2px dashed var(--accent)", fontFamily:"monospace", fontSize:22, fontWeight:800, letterSpacing:"0.15em", color:"var(--accent)", textAlign:"center" }}>
                  {myCode.referral_code}
                </div>
                <Btn onClick={() => { navigator.clipboard.writeText(myCode.referral_code); showToast("Code copied! 📋"); }}>Copy</Btn>
              </div>
              {refStats && (
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12, marginTop:20 }}>
                  {[["Total",refStats.total_referrals],["Earned",`₹${refStats.total_earned}`],["Per Ref",`₹${refStats.bonus_per_referral}`]].map(([label,val]) => (
                    <div key={label} style={{ textAlign:"center", padding:"12px", background:"var(--card2)", borderRadius:10 }}>
                      <div style={{ fontWeight:800, fontSize:18, color:"var(--accent)" }}>{val}</div>
                      <div style={{ color:"var(--muted)", fontSize:11, marginTop:2 }}>{label}</div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}
          <Card hover={false} style={{ padding:24 }}>
            <h3 style={{ fontWeight:700, marginBottom:4, fontSize:18 }}>Apply Referral Code</h3>
            <p style={{ color:"var(--muted)", fontSize:13, marginBottom:16 }}>Have a friend's code? Apply it to get bonus wallet credit.</p>
            <div style={{ display:"flex", gap:10 }}>
              <input value={refCode} onChange={e => setRefCode(e.target.value.toUpperCase())} placeholder="Enter code e.g. AB12CD34"
                style={{ flex:1, background:"var(--surface)", border:"1px solid var(--border)", borderRadius:9, padding:"11px 14px", color:"var(--text)", fontSize:14, outline:"none", letterSpacing:"0.1em" }}/>
              <Btn onClick={handleApplyReferral}>Apply</Btn>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}