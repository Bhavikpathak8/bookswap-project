import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getDashboard, deleteBook, addBook, getBook, editBook } from "../api";
import { useAuth } from "../context/AuthContext";
import { Btn, Input, Select, Textarea, Card, Badge, StatCard, Empty, Spinner, SectionHeader } from "../components/UI";
import BookCard from "../components/BookCard";

const CATEGORIES = ["Fiction","Non-Fiction","Science","History","Technology","Self-Help","Finance","Children","Biography","Comics","Other"];
const CONDITIONS  = ["New","Like New","Good","Fair","Poor"];
const CITIES = ["Surat","Ahmedabad","Mumbai","Delhi","Bangalore","Pune","Chennai","Kolkata","Hyderabad","Jaipur","Lucknow","Other"];

// ── DASHBOARD ─────────────────────────────────────────────────
export function Dashboard({ showToast }) {
  const { user }      = useAuth();
  const navigate      = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    getDashboard().then(d => { setData(d); setLoading(false); });
  };
  useEffect(load, []);

  const handleDelete = async (bookId, title) => {
    if (!confirm(`Delete "${title}"?`)) return;
    const res = await deleteBook(bookId);
    if (res.message) { showToast("Book deleted"); load(); }
    else showToast(res.error, "error");
  };

  if (loading) return <div style={{ display: "flex", justifyContent: "center", padding: 100 }}><Spinner size={48} /></div>;

  return (
    <div className="page">
      <div style={{ marginBottom: 36 }}>
        <h1 className="fade-up" style={{ fontFamily: "var(--font-serif)", fontSize: 36, fontWeight: 700 }}>
          Hello, {data?.user} 👋
        </h1>
        <p className="fade-up-1" style={{ color: "var(--muted)" }}>Here's your BookSwap activity</p>
      </div>

      {/* Stats */}
      <div className="grid-stats" style={{ marginBottom: 40 }}>
        <StatCard icon="📚" label="My Listings"   value={data?.books?.length || 0}    color="var(--accent)"  delay={0}    />
        <StatCard icon="✅" label="Books Sold"    value={data?.sold_count || 0}        color="var(--success)" delay={0.1}  />
        <StatCard icon="📦" label="My Orders"     value={data?.orders_count || 0}      color="var(--info)"    delay={0.2}  />
        <StatCard icon="💰" label="Wallet Balance" value={`₹${data?.wallet_balance || 0}`} color="var(--purple)" delay={0.3} />
      </div>

      <SectionHeader
        title="My Book Listings"
        subtitle="Books you've listed for sale"
        action={<Btn onClick={() => navigate("/add_book")}>+ List a Book</Btn>}
      />

      {data?.books?.length === 0 ? (
        <Empty icon="📚" title="No books listed yet" subtitle="List your first book and start earning!" />
      ) : (
        <div className="grid-books">
          {data.books.map((b, i) => (
            <div key={b.id} style={{ position: "relative", animation: `fadeUp 0.5s ${i * 0.06}s both` }}>
              <BookCard book={b} />
              {/* Status badge */}
              {!b.is_approved && (
                <div style={{
                  position: "absolute", top: 10, left: 10,
                  background: "rgba(255,160,0,0.9)", color: "#0c0a08",
                  fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 6
                }}>PENDING APPROVAL</div>
              )}
              <div style={{ display: "flex", gap: 8, padding: "0 0 4px" }}>
                <Btn size="sm" variant="ghost" onClick={() => navigate(`/edit_book/${b.id}`)} style={{ flex: 1 }}>Edit</Btn>
                <Btn size="sm" variant="danger" onClick={() => handleDelete(b.id, b.title)} style={{ flex: 1 }}>Delete</Btn>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── ADD BOOK ──────────────────────────────────────────────────
export function AddBook({ showToast }) {
  const { user }   = useAuth();
  const navigate   = useNavigate();
  const fileRef    = useRef();

  const [form, setForm] = useState({
    title: "", author: "", category: "", price: "",
    description: "", condition: "Good",
    location: user?.city || "", state: user?.state || "", pincode: user?.pincode || ""
  });
  const [imageFile, setImageFile]     = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading]         = useState(false);

  const set = (k) => (v) => setForm(f => ({ ...f, [k]: v }));

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.author || !form.category || !form.price) {
      showToast("Fill all required fields", "error"); return;
    }
    setLoading(true);
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    if (imageFile) fd.append("image", imageFile);

    const res = await addBook(fd);
    setLoading(false);
    if (res.message) {
      showToast("Book submitted for approval 📚");
      navigate("/dashboard");
    } else {
      showToast(res.error || "Failed to add book", "error");
    }
  };

  return (
    <div className="page-sm">
      <button onClick={() => navigate("/dashboard")} style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", marginBottom: 16, fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
        ← Back to Dashboard
      </button>
      <h1 style={{ fontFamily: "var(--font-serif)", fontSize: 30, fontWeight: 700, marginBottom: 6 }}>List a Book</h1>
      <p style={{ color: "var(--muted)", marginBottom: 32 }}>Fill in the details to list your book for sale</p>

      <Card hover={false} style={{ padding: 32 }}>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <Input label="Book Title *" value={form.title} onChange={set("title")} placeholder="e.g. The Alchemist" required />
          <Input label="Author *" value={form.author} onChange={set("author")} placeholder="e.g. Paulo Coelho" required />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Select label="Category *" value={form.category} onChange={set("category")}
              options={[{ value: "", label: "Select category" }, ...CATEGORIES.map(c => ({ value: c, label: c }))]} />
            <Select label="Condition *" value={form.condition} onChange={set("condition")}
              options={CONDITIONS.map(c => ({ value: c, label: c }))} />
          </div>

          <Input label="Price (₹) *" type="number" value={form.price} onChange={set("price")} placeholder="e.g. 150" required />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <Select label="City 📍" value={form.location} onChange={set("location")}
              options={[{ value: "", label: "Select city" }, ...CITIES.map(c => ({ value: c, label: c }))]} />
            <Input label="State" value={form.state} onChange={set("state")} placeholder="Gujarat" />
            <Input label="Pincode" value={form.pincode} onChange={set("pincode")} placeholder="395001" />
          </div>

          <Textarea label="Description" value={form.description} onChange={set("description")}
            placeholder="Brief description — edition, highlights, condition notes..." rows={3} />

          {/* Image upload */}
          <div>
            <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 8 }}>
              Book Image
            </label>
            <div
              onClick={() => fileRef.current?.click()}
              style={{
                border: `2px dashed ${imagePreview ? "var(--accent)" : "var(--border2)"}`,
                borderRadius: "var(--radius)", padding: imagePreview ? 0 : "28px 16px",
                textAlign: "center", cursor: "pointer", overflow: "hidden",
                transition: "var(--transition)",
                background: imagePreview ? "transparent" : "var(--surface)"
              }}
              onMouseEnter={e => { if (!imagePreview) e.currentTarget.style.borderColor = "var(--accent)"; }}
              onMouseLeave={e => { if (!imagePreview) e.currentTarget.style.borderColor = "var(--border2)"; }}
            >
              {imagePreview ? (
                <img src={imagePreview} alt="preview" style={{ width: "100%", maxHeight: 200, objectFit: "cover", borderRadius: 8 }} />
              ) : (
                <>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>📷</div>
                  <div style={{ fontSize: 13, color: "var(--muted)" }}>Click to upload book photo</div>
                  <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>JPG, PNG — max 5MB</div>
                </>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleImage} style={{ display: "none" }} />
          </div>

          <Btn type="submit" size="lg" disabled={loading}>
            {loading ? "Submitting..." : "Submit for Approval →"}
          </Btn>
          <p style={{ fontSize: 12, color: "var(--muted)", textAlign: "center" }}>
            Books are reviewed by admin before going live
          </p>
        </form>
      </Card>
    </div>
  );
}

// ── EDIT BOOK ─────────────────────────────────────────────────
export function EditBook({ showToast }) {
  const { id }    = useParams();
  const navigate  = useNavigate();
  const fileRef   = useRef();

  const [form, setForm] = useState({
    title: "", author: "", price: "", description: "", condition: "Good", location: ""
  });
  const [imageFile, setImageFile]     = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading]         = useState(false);

  const set = (k) => (v) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    getBook(id).then(b => {
      setForm({ title: b.title, author: b.author, price: b.price, description: b.description || "", condition: b.condition || "Good", location: b.location || "" });
    });
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData();
    Object.entries(form).forEach(([k,v]) => fd.append(k, v));
    if (imageFile) fd.append("image", imageFile);
    const res = await editBook(id, fd);
    setLoading(false);
    if (res.message) { showToast("Book updated!"); navigate("/dashboard"); }
    else showToast(res.error || "Update failed", "error");
  };

  return (
    <div className="page-sm">
      <button onClick={() => navigate("/dashboard")} style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", marginBottom: 16, fontSize: 13 }}>
        ← Back to Dashboard
      </button>
      <h1 style={{ fontFamily: "var(--font-serif)", fontSize: 30, fontWeight: 700, marginBottom: 32 }}>Edit Book</h1>
      <Card hover={false} style={{ padding: 32 }}>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <Input label="Title" value={form.title} onChange={set("title")} />
          <Input label="Author" value={form.author} onChange={set("author")} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Input label="Price (₹)" type="number" value={form.price} onChange={set("price")} />
            <Select label="Condition" value={form.condition} onChange={set("condition")}
              options={CONDITIONS.map(c => ({ value: c, label: c }))} />
          </div>
          <Select label="City 📍" value={form.location} onChange={set("location")}
            options={[{ value: "", label: "Select city" }, ...CITIES.map(c => ({ value: c, label: c }))]} />
          <Textarea label="Description" value={form.description} onChange={set("description")} rows={3} />
          <div onClick={() => fileRef.current?.click()}
            style={{ border: "2px dashed var(--border2)", borderRadius: 10, padding: "20px", textAlign: "center", cursor: "pointer", color: "var(--muted)", fontSize: 13 }}>
            {imageFile ? `✓ ${imageFile.name}` : "📷 Click to update image (optional)"}
          </div>
          <input ref={fileRef} type="file" accept="image/*" onChange={e => setImageFile(e.target.files[0])} style={{ display: "none" }} />
          <Btn type="submit" size="lg" disabled={loading}>{loading ? "Saving..." : "Save Changes"}</Btn>
        </form>
      </Card>
    </div>
  );
}
