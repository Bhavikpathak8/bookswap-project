from flask import Flask, request, jsonify, redirect, session
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, login_user, logout_user, login_required, current_user, UserMixin
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta
from models import (
    Message, Conversation, Notification, db, User, Book, Order,
    Review, Dispute, PlatformSettings, EmailVerification, PhoneOTP,
    Wishlist, WalletTransaction, Referral, BookView
)
import os
import secrets
import random
import string
from werkzeug.utils import secure_filename
from authlib.integrations.flask_client import OAuth
from flask_socketio import SocketIO, emit, join_room, leave_room
from flask_cors import CORS
from sqlalchemy import func, extract


# ========================
# APP CONFIGURATION
# ========================

app = Flask(__name__)

app.config['SECRET_KEY'] = 'bookswap_secret'
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://postgres:1234@localhost:5432/bookswap_db'

db.init_app(app)

CORS(app, supports_credentials=True, origins=["http://localhost:5173", "https://bookswap-project.vercel.app", "https://*.vercel.app"])

login_manager = LoginManager(app)

socketio = SocketIO(app, cors_allowed_origins="*", manage_session=False, async_mode="gevent")

UPLOAD_FOLDER = 'static/uploads'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


# ========================
# HELPERS
# ========================

def send_notification(user_id, message, notif_type="info"):
    """Create a notification for a user."""
    notif = Notification(
        user_id=user_id,
        message=message,
        notif_type=notif_type
    )
    db.session.add(notif)
    # Note: commit is handled by the calling function


# ========================
# USER LOADER
# ========================

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))


# ========================
# HOME
# ========================

@app.route('/')
def index():
    return jsonify({"message": "BookSwap API Running"})


# ========================
# REGISTER
# ========================

@app.route('/api/register', methods=['POST'])
def register():
    data = request.json

    if User.query.filter_by(email=data['email']).first():
        return jsonify({"error": "Email already registered"}), 400

    if User.query.filter_by(username=data['username']).first():
        return jsonify({"error": "Username already taken"}), 400

    hashed_pw = generate_password_hash(data['password'])

    user = User(
        username=data['username'],
        email=data['email'],
        password=hashed_pw,
        city=data.get('city', ''),
        state=data.get('state', ''),
        pincode=data.get('pincode', '')
    )

    db.session.add(user)
    db.session.commit()

    return jsonify({"message": "Registration Successful"})


# ========================
# GOOGLE OAuth
# ========================

oauth = OAuth(app)

google = oauth.register(
    name='google',
    client_id='YOUR_GOOGLE_CLIENT_ID',
    client_secret='YOUR_GOOGLE_CLIENT_SECRET',
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
    client_kwargs={'scope': 'openid email profile'}
)

@app.route('/api/google_login')
def google_login():
    redirect_uri = "http://localhost:5000/api/google_auth"
    # Clear any stale OAuth state to prevent MismatchingStateError
    session.pop('_state_google_state', None)
    return google.authorize_redirect(redirect_uri)

@app.route('/api/google_auth')
def google_auth():
    try:
        token = google.authorize_access_token()
    except Exception as e:
        # CSRF state mismatch — just redirect back to login
        print(f"[Google Auth Error] {e}")
        return redirect("http://localhost:5173/login?error=google_failed")

    user_info = token.get('userinfo') or {}
    email = user_info.get('email')
    name  = user_info.get('name', email)

    if not email:
        return redirect("http://localhost:5173/login?error=no_email")

    user = User.query.filter_by(email=email).first()
    if not user:
        # Make sure username is unique
        base_username = name
        username = base_username
        count = 1
        while User.query.filter_by(username=username).first():
            username = f"{base_username}{count}"
            count += 1
        user = User(username=username, email=email, password=generate_password_hash("google_oauth_no_password"))
        db.session.add(user)
        db.session.commit()

    login_user(user)
    # Redirect back to React app — frontend reads session via /api/profile
    return redirect("http://localhost:5173/")


# ========================
# LOGIN
# ========================

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    user = User.query.filter_by(email=data['email']).first()

    if not user or not check_password_hash(user.password, data['password']):
        return jsonify({"error": "Invalid Credentials"}), 401

    if user.is_banned:
        return jsonify({"error": "Your account has been banned. Contact support."}), 403

    login_user(user)
    return jsonify({
        "message": "Login Successful",
        "username": user.username,
        "email": user.email,
        "is_admin": user.is_admin,
        "city": user.city,
        "email_verified": user.email_verified,
        "phone_verified": user.phone_verified
    })


# ========================
# LOGOUT
# ========================

@app.route('/api/logout')
@login_required
def logout():
    logout_user()
    return jsonify({"message": "Logged Out Successfully"})


# ========================
# PROFILE
# ========================

@app.route('/api/profile')
@login_required
def profile():
    books = Book.query.filter_by(seller_id=current_user.id).all()
    user_books = [{
        "id": b.id, "title": b.title, "price": b.price,
        "image": b.image, "available": b.available, "is_approved": b.is_approved
    } for b in books]

    return jsonify({
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
        "phone_number": current_user.phone_number,
        "wallet_balance": current_user.wallet_balance,
        "city": current_user.city,
        "state": current_user.state,
        "pincode": current_user.pincode,
        "email_verified": current_user.email_verified,
        "phone_verified": current_user.phone_verified,
        "is_admin": current_user.is_admin,
        "books": user_books
    })


@app.route('/api/profile/update', methods=['PUT'])
@login_required
def update_profile():
    data = request.get_json()
    current_user.city = data.get('city', current_user.city)
    current_user.state = data.get('state', current_user.state)
    current_user.pincode = data.get('pincode', current_user.pincode)
    current_user.phone_number = data.get('phone_number', current_user.phone_number)
    db.session.commit()
    return jsonify({"message": "Profile updated"})


# ========================
# DASHBOARD
# ========================

@app.route('/api/dashboard')
@login_required
def dashboard():
    books = Book.query.filter_by(seller_id=current_user.id).all()
    result = [{
        "id": b.id, "title": b.title, "author": b.author,
        "category": b.category, "price": b.price,
        "image": b.image, "available": b.available, "is_approved": b.is_approved
    } for b in books]

    orders_count = Order.query.filter_by(buyer_id=current_user.id).count()
    sold_count = Order.query.filter_by(seller_id=current_user.id).count()

    return jsonify({
        "user": current_user.username,
        "wallet_balance": current_user.wallet_balance,
        "orders_count": orders_count,
        "sold_count": sold_count,
        "books": result
    })


# ========================
# BOOKS — BROWSE (with location filter)
# ========================

@app.route('/api/books')
def books():
    search   = request.args.get('search', '')
    category = request.args.get('category', '')
    city     = request.args.get('city', '')          # location filter
    nearby   = request.args.get('nearby', 'false')   # "true" = city-only
    min_price = request.args.get('min_price', type=float)
    max_price = request.args.get('max_price', type=float)

    query = Book.query.filter_by(available=True, is_approved=True)

    if search:
        query = Book.query.filter(
            Book.title.ilike(f'%{search}%') | Book.author.ilike(f'%{search}%')
        ).filter_by(available=True)

    if category:
        query = query.filter(Book.category.ilike(f'%{category}%'))

    # Location-based filter
    if nearby == 'true' and city:
        query = query.filter(Book.location.ilike(f'%{city}%'))
    elif city:
        query = query.filter(Book.location.ilike(f'%{city}%'))

    if min_price is not None:
        query = query.filter(Book.price >= min_price)
    if max_price is not None:
        query = query.filter(Book.price <= max_price)

    all_books = query.order_by(Book.created_at.desc()).all()

    result = [{
        "id": b.id, "title": b.title, "author": b.author,
        "category": b.category, "price": b.price,
        "image": b.image, "available": b.available,
        "location": b.location, "condition": b.condition,
        "seller_id": b.seller_id
    } for b in all_books]

    return jsonify(result)


# ========================
# BOOK DETAIL
# ========================

@app.route('/api/book/<int:book_id>')
def book_detail(book_id):
    book = Book.query.get_or_404(book_id)
    seller = User.query.get(book.seller_id)

    # Track view
    try:
        viewer_ip = request.environ.get('HTTP_X_FORWARDED_FOR', request.remote_addr)
        db.session.add(BookView(book_id=book_id, viewer_ip=viewer_ip))
        db.session.commit()
    except Exception:
        db.session.rollback()

    # Seller avg rating
    seller_reviews = Review.query.filter_by(reviewed_user_id=book.seller_id).all()
    avg_rating = round(sum(r.rating for r in seller_reviews) / len(seller_reviews), 1) if seller_reviews else None

    return jsonify({
        "id": book.id, "title": book.title, "author": book.author,
        "category": book.category, "price": book.price,
        "description": book.description, "image": book.image,
        "available": book.available, "condition": book.condition,
        "location": book.location, "state": book.state, "pincode": book.pincode,
        "is_approved": book.is_approved, "is_featured": book.is_featured or False,
        "view_count": BookView.query.filter_by(book_id=book_id).count(),
        "seller": {
            "id": seller.id if seller else None,
            "username": seller.username if seller else "Unknown",
            "city": seller.city if seller else "",
            "avg_rating": avg_rating,
            "total_reviews": len(seller_reviews)
        }
    })


# ========================
# ADD BOOK
# ========================

@app.route('/api/add_book', methods=['POST'])
@login_required
def add_book():
    title       = request.form['title']
    author      = request.form['author']
    category    = request.form['category']
    price       = float(request.form['price'])
    description = request.form.get('description', '')
    condition   = request.form.get('condition', 'Good')

    # Use seller's city if not provided separately
    location = request.form.get('location', current_user.city or '')
    state    = request.form.get('state',    current_user.state or '')
    pincode  = request.form.get('pincode',  current_user.pincode or '')

    image = request.files.get('image')
    filename = None
    if image:
        filename = secure_filename(image.filename)
        image.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))

    book = Book(
        title=title, author=author, category=category,
        price=price, description=description, condition=condition,
        image=filename, seller_id=current_user.id,
        location=location, state=state, pincode=pincode,
        is_approved=False   # requires admin approval
    )

    db.session.add(book)

    # Notify admin
    admins = User.query.filter_by(is_admin=True).all()
    for admin in admins:
        send_notification(admin.id, f"New book '{title}' listed by {current_user.username} — pending approval.", "info")

    db.session.commit()
    return jsonify({"message": "Book submitted for approval"})


# ========================
# EDIT BOOK
# ========================

@app.route('/api/edit_book/<int:book_id>', methods=['PUT'])
@login_required
def edit_book(book_id):
    book = Book.query.get_or_404(book_id)
    if book.seller_id != current_user.id and not current_user.is_admin:
        return jsonify({"error": "Unauthorized"}), 403

    if request.form.get('title'):   book.title  = request.form['title']
    if request.form.get('author'):  book.author = request.form['author']
    if request.form.get('price'):   book.price  = float(request.form['price'])
    if request.form.get('description'): book.description = request.form['description']
    if request.form.get('condition'):   book.condition   = request.form['condition']
    if request.form.get('location'):    book.location    = request.form['location']

    image = request.files.get('image')
    if image:
        filename = secure_filename(image.filename)
        image.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
        book.image = filename

    db.session.commit()
    return jsonify({"message": "Book updated successfully"})


# ========================
# DELETE BOOK
# ========================

@app.route('/api/delete_book/<int:book_id>', methods=["DELETE"])
@login_required
def delete_book(book_id):
    book = Book.query.get_or_404(book_id)
    if book.seller_id != current_user.id and not current_user.is_admin:
        return jsonify({"error": "Unauthorized"}), 403
    db.session.delete(book)
    db.session.commit()
    return jsonify({"message": "Book deleted successfully"})


# ========================
# ADMIN — APPROVE / REJECT BOOK
# ========================

@app.route('/api/admin/approve_book/<int:book_id>', methods=['POST'])
@login_required
def approve_book(book_id):
    if not current_user.is_admin:
        return jsonify({"error": "Access Denied"}), 403

    book = Book.query.get_or_404(book_id)
    data = request.get_json()
    action = data.get('action', 'approve')   # 'approve' or 'reject'

    if action == 'approve':
        book.is_approved = True
        send_notification(
            book.seller_id,
            f"Your book '{book.title}' has been approved and is now live!",
            "info"
        )
        msg = "Book approved"
    else:
        reason = data.get('reason', 'Does not meet guidelines')
        send_notification(
            book.seller_id,
            f"Your book '{book.title}' was rejected. Reason: {reason}",
            "info"
        )
        db.session.delete(book)
        msg = "Book rejected and removed"

    db.session.commit()
    return jsonify({"message": msg})


@app.route('/api/admin/pending_books')
@login_required
def pending_books():
    if not current_user.is_admin:
        return jsonify({"error": "Access Denied"}), 403

    books = Book.query.filter_by(is_approved=False).order_by(Book.created_at.desc()).all()
    result = [{
        "id": b.id, "title": b.title, "author": b.author,
        "category": b.category, "price": b.price,
        "image": b.image, "location": b.location,
        "seller_id": b.seller_id,
        "created_at": b.created_at.isoformat() if b.created_at else None
    } for b in books]
    return jsonify(result)


# ========================
# BUY BOOK
# ========================

@app.route('/api/buy/<int:book_id>', methods=['POST'])
@login_required
def buy(book_id):
    book = Book.query.get_or_404(book_id)

    if book.seller_id == current_user.id:
        return jsonify({"error": "You cannot buy your own book"}), 400
    if not book.available:
        return jsonify({"error": "Book already sold"}), 400
    if not book.is_approved:
        return jsonify({"error": "This book is not yet approved"}), 400

    settings = PlatformSettings.query.first()
    if not settings:
        settings = PlatformSettings(commission_rate=10)
        db.session.add(settings)
        db.session.commit()

    commission_rate = settings.commission_rate
    commission      = (book.price * commission_rate) / 100
    seller_amount   = book.price - commission

    if current_user.wallet_balance < book.price:
        return jsonify({"error": "Insufficient wallet balance"}), 400

    try:
        current_user.wallet_balance -= book.price
        seller = User.query.get(book.seller_id)
        if not seller:
            return jsonify({"error": "Seller not found"}), 404

        seller.wallet_balance += seller_amount
        book.available = False

        order = Order(
            buyer_id=current_user.id, seller_id=book.seller_id,
            book_id=book.id, amount=book.price, total_price=book.price,
            commission=commission, net_amount=seller_amount
        )
        db.session.add(order)

        # Notifications
        send_notification(
            current_user.id,
            f"You bought '{book.title}' for ₹{book.price}. Enjoy reading!",
            "buy"
        )
        send_notification(
            seller.id,
            f"Your book '{book.title}' was sold! ₹{seller_amount:.2f} added to your wallet.",
            "sell"
        )

        db.session.commit()
        return jsonify({"message": "Book purchased successfully"})

    except Exception as e:
        db.session.rollback()
        print("BUY ERROR:", e)
        return jsonify({"error": "Transaction failed"}), 500


# ========================
# WALLET
# ========================

@app.route('/api/wallet')
@login_required
def wallet():
    return jsonify({"balance": current_user.wallet_balance})


@app.route('/api/add_credit', methods=['POST'])
@login_required
def add_credit():
    data = request.get_json()
    amount = float(data['amount'])
    if amount <= 0:
        return jsonify({"error": "Invalid amount"}), 400
    current_user.wallet_balance += amount
    db.session.commit()
    return jsonify({"message": "Wallet recharged", "new_balance": current_user.wallet_balance})


# ========================
# ORDERS
# ========================

@app.route('/api/orders')
@login_required
def orders():
    user_orders = Order.query.filter_by(buyer_id=current_user.id).order_by(Order.created_at.desc()).all()
    result = []
    for o in user_orders:
        book = Book.query.get(o.book_id)
        result.append({
            "order_id": o.id,
            "book_id": o.book_id,
            "book_title": book.title if book else "Deleted",
            "book_image": book.image if book else None,
            "amount": o.amount,
            "commission": o.commission,
            "net_amount": o.net_amount,
            "status": o.status,
            "date": o.created_at.isoformat() if o.created_at else None
        })
    return jsonify(result)


@app.route('/api/cancel_order/<int:order_id>', methods=['POST'])
@login_required
def cancel_order(order_id):
    order = Order.query.get_or_404(order_id)
    if order.buyer_id != current_user.id:
        return jsonify({"error": "Unauthorized"}), 403

    book   = Book.query.get(order.book_id)
    seller = User.query.get(order.seller_id)

    current_user.wallet_balance += order.amount
    if seller:
        seller.wallet_balance -= order.net_amount
    if book:
        book.available = True

    send_notification(current_user.id, f"Order for '{book.title if book else 'book'}' cancelled. ₹{order.amount} refunded.", "info")

    db.session.delete(order)
    db.session.commit()
    return jsonify({"message": "Order cancelled and refunded"})


# ========================
# DISPUTES
# ========================

@app.route('/api/dispute', methods=['POST'])
@login_required
def raise_dispute():
    data = request.get_json()
    order_id = data.get('order_id')
    issue    = data.get('issue', '').strip()

    if not issue:
        return jsonify({"error": "Issue description required"}), 400

    order = Order.query.get_or_404(order_id)
    if order.buyer_id != current_user.id:
        return jsonify({"error": "Unauthorized"}), 403

    existing = Dispute.query.filter_by(order_id=order_id).first()
    if existing:
        return jsonify({"error": "Dispute already raised for this order"}), 400

    dispute = Dispute(
        order_id=order_id,
        user_id=current_user.id,
        issue=issue,
        status="open"
    )
    db.session.add(dispute)

    # Notify admin
    admins = User.query.filter_by(is_admin=True).all()
    for admin in admins:
        send_notification(admin.id, f"New dispute raised by {current_user.username} for order #{order_id}.", "dispute")

    db.session.commit()
    return jsonify({"message": "Dispute raised successfully"})


@app.route('/api/my_disputes')
@login_required
def my_disputes():
    disputes = Dispute.query.filter_by(user_id=current_user.id).order_by(Dispute.created_at.desc()).all()
    result = []
    for d in disputes:
        order = Order.query.get(d.order_id)
        book  = Book.query.get(order.book_id) if order else None
        result.append({
            "id": d.id,
            "order_id": d.order_id,
            "book_title": book.title if book else "Unknown",
            "issue": d.issue,
            "status": d.status,
            "resolution_note": d.resolution_note,
            "created_at": d.created_at.isoformat()
        })
    return jsonify(result)


@app.route('/api/admin/disputes')
@login_required
def admin_disputes():
    if not current_user.is_admin:
        return jsonify({"error": "Access Denied"}), 403

    disputes = Dispute.query.order_by(Dispute.created_at.desc()).all()
    result = []
    for d in disputes:
        user  = User.query.get(d.user_id)
        order = Order.query.get(d.order_id)
        book  = Book.query.get(order.book_id) if order else None
        result.append({
            "id": d.id,
            "order_id": d.order_id,
            "user": user.username if user else "Unknown",
            "book_title": book.title if book else "Unknown",
            "issue": d.issue,
            "status": d.status,
            "resolution_note": d.resolution_note,
            "created_at": d.created_at.isoformat()
        })
    return jsonify(result)


@app.route('/api/admin/resolve_dispute/<int:dispute_id>', methods=['POST'])
@login_required
def resolve_dispute(dispute_id):
    if not current_user.is_admin:
        return jsonify({"error": "Access Denied"}), 403

    dispute = Dispute.query.get_or_404(dispute_id)
    data    = request.get_json()
    action  = data.get('action', 'resolved')    # 'resolved' or 'rejected'
    note    = data.get('note', '')

    dispute.status          = action
    dispute.resolution_note = note
    dispute.resolved_at     = datetime.utcnow()

    send_notification(
        dispute.user_id,
        f"Your dispute #{dispute_id} has been {action}. Admin note: {note}",
        "dispute"
    )

    db.session.commit()
    return jsonify({"message": f"Dispute {action}"})


# ========================
# BAN / UNBAN USER
# ========================

@app.route('/api/admin/ban_user/<int:user_id>', methods=['POST'])
@login_required
def ban_user(user_id):
    if not current_user.is_admin:
        return jsonify({"error": "Access Denied"}), 403

    user = User.query.get_or_404(user_id)
    if user.is_admin:
        return jsonify({"error": "Cannot ban an admin"}), 400
    if user.id == current_user.id:
        return jsonify({"error": "Cannot ban yourself"}), 400

    user.is_banned = True
    send_notification(user.id, "Your account has been banned. Contact support@bookswap.com.", "info")
    db.session.commit()
    return jsonify({"message": f"User {user.username} banned"})


@app.route('/api/admin/unban_user/<int:user_id>', methods=['POST'])
@login_required
def unban_user(user_id):
    if not current_user.is_admin:
        return jsonify({"error": "Access Denied"}), 403

    user = User.query.get_or_404(user_id)
    user.is_banned = False
    send_notification(user.id, "Your account has been reinstated. Welcome back!", "info")
    db.session.commit()
    return jsonify({"message": f"User {user.username} unbanned"})


# ========================
# EMAIL VERIFICATION
# ========================

@app.route('/api/send_verification_email', methods=['POST'])
@login_required
def send_verification_email():
    if current_user.email_verified:
        return jsonify({"message": "Email already verified"}), 200

    # Generate a secure token
    token = secrets.token_urlsafe(32)
    expires = datetime.utcnow() + timedelta(hours=24)

    # Remove old tokens for this user
    EmailVerification.query.filter_by(user_id=current_user.id, used=False).delete()

    ev = EmailVerification(
        user_id=current_user.id,
        token=token,
        expires_at=expires
    )
    db.session.add(ev)
    db.session.commit()

    # In production: send via SMTP / SendGrid / etc.
    # For now, we return the token so you can test
    verify_link = f"http://localhost:5000/api/verify_email/{token}"
    print(f"[EMAIL VERIFICATION] Link for {current_user.email}: {verify_link}")

    return jsonify({
        "message": "Verification email sent",
        "dev_link": verify_link    # remove in production
    })


@app.route('/api/verify_email/<token>')
def verify_email(token):
    ev = EmailVerification.query.filter_by(token=token, used=False).first()
    if not ev:
        return jsonify({"error": "Invalid or expired token"}), 400
    if ev.expires_at < datetime.utcnow():
        return jsonify({"error": "Token expired"}), 400

    user = User.query.get(ev.user_id)
    user.email_verified = True
    ev.used = True
    db.session.commit()
    return jsonify({"message": "Email verified successfully!"})


# ========================
# PHONE OTP VERIFICATION
# ========================

@app.route('/api/send_phone_otp', methods=['POST'])
@login_required
def send_phone_otp():
    data  = request.get_json()
    phone = data.get('phone_number', current_user.phone_number)

    if not phone:
        return jsonify({"error": "Phone number required"}), 400

    otp     = ''.join(random.choices(string.digits, k=6))
    expires = datetime.utcnow() + timedelta(minutes=10)

    # Remove old OTPs
    PhoneOTP.query.filter_by(user_id=current_user.id, used=False).delete()

    phone_otp = PhoneOTP(
        user_id=current_user.id,
        otp=otp,
        expires_at=expires
    )
    db.session.add(phone_otp)

    # Update phone if changed
    current_user.phone_number = phone
    db.session.commit()

    # In production: send via Twilio / MSG91 / etc.
    print(f"[OTP] For {phone}: {otp}")

    return jsonify({
        "message": "OTP sent to your phone",
        "dev_otp": otp    # remove in production
    })


@app.route('/api/verify_phone_otp', methods=['POST'])
@login_required
def verify_phone_otp():
    data = request.get_json()
    otp  = data.get('otp', '').strip()

    record = PhoneOTP.query.filter_by(
        user_id=current_user.id, otp=otp, used=False
    ).first()

    if not record:
        return jsonify({"error": "Invalid OTP"}), 400
    if record.expires_at < datetime.utcnow():
        return jsonify({"error": "OTP expired"}), 400

    current_user.phone_verified = True
    record.used = True
    db.session.commit()
    return jsonify({"message": "Phone verified successfully!"})


# ========================
# NOTIFICATIONS
# ========================

@app.route('/api/notifications')
@login_required
def get_notifications():
    notifs = Notification.query.filter_by(user_id=current_user.id)\
                .order_by(Notification.created_at.desc()).limit(30).all()
    return jsonify([{
        "id": n.id,
        "message": n.message,
        "type": n.notif_type,
        "is_read": n.is_read,
        "created_at": n.created_at.isoformat()
    } for n in notifs])


@app.route('/api/notifications/mark_read', methods=['POST'])
@login_required
def mark_notifications_read():
    Notification.query.filter_by(user_id=current_user.id, is_read=False).update({"is_read": True})
    db.session.commit()
    return jsonify({"message": "All notifications marked as read"})


@app.route('/api/notifications/unread_count')
@login_required
def notif_unread_count():
    count = Notification.query.filter_by(user_id=current_user.id, is_read=False).count()
    return jsonify({"count": count})


# ========================
# ADMIN COMMISSION SETTINGS
# ========================

@app.route('/api/admin/commission', methods=['GET'])
@login_required
def get_commission():
    if not current_user.is_admin:
        return jsonify({"error": "Access Denied"}), 403
    settings = PlatformSettings.query.first()
    if not settings:
        settings = PlatformSettings(commission_rate=10)
        db.session.add(settings)
        db.session.commit()
    return jsonify({"commission_rate": settings.commission_rate})


@app.route('/api/admin/commission', methods=['PUT'])
@login_required
def update_commission():
    if not current_user.is_admin:
        return jsonify({"error": "Access Denied"}), 403
    data = request.get_json()
    rate = float(data.get('commission_rate', 10))
    if rate < 0 or rate > 50:
        return jsonify({"error": "Rate must be between 0 and 50"}), 400

    settings = PlatformSettings.query.first()
    if not settings:
        settings = PlatformSettings()
        db.session.add(settings)

    settings.commission_rate = rate
    settings.updated_at = datetime.utcnow()
    db.session.commit()
    return jsonify({"message": f"Commission rate updated to {rate}%"})


# ========================
# ADMIN DASHBOARD (with real revenue data)
# ========================

@app.route('/api/admin')
@login_required
def admin_dashboard():
    if not current_user.is_admin:
        return jsonify({"error": "Access Denied"}), 403

    try:
        users      = User.query.all()
        books      = Book.query.all()
        all_orders = Order.query.all()

        # Safe monthly revenue query
        try:
            monthly_data = db.session.query(
                extract('month', Order.created_at).label('month'),
                extract('year',  Order.created_at).label('year'),
                func.sum(Order.commission).label('revenue'),
                func.count(Order.id).label('sales')
            ).group_by('year', 'month').order_by('year', 'month').limit(12).all()
            month_names     = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
            month_labels    = [month_names[int(r.month)-1] for r in monthly_data]
            monthly_revenue = [float(r.revenue or 0) for r in monthly_data]
            monthly_sales   = [int(r.sales or 0)   for r in monthly_data]
        except Exception:
            month_labels    = []
            monthly_revenue = []
            monthly_sales   = []

        # Safe disputes count
        try:
            open_disputes = Dispute.query.filter_by(status="open").count()
        except Exception:
            open_disputes = 0

        # Safe pending books count
        try:
            pending_count = Book.query.filter_by(is_approved=False).count()
        except Exception:
            pending_count = 0

        # Safe commission
        try:
            settings = PlatformSettings.query.first()
            commission_rate = settings.commission_rate if settings else 10
        except Exception:
            commission_rate = 10

        # Safe total revenue
        try:
            total_revenue = sum((o.commission or 0) for o in all_orders)
        except Exception:
            total_revenue = 0

        return jsonify({
            "total_users":    len(users),
            "total_books":    len(books),
            "total_orders":   len(all_orders),
            "total_revenue":  total_revenue,
            "pending_books":  pending_count,
            "open_disputes":  open_disputes,
            "commission_rate": commission_rate,
            "users": [{
                "id": u.id, "username": u.username, "email": u.email,
                "wallet_balance": u.wallet_balance or 0,
                "is_banned": u.is_banned or False,
                "is_admin": u.is_admin or False,
                "city": u.city or "",
                "email_verified": u.email_verified or False,
                "phone_verified": u.phone_verified or False,
                "created_at": u.created_at.isoformat() if u.created_at else None
            } for u in users],
            "books": [{
                "id": b.id, "title": b.title, "author": b.author,
                "price": b.price, "is_approved": b.is_approved or False,
                "location": b.location or ""
            } for b in books],
            "month_labels":    month_labels    or ["Jan","Feb","Mar","Apr","May","Jun"],
            "monthly_revenue": monthly_revenue or [0,0,0,0,0,0],
            "monthly_sales":   monthly_sales   or [0,0,0,0,0,0]
        })

    except Exception as e:
        print("ADMIN DASHBOARD ERROR:", e)
        return jsonify({"error": str(e)}), 500


# ========================
# ADMIN DELETE USER
# ========================

@app.route('/api/delete_user/<int:id>', methods=["DELETE"])
@login_required
def delete_user(id):
    if not current_user.is_admin:
        return jsonify({"error": "Access Denied"}), 403

    user = User.query.get_or_404(id)
    if user.id == current_user.id:
        return jsonify({"error": "Admin cannot delete themselves"}), 400
    if user.is_admin:
        return jsonify({"error": "Cannot delete another admin"}), 400

    Message.query.filter(
        (Message.sender_id == user.id) | (Message.receiver_id == user.id)
    ).delete()

    Conversation.query.filter(
        (Conversation.user1_id == user.id) | (Conversation.user2_id == user.id)
    ).delete()

    Order.query.filter_by(buyer_id=user.id).delete()
    Order.query.filter_by(seller_id=user.id).delete()

    Notification.query.filter_by(user_id=user.id).delete()

    # Books cascade deleted via relationship
    db.session.delete(user)
    db.session.commit()
    return jsonify({"message": "User deleted successfully"})


# ========================
# REVIEWS
# ========================

@app.route('/api/review/<int:user_id>', methods=['POST'])
@login_required
def review(user_id):
    data    = request.get_json()
    rating  = int(data['rating'])
    comment = data.get('comment', '')

    if rating < 1 or rating > 5:
        return jsonify({"error": "Rating must be 1–5"}), 400

    reviewed_user = User.query.get_or_404(user_id)

    new_review = Review(
        reviewer_id=current_user.id,
        reviewed_user_id=user_id,
        rating=rating,
        comment=comment
    )
    db.session.add(new_review)

    send_notification(
        user_id,
        f"{current_user.username} left you a {rating}★ review: \"{comment[:60]}\"",
        "review"
    )

    db.session.commit()
    return jsonify({"message": "Review submitted"})


@app.route('/api/reviews/<int:user_id>')
def get_reviews(user_id):
    reviews = Review.query.filter_by(reviewed_user_id=user_id)\
                .order_by(Review.created_at.desc()).all()
    result = []
    for r in reviews:
        reviewer = User.query.get(r.reviewer_id)
        result.append({
            "id": r.id,
            "reviewer": reviewer.username if reviewer else "Unknown",
            "rating": r.rating,
            "comment": r.comment,
            "created_at": r.created_at.isoformat()
        })
    return jsonify(result)


# ========================
# CHAT — REST
# ========================

@app.route("/api/messages")
@login_required
def messages():
    # Simple subquery approach — no JOIN issues
    sent_to = db.session.query(Message.receiver_id).filter(
        Message.sender_id == current_user.id
    ).distinct().all()
    received_from = db.session.query(Message.sender_id).filter(
        Message.receiver_id == current_user.id
    ).distinct().all()

    # Collect all unique user IDs we've chatted with
    user_ids = set()
    for row in sent_to:
        user_ids.add(row[0])
    for row in received_from:
        user_ids.add(row[0])
    user_ids.discard(current_user.id)

    if not user_ids:
        return jsonify([])

    chat_users = User.query.filter(User.id.in_(user_ids)).all()

    return jsonify([{
        "id": u.id, "username": u.username,
        "email": u.email, "city": u.city or ""
    } for u in chat_users])


@app.route("/api/chat/<int:user_id>")
@login_required
def chat(user_id):
    other_user = User.query.get_or_404(user_id)
    msgs = Message.query.filter(
        ((Message.sender_id == current_user.id) & (Message.receiver_id == user_id)) |
        ((Message.sender_id == user_id) & (Message.receiver_id == current_user.id))
    ).order_by(Message.timestamp).all()

    # Mark as read
    Message.query.filter_by(receiver_id=current_user.id, sender_id=user_id, is_read=False)\
        .update({"is_read": True})
    db.session.commit()

    return jsonify({
        "chat_with": {
            "id": other_user.id,
            "username": other_user.username,
            "city": other_user.city or ""
        },
        "messages": [{
            "id": m.id,
            "sender_id": m.sender_id,   # always use sender_id for consistency
            "receiver_id": m.receiver_id,
            "message": m.message,
            "image": m.image,
            "timestamp": m.timestamp.isoformat() if m.timestamp else None,
            "is_read": m.is_read
        } for m in msgs]
    })


@app.route("/api/unread_count")
@login_required
def unread_count():
    count = Message.query.filter_by(receiver_id=current_user.id, is_read=False).count()
    return jsonify({"count": count})


@app.route("/api/delete_message/<int:msg_id>", methods=["DELETE"])
@login_required
def delete_message(msg_id):
    msg = Message.query.get_or_404(msg_id)
    if msg.sender_id != current_user.id:
        return jsonify({"error": "Unauthorized"}), 403
    db.session.delete(msg)
    db.session.commit()
    return jsonify({"success": True})


@app.route("/api/delete_chat/<int:user_id>", methods=["DELETE"])
@login_required
def delete_chat(user_id):
    Message.query.filter(
        ((Message.sender_id == current_user.id) & (Message.receiver_id == user_id)) |
        ((Message.sender_id == user_id) & (Message.receiver_id == current_user.id))
    ).delete()
    db.session.commit()
    return jsonify({"success": True})


# ========================

# ========================
# WISHLIST
# ========================

@app.route('/api/wishlist', methods=['GET'])
@login_required
def get_wishlist():
    items = Wishlist.query.filter_by(user_id=current_user.id).order_by(Wishlist.created_at.desc()).all()
    result = []
    for w in items:
        b = Book.query.get(w.book_id)
        if b:
            result.append({
                "wishlist_id": w.id, "book_id": b.id,
                "title": b.title, "author": b.author,
                "price": b.price, "image": b.image,
                "available": b.available, "location": b.location or "",
                "category": b.category, "condition": b.condition or ""
            })
    return jsonify(result)

@app.route('/api/wishlist/<int:book_id>', methods=['POST'])
@login_required
def add_wishlist(book_id):
    if Wishlist.query.filter_by(user_id=current_user.id, book_id=book_id).first():
        return jsonify({"error": "Already in wishlist"}), 400
    Book.query.get_or_404(book_id)
    db.session.add(Wishlist(user_id=current_user.id, book_id=book_id))
    db.session.commit()
    return jsonify({"message": "Added to wishlist"})

@app.route('/api/wishlist/<int:book_id>', methods=['DELETE'])
@login_required
def remove_wishlist(book_id):
    w = Wishlist.query.filter_by(user_id=current_user.id, book_id=book_id).first()
    if not w:
        return jsonify({"error": "Not in wishlist"}), 404
    db.session.delete(w)
    db.session.commit()
    return jsonify({"message": "Removed from wishlist"})

@app.route('/api/wishlist/check/<int:book_id>')
@login_required
def check_wishlist(book_id):
    exists = Wishlist.query.filter_by(user_id=current_user.id, book_id=book_id).first()
    return jsonify({"wishlisted": bool(exists)})


# ========================
# SIMILAR BOOKS
# ========================

@app.route('/api/books/<int:book_id>/similar')
def similar_books(book_id):
    book = Book.query.get_or_404(book_id)
    similar = Book.query.filter(
        Book.id != book_id,
        Book.available == True,
        Book.is_approved == True,
        db.or_(Book.category == book.category, Book.author == book.author)
    ).order_by(Book.created_at.desc()).limit(6).all()
    return jsonify([{
        "id": b.id, "title": b.title, "author": b.author,
        "price": b.price, "image": b.image, "category": b.category,
        "location": b.location or "", "condition": b.condition or ""
    } for b in similar])


# ========================
# SEARCH SUGGESTIONS
# ========================

@app.route('/api/search/suggest')
def search_suggest():
    q = request.args.get('q', '').strip()
    if len(q) < 2:
        return jsonify([])
    books = Book.query.filter(
        Book.is_approved == True, Book.available == True,
        db.or_(Book.title.ilike(f'%{q}%'), Book.author.ilike(f'%{q}%'), Book.category.ilike(f'%{q}%'))
    ).limit(10).all()
    suggestions = []
    seen = set()
    for b in books:
        if b.title.lower() not in seen:
            suggestions.append({"type": "book", "text": b.title, "sub": f"by {b.author}", "id": b.id})
            seen.add(b.title.lower())
        if b.author.lower() not in seen:
            suggestions.append({"type": "author", "text": b.author, "sub": "Author"})
            seen.add(b.author.lower())
    return jsonify(suggestions[:8])


# ========================
# ORDER TRACKING
# ========================

@app.route('/api/order/<int:order_id>/track', methods=['POST'])
@login_required
def update_tracking(order_id):
    order = Order.query.get_or_404(order_id)
    if order.seller_id != current_user.id and not current_user.is_admin:
        return jsonify({"error": "Unauthorized"}), 403
    data   = request.get_json()
    status = data.get('tracking_status')
    note   = data.get('tracking_note', '')
    if status not in ['pending', 'shipped', 'delivered']:
        return jsonify({"error": "Invalid status"}), 400
    order.tracking_status = status
    order.tracking_note   = note
    if status == 'shipped':
        order.shipped_at = datetime.utcnow()
    if status == 'delivered':
        order.delivered_at = datetime.utcnow()
        order.status = 'delivered'
    book = Book.query.get(order.book_id)
    msgs = {
        'pending':   f"Your order for '{book.title if book else 'book'}' is being prepared. 📋",
        'shipped':   f"Your order for '{book.title if book else 'book'}' has been shipped! 🚚",
        'delivered': f"Your order for '{book.title if book else 'book'}' has been delivered! 📦",
    }
    send_notification(order.buyer_id, msgs[status], "info")
    db.session.commit()
    return jsonify({"message": f"Tracking updated to {status}"})

@app.route('/api/order/<int:order_id>/tracking')
@login_required
def get_tracking(order_id):
    order = Order.query.get_or_404(order_id)
    if order.buyer_id != current_user.id and order.seller_id != current_user.id and not current_user.is_admin:
        return jsonify({"error": "Unauthorized"}), 403
    book = Book.query.get(order.book_id)
    return jsonify({
        "order_id": order.id,
        "book_title": book.title if book else "Unknown",
        "tracking_status": order.tracking_status or "pending",
        "tracking_note": order.tracking_note or "",
        "shipped_at": order.shipped_at.isoformat() if order.shipped_at else None,
        "delivered_at": order.delivered_at.isoformat() if order.delivered_at else None,
        "created_at": order.created_at.isoformat() if order.created_at else None,
    })


# ========================
# WALLET TRANSACTIONS
# ========================

@app.route('/api/wallet/transactions')
@login_required
def wallet_transactions():
    txns = WalletTransaction.query.filter_by(user_id=current_user.id)\
        .order_by(WalletTransaction.created_at.desc()).limit(50).all()
    return jsonify([{
        "id": t.id, "amount": t.amount, "type": t.txn_type,
        "description": t.description, "balance_after": t.balance_after,
        "created_at": t.created_at.isoformat()
    } for t in txns])


# ========================
# RAZORPAY PAYMENT
# ========================

@app.route('/api/razorpay/order/<int:book_id>', methods=['POST'])
@login_required
def create_razorpay_order(book_id):
    try:
        import razorpay
    except ImportError:
        return jsonify({"error": "Run: pip install razorpay"}), 500
    book = Book.query.get_or_404(book_id)
    if not book.available:
        return jsonify({"error": "Book not available"}), 400
    RAZORPAY_KEY    = os.environ.get('RAZORPAY_KEY', 'YOUR_KEY')
    RAZORPAY_SECRET = os.environ.get('RAZORPAY_SECRET', 'YOUR_SECRET')
    client   = razorpay.Client(auth=(RAZORPAY_KEY, RAZORPAY_SECRET))
    rz_order = client.order.create({
        "amount": int(book.price * 100),
        "currency": "INR",
        "receipt": f"book_{book_id}_user_{current_user.id}",
        "notes": {"book_id": book_id, "buyer_id": current_user.id}
    })
    return jsonify({
        "razorpay_order_id": rz_order['id'],
        "amount": int(book.price * 100),
        "currency": "INR",
        "key": RAZORPAY_KEY,
        "book_title": book.title,
        "user_name": current_user.username,
        "user_email": current_user.email,
    })

@app.route('/api/razorpay/verify', methods=['POST'])
@login_required
def verify_razorpay_payment():
    try:
        import razorpay, hmac, hashlib
    except ImportError:
        return jsonify({"error": "Run: pip install razorpay"}), 500
    data        = request.get_json()
    book_id     = data.get('book_id')
    rz_order_id = data.get('razorpay_order_id')
    rz_pay_id   = data.get('razorpay_payment_id')
    rz_sig      = data.get('razorpay_signature')
    RAZORPAY_SECRET = os.environ.get('RAZORPAY_SECRET', 'YOUR_SECRET')
    body     = f"{rz_order_id}|{rz_pay_id}"
    expected = hmac.new(RAZORPAY_SECRET.encode(), body.encode(), hashlib.sha256).hexdigest()
    if expected != rz_sig:
        return jsonify({"error": "Payment verification failed"}), 400
    book = Book.query.get_or_404(book_id)
    if not book.available:
        return jsonify({"error": "Book already sold"}), 400
    settings       = PlatformSettings.query.first()
    commission_pct = settings.commission_rate if settings else 10
    commission     = (book.price * commission_pct) / 100
    net_amount     = book.price - commission
    seller         = User.query.get(book.seller_id)
    if seller:
        seller.wallet_balance += net_amount
        db.session.add(WalletTransaction(
            user_id=seller.id, amount=net_amount, txn_type="credit",
            description=f"Sale of '{book.title}' via Razorpay",
            balance_after=seller.wallet_balance
        ))
    book.available = False
    order = Order(
        buyer_id=current_user.id, seller_id=book.seller_id, book_id=book.id,
        amount=book.price, total_price=book.price,
        commission=commission, net_amount=net_amount,
        payment_provider="razorpay", payment_id=rz_pay_id,
        razorpay_order_id=rz_order_id
    )
    db.session.add(order)
    send_notification(current_user.id, f"Payment confirmed for '{book.title}'! 🎉", "buy")
    send_notification(book.seller_id, f"'{book.title}' sold via Razorpay! ₹{net_amount:.2f} added.", "sell")
    db.session.commit()
    return jsonify({"message": "Payment verified and order placed!"})


# ========================
# REFERRAL SYSTEM
# ========================

@app.route('/api/referral/my_code')
@login_required
def my_referral_code():
    if not current_user.referral_code:
        import uuid
        current_user.referral_code = str(uuid.uuid4())[:8].upper()
        db.session.commit()
    return jsonify({
        "referral_code": current_user.referral_code,
        "referral_link": f"http://localhost:5173/register?ref={current_user.referral_code}"
    })

@app.route('/api/referral/stats')
@login_required
def referral_stats():
    referrals = Referral.query.filter_by(referrer_id=current_user.id).all()
    settings  = PlatformSettings.query.first()
    bonus     = settings.referral_bonus if settings else 50
    return jsonify({
        "total_referrals": len(referrals),
        "bonus_per_referral": bonus,
        "total_earned": len([r for r in referrals if r.bonus_paid]) * bonus,
        "referral_code": current_user.referral_code or ""
    })

@app.route('/api/referral/apply', methods=['POST'])
@login_required
def apply_referral():
    data = request.get_json()
    code = data.get('code', '').strip().upper()
    if not code:
        return jsonify({"error": "No code provided"}), 400
    referrer = User.query.filter_by(referral_code=code).first()
    if not referrer:
        return jsonify({"error": "Invalid referral code"}), 404
    if referrer.id == current_user.id:
        return jsonify({"error": "Cannot use your own code"}), 400
    if Referral.query.filter_by(referred_id=current_user.id).first():
        return jsonify({"error": "You already used a referral code"}), 400
    settings = PlatformSettings.query.first()
    bonus    = settings.referral_bonus if settings else 50
    referrer.wallet_balance     += bonus
    current_user.wallet_balance += bonus
    db.session.add(Referral(referrer_id=referrer.id, referred_id=current_user.id, bonus_paid=True))
    db.session.add(WalletTransaction(user_id=referrer.id, amount=bonus, txn_type="credit",
        description=f"Referral bonus — {current_user.username} joined", balance_after=referrer.wallet_balance))
    db.session.add(WalletTransaction(user_id=current_user.id, amount=bonus, txn_type="credit",
        description="Welcome bonus for using referral code", balance_after=current_user.wallet_balance))
    send_notification(referrer.id, f"🎉 {current_user.username} used your referral! ₹{bonus} added.", "info")
    send_notification(current_user.id, f"Welcome bonus! ₹{bonus} added for referral 🎁", "info")
    db.session.commit()
    return jsonify({"message": f"Referral applied! ₹{bonus} added to your wallet 🎁"})


# ========================
# FEATURED BOOKS
# ========================

@app.route('/api/admin/feature_book/<int:book_id>', methods=['POST'])
@login_required
def feature_book(book_id):
    if not current_user.is_admin:
        return jsonify({"error": "Access Denied"}), 403
    data = request.get_json()
    book = Book.query.get_or_404(book_id)
    book.is_featured = (data.get('action') == 'feature')
    db.session.commit()
    return jsonify({"message": f"Book {'featured' if book.is_featured else 'unfeatured'}"})

@app.route('/api/books/featured')
def featured_books():
    books = Book.query.filter_by(is_featured=True, available=True, is_approved=True)\
        .order_by(Book.created_at.desc()).limit(12).all()
    return jsonify([{
        "id": b.id, "title": b.title, "author": b.author,
        "price": b.price, "image": b.image, "category": b.category,
        "location": b.location or "", "condition": b.condition or ""
    } for b in books])


# ========================
# SELLER ANALYTICS
# ========================

@app.route('/api/seller/analytics')
@login_required
def seller_analytics():
    from datetime import timedelta
    books  = Book.query.filter_by(seller_id=current_user.id).all()
    orders = Order.query.filter_by(seller_id=current_user.id).all()

    book_stats = []
    for b in books:
        views    = BookView.query.filter_by(book_id=b.id).count()
        b_orders = Order.query.filter_by(book_id=b.id).all()
        earnings = sum(o.net_amount for o in b_orders)
        book_stats.append({
            "id": b.id, "title": b.title, "price": b.price,
            "available": b.available, "is_approved": b.is_approved,
            "views": views, "sales": len(b_orders), "earnings": round(earnings, 2),
            "created_at": b.created_at.isoformat() if b.created_at else None
        })

    monthly = []
    today = datetime.utcnow()
    for i in range(5, -1, -1):
        month_start = (today.replace(day=1) - timedelta(days=i*28)).replace(day=1)
        month_end   = (month_start + timedelta(days=32)).replace(day=1)
        month_orders = Order.query.filter(
            Order.seller_id == current_user.id,
            Order.created_at >= month_start,
            Order.created_at < month_end
        ).all()
        monthly.append({
            "month": month_start.strftime("%b"),
            "earnings": round(sum(o.net_amount for o in month_orders), 2),
            "sales": len(month_orders)
        })

    reviews = Review.query.filter_by(reviewed_user_id=current_user.id).all()
    avg_rating = round(sum(r.rating for r in reviews) / len(reviews), 1) if reviews else 0

    return jsonify({
        "total_books":    len(books),
        "total_views":    sum(b["views"] for b in book_stats),
        "total_sales":    len(orders),
        "total_earnings": round(sum(o.net_amount for o in orders), 2),
        "avg_rating":     avg_rating,
        "book_stats":     sorted(book_stats, key=lambda x: x["views"], reverse=True),
        "monthly":        monthly
    })


# ========================
# SELLER STORE PAGE
# ========================

@app.route('/api/seller/<int:seller_id>/store')
def seller_store(seller_id):
    seller = User.query.get_or_404(seller_id)
    if seller.is_banned:
        return jsonify({"error": "Seller unavailable"}), 404

    books   = Book.query.filter_by(seller_id=seller_id, is_approved=True).order_by(Book.created_at.desc()).all()
    reviews = Review.query.filter_by(reviewed_user_id=seller_id).order_by(Review.created_at.desc()).all()
    avg_rating  = round(sum(r.rating for r in reviews) / len(reviews), 1) if reviews else None
    total_sales = Order.query.filter_by(seller_id=seller_id).count()

    return jsonify({
        "seller": {
            "id": seller.id, "username": seller.username,
            "city": seller.city or "", "state": seller.state or "",
            "joined": seller.created_at.isoformat() if seller.created_at else None,
            "avg_rating": avg_rating, "total_reviews": len(reviews),
            "total_sales": total_sales,
            "email_verified": seller.email_verified or False,
        },
        "books": [{
            "id": b.id, "title": b.title, "author": b.author,
            "price": b.price, "image": b.image, "available": b.available,
            "category": b.category, "condition": b.condition or "",
            "location": b.location or "",
            "views": BookView.query.filter_by(book_id=b.id).count()
        } for b in books],
        "reviews": [{
            "rating": r.rating, "comment": r.comment,
            "reviewer": User.query.get(r.reviewer_id).username if User.query.get(r.reviewer_id) else "User",
            "created_at": r.created_at.isoformat()
        } for r in reviews[:5]]
    })


# SOCKET.IO — REAL-TIME CHAT
# ========================

@socketio.on("join_room")
def join(data):
    room  = data["room"]
    users = room.split("_")
    if str(current_user.id) not in users:
        return
    join_room(room)

@socketio.on("leave_room")
def leave(data):
    leave_room(data["room"])

@socketio.on("send_message")
def handle_send_message(data):
    receiver = data["receiver"]
    msg = Message(
        sender_id=current_user.id,
        receiver_id=receiver,
        message=data.get("message"),
        image=data.get("image")
    )
    db.session.add(msg)
    db.session.commit()

    # include_self=False so the SENDER doesn't get a duplicate
    # The sender already has the message shown via optimistic update if needed
    emit("receive_message", {
        "msg_id": msg.id,
        "sender": current_user.id,
        "receiver": receiver,
        "message": msg.message,
        "image": msg.image,
        "timestamp": msg.timestamp.isoformat()
    }, room=data["room"], include_self=False)

    # Also emit back only to sender with the saved msg_id so they have the real DB id
    emit("message_sent", {
        "msg_id": msg.id,
        "timestamp": msg.timestamp.isoformat()
    })

@socketio.on("typing")
def handle_typing(data):
    emit("show_typing", data, room=data["room"], include_self=False)


# ========================
# CREATE TABLES + ADMIN
# ========================

with app.app_context():
    db.create_all()
    admin = User.query.filter_by(email="admin@bookswap.com").first()
    if not admin:
        new_admin = User(
            username="admin",
            email="admin@bookswap.com",
            password=generate_password_hash("admin123"),
            is_admin=True,
            email_verified=True
        )
        db.session.add(new_admin)
        db.session.commit()
        print("Admin account created: admin@bookswap.com / admin123")


# ========================
# RUN
# ========================

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    debug = os.environ.get("RAILWAY_ENVIRONMENT") is None
    socketio.run(app, debug=debug, host="0.0.0.0", port=port)