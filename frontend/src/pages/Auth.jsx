import { useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { loginUser, googleLogin, socket } from "../api";
import { useAuth } from "../context/AuthContext";
import { Btn, Input, Card } from "../components/UI";

// ── LOGIN ──────────────────────────────────────────────────────
export function Login({ showToast }) {
  const { login }   = useAuth();
  const navigate    = useNavigate();
  const [searchParams] = useSearchParams();

  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent, setForgotSent]   = useState(false);

  // Show error if Google login failed
  const googleError = searchParams.get("error");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const res = await loginUser(email, password);
    setLoading(false);
    if (res.message) {
      login(res);
      socket.connect();
      showToast(`Welcome back, ${res.username}! 📚`);
      navigate(res.is_admin ? "/admin" : "/dashboard");
    } else {
      showToast(res.error || "Login failed", "error");
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!forgotEmail.trim()) { showToast("Enter your email address", "error"); return; }
    // Call backend forgot password endpoint
    try {
      const res = await fetch("http://localhost:5000/api/forgot_password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail })
      }).then(r => r.json());
      setForgotSent(true);
      showToast(res.message || "Reset instructions sent!");
    } catch {
      showToast("Check your email address", "error");
    }
  };

  return (
    <div style={{
      minHeight: "90vh", display: "flex", alignItems: "center",
      justifyContent: "center", padding: 32,
      position: "relative", overflow: "hidden"
    }}>
      <div className="glow-orb" style={{ width: 500, height: 500, top: -150, left: "50%", transform: "translateX(-50%)" }} />

      <div style={{ width: "100%", maxWidth: 420, position: "relative", zIndex: 1, animation: "scaleIn 0.4s ease" }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{
            width: 60, height: 60, borderRadius: 14, margin: "0 auto 16px",
            background: "linear-gradient(135deg,#e8a020,#b87d18)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 28, fontWeight: 900, color: "#0c0a08",
            boxShadow: "0 8px 24px rgba(232,160,32,0.3)"
          }}>B</div>
          <h1 style={{ fontFamily: "var(--font-serif)", fontSize: 30, fontWeight: 700 }}>
            {showForgot ? "Reset Password" : "Welcome Back"}
          </h1>
          <p style={{ color: "var(--muted)", marginTop: 6 }}>
            {showForgot ? "Enter your email to receive reset instructions" : "Sign in to your BookSwap account"}
          </p>
        </div>

        {/* Google error notice */}
        {googleError && (
          <div style={{
            background: "rgba(217,79,79,0.1)", border: "1px solid var(--danger)",
            borderRadius: 10, padding: "10px 14px", marginBottom: 16,
            color: "var(--danger)", fontSize: 13, textAlign: "center"
          }}>
            Google login failed. Please try again or use email/password.
          </div>
        )}

        <Card hover={false} style={{ padding: 32 }}>

          {/* ── FORGOT PASSWORD FORM ── */}
          {showForgot ? (
            forgotSent ? (
              <div style={{ textAlign: "center", padding: "16px 0" }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>📧</div>
                <p style={{ color: "var(--text)", fontWeight: 600, marginBottom: 8 }}>
                  Check your email!
                </p>
                <p style={{ color: "var(--muted)", fontSize: 13, marginBottom: 24 }}>
                  If an account exists for <b>{forgotEmail}</b>, we sent password reset instructions.
                </p>
                <button onClick={() => { setShowForgot(false); setForgotSent(false); setForgotEmail(""); }}
                  style={{ color: "var(--accent)", background: "none", border: "none", cursor: "pointer", fontSize: 14, fontWeight: 600 }}>
                  ← Back to Sign In
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                <Input
                  label="Email Address"
                  type="email"
                  value={forgotEmail}
                  onChange={setForgotEmail}
                  placeholder="your@email.com"
                  required
                />
                <Btn type="submit" size="lg">Send Reset Instructions →</Btn>
                <button type="button" onClick={() => setShowForgot(false)}
                  style={{
                    background: "none", border: "none", color: "var(--muted)",
                    cursor: "pointer", fontSize: 13, padding: 0
                  }}>
                  ← Back to Sign In
                </button>
              </form>
            )
          ) : (

          /* ── LOGIN FORM ── */
            <>
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                <Input label="Email Address" type="email" value={email}
                  onChange={setEmail} placeholder="your@email.com" required />
                <div>
                  <Input label="Password" type="password" value={password}
                    onChange={setPassword} placeholder="••••••••" required />
                  {/* Forgot password link */}
                  <div style={{ textAlign: "right", marginTop: 6 }}>
                    <button type="button" onClick={() => setShowForgot(true)}
                      style={{
                        background: "none", border: "none", color: "var(--accent)",
                        cursor: "pointer", fontSize: 12, fontWeight: 500, padding: 0
                      }}>
                      Forgot password?
                    </button>
                  </div>
                </div>
                <Btn type="submit" size="lg" disabled={loading}>
                  {loading ? "Signing in..." : "Sign In →"}
                </Btn>
              </form>

              <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "20px 0" }}>
                <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
                <span style={{ color: "var(--muted)", fontSize: 12 }}>OR</span>
                <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
              </div>

              <button onClick={googleLogin} style={{
                width: "100%", padding: "11px", borderRadius: 9,
                background: "var(--surface)", border: "1px solid var(--border2)",
                color: "var(--text)", fontSize: 14, fontWeight: 500, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                transition: "var(--transition)"
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = "var(--accent)"}
              onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border2)"}
              >
                🔐 Continue with Google
              </button>

              <p style={{ textAlign: "center", marginTop: 20, color: "var(--muted)", fontSize: 13 }}>
                New here?{" "}
                <Link to="/register" style={{ color: "var(--accent)", fontWeight: 600 }}>Create account</Link>
              </p>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}

// ── REGISTER ───────────────────────────────────────────────────
export function Register({ showToast }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const refCode = searchParams.get("ref") || "";

  const INDIAN_CITIES = ["Surat","Ahmedabad","Mumbai","Delhi","Bangalore","Pune",
    "Chennai","Kolkata","Hyderabad","Jaipur","Lucknow","Nagpur","Indore","Bhopal","Vadodara"];

  const [form, setForm] = useState({
    username: "", email: "", password: "",
    city: "", state: "", pincode: "", referral_code: refCode
  });
  const [loading, setLoading] = useState(false);
  const set = (k) => (v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) { showToast("Password must be at least 6 characters", "error"); return; }
    setLoading(true);
    const { registerUser } = await import("../api");
    const res = await registerUser(form);
    setLoading(false);
    if (res.message) {
      showToast("Account created! Please sign in 🎉");
      navigate("/login");
    } else {
      showToast(res.error || "Registration failed", "error");
    }
  };

  return (
    <div style={{
      minHeight: "90vh", display: "flex", alignItems: "center",
      justifyContent: "center", padding: 32,
      position: "relative", overflow: "hidden"
    }}>
      <div className="glow-orb" style={{ width: 400, height: 400, top: -100, right: "10%", opacity: 0.6 }} />

      <div style={{ width: "100%", maxWidth: 500, position: "relative", zIndex: 1, animation: "scaleIn 0.4s ease" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <h1 style={{ fontFamily: "var(--font-serif)", fontSize: 30, fontWeight: 700 }}>Join BookSwap</h1>
          <p style={{ color: "var(--muted)", marginTop: 6 }}>Create your free account and start swapping books</p>
        </div>

        <Card hover={false} style={{ padding: 32 }}>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div style={{ gridColumn: "1 / -1" }}>
                <Input label="Username" value={form.username} onChange={set("username")} placeholder="bookworm42" required />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <Input label="Email" type="email" value={form.email} onChange={set("email")} placeholder="your@email.com" required />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <Input label="Password" type="password" value={form.password} onChange={set("password")} placeholder="Min 6 characters" required />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>
                  Your City 📍
                </label>
                <select value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                  style={{ width: "100%", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 9, padding: "11px 14px", color: "var(--text)", fontSize: 14 }}>
                  <option value="">Select your city</option>
                  {INDIAN_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <Input label="State" value={form.state} onChange={set("state")} placeholder="Gujarat" />
              <Input label="Pincode" value={form.pincode} onChange={set("pincode")} placeholder="395001" />
              <div style={{ gridColumn: "1 / -1" }}>
                <Input label="Referral Code (Optional)" value={form.referral_code}
                  onChange={set("referral_code")} placeholder="Get ₹50 bonus for you & your friend" />
              </div>
            </div>
            <Btn type="submit" size="lg" disabled={loading}>
              {loading ? "Creating account..." : "Create Account →"}
            </Btn>
          </form>

          <p style={{ textAlign: "center", marginTop: 20, color: "var(--muted)", fontSize: 13 }}>
            Already have an account?{" "}
            <Link to="/login" style={{ color: "var(--accent)", fontWeight: 600 }}>Sign in</Link>
          </p>
        </Card>
      </div>
    </div>
  );
}