import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Btn, Input, Card } from "../components/UI";

export default function ResetPassword({ showToast }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const email = searchParams.get("email") || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");
  const [loading, setLoading]   = useState(false);
  const [done, setDone]         = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 6) { showToast("Password must be at least 6 characters", "error"); return; }
    if (password !== confirm) { showToast("Passwords do not match", "error"); return; }
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/reset_password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, email, password })
      }).then(r => r.json());
      if (res.message) {
        setDone(true);
        showToast("Password reset successfully! 🎉");
      } else {
        showToast(res.error || "Reset failed", "error");
      }
    } catch {
      showToast("Something went wrong. Try again.", "error");
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: "90vh", display: "flex", alignItems: "center",
      justifyContent: "center", padding: 32, position: "relative", overflow: "hidden"
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
          <h1 style={{ fontFamily: "var(--font-serif)", fontSize: 28, fontWeight: 700 }}>
            {done ? "Password Reset!" : "Set New Password"}
          </h1>
          <p style={{ color: "var(--muted)", marginTop: 6 }}>
            {done ? "You can now login with your new password" : `Resetting password for ${email}`}
          </p>
        </div>

        <Card hover={false} style={{ padding: 32 }}>
          {done ? (
            <div style={{ textAlign: "center", padding: "16px 0" }}>
              <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
              <p style={{ color: "var(--text)", marginBottom: 24 }}>
                Your password has been updated successfully.
              </p>
              <Btn onClick={() => navigate("/login")} size="lg">Go to Login →</Btn>
            </div>
          ) : !token ? (
            <div style={{ textAlign: "center", padding: "16px 0" }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>❌</div>
              <p style={{ color: "var(--danger)", marginBottom: 24 }}>
                Invalid or missing reset link. Please request a new one.
              </p>
              <Btn onClick={() => navigate("/login")} size="lg">Back to Login</Btn>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <Input label="New Password" type="password" value={password}
                onChange={setPassword} placeholder="Min 6 characters" required />
              <Input label="Confirm Password" type="password" value={confirm}
                onChange={setConfirm} placeholder="Repeat your new password" required />
              <Btn type="submit" size="lg" disabled={loading}>
                {loading ? "Resetting..." : "Reset Password →"}
              </Btn>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}