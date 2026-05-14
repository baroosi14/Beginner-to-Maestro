# 🎵 Beginner to Maestro – Music Learning Platform

A full-stack online music learning platform for teaching music to the general public, especially young learners, through structured lessons, videos, and live sessions.

---

## 🏗️ Architecture

```
beginner-to-maestro/
├── backend/          PHP 8.2 REST API (Apache)
├── frontend/         React.js 18 Web App (Vite + Tailwind CSS)
├── mobile/           React Native Mobile App (Expo)
└── docker-compose.yml
```

---

## ✨ Features

### 👩‍🎓 Students
- Registration with auto-generated Student ID (`BTM-YEAR-XXXX`)
- Secure login via email or Student ID (JWT auth)
- Personal dashboard with progress tracking
- Video lessons with watch-time tracking
- Downloadable resources (PDFs, audio)
- Live class registration and join links
- In-app notifications for classes and payments

### 🎥 Learning Content
- HD video lectures (self-hosted or S3)
- Courses organized into modules and lessons
- Free previews for select lessons
- Downloadable resources per lesson
- Course progress (% complete per course)

### 📡 Live Learning
- Schedule and manage live classes (Zoom, Google Meet, Teams)
- Student registration for live sessions
- Automatic meeting link delivery to registered students
- Recorded session URLs

### 💳 Payments
| Provider | Type |
|----------|------|
| **Paystack** | Cards, Bank Transfer (Africa-focused) |
| **Flutterwave** | Cards, Mobile Money (Africa-focused) |
| **Stripe** | Credit/Debit Cards (Global) |
| **PayPal** | PayPal accounts (Global) |

- Webhook handlers for all 4 providers
- Automatic enrollment on payment confirmation
- Payment history for students

### 🧑‍💼 Admin Panel
- Manage students (activate/deactivate)
- Create/edit/publish courses with modules and lessons
- Schedule and manage live classes
- View all payments and transactions
- Analytics dashboard with charts:
  - Monthly revenue and enrollment trends
  - Revenue by payment provider (pie chart)
  - Top courses by enrollment
  - New student registrations (30 days)

---

## 🚀 Quick Start with Docker

```bash
# 1. Clone and configure
cp .env.example .env
# Edit .env with your credentials

# 2. Start all services
docker compose up -d

# 3. App is now running:
#    Web:  http://localhost:3000
#    API:  http://localhost:8000/api
#    DB:   localhost:3306
```

Default admin account:
- **Email:** `admin@begintomastro.com`
- **Password:** `Admin@123`

---

## 🛠️ Local Development

### Backend (PHP API)

```bash
cd backend
cp .env.example .env   # configure DB + payment keys
mysql -u root -p < database/schema.sql
php -S localhost:8000 index.php
```

### Frontend (React Web)

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev   # http://localhost:3000
```

### Mobile (React Native / Expo)

```bash
cd mobile
npm install
npx expo start
# Press 'a' for Android, 'i' for iOS, 'w' for web
```

---

## 📡 API Reference

All endpoints are prefixed with `/api`.

### Auth
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/register` | No | Register new student |
| POST | `/auth/login` | No | Login (email or student ID) |
| POST | `/auth/logout` | Yes | Invalidate session |
| GET  | `/auth/me` | Yes | Get current user |

### Courses
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET  | `/courses` | No | List courses (filterable) |
| GET  | `/courses/:slug` | No | Course details + curriculum |
| POST | `/courses/:slug/enroll` | Yes | Enroll in course |

### Payments
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/payments/initiate` | Yes | Initiate payment (any provider) |
| POST | `/payments/verify` | Yes | Verify payment |
| GET  | `/payments/history` | Yes | Payment history |
| GET  | `/plans` | No | Subscription plans |

### Live Classes
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET  | `/live-classes` | No | List classes |
| GET  | `/live-classes/:id` | No | Class details |
| POST | `/live-classes/:id/register` | Yes | Register for class |

### Admin (requires admin role)
| Endpoint | Description |
|----------|-------------|
| `GET /admin/students` | List students (paginated, searchable) |
| `PATCH /admin/students/:id` | Update student |
| `GET/POST/PUT/DELETE /admin/courses` | Course CRUD |
| `POST/PUT/DELETE /admin/modules` | Module management |
| `POST/PUT/DELETE /admin/lessons` | Lesson management |
| `GET /admin/payments` | All payments |
| `GET/POST/PUT/DELETE /admin/live-classes` | Live class management |
| `GET /admin/analytics` | Platform analytics |
| `POST /admin/media/upload` | File upload |

---

## 🗄️ Database Schema

Key tables:
- `users` – Students and admins (with auto-generated `student_id`)
- `courses` – Course catalog with pricing
- `modules` – Course sections
- `lessons` – Individual lessons (video, PDF, audio)
- `enrollments` – Student to Course relationships
- `lesson_progress` – Watch time and completion tracking
- `payments` – All transactions
- `subscription_plans` / `subscriptions` – Subscription system
- `live_classes` – Scheduled sessions
- `live_class_registrations` – Student to Live class
- `notifications` – In-app notifications
- `media` – Uploaded file metadata

---

## ☁️ Production Deployment

### Payment Webhook URLs
Register these in each payment provider's dashboard:
```
POST https://api.yourdomain.com/api/payments/webhook/paystack
POST https://api.yourdomain.com/api/payments/webhook/flutterwave
POST https://api.yourdomain.com/api/payments/webhook/stripe
POST https://api.yourdomain.com/api/payments/webhook/paypal
```

### Environment Variables
See `.env.example` for the complete list. Key variables:
- `JWT_SECRET` – Long random string (64+ chars)
- `DB_*` – MySQL credentials
- `PAYSTACK_SECRET_KEY`, `FLUTTERWAVE_SECRET_KEY`, `STRIPE_SECRET_KEY`, `PAYPAL_CLIENT_*`
- `AWS_*` – Only needed when `STORAGE_DRIVER=s3`

---

## 🔮 Future Enhancements
- Certificates of completion (PDF generation)
- Quiz and assignment system
- AI-based learning recommendations
- Community / chat feature
- Zoom API integration (auto-create meetings)
- Push notifications (FCM for mobile)
- Progress leaderboard

---

## 📄 License
MIT License – © 2025 Beginner to Maestro
