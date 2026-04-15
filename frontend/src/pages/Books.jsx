import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getBooks, searchSuggest } from "../api";
import { useAuth } from "../context/AuthContext";
import { Btn, Select, Spinner, Empty } from "../components/UI";
import BookCard from "../components/BookCard";

const CATEGORIES = ["","Fiction","Non-Fiction","Science","History","Technology","Self-Help","Finance","Children","Biography","Comics"];
const CITIES     = ["","Surat","Ahmedabad","Mumbai","Delhi","Bangalore","Pune","Chennai","Kolkata","Hyderabad","Jaipur"];

export default function Books() {
  const { user }    = useAuth();
  const navigate    = useNavigate();
  const [params]    = useSearchParams();
  const [books, setBooks]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState(params.get("search") || "");
  const [category, setCategory] = useState(params.get("category") || "");
  const [city, setCity]         = useState("");
  const [nearbyOnly, setNearbyOnly] = useState(false);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Search suggestions
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestTimer = useRef(null);
  const searchRef    = useRef(null);

  useEffect(() => { if (user?.city && !city) setCity(user.city); }, [user]);

  const fetchBooks = () => {
    setLoading(true);
    const p = {};
    if (search)    p.search    = search;
    if (category)  p.category  = category;
    if (city)      p.city      = city;
    if (nearbyOnly) p.nearby   = "true";
    if (minPrice)  p.min_price = minPrice;
    if (maxPrice)  p.max_price = maxPrice;
    getBooks(p)
      .then(data => { if (Array.isArray(data)) setBooks(data); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchBooks(); }, [category, nearbyOnly, city]);

  // Suggest on keystroke
  const handleSearchChange = (val) => {
    setSearch(val);
    clearTimeout(suggestTimer.current);
    if (val.length < 2) { setSuggestions([]); setShowSuggestions(false); return; }
    suggestTimer.current = setTimeout(() => {
      searchSuggest(val).then(d => {
        setSuggestions(Array.isArray(d) ? d : []);
        setShowSuggestions(true);
      });
    }, 250);
  };

  const handleSelectSuggestion = (s) => {
    setSearch(s.text);
    setSuggestions([]);
    setShowSuggestions(false);
    if (s.id) navigate(`/book/${s.id}`);
    else setTimeout(() => fetchBooks(), 50);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setShowSuggestions(false);
    fetchBooks();
  };

  const clearFilters = () => {
    setSearch(""); setCategory(""); setCity(user?.city || "");
    setNearbyOnly(false); setMinPrice(""); setMaxPrice("");
  };

  return (
    <div className="page">
      <div style={{ marginBottom:32 }}>
        <h1 style={{ fontFamily:"var(--font-serif)", fontSize:40, fontWeight:700, marginBottom:6 }}>Browse Books</h1>
        <p style={{ color:"var(--muted)" }}>Discover second-hand books near you</p>
      </div>

      {/* Search bar with suggestions */}
      <form onSubmit={handleSearch} style={{ display:"flex", gap:10, marginBottom:20, flexWrap:"wrap" }}>
        <div style={{ flex:1, minWidth:260, position:"relative" }} ref={searchRef}>
          <span style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", color:"var(--muted)", pointerEvents:"none", zIndex:1 }}>🔍</span>
          <input
            value={search}
            onChange={e => handleSearchChange(e.target.value)}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            placeholder="Search by title, author, or category..."
            style={{ width:"100%", background:"var(--card)", border:"1px solid var(--border2)", borderRadius:10, padding:"12px 14px 12px 42px", color:"var(--text)", fontSize:14, outline:"none", transition:"var(--transition)" }}
            onFocus2={e => e.target.style.borderColor="var(--accent)"}
          />
          {/* Suggestions dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div style={{ position:"absolute", top:"calc(100% + 4px)", left:0, right:0, background:"var(--card)", border:"1px solid var(--border)", borderRadius:10, boxShadow:"0 8px 30px rgba(0,0,0,0.4)", zIndex:100, overflow:"hidden" }}>
              {suggestions.map((s, i) => (
                <div key={i}
                  onMouseDown={() => handleSelectSuggestion(s)}
                  style={{ padding:"11px 16px", cursor:"pointer", display:"flex", alignItems:"center", gap:12, borderBottom: i < suggestions.length-1 ? "1px solid var(--border)" : "none", transition:"background 0.1s" }}
                  onMouseEnter={e => e.currentTarget.style.background="var(--card2)"}
                  onMouseLeave={e => e.currentTarget.style.background="transparent"}>
                  <span style={{ fontSize:16 }}>{s.type==="book" ? "📚" : s.type==="author" ? "✍️" : "🏷️"}</span>
                  <div>
                    <div style={{ fontSize:14, fontWeight:500 }}>{s.text}</div>
                    <div style={{ fontSize:11, color:"var(--muted)" }}>{s.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <Btn type="submit">Search</Btn>
        <button type="button" onClick={() => setShowFilters(!showFilters)}
          style={{ padding:"12px 16px", borderRadius:10, border:"1px solid var(--border)", background: showFilters ? "var(--accent-glow)" : "var(--card)", color: showFilters ? "var(--accent)" : "var(--muted)", cursor:"pointer", fontWeight:600, fontSize:13, transition:"all 0.2s" }}>
          {showFilters ? "▲ Filters" : "▼ Filters"}
        </button>
      </form>

      {/* Filters */}
      {showFilters && (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))", gap:12, padding:20, background:"var(--card)", borderRadius:12, border:"1px solid var(--border)", marginBottom:24, animation:"fadeUp 0.3s ease" }}>
          <div>
            <label style={{ fontSize:11, color:"var(--muted)", fontWeight:600, display:"block", marginBottom:6 }}>CATEGORY</label>
            <select value={category} onChange={e => setCategory(e.target.value)}
              style={{ width:"100%", background:"var(--surface)", border:"1px solid var(--border)", borderRadius:8, padding:"9px 12px", color:"var(--text)", fontSize:13 }}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c || "All Categories"}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize:11, color:"var(--muted)", fontWeight:600, display:"block", marginBottom:6 }}>CITY</label>
            <select value={city} onChange={e => setCity(e.target.value)}
              style={{ width:"100%", background:"var(--surface)", border:"1px solid var(--border)", borderRadius:8, padding:"9px 12px", color:"var(--text)", fontSize:13 }}>
              {CITIES.map(c => <option key={c} value={c}>{c || "All Cities"}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize:11, color:"var(--muted)", fontWeight:600, display:"block", marginBottom:6 }}>MIN PRICE</label>
            <input value={minPrice} onChange={e => setMinPrice(e.target.value)} type="number" placeholder="₹0"
              style={{ width:"100%", background:"var(--surface)", border:"1px solid var(--border)", borderRadius:8, padding:"9px 12px", color:"var(--text)", fontSize:13 }}/>
          </div>
          <div>
            <label style={{ fontSize:11, color:"var(--muted)", fontWeight:600, display:"block", marginBottom:6 }}>MAX PRICE</label>
            <input value={maxPrice} onChange={e => setMaxPrice(e.target.value)} type="number" placeholder="₹9999"
              style={{ width:"100%", background:"var(--surface)", border:"1px solid var(--border)", borderRadius:8, padding:"9px 12px", color:"var(--text)", fontSize:13 }}/>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            <label style={{ fontSize:11, color:"var(--muted)", fontWeight:600 }}>NEARBY</label>
            <label style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer" }}>
              <input type="checkbox" checked={nearbyOnly} onChange={e => setNearbyOnly(e.target.checked)} style={{ width:16, height:16 }}/>
              <span style={{ fontSize:13, color:"var(--text)" }}>Near me only</span>
            </label>
          </div>
          <div style={{ display:"flex", alignItems:"flex-end" }}>
            <Btn variant="subtle" size="sm" onClick={clearFilters} style={{ width:"100%" }}>Clear Filters</Btn>
          </div>
        </div>
      )}

      {/* Results */}
      {loading ? (
        <div style={{ display:"flex", justifyContent:"center", paddingTop:80 }}><Spinner size={48}/></div>
      ) : books.length === 0 ? (
        <Empty icon="📭" title="No books found" subtitle="Try different search terms or clear filters"/>
      ) : (
        <>
          <p style={{ color:"var(--muted)", fontSize:13, marginBottom:20 }}>{books.length} book{books.length!==1?"s":""} found</p>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:20 }}>
            {books.map((book, i) => (
              <BookCard key={book.id} book={book} index={i} onClick={() => navigate(`/book/${book.id}`)}/>
            ))}
          </div>
        </>
      )}
    </div>
  );
}