<div align="center">

# 📚 BookSwap

### India's Community Platform for Buying & Selling Second-Hand Books

[![Python](https://img.shields.io/badge/Python-3.14-blue?style=flat-square&logo=python)](https://python.org)
[![Flask](https://img.shields.io/badge/Flask-3.x-black?style=flat-square&logo=flask)](https://flask.palletsprojects.com)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)](https://react.dev)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=flat-square&logo=postgresql)](https://postgresql.org)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-Real--time-black?style=flat-square&logo=socketdotio)](https://socket.io)

> A full-stack second-hand book marketplace built as a 3rd year university project.  
> Connect with readers in your city — buy affordable books or earn by selling ones you've finished.

</div>

---

## ✨ Features

### 👤 User Features
| Feature | Description |
|---|---|
| 🔐 Auth | Email/password login + Google OAuth |
| 📚 Browse Books | Search, filter by category, city, price, condition |
| 🔍 Search Autocomplete | Live suggestions as you type |
| 📖 Book Detail | Full info, seller profile, similar books |
| 🛒 Buy Books | Purchase using wallet balance |
| ❤️ Wishlist | Save books to buy later |
| 💬 Real-time Chat | Socket.IO powered live messaging |
| 📦 Order Tracking | Pending → Shipped → Delivered with progress bar |
| 💰 Wallet System | Add money, view transaction history |
| 🎁 Referral System | Share code, both users get bonus |
| ⭐ Reviews | Rate and review sellers |
| 🔔 Notifications | Real-time alerts for orders, messages, disputes |
| 📊 Seller Analytics | Views, earnings, monthly chart per book |
| 🏪 Seller Store | Public profile page with all listings |
| 📱 PWA | Installable on mobile like a native app |

### 🛡️ Admin Features
| Feature | Description |
|---|---|
| 📊 Dashboard | Revenue chart, total users/books/orders |
| ✅ Book Approval | Approve or reject listings before they go live |
| ⭐ Featured Books | Pin books to the homepage |
| 👥 User Management | View, ban, unban, delete users |
| ⚖️ Dispute Resolution | Review and resolve buyer-seller disputes |
| 💸 Commission Control | Adjust platform fee via slider |

---

## 🛠️ Tech Stack

### Backend
- **Python 3.14** + **Flask** — REST API
- **PostgreSQL** — Database
- **SQLAlchemy** — ORM
- **Flask-Login** — Session management
- **Flask-SocketIO + Gevent** — Real-time WebSocket chat
- **Authlib** — Google OAuth 2.0
- **Werkzeug** — Password hashing & file uploads

### Frontend
- **React 18** + **Vite** — UI framework
- **React Router v6** — Client-side routing
- **Socket.IO Client** — Real-time chat
- **PWA** — Service worker + Web manifest

### Infrastructure
- **pgAdmin 4** — Database management
- **Git + GitHub** — Version control

---

## 🚀 Getting Started

### Prerequisites
- Python 3.14+
- Node.js 18+
- PostgreSQL 16+
- pgAdmin 4

### 1. Clone the Repository
```bash
git clone https://github.com/Bhavikpathak8/bookswap-project.git
cd bookswap-project
```

### 2. Setup Database
Open **pgAdmin** → connect to PostgreSQL → create a new database:
```sql
CREATE DATABASE bookswap_db;
```

Then run all migrations (open Query Tool and paste):
```sql
-- Core tables are created automatically by Flask on first run
-- Run these for extra columns:
ALTER TABLE users ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_code VARCHAR(20) UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS referred_by INTEGER;
ALTER TABLE books ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_status VARCHAR(50) DEFAULT 'pending';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_note TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMP;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP;

CREATE TABLE IF NOT EXISTS wishlists (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    book_id INTEGER REFERENCES books(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS wallet_transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    amount FLOAT NOT NULL,
    txn_type VARCHAR(50) NOT NULL,
    description VARCHAR(255),
    balance_after FLOAT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS referrals (
    id SERIAL PRIMARY KEY,
    referrer_id INTEGER REFERENCES users(id),
    referred_id INTEGER REFERENCES users(id),
    bonus_paid BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS disputes (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id),
    user_id INTEGER REFERENCES users(id),
    issue TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'open',
    resolution_note TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS platform_settings (
    id SERIAL PRIMARY KEY,
    commission_rate FLOAT DEFAULT 10.0,
    referral_bonus FLOAT DEFAULT 50.0
);

INSERT INTO platform_settings (commission_rate)
SELECT 10.0 WHERE NOT EXISTS (SELECT 1 FROM platform_settings);

CREATE TABLE IF NOT EXISTS book_views (
    id SERIAL PRIMARY KEY,
    book_id INTEGER REFERENCES books(id) ON DELETE CASCADE,
    viewer_ip VARCHAR(50),
    viewed_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    message TEXT NOT NULL,
    notif_type VARCHAR(50) DEFAULT 'info',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### 3. Setup Backend
```bash
cd backend

# Install dependencies
python -m pip install flask flask-sqlalchemy flask-login flask-cors flask-socketio authlib requests gevent gevent-websocket werkzeug psycopg2-binary razorpay

# Run the server
python app.py
```

Backend runs at: **http://localhost:5000**

### 4. Setup Frontend
```bash
cd frontend

# Install dependencies
npm install

# Run dev server
npm run dev
```

Frontend runs at: **http://localhost:5173**

### 5. Default Admin Account
```
Email:    admin@bookswap.com
Password: admin123
```

---

## 📁 Project Structure

```
bookswap-project/
├── backend/
│   ├── app.py          # All Flask routes & API endpoints
│   ├── models.py       # SQLAlchemy database models
│   ├── requirements.txt
│   └── static/
│       └── uploads/    # Book images
│
└── frontend/
    ├── index.html
    ├── public/
    │   ├── manifest.json   # PWA manifest
    │   └── sw.js           # Service worker
    └── src/
        ├── App.jsx         # Routes
        ├── api.js          # All API calls
        ├── index.css       # Global styles
        ├── components/
        │   ├── Navbar.jsx
        │   ├── BookCard.jsx
        │   └── UI.jsx
        ├── context/
        │   └── AuthContext.jsx
        └── pages/
            ├── Home.jsx
            ├── Books.jsx
            ├── Auth.jsx
            ├── Dashboard.jsx
            ├── BookDetail.jsx
            ├── Messages.jsx
            ├── Profile.jsx
            ├── SellerAnalytics.jsx
            ├── SellerStore.jsx
            └── AdminDashboard.jsx
```

---

## 🔑 Environment Variables

For production, set these as environment variables:

| Variable | Description | Example |
|---|---|---|
| `SECRET_KEY` | Flask secret key | `your-secret-key` |
| `DATABASE_URL` | PostgreSQL connection | `postgresql://user:pass@host/db` |
| `GOOGLE_CLIENT_ID` | Google OAuth ID | `xxxxx.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Google OAuth secret | `GOCSPX-xxxxx` |
| `RAZORPAY_KEY` | Razorpay key (optional) | `rzp_test_xxxxx` |
| `RAZORPAY_SECRET` | Razorpay secret (optional) | `xxxxx` |

---

## 📱 PWA Installation

BookSwap is installable as a mobile app:

1. Open the site in **Chrome on Android**
2. Tap the **3-dot menu** → **"Add to Home Screen"**
3. App installs with BookSwap icon

Or on desktop Chrome, click the **install icon** in the address bar.

---

## 🔄 How Book Exchange Works

```
Seller lists book → Admin approves → Book goes live
         ↓
Buyer finds book → Chats with seller → Agrees on meetup/shipping
         ↓
Buyer purchases → Wallet deducted → Seller notified
         ↓
Seller ships → Updates tracking → Buyer gets notified
         ↓
Delivered → Seller wallet credited → Both can leave reviews
```

**Why use the platform even for local meetups?**
- 🛡️ **Buyer protection** — dispute system refunds if something goes wrong
- ⭐ **Verified sellers** — ratings and reviews build trust
- 💬 **Chat history** — proof of all agreements
- 📍 **Local discovery** — find books near you easily

---

## 🏫 About This Project

Built as a **3rd Year University Project** demonstrating:

- Full-stack web development (Python + React)
- RESTful API design
- Real-time communication (WebSockets)
- Database design and management
- Authentication and authorization
- Payment gateway integration concepts
- Progressive Web App (PWA)
- Version control with Git

---

## 👨‍💻 Developer

**Bhavik Pathak**  
3rd Year BScIT Student  
📧 bhavikpathak08@gmail.com  
🔗 [GitHub](https://github.com/Bhavikpathak8)

---

<div align="center">

Made with ❤️ for readers everywhere

</div>