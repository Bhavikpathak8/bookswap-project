import { io } from "socket.io-client";

export const BASE = "http://localhost:5000";
const API = `${BASE}/api`;

const req = (url, options = {}) =>
  fetch(url, { credentials: "include", ...options }).then(r => r.json());

const post = (url, body) =>
  req(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

const del = (url) => req(url, { method: "DELETE" });

// AUTH
export const registerUser = (data)            => post(`${API}/register`, data);
export const loginUser    = (email, password) => post(`${API}/login`, { email, password });
export const logoutUser   = ()                => req(`${API}/logout`);
export const googleLogin  = ()                => { window.location.href = `${BASE}/api/google_login`; };

// PROFILE
export const getProfile    = ()     => req(`${API}/profile`);
export const getDashboard  = ()     => req(`${API}/dashboard`);
export const updateProfile = (data) => req(`${API}/profile/update`, {
  method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data)
});

// BOOKS
export const getBooks   = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return req(`${API}/books${qs ? '?' + qs : ''}`);
};
export const getBook    = (id)       => req(`${API}/book/${id}`);
export const addBook    = (fd)       => req(`${API}/add_book`,        { method: "POST", body: fd });
export const editBook   = (id, fd)   => req(`${API}/edit_book/${id}`, { method: "PUT",  body: fd });
export const deleteBook = (id)       => del(`${API}/delete_book/${id}`);

// SEARCH SUGGESTIONS
export const searchSuggest = (q) => req(`${API}/search/suggest?q=${encodeURIComponent(q)}`);

// SIMILAR BOOKS
export const getSimilarBooks = (bookId) => req(`${API}/books/${bookId}/similar`);

// FEATURED BOOKS
export const getFeaturedBooks = () => req(`${API}/books/featured`);
export const featureBook      = (id, action) => post(`${API}/admin/feature_book/${id}`, { action });

// WISHLIST
export const getWishlist     = ()    => req(`${API}/wishlist`);
export const addToWishlist   = (id)  => req(`${API}/wishlist/${id}`, { method: "POST" });
export const removeWishlist  = (id)  => del(`${API}/wishlist/${id}`);
export const checkWishlist   = (id)  => req(`${API}/wishlist/check/${id}`);

// ORDERS & BUY
export const buyBook     = (id)  => req(`${API}/buy/${id}`, { method: "POST" });
export const getOrders   = ()    => req(`${API}/orders`);
export const cancelOrder = (id)  => req(`${API}/cancel_order/${id}`, { method: "POST" });

// ORDER TRACKING
export const updateTracking = (orderId, tracking_status, tracking_note) =>
  post(`${API}/order/${orderId}/track`, { tracking_status, tracking_note });
export const getTracking = (orderId) => req(`${API}/order/${orderId}/tracking`);

// WALLET
export const getWallet           = ()    => req(`${API}/wallet`);
export const addCredit           = (amt) => post(`${API}/add_credit`, { amount: amt });
export const getWalletTransactions = ()  => req(`${API}/wallet/transactions`);

// RAZORPAY
export const createRazorpayOrder  = (bookId) => req(`${API}/razorpay/order/${bookId}`, { method: "POST" });
export const verifyRazorpayPayment = (data)  => post(`${API}/razorpay/verify`, data);

// REFERRAL
export const getMyReferralCode = ()     => req(`${API}/referral/my_code`);
export const getReferralStats  = ()     => req(`${API}/referral/stats`);
export const applyReferral     = (code) => post(`${API}/referral/apply`, { code });

// DISPUTES
export const raiseDispute     = (order_id, issue)      => post(`${API}/dispute`, { order_id, issue });
export const getMyDisputes    = ()                      => req(`${API}/my_disputes`);
export const getAdminDisputes = ()                      => req(`${API}/admin/disputes`);
export const resolveDispute   = (id, action, note)     => post(`${API}/admin/resolve_dispute/${id}`, { action, note });

// BAN / UNBAN
export const banUser   = (id) => req(`${API}/admin/ban_user/${id}`,   { method: "POST" });
export const unbanUser = (id) => req(`${API}/admin/unban_user/${id}`, { method: "POST" });

// EMAIL / PHONE
export const sendVerificationEmail = () => req(`${API}/send_verification_email`, { method: "POST" });
export const sendPhoneOtp   = (phone) => post(`${API}/send_phone_otp`,   { phone_number: phone });
export const verifyPhoneOtp = (otp)   => post(`${API}/verify_phone_otp`, { otp });

// NOTIFICATIONS
export const getNotifications    = () => req(`${API}/notifications`);
export const markNotifsRead      = () => req(`${API}/notifications/mark_read`, { method: "POST" });
export const getNotifUnreadCount = () => req(`${API}/notifications/unread_count`);

// ADMIN
export const getAdminDashboard = ()         => req(`${API}/admin`);
export const deleteUser        = (id)       => del(`${API}/delete_user/${id}`);
export const getPendingBooks   = ()         => req(`${API}/admin/pending_books`);
export const approveBook       = (id, action, reason) => post(`${API}/admin/approve_book/${id}`, { action, reason });
export const getCommission     = ()         => req(`${API}/admin/commission`);
export const updateCommission  = (rate)     => req(`${API}/admin/commission`, {
  method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ commission_rate: rate })
});

// REVIEWS
export const submitReview = (userId, rating, comment) => post(`${API}/review/${userId}`, { rating, comment });
export const getReviews   = (userId)                  => req(`${API}/reviews/${userId}`);

// CHAT REST
export const getChatUsers   = ()   => req(`${API}/messages`);
export const getChatHistory = (id) => req(`${API}/chat/${id}`);
export const getUnreadCount = ()   => req(`${API}/unread_count`);
export const deleteMessage  = (id) => del(`${API}/delete_message/${id}`);
export const deleteChat     = (id) => del(`${API}/delete_chat/${id}`);

// SOCKET
export const getRoomName       = (a, b) => [a, b].sort((x, y) => x - y).join("_");
export const socket            = io(BASE, { withCredentials: true, autoConnect: false });
export const joinRoom          = (room) => socket.emit("join_room",  { room });
export const leaveRoom         = (room) => socket.emit("leave_room", { room });
export const sendSocketMessage = (room, receiver, message, image = null) =>
  socket.emit("send_message", { room, receiver, message, image });
export const sendTyping        = (room) => socket.emit("typing", { room });

// HELPERS
export const imageUrl = (filename) =>
  filename ? `${BASE}/static/uploads/${filename}` : null;

// SELLER ANALYTICS
export const getSellerAnalytics = () => req(`${API}/seller/analytics`);

// SELLER STORE
export const getSellerStore = (sellerId) => req(`${API}/seller/${sellerId}/store`);