// ── Shared UI Components ──────────────────────────────────────

// Button
export function Btn({ children, onClick, variant = "primary", size = "md", disabled = false, type = "button", style: s = {}, className = "" }) {
  const sizes = {
    sm: { padding: "6px 16px", fontSize: "13px" },
    md: { padding: "10px 22px", fontSize: "14px" },
    lg: { padding: "14px 32px", fontSize: "15px" },
  };
  const variants = {
    primary: { background: "linear-gradient(135deg,#e8a020,#b87d18)", color: "#0c0a08", border: "none" },
    ghost:   { background: "transparent", color: "#e8a020", border: "1px solid #2c2520" },
    danger:  { background: "#d94f4f", color: "#fff", border: "none" },
    success: { background: "#4caf7d", color: "#fff", border: "none" },
    subtle:  { background: "rgba(255,255,255,0.05)", color: "#c8bfa8", border: "1px solid #2c2520" },
  };
  return (
    <button
      type={type} onClick={onClick} disabled={disabled} className={className}
      style={{
        ...sizes[size], ...variants[variant],
        borderRadius: "9px", fontWeight: 600, cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.55 : 1,
        transition: "all 0.2s cubic-bezier(0.4,0,0.2,1)",
        whiteSpace: "nowrap",
        ...s,
      }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.filter = "brightness(1.12)"; }}
      onMouseLeave={e => { e.currentTarget.style.filter = ""; }}
    >
      {children}
    </button>
  );
}

// Input
export function Input({ label, value, onChange, type = "text", placeholder = "", required = false, style: s = {}, helpText = "" }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      {label && <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</label>}
      <input
        type={type} value={value} required={required}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          background: "var(--surface)", border: "1px solid var(--border)",
          borderRadius: "9px", padding: "11px 14px", color: "var(--text)",
          fontSize: "14px", width: "100%", transition: "var(--transition)", ...s
        }}
      />
      {helpText && <span style={{ fontSize: "12px", color: "var(--muted)" }}>{helpText}</span>}
    </div>
  );
}

// Select
export function Select({ label, value, onChange, options = [], style: s = {} }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      {label && <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</label>}
      <select value={value} onChange={e => onChange(e.target.value)}
        style={{
          background: "var(--surface)", border: "1px solid var(--border)",
          borderRadius: "9px", padding: "11px 14px", color: "var(--text)",
          fontSize: "14px", width: "100%", cursor: "pointer", ...s
        }}>
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

// Textarea
export function Textarea({ label, value, onChange, placeholder = "", rows = 4 }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      {label && <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</label>}
      <textarea value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} rows={rows}
        style={{
          background: "var(--surface)", border: "1px solid var(--border)",
          borderRadius: "9px", padding: "11px 14px", color: "var(--text)",
          fontSize: "14px", width: "100%", resize: "vertical", transition: "var(--transition)"
        }}
      />
    </div>
  );
}

// Card
export function Card({ children, style: s = {}, hover = true, className = "" }) {
  return (
    <div className={hover ? `card-hover ${className}` : className}
      style={{
        background: "var(--card)", border: "1px solid var(--border)",
        borderRadius: "var(--radius-lg)", padding: "22px", ...s
      }}>
      {children}
    </div>
  );
}

// Badge
export function Badge({ children, color = "var(--accent)", style: s = {} }) {
  return (
    <span style={{
      background: `${color}22`, color, border: `1px solid ${color}44`,
      borderRadius: "20px", padding: "3px 10px", fontSize: "11px",
      fontWeight: 600, whiteSpace: "nowrap", ...s
    }}>{children}</span>
  );
}

// Spinner
export function Spinner({ size = 24 }) {
  return (
    <div style={{
      width: size, height: size,
      border: `2px solid var(--border2)`,
      borderTopColor: "var(--accent)",
      borderRadius: "50%",
      animation: "spin 0.8s linear infinite"
    }} />
  );
}

// Skeleton loader
export function Skeleton({ height = 20, width = "100%", style: s = {} }) {
  return <div className="skeleton" style={{ height, width, ...s }} />;
}

// Toast
export function Toast({ msg, type = "success", onClose }) {
  const colors = { success: "var(--success)", error: "var(--danger)", info: "var(--info)" };
  const icons  = { success: "✓", error: "✕", info: "ℹ" };
  return (
    <div style={{
      position: "fixed", bottom: "28px", right: "28px", zIndex: 9999,
      background: "var(--card2)", border: `1px solid ${colors[type]}55`,
      color: "var(--text)", padding: "14px 20px", borderRadius: "12px",
      boxShadow: `0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px ${colors[type]}33`,
      animation: "toastIn 0.3s ease", display: "flex", alignItems: "center", gap: "12px",
      maxWidth: "340px", cursor: "pointer"
    }} onClick={onClose}>
      <span style={{ color: colors[type], fontSize: "16px", fontWeight: 700 }}>{icons[type]}</span>
      <span style={{ fontSize: "14px", fontWeight: 500 }}>{msg}</span>
    </div>
  );
}

// Empty state
export function Empty({ icon = "📭", title = "Nothing here", subtitle = "" }) {
  return (
    <div style={{ textAlign: "center", padding: "80px 24px", color: "var(--muted)" }}>
      <div style={{ fontSize: "56px", marginBottom: "16px", animation: "float 3s ease-in-out infinite" }}>{icon}</div>
      <div style={{ fontSize: "18px", fontWeight: 600, color: "var(--text2)", marginBottom: "6px" }}>{title}</div>
      {subtitle && <div style={{ fontSize: "14px" }}>{subtitle}</div>}
    </div>
  );
}

// Section header
export function SectionHeader({ title, subtitle, action }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "28px", flexWrap: "wrap", gap: "12px" }}>
      <div>
        <h2 style={{ fontSize: "26px", fontWeight: 700, marginBottom: "4px" }}>{title}</h2>
        {subtitle && <p style={{ color: "var(--muted)", fontSize: "14px" }}>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

// StatCard
export function StatCard({ icon, label, value, color = "var(--accent)", delay = 0 }) {
  return (
    <Card style={{ animation: `fadeUp 0.5s ${delay}s both` }} hover={false}>
      <div style={{ fontSize: "26px", marginBottom: "10px" }}>{icon}</div>
      <div style={{ fontSize: "28px", fontWeight: 800, color, fontFamily: "var(--font-serif)", letterSpacing: "-0.5px" }}>{value}</div>
      <div style={{ color: "var(--muted)", fontSize: "13px", marginTop: "4px", fontWeight: 500 }}>{label}</div>
    </Card>
  );
}
