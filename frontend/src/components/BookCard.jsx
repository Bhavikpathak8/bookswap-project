import { useNavigate } from "react-router-dom";
import { imageUrl } from "../api";
import { Badge } from "./UI";

const CONDITION_COLOR = {
  "New":       "var(--success)",
  "Like New":  "var(--info)",
  "Good":      "var(--accent)",
  "Fair":      "var(--purple)",
  "Poor":      "var(--danger)",
};

export default function BookCard({ book, delay = 0 }) {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/book/${book.id}`)}
      className="card-hover"
      style={{
        background: "var(--card)", border: "1px solid var(--border)",
        borderRadius: "var(--radius-lg)", overflow: "hidden",
        cursor: "pointer", animation: `fadeUp 0.5s ${delay}s both`,
        display: "flex", flexDirection: "column",
      }}
    >
      {/* Image */}
      <div style={{
        height: 160, overflow: "hidden", position: "relative",
        background: "linear-gradient(135deg, var(--surface), var(--border))",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {imageUrl(book.image) ? (
          <img src={imageUrl(book.image)} alt={book.title}
            style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.4s ease" }}
            onMouseEnter={e => e.currentTarget.style.transform = "scale(1.06)"}
            onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
          />
        ) : (
          <div style={{ fontSize: 52, opacity: 0.4 }}>📚</div>
        )}

        {/* Overlay badges */}
        <div style={{ position: "absolute", top: 10, left: 10, display: "flex", flexDirection: "column", gap: 5 }}>
          {!book.available && (
            <span style={{
              background: "rgba(217,79,79,0.9)", color: "#fff",
              fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 6
            }}>SOLD</span>
          )}
        </div>

        {book.location && (
          <div style={{
            position: "absolute", bottom: 8, right: 8,
            background: "rgba(12,10,8,0.8)", color: "var(--text2)",
            fontSize: 10, padding: "3px 8px", borderRadius: 6,
            display: "flex", alignItems: "center", gap: 3
          }}>
            📍 {book.location}
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: "14px 16px 16px", flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{
          fontWeight: 600, fontSize: 14, lineHeight: 1.35,
          overflow: "hidden", display: "-webkit-box",
          WebkitLineClamp: 2, WebkitBoxOrient: "vertical"
        }}>{book.title}</div>

        <div style={{ color: "var(--muted)", fontSize: 12 }}>{book.author}</div>

        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 2 }}>
          <Badge>{book.category}</Badge>
          {book.condition && (
            <Badge color={CONDITION_COLOR[book.condition] || "var(--muted)"}>{book.condition}</Badge>
          )}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "auto", paddingTop: 8 }}>
          <span style={{
            color: "var(--accent)", fontWeight: 800, fontSize: 18,
            fontFamily: "var(--font-serif)"
          }}>₹{book.price}</span>
          <span style={{
            fontSize: 11, color: book.available ? "var(--success)" : "var(--muted)",
            fontWeight: 600
          }}>{book.available ? "● Available" : "● Sold"}</span>
        </div>
      </div>
    </div>
  );
}
