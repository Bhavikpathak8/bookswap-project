import { useState, useCallback } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import { Toast } from "./components/UI";

// Pages
import Home          from "./pages/Home";
import Books         from "./pages/Books";
import { Login, Register } from "./pages/Auth";
import { Dashboard, AddBook, EditBook } from "./pages/Dashboard";
import { BookDetail, Orders, Wallet }   from "./pages/BookDetail";
import Messages      from "./pages/Messages";
import Profile       from "./pages/Profile";
import AdminDashboard from "./pages/AdminDashboard";
import SellerAnalytics from "./pages/SellerAnalytics";
import SellerStore   from "./pages/SellerStore";

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? children : <Navigate to="/login" replace />;
}

function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user?.is_admin ? children : <Navigate to="/" replace />;
}

function AppInner() {
  const [toast, setToast] = useState(null);

  const showToast = useCallback((msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const toastProps = { showToast };

  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/"          element={<Home />} />
        <Route path="/books"     element={<Books />} />
        <Route path="/book/:id"  element={<BookDetail {...toastProps} />} />
        <Route path="/login"     element={<Login    {...toastProps} />} />
        <Route path="/register"  element={<Register {...toastProps} />} />

        <Route path="/dashboard" element={<Protected><Dashboard   {...toastProps} /></Protected>} />
        <Route path="/add_book"  element={<Protected><AddBook     {...toastProps} /></Protected>} />
        <Route path="/edit_book/:id" element={<Protected><EditBook {...toastProps} /></Protected>} />
        <Route path="/orders"    element={<Protected><Orders      {...toastProps} /></Protected>} />
        <Route path="/wallet"    element={<Protected><Wallet      {...toastProps} /></Protected>} />
        <Route path="/messages"  element={<Protected><Messages    {...toastProps} /></Protected>} />
        <Route path="/profile"   element={<Protected><Profile     {...toastProps} /></Protected>} />
        <Route path="/analytics" element={<Protected><SellerAnalytics {...toastProps} /></Protected>} />
        <Route path="/admin"     element={<AdminRoute><AdminDashboard {...toastProps} /></AdminRoute>} />
        <Route path="/seller/:sellerId" element={<SellerStore {...toastProps} />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}