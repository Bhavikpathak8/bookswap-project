# BookSwap — Complete Project

## Full Stack: Python Flask + React + PostgreSQL

---

## Project Structure

```
bookswap-project/
├── backend/
│   ├── app.py              ← All API routes
│   ├── models.py           ← Database models
│   ├── requirements.txt    ← Python packages
│   └── static/uploads/     ← Book images (auto-created)
│
└── frontend/
    ├── src/
    │   ├── api.js                      ← All API calls + Socket
    │   ├── App.jsx                     ← Routes
    │   ├── index.css                   ← Global styles + animations
    │   ├── context/AuthContext.jsx     ← Global user state
    │   ├── components/
    │   │   ├── Navbar.jsx              ← Top nav with notifications
    │   │   ├── BookCard.jsx            ← Book listing card
    │   │   └── UI.jsx                  ← Shared components
    │   └── pages/
    │       ├── Home.jsx
    │       ├── Books.jsx               ← Browse + location filter
    │       ├── Auth.jsx                ← Login + Register
    │       ├── Dashboard.jsx           ← Dashboard + AddBook + EditBook
    │       ├── BookDetail.jsx          ← Detail + Orders + Wallet
    │       ├── Messages.jsx            ← Real-time chat
    │       ├── Profile.jsx             ← Profile + verification
    │       └── AdminDashboard.jsx      ← Full admin panel
    ├── index.html
    ├── package.json
    └── vite.config.js
```

---

## Setup — Backend

### 1. PostgreSQL database
```sql
psql -U postgres
CREATE DATABASE bookswap_db;
\q
```

### 2. Virtual environment
```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# Mac/Linux
source venv/bin/activate
```

### 3. Install packages
```bash
pip install -r requirements.txt
```

### 4. Run Flask
```bash
python app.py
```

Flask runs at: `http://localhost:5000`

On first run, tables are auto-created and admin account is created:
- Email: `admin@bookswap.com`
- Password: `admin123`

---

## Setup — Frontend

### 1. Install Node packages
```bash
cd frontend
npm install
```

### 2. Run Vite dev server
```bash
npm run dev
```

React runs at: `http://localhost:5173`

---

## Features Implemented

### Authentication
- Register with city/state/pincode
- Login + session management
- Logout
- Google OAuth (configure client ID in app.py)
- Auto-create admin on startup

### Books
- Browse books with live search
- Filter by category, city, price range
- **Location-based filter** — see only books from your city
- Book detail page with seller info
- Add book (with image upload)
- Edit book
- Delete book
- **Admin book approval** — books go live only after admin approves

### Location-Based Discovery
- Users set their city on registration
- Browse page auto-filters to show nearby books
- "Near me only" checkbox to show only your city's books
- Books store city/state/pincode from seller's profile

### Buying & Orders
- Buy book (wallet deduction + commission)
- View orders with full breakdown
- Cancel order (auto-refund)
- **Raise disputes** on orders with admin review

### Wallet
- View balance
- Add money (quick amounts + custom)

### Chat
- Real-time messaging with Socket.IO
- Typing indicators
- Delete single messages or full conversations
- Unread message count badge

### Notifications
- Auto-triggered on: buy, sell, review, dispute, ban, approve/reject
- Bell icon with unread count
- Mark all as read

### Profile
- View profile with stats
- Edit city/state/pincode/phone
- **Email verification** (generates token, sends link)
- **Phone OTP verification** (generates OTP, logs to console in dev)
- View received reviews

### Admin Panel
- Stats: total users, books, orders, revenue
- **Real monthly revenue chart** (from actual database data)
- User management with ban/unban + delete
- **Pending book approvals** with approve/reject
- **Disputes management** with resolve/reject + notes
- **Commission rate control** (slider from 0–50%)

---

## New API Endpoints Added

| Method | URL | Description |
|--------|-----|-------------|
| PUT | `/api/profile/update` | Update city/state/pincode/phone |
| GET | `/api/books?city=Surat&nearby=true` | Location-filtered browse |
| POST | `/api/admin/approve_book/<id>` | Approve or reject book |
| GET | `/api/admin/pending_books` | List pending approval |
| POST | `/api/dispute` | Raise dispute on order |
| GET | `/api/my_disputes` | User's own disputes |
| GET | `/api/admin/disputes` | All disputes (admin) |
| POST | `/api/admin/resolve_dispute/<id>` | Resolve or reject dispute |
| POST | `/api/admin/ban_user/<id>` | Ban a user |
| POST | `/api/admin/unban_user/<id>` | Unban a user |
| POST | `/api/send_verification_email` | Send email verify link |
| GET | `/api/verify_email/<token>` | Verify email token |
| POST | `/api/send_phone_otp` | Send phone OTP |
| POST | `/api/verify_phone_otp` | Verify phone OTP |
| GET | `/api/notifications` | Get notifications |
| POST | `/api/notifications/mark_read` | Mark all read |
| GET | `/api/notifications/unread_count` | Get unread count |
| GET | `/api/admin/commission` | Get commission rate |
| PUT | `/api/admin/commission` | Update commission rate |
| GET | `/api/reviews/<user_id>` | Get user's reviews |

---

## Google OAuth Setup (Optional)

1. Go to https://console.cloud.google.com/
2. Create OAuth 2.0 credentials
3. Set redirect URI: `http://localhost:5000/api/google_auth`
4. Replace in `app.py`:
```python
client_id='YOUR_GOOGLE_CLIENT_ID',
client_secret='YOUR_GOOGLE_CLIENT_SECRET',
```

## SMS/Email in Production

- **Email**: Replace `print()` in `send_verification_email` with SMTP/SendGrid
- **SMS OTP**: Replace `print()` in `send_phone_otp` with Twilio/MSG91

In development, both the verify link and OTP are printed in the Flask terminal.
