// Login.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loginUser, googleLogin, socket } from "../api";
import { useAuth } from "../context/AuthContext";
import { Btn, Input, Card } from "../components/UI";

export function Login({ showToast }) {
  const { login }       = useAuth();
  const navigate        = useNavigate();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const res = await loginUser(email, password);
    setLoading(false);
    if (res.message) {
      login(res);
      showToast(`Welcome back, ${res.username}! 📚`);
      navigate(res.is_admin ? "/admin" : "/dashboard");
    } else {
      showToast(res.error || "Login failed", "error");
    }
  };

  return (
    <div style={{
      minHeight: "90vh", display: "flex", alignItems: "center", justifyContent: "center",
      padding: 32, position: "relative", overflow: "hidden"
    }}>
      <div className="glow-orb" style={{ width: 500, height: 500, top: -150, left: "50%", transform: "translateX(-50%)" }} />

      <div style={{ width: "100%", maxWidth: 420, position: "relative", zIndex: 1, animation: "scaleIn 0.4s ease" }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{
            width: 60, height: 60, borderRadius: 14, margin: "0 auto 16px",
            background: "linear-gradient(135deg,#e8a020,#b87d18)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 28, fontWeight: 900, color: "#0c0a08",
            boxShadow: "0 8px 24px rgba(232,160,32,0.3)"
          }}>B</div>
          <h1 style={{ fontFamily: "var(--font-serif)", fontSize: 30, fontWeight: 700 }}>Welcome Back</h1>
          <p style={{ color: "var(--muted)", marginTop: 6 }}>Sign in to your BookSwap account</p>
        </div>

        <Card hover={false} style={{ padding: 32 }}>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <Input label="Email Address" type="email" value={email} onChange={setEmail} placeholder="your@email.com" required />
            <Input label="Password" type="password" value={password} onChange={setPassword} placeholder="••••••••" required />
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
        </Card>
      </div>
    </div>
  );
}

// Register.jsx
export function Register({ showToast }) {
  const navigate = useNavigate();
  const INDIAN_CITIES = ["Surat", "Ahmedabad", "Mumbai", "Delhi", "Bangalore", "Pune", "Chennai", "Kolkata", "Hyderabad", "Jaipur", "Lucknow", "Nagpur", "Indore", "Bhopal", "Vadodara"];

  const [form, setForm] = useState({ username: "", email: "", password: "", city: "", state: "", pincode: "" });
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
      minHeight: "90vh", display: "flex", alignItems: "center", justifyContent: "center",
      padding: 32, position: "relative", overflow: "hidden"
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

              {/* Location fields */}
              <div style={{ gridColumn: "1 / -1" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    Your City <span style={{ color: "var(--accent)" }}>📍</span>
                  </label>
                  <select value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                    style={{
                      background: "var(--surface)", border: "1px solid var(--border)",
                      borderRadius: 9, padding: "11px 14px", color: "var(--text)", fontSize: 14
                    }}>
                    <option value="">Select your city</option>
                    {INDIAN_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <span style={{ fontSize: 12, color: "var(--muted)" }}>
                    Used to show you books available near you
                  </span>
                </div>
              </div>
              <Input label="State" value={form.state} onChange={set("state")} placeholder="Gujarat" />
              <Input label="Pincode" value={form.pincode} onChange={set("pincode")} placeholder="395001" />
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
