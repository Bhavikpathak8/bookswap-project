import { useState, useEffect } from "react";
import { BASE } from "../api";

export default function WakeUp({ children }) {
  const [ready, setReady] = useState(false);
  const [waking, setWaking] = useState(false);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    // Ping the backend to wake it up
    const ping = async () => {
      try {
        const res = await fetch(`${BASE}/api/ping`, { 
          signal: AbortSignal.timeout(3000) 
        });
        if (res.ok) { setReady(true); return; }
      } catch {}
      
      // Backend is sleeping — show wakeup screen
      setWaking(true);
      let secs = 0;
      const timer = setInterval(() => {
        secs++;
        setSeconds(secs);
      }, 1000);

      // Keep trying every 3 seconds
      const retry = setInterval(async () => {
        try {
          const res = await fetch(`${BASE}/api/ping`, {
            signal: AbortSignal.timeout(5000)
          });
          if (res.ok) {
            clearInterval(retry);
            clearInterval(timer);
            setReady(true);
            setWaking(false);
          }
        } catch {}
      }, 3000);
    };

    ping();
  }, []);

  if (ready) return children;

  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      background: "var(--bg)", padding: 24, textAlign: "center"
    }}>
      {/* Logo */}
      <div style={{
        width: 64, height: 64, borderRadius: 16,
        background: "linear-gradient(135deg,#e8a020,#b87d18)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 32, fontWeight: 900, color: "#0c0a08",
        boxShadow: "0 8px 32px rgba(232,160,32,0.3)",
        marginBottom: 24, animation: "pulse 2s infinite"
      }}>B</div>

      <h2 style={{ fontFamily: "var(--font-serif)", fontSize: 28, fontWeight: 700, marginBottom: 12 }}>
        BookSwap
      </h2>

      {waking ? (
        <>
          <p style={{ color: "var(--muted)", fontSize: 15, marginBottom: 8, maxWidth: 340 }}>
            Waking up the server... this takes about 30-50 seconds on the free plan.
          </p>
          <div style={{ color: "var(--accent)", fontSize: 13, marginBottom: 28 }}>
            {seconds}s elapsed
          </div>

          {/* Progress bar */}
          <div style={{
            width: 280, height: 4, background: "var(--border)",
            borderRadius: 2, overflow: "hidden", marginBottom: 32
          }}>
            <div style={{
              height: "100%", borderRadius: 2,
              background: "linear-gradient(90deg, var(--accent), var(--accent-dim))",
              width: `${Math.min(100, (seconds / 50) * 100)}%`,
              transition: "width 1s linear"
            }}/>
          </div>

          <p style={{ color: "var(--muted)", fontSize: 12 }}>
            ☕ Free hosting sleeps when inactive. This only happens once!
          </p>
        </>
      ) : (
        <p style={{ color: "var(--muted)", fontSize: 15 }}>
          Connecting to server...
        </p>
      )}
    </div>
  );
}