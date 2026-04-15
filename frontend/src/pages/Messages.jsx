import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import {
  getChatUsers, getChatHistory,
  socket, joinRoom, leaveRoom,
  sendSocketMessage, sendTyping, getRoomName
} from "../api";
import { useAuth } from "../context/AuthContext";
import { Btn, Spinner, Empty } from "../components/UI";

export default function Messages({ showToast }) {
  const { user }        = useAuth();
  const [searchParams]  = useSearchParams();
  const [contacts, setContacts] = useState([]);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText]         = useState("");
  const [typing, setTyping]     = useState(false);
  const [loading, setLoading]   = useState(true);
  const bottomRef    = useRef();
  const typingTimer  = useRef();
  const selectedRef  = useRef(null);  // keep ref for socket callback
  const messagesRef  = useRef([]);    // keep ref to avoid stale closure duplicates

  // sync refs
  useEffect(() => { selectedRef.current = selected; }, [selected]);
  useEffect(() => { messagesRef.current = messages; }, [messages]);

  const scrollBottom = () =>
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 60);

  // ── Load contacts on mount ──────────────────────────────────
  useEffect(() => {
    getChatUsers()
      .then(d => {
        const list = Array.isArray(d) ? d : [];
        setContacts(list);
        setLoading(false);

        // Auto-open if ?user=ID in URL
        const autoId = searchParams.get("user");
        if (autoId) {
          const existing = list.find(c => String(c.id) === String(autoId));
          if (existing) {
            setSelected(existing);
          } else {
            fetch(`http://localhost:5000/api/chat/${autoId}`, { credentials: "include" })
              .then(r => r.json())
              .then(data => {
                if (data.chat_with) {
                  setSelected(data.chat_with);
                  setContacts(prev => {
                    if (prev.find(c => c.id === data.chat_with.id)) return prev;
                    return [data.chat_with, ...prev];
                  });
                }
              }).catch(() => {});
          }
        }
      })
      .catch(() => setLoading(false));
  }, []);

  // ── Load messages when contact changes ──────────────────────
  useEffect(() => {
    if (!selected) return;

    getChatHistory(selected.id)
      .then(d => {
        setMessages(Array.isArray(d.messages) ? d.messages : []);
        scrollBottom();
      })
      .catch(() => setMessages([]));

    const room = getRoomName(user.id, selected.id);
    joinRoom(room);
    return () => leaveRoom(room);
  }, [selected?.id]);

  // ── Socket listeners ────────────────────────────────────────
  useEffect(() => {
    const onMessage = (data) => {
      // Only add if this message is for the currently open conversation
      const sel = selectedRef.current;
      if (!sel) return;
      if (
        String(data.sender) !== String(sel.id) &&
        String(data.receiver) !== String(sel.id)
      ) return;

      // Dedup: skip if message id already exists
      const existing = messagesRef.current.find(m => m.id === data.msg_id);
      if (existing) return;

      setMessages(prev => [...prev, {
        id:        data.msg_id,
        sender_id: data.sender,
        message:   data.message,
        image:     data.image,
        timestamp: data.timestamp,
      }]);
      scrollBottom();
    };

    const onTyping = () => {
      setTyping(true);
      clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => setTyping(false), 2200);
    };

    socket.on("receive_message", onMessage);
    socket.on("show_typing", onTyping);
    return () => {
      socket.off("receive_message", onMessage);
      socket.off("show_typing", onTyping);
    };
  }, []);

  // ── Send message ────────────────────────────────────────────
  const handleSend = () => {
    if (!text.trim() || !selected) return;
    const room = getRoomName(user.id, selected.id);

    // Generate a temp id so we can dedup when socket echoes back
    const tempId = `temp_${Date.now()}`;

    // Optimistic add (sender side)
    setMessages(prev => [...prev, {
      id:        tempId,
      sender_id: user.id,
      message:   text,
      timestamp: new Date().toISOString(),
    }]);
    scrollBottom();

    sendSocketMessage(room, selected.id, text);
    setText("");
  };

  const handleTyping = () => {
    if (selected) sendTyping(getRoomName(user.id, selected.id));
  };

  const handleDeleteChat = async () => {
    if (!confirm("Delete this entire conversation?")) return;
    await fetch(`http://localhost:5000/api/delete_chat/${selected.id}`, {
      method: "DELETE", credentials: "include"
    });
    setSelected(null);
    setMessages([]);
    getChatUsers().then(d => setContacts(Array.isArray(d) ? d : []));
    showToast("Conversation deleted");
  };

  // ── Render ──────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "40px 24px 80px" }}>
      <h1 className="fade-up" style={{
        fontFamily: "var(--font-serif)", fontSize: 36,
        fontWeight: 700, marginBottom: 24
      }}>Messages</h1>

      <div style={{
        display: "flex", height: 580,
        background: "var(--card)", border: "1px solid var(--border)",
        borderRadius: "var(--radius-lg)", overflow: "hidden"
      }}>

        {/* ── Contacts sidebar ── */}
        <div style={{
          width: 260, borderRight: "1px solid var(--border)",
          display: "flex", flexDirection: "column", flexShrink: 0
        }}>
          <div style={{
            padding: "14px 18px", borderBottom: "1px solid var(--border)",
            fontWeight: 600, fontSize: 11, color: "var(--muted)",
            letterSpacing: "0.08em", textTransform: "uppercase"
          }}>Conversations</div>

          <div style={{ flex: 1, overflowY: "auto" }}>
            {loading ? (
              <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
                <Spinner />
              </div>
            ) : contacts.length === 0 ? (
              <div style={{ padding: "32px 16px", textAlign: "center", color: "var(--muted)", fontSize: 13 }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>💬</div>
                No conversations yet.<br />
                Start from a book listing!
              </div>
            ) : contacts.map(c => (
              <div key={c.id} onClick={() => setSelected(c)}
                style={{
                  padding: "14px 18px", cursor: "pointer",
                  borderBottom: "1px solid var(--border)",
                  background: selected?.id === c.id ? "var(--accent-glow)" : "transparent",
                  transition: "background 0.15s ease",
                  display: "flex", alignItems: "center", gap: 12
                }}
                onMouseEnter={e => { if (selected?.id !== c.id) e.currentTarget.style.background = "var(--card2)"; }}
                onMouseLeave={e => { if (selected?.id !== c.id) e.currentTarget.style.background = "transparent"; }}
              >
                <div style={{
                  width: 38, height: 38, borderRadius: "50%", flexShrink: 0,
                  background: "linear-gradient(135deg,var(--accent),var(--accent-dim))",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontWeight: 700, color: "#0c0a08", fontSize: 15
                }}>{c.username[0].toUpperCase()}</div>

                <div style={{ overflow: "hidden", flex: 1 }}>
                  <div style={{
                    fontWeight: selected?.id === c.id ? 600 : 400,
                    fontSize: 14,
                    color: selected?.id === c.id ? "var(--accent)" : "var(--text)",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"
                  }}>{c.username}</div>
                  {c.city && (
                    <div style={{ fontSize: 11, color: "var(--muted)" }}>📍 {c.city}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Chat area ── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
          {!selected ? (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Empty icon="💬" title="Select a conversation"
                subtitle="Choose someone from the left to start chatting" />
            </div>
          ) : (
            <>
              {/* Header */}
              <div style={{
                padding: "12px 20px", borderBottom: "1px solid var(--border)",
                display: "flex", alignItems: "center", justifyContent: "space-between",
                background: "var(--card2)"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: "50%",
                    background: "linear-gradient(135deg,var(--accent),var(--accent-dim))",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontWeight: 700, color: "#0c0a08", fontSize: 14
                  }}>{selected.username[0].toUpperCase()}</div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{selected.username}</div>
                    {typing && (
                      <div style={{ fontSize: 11, color: "var(--accent)", animation: "pulse 1s infinite" }}>
                        typing...
                      </div>
                    )}
                  </div>
                </div>
                <Btn size="sm" variant="danger" onClick={handleDeleteChat}>Delete Chat</Btn>
              </div>

              {/* Messages */}
              <div style={{
                flex: 1, overflowY: "auto",
                padding: "16px 20px",
                display: "flex", flexDirection: "column", gap: 8
              }}>
                {messages.length === 0 && (
                  <div style={{ textAlign: "center", color: "var(--muted)", fontSize: 13, padding: "40px 0" }}>
                    No messages yet — say hello! 👋
                  </div>
                )}

                {messages.map((m, i) => {
                  // Support both sender_id (REST) and sender (socket)
                  const senderId = m.sender_id ?? m.sender;
                  const isMe = String(senderId) === String(user.id);

                  return (
                    <div key={m.id ?? i} style={{
                      display: "flex",
                      justifyContent: isMe ? "flex-end" : "flex-start",
                    }}>
                      <div style={{ maxWidth: "72%" }}>
                        <div style={{
                          padding: "10px 14px",
                          borderRadius: isMe ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                          background: isMe
                            ? "linear-gradient(135deg,#e8a020,#b87d18)"
                            : "var(--card2)",
                          color: isMe ? "#0c0a08" : "var(--text)",
                          fontSize: 14, lineHeight: 1.5,
                          border: isMe ? "none" : "1px solid var(--border2)",
                          wordBreak: "break-word",
                          fontWeight: isMe ? 500 : 400,
                        }}>
                          {m.image && (
                            <img src={m.image} alt=""
                              style={{ maxWidth: 200, borderRadius: 8, marginBottom: m.message ? 8 : 0 }}
                            />
                          )}
                          {m.message}
                        </div>
                        {m.timestamp && (
                          <div style={{
                            fontSize: 10, color: "var(--muted)", marginTop: 3,
                            textAlign: isMe ? "right" : "left", paddingRight: 2
                          }}>
                            {new Date(m.timestamp).toLocaleTimeString([], {
                              hour: "2-digit", minute: "2-digit"
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div style={{
                padding: "12px 16px", borderTop: "1px solid var(--border)",
                display: "flex", gap: 8, background: "var(--card2)"
              }}>
                <input
                  value={text}
                  onChange={e => { setText(e.target.value); handleTyping(); }}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  placeholder="Type a message... (Enter to send)"
                  style={{
                    flex: 1, background: "var(--surface)",
                    border: "1px solid var(--border2)",
                    borderRadius: 10, padding: "10px 14px",
                    color: "var(--text)", fontSize: 14, outline: "none",
                    transition: "border-color 0.2s"
                  }}
                  onFocus={e => e.target.style.borderColor = "var(--accent)"}
                  onBlur={e => e.target.style.borderColor = "var(--border2)"}
                />
                <Btn onClick={handleSend} disabled={!text.trim()}>Send →</Btn>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}