import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getProfile, sendVerificationEmail, sendPhoneOtp, verifyPhoneOtp, getReviews, updateProfile } from "../api";
import { useAuth } from "../context/AuthContext";
import { Btn, Input, Card, Badge, Spinner } from "../components/UI";

export default function Profile({ showToast }) {
  const { user, setUser } = useAuth();
  const navigate          = useNavigate();
  const [profile, setProfile] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [tab, setTab]         = useState("overview");
  const [loading, setLoading] = useState(true);

  // Phone OTP state
  const [phone, setPhone]   = useState("");
  const [otp, setOtp]       = useState("");
  const [otpSent, setOtpSent] = useState(false);

  // Edit profile state
  const [editForm, setEditForm] = useState({ city: "", state: "", pincode: "", phone_number: "" });
  const [saving, setSaving]     = useState(false);

  useEffect(() => {
    getProfile().then(p => {
      setProfile(p);
      setEditForm({ city: p.city || "", state: p.state || "", pincode: p.pincode || "", phone_number: p.phone_number || "" });
      setPhone(p.phone_number || "");
      setLoading(false);
    });
    getReviews(user?.id).then(r => setReviews(Array.isArray(r) ? r : []));
  }, []);

  const handleSendVerification = async () => {
    const res = await sendVerificationEmail();
    showToast(res.message || res.error, res.error ? "error" : "success");
  };

  const handleSendOtp = async () => {
    if (!phone) { showToast("Enter your phone number", "error"); return; }
    const res = await sendPhoneOtp(phone);
    if (res.message) { setOtpSent(true); showToast("OTP sent! Check console in dev mode"); }
    else showToast(res.error, "error");
  };

  const handleVerifyOtp = async () => {
    const res = await verifyPhoneOtp(otp);
    if (res.message) {
      showToast("Phone verified! ✓");
      setProfile(p => ({ ...p, phone_verified: true }));
      setUser(u => ({ ...u, phone_verified: true }));
      setOtpSent(false);
    } else showToast(res.error, "error");
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    const res = await updateProfile(editForm);
    setSaving(false);
    if (res.message) {
      showToast("Profile updated!");
      setProfile(p => ({ ...p, ...editForm }));
      setUser(u => ({ ...u, ...editForm }));
    } else showToast(res.error, "error");
  };

  const avgRating = reviews.length > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  if (loading) return <div style={{ display: "flex", justifyContent: "center", padding: 100 }}><Spinner size={48} /></div>;

  const TABS = ["overview", "edit", "verification", "reviews"];

  return (
    <div className="page" style={{ maxWidth: 700 }}>
      {/* Header */}
      <Card hover={false} style={{ padding: "28px 32px", marginBottom: 24, display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
        <div style={{
          width: 72, height: 72, borderRadius: "50%", flexShrink: 0,
          background: "linear-gradient(135deg,#e8a020,#b87d18)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 28, fontWeight: 700, color: "#0c0a08",
          boxShadow: "0 4px 20px rgba(232,160,32,0.3)"
        }}>{profile?.username?.[0]?.toUpperCase()}</div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 4 }}>
            <h2 style={{ fontFamily: "var(--font-serif)", fontSize: 24, fontWeight: 700 }}>{profile?.username}</h2>
            {profile?.is_admin && <Badge color="var(--accent)">Admin</Badge>}
          </div>
          <p style={{ color: "var(--muted)", fontSize: 13 }}>{profile?.email}</p>
          {profile?.city && <p style={{ color: "var(--muted)", fontSize: 13 }}>📍 {profile.city}{profile.state ? `, ${profile.state}` : ""}</p>}
          <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
            <Badge color={profile?.email_verified ? "var(--success)" : "var(--muted)"}>
              {profile?.email_verified ? "✓ Email Verified" : "✕ Email Unverified"}
            </Badge>
            <Badge color={profile?.phone_verified ? "var(--success)" : "var(--muted)"}>
              {profile?.phone_verified ? "✓ Phone Verified" : "✕ Phone Unverified"}
            </Badge>
            {avgRating && <Badge color="var(--accent)">⭐ {avgRating}</Badge>}
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 24, borderBottom: "1px solid var(--border)", paddingBottom: 0 }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{
              background: "none", border: "none", cursor: "pointer",
              padding: "10px 18px", fontSize: 13, fontWeight: tab === t ? 600 : 400,
              color: tab === t ? "var(--accent)" : "var(--muted)",
              borderBottom: `2px solid ${tab === t ? "var(--accent)" : "transparent"}`,
              marginBottom: -1, transition: "var(--transition)",
              textTransform: "capitalize"
            }}>{t}</button>
        ))}
      </div>

      {/* Overview */}
      {tab === "overview" && (
        <div style={{ animation: "fadeUp 0.3s ease" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
            {[
              { label: "Books Listed", value: profile?.books?.length || 0, icon: "📚" },
              { label: "Wallet Balance", value: `₹${profile?.wallet_balance || 0}`, icon: "💰" },
            ].map(s => (
              <Card key={s.label} hover={false}>
                <div style={{ fontSize: 28, marginBottom: 6 }}>{s.icon}</div>
                <div style={{ fontSize: 26, fontWeight: 700, color: "var(--accent)", fontFamily: "var(--font-serif)" }}>{s.value}</div>
                <div style={{ color: "var(--muted)", fontSize: 13 }}>{s.label}</div>
              </Card>
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { label: "My Listings", icon: "📚", path: "/dashboard" },
              { label: "Order History", icon: "📦", path: "/orders" },
              { label: "Wallet", icon: "💰", path: "/wallet" },
              { label: "Messages", icon: "💬", path: "/messages" },
            ].map(item => (
              <div key={item.label} onClick={() => navigate(item.path)}
                style={{
                  background: "var(--card)", border: "1px solid var(--border)",
                  borderRadius: "var(--radius)", padding: "14px 18px",
                  display: "flex", alignItems: "center", gap: 12,
                  cursor: "pointer", transition: "var(--transition)"
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.background = "var(--card2)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.background = "var(--card)"; }}
              >
                <span style={{ fontSize: 20 }}>{item.icon}</span>
                <span style={{ fontWeight: 500 }}>{item.label}</span>
                <span style={{ marginLeft: "auto", color: "var(--muted)" }}>›</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit Profile */}
      {tab === "edit" && (
        <Card hover={false} style={{ padding: 28, animation: "fadeUp 0.3s ease" }}>
          <h3 style={{ fontWeight: 700, marginBottom: 20, fontSize: 18 }}>Edit Profile</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Input label="City" value={editForm.city} onChange={v => setEditForm(f => ({ ...f, city: v }))} placeholder="Surat" />
            <Input label="State" value={editForm.state} onChange={v => setEditForm(f => ({ ...f, state: v }))} placeholder="Gujarat" />
            <Input label="Pincode" value={editForm.pincode} onChange={v => setEditForm(f => ({ ...f, pincode: v }))} placeholder="395001" />
            <Input label="Phone Number" value={editForm.phone_number} onChange={v => setEditForm(f => ({ ...f, phone_number: v }))} placeholder="+91 9876543210" />
            <Btn onClick={handleSaveProfile} disabled={saving}>{saving ? "Saving..." : "Save Changes"}</Btn>
          </div>
        </Card>
      )}

      {/* Verification */}
      {tab === "verification" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16, animation: "fadeUp 0.3s ease" }}>
          {/* Email */}
          <Card hover={false} style={{ padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
              <div>
                <h3 style={{ fontWeight: 700, marginBottom: 4 }}>Email Verification</h3>
                <p style={{ color: "var(--muted)", fontSize: 13 }}>{profile?.email}</p>
              </div>
              {profile?.email_verified ? (
                <Badge color="var(--success)" style={{ padding: "6px 14px", fontSize: 13 }}>✓ Verified</Badge>
              ) : (
                <Btn onClick={handleSendVerification}>Send Verification Email</Btn>
              )}
            </div>
          </Card>

          {/* Phone */}
          <Card hover={false} style={{ padding: 24 }}>
            <h3 style={{ fontWeight: 700, marginBottom: 16 }}>Phone Verification</h3>
            {profile?.phone_verified ? (
              <Badge color="var(--success)" style={{ padding: "6px 14px", fontSize: 13 }}>✓ Phone Verified — {profile.phone_number}</Badge>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <Input label="Phone Number" value={phone} onChange={setPhone} placeholder="+91 9876543210" />
                {!otpSent ? (
                  <Btn onClick={handleSendOtp}>Send OTP</Btn>
                ) : (
                  <>
                    <Input label="Enter OTP" value={otp} onChange={setOtp} placeholder="6-digit code" />
                    <div style={{ display: "flex", gap: 8 }}>
                      <Btn onClick={handleVerifyOtp} style={{ flex: 1 }}>Verify OTP</Btn>
                      <Btn variant="subtle" onClick={() => setOtpSent(false)}>Resend</Btn>
                    </div>
                    <p style={{ fontSize: 12, color: "var(--muted)" }}>
                      In development mode, check the Flask terminal for your OTP.
                    </p>
                  </>
                )}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Reviews */}
      {tab === "reviews" && (
        <div style={{ animation: "fadeUp 0.3s ease" }}>
          {reviews.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: "var(--muted)" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>⭐</div>
              <div>No reviews yet</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {reviews.map((r, i) => (
                <Card key={r.id} hover={false} style={{ animation: `fadeUp 0.4s ${i * 0.07}s both` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>{r.reviewer}</span>
                    <span style={{ color: "var(--accent)", fontSize: 16 }}>{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span>
                  </div>
                  <p style={{ color: "var(--text2)", fontSize: 14, lineHeight: 1.6 }}>{r.comment}</p>
                  <div style={{ color: "var(--muted)", fontSize: 11, marginTop: 8 }}>{new Date(r.created_at).toLocaleDateString()}</div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
