import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { logoutUser, getNotifUnreadCount, getNotifications, markNotifsRead } from "../api";

export default function Navbar() {
  const { user, logout }              = useAuth();
  const location                      = useLocation();
  const navigate                      = useNavigate();
  const [notifCount, setNotifCount]   = useState(0);
  const [notifs, setNotifs]           = useState([]);
  const [showNotifs, setShowNotifs]   = useState(false);
  const [scrolled, setScrolled]       = useState(false);
  const [mobileOpen, setMobileOpen]   = useState(false);

  const isActive = (path) => location.pathname === path;

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false); setShowNotifs(false); }, [location]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!user) return;
    const fetchCount = () => getNotifUnreadCount().then(r => setNotifCount(r.count || 0));
    fetchCount();
    const interval = setInterval(fetchCount, 15000);
    return () => clearInterval(interval);
  }, [user]);

  const handleNotifClick = async () => {
    if (showNotifs) { setShowNotifs(false); return; }
    const data = await getNotifications();
    setNotifs(Array.isArray(data) ? data : []);
    setShowNotifs(true);
    if (notifCount > 0) markNotifsRead().then(() => setNotifCount(0));
  };

  const handleLogout = async () => {
    await logoutUser();
    logout();
    navigate("/");
  };

  const navLinks = user
    ? [
        { to: "/",          label: "Home",      icon: "🏠" },
        { to: "/books",     label: "Browse",    icon: "📚" },
        { to: "/dashboard", label: "Dashboard", icon: "📊" },
        { to: "/orders",    label: "Orders",    icon: "📦" },
        { to: "/wallet",    label: "Wallet",    icon: "💰" },
        { to: "/messages",  label: "Messages",  icon: "💬" },
        { to: "/analytics", label: "Analytics", icon: "📊" },
        ...(user.is_admin ? [{ to: "/admin", label: "Admin", icon: "⚙️" }] : []),
      ]
    : [
        { to: "/",        label: "Home",   icon: "🏠" },
        { to: "/books",   label: "Browse", icon: "📚" },
      ];

  const notifTypeColor = {
    buy: "var(--success)", sell: "var(--accent)",
    review: "var(--purple)", dispute: "var(--danger)", info: "var(--info)"
  };

  const linkStyle = (to) => ({
    padding: "8px 13px", borderRadius: 8, fontSize: 13,
    fontWeight: isActive(to) ? 600 : 400,
    color: isActive(to) ? "var(--accent)" : "var(--muted)",
    background: isActive(to) ? "var(--accent-glow)" : "transparent",
    transition: "var(--transition)", textDecoration: "none",
    whiteSpace: "nowrap",
  });

  return (
    <>
      <nav style={{
        position: "sticky", top: 0, zIndex: 200,
        background: scrolled ? "rgba(12,10,8,0.97)" : "rgba(12,10,8,0.88)",
        backdropFilter: "blur(20px)",
        borderBottom: `1px solid ${scrolled ? "var(--border2)" : "var(--border)"}`,
        padding: "0 20px",
        transition: "var(--transition)",
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" }}>

          {/* Logo */}
          <Link to="/" style={{ display: "flex", alignItems: "center", gap: 9, textDecoration: "none", flexShrink: 0 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 8,
              background: "linear-gradient(135deg,#e8a020,#b87d18)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 17, fontWeight: 900, color: "#0c0a08",
              boxShadow: "0 4px 12px rgba(232,160,32,0.3)",
            }}>B</div>
            <span style={{ fontFamily: "var(--font-serif)", fontSize: 19, fontWeight: 700, letterSpacing: "-0.5px" }}>
              Book<span style={{ color: "var(--accent)" }}>Swap</span>
            </span>
          </Link>

          {/* Desktop nav links */}
          <div className="nav-desktop" style={{ gap: 2, alignItems: "center", flex: 1, justifyContent: "center", padding: "0 16px" }}>
            {navLinks.map(l => (
              <Link key={l.to} to={l.to} style={linkStyle(l.to)}
                onMouseEnter={e => { if (!isActive(l.to)) { e.currentTarget.style.color="var(--text)"; e.currentTarget.style.background="var(--surface)"; }}}
                onMouseLeave={e => { if (!isActive(l.to)) { e.currentTarget.style.color="var(--muted)"; e.currentTarget.style.background="transparent"; }}}
              >{l.label}</Link>
            ))}
          </div>

          {/* Right side */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
            {user ? (
              <>
                {/* Notification bell */}
                <div style={{ position: "relative" }}>
                  <button onClick={handleNotifClick} style={{
                    background: "var(--surface)", border: "1px solid var(--border)",
                    borderRadius: 8, width: 36, height: 36,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer", fontSize: 15, position: "relative", transition: "var(--transition)"
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor="var(--accent)"}
                  onMouseLeave={e => e.currentTarget.style.borderColor="var(--border)"}>
                    🔔
                    {notifCount > 0 && (
                      <span style={{
                        position: "absolute", top: -4, right: -4,
                        background: "var(--danger)", color: "#fff",
                        borderRadius: "50%", width: 17, height: 17,
                        fontSize: 9, fontWeight: 700,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        animation: "badgePop 0.3s ease",
                      }}>{notifCount > 9 ? "9+" : notifCount}</span>
                    )}
                  </button>

                  {showNotifs && (
                    <div style={{
                      position: "absolute", top: "calc(100% + 10px)", right: 0,
                      width: 300, background: "var(--card2)", border: "1px solid var(--border2)",
                      borderRadius: 14, boxShadow: "var(--shadow-lg)",
                      overflow: "hidden", animation: "scaleIn 0.2s ease",
                      transformOrigin: "top right", zIndex: 300,
                    }}>
                      <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", fontWeight: 600, fontSize: 13 }}>
                        Notifications
                      </div>
                      <div style={{ maxHeight: 320, overflowY: "auto" }}>
                        {notifs.length === 0 ? (
                          <div style={{ padding: 24, textAlign: "center", color: "var(--muted)", fontSize: 13 }}>No notifications yet</div>
                        ) : notifs.map(n => (
                          <div key={n.id} style={{
                            padding: "10px 16px", borderBottom: "1px solid var(--border)",
                            background: n.is_read ? "transparent" : "var(--accent-glow2)",
                            display: "flex", gap: 10, alignItems: "flex-start"
                          }}>
                            <span style={{ color: notifTypeColor[n.type] || "var(--accent)", fontSize: 14, marginTop: 2, flexShrink: 0 }}>●</span>
                            <div>
                              <div style={{ fontSize: 13, lineHeight: 1.4 }}>{n.message}</div>
                              <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 3 }}>
                                {new Date(n.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Avatar */}
                <Link to="/profile" style={{
                  width: 34, height: 34, borderRadius: "50%",
                  background: "linear-gradient(135deg,#e8a020,#b87d18)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontWeight: 700, color: "#0c0a08", fontSize: 13,
                  boxShadow: "0 2px 8px rgba(232,160,32,0.3)",
                  transition: "var(--transition)", flexShrink: 0,
                }}>{user.username[0].toUpperCase()}</Link>

                {/* Logout — hide on mobile */}
                <button onClick={handleLogout} className="hide-mobile" style={{
                  background: "var(--surface)", border: "1px solid var(--border)",
                  borderRadius: 8, padding: "7px 14px", fontSize: 13,
                  color: "var(--muted)", cursor: "pointer", transition: "var(--transition)"
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor="var(--danger)"}
                onMouseLeave={e => e.currentTarget.style.borderColor="var(--border)"}>
                  Logout
                </button>
              </>
            ) : (
              <>
                <button onClick={() => navigate("/login")} className="hide-mobile" style={{
                  background: "transparent", border: "1px solid var(--border)",
                  borderRadius: 8, padding: "7px 14px", fontSize: 13, color: "var(--muted)", cursor: "pointer"
                }}>Sign In</button>
                <button onClick={() => navigate("/register")} style={{
                  background: "var(--accent)", border: "none",
                  borderRadius: 8, padding: "7px 16px", fontSize: 13,
                  fontWeight: 600, color: "#0c0a08", cursor: "pointer"
                }}>Join Free</button>
              </>
            )}

            {/* Hamburger — mobile only */}
            <button className="nav-hamburger" onClick={() => setMobileOpen(!mobileOpen)}
              style={{
                background: "var(--surface)", border: "1px solid var(--border)",
                borderRadius: 8, width: 36, height: 36, display: "none",
                alignItems: "center", justifyContent: "center",
                fontSize: 18, cursor: "pointer", flexShrink: 0,
              }}>
              {mobileOpen ? "✕" : "☰"}
            </button>
          </div>
        </div>

        {/* Mobile dropdown menu */}
        {mobileOpen && (
          <div className="mobile-menu" style={{
            borderTop: "1px solid var(--border)",
            background: "rgba(12,10,8,0.98)",
            padding: "12px 16px 16px",
          }}>
            {navLinks.map(l => (
              <Link key={l.to} to={l.to}
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "12px 14px", borderRadius: 10, marginBottom: 4,
                  fontSize: 15, fontWeight: isActive(l.to) ? 600 : 400,
                  color: isActive(l.to) ? "var(--accent)" : "var(--text)",
                  background: isActive(l.to) ? "var(--accent-glow)" : "transparent",
                  textDecoration: "none", transition: "var(--transition)",
                }}>
                <span>{l.icon}</span> {l.label}
              </Link>
            ))}
            {user ? (
              <button onClick={handleLogout} style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "12px 14px", borderRadius: 10, width: "100%",
                fontSize: 15, color: "var(--danger)", background: "transparent",
                border: "none", marginTop: 8, cursor: "pointer",
              }}>
                🚪 Logout
              </button>
            ) : (
              <button onClick={() => navigate("/login")} style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "12px 14px", borderRadius: 10, width: "100%",
                fontSize: 15, color: "var(--accent)", background: "var(--accent-glow)",
                border: "none", marginTop: 8, cursor: "pointer", fontWeight: 600,
              }}>
                🔑 Sign In
              </button>
            )}
          </div>
        )}

        {/* Click outside to close */}
        {(showNotifs || mobileOpen) && (
          <div style={{ position: "fixed", inset: 0, zIndex: -1 }}
            onClick={() => { setShowNotifs(false); setMobileOpen(false); }} />
        )}
      </nav>

      {/* Bottom mobile nav bar */}
      {user && (
        <nav className="bottom-nav" style={{ justifyContent: "space-around", alignItems: "center" }}>
          {[
            { to: "/",          icon: "🏠", label: "Home"      },
            { to: "/books",     icon: "📚", label: "Browse"    },
            { to: "/orders",    icon: "📦", label: "Orders"    },
            { to: "/messages",  icon: "💬", label: "Chat"      },
            { to: "/wallet",    icon: "💰", label: "Wallet"    },
          ].map(l => (
            <Link key={l.to} to={l.to} style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              gap: 2, padding: "6px 12px", borderRadius: 10,
              color: isActive(l.to) ? "var(--accent)" : "var(--muted)",
              textDecoration: "none", transition: "var(--transition)", minWidth: 52,
            }}>
              <span style={{ fontSize: 20 }}>{l.icon}</span>
              <span style={{ fontSize: 10, fontWeight: isActive(l.to) ? 600 : 400 }}>{l.label}</span>
            </Link>
          ))}
        </nav>
      )}
    </>
  );
}