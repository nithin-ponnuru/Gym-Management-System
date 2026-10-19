# 🏋️ FitPro — Gym Management System

A full-stack, production-quality **MERN** (MongoDB, Express, React, Node.js) web application for managing gym operations professionally.

![Tech Stack](https://img.shields.io/badge/MongoDB-47A248?style=flat&logo=mongodb&logoColor=white)
![Tech Stack](https://img.shields.io/badge/Express.js-000000?style=flat&logo=express&logoColor=white)
![Tech Stack](https://img.shields.io/badge/React-61DAFB?style=flat&logo=react&logoColor=black)
![Tech Stack](https://img.shields.io/badge/Node.js-339933?style=flat&logo=nodedotjs&logoColor=white)
![Tech Stack](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white)

---

## ✨ Features

| Module | Features |
|--------|----------|
| **Dashboard** | Real-time stats, MongoDB aggregation charts, recent activity |
| **Members** | Full CRUD, search, filter by trainer/status, pagination |
| **Trainers** | Card layout, specialization, member count, full CRUD |
| **Memberships** | Plan cards with gradient, assign to member, payment tracking |
| **Workout Plans** | Dynamic exercise builder, expandable cards, filter by goal |
| **Attendance** | Mark attendance, duplicate prevention, date filtering |
| **AI Assistant** | Chat UI powered by OpenRouter (key stays server-side only) |

---

## 🚀 Quick Start

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)

### 1. Clone & Install

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 2. Configure Environment

Edit `server/.env`:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/GymManagementDB
OPENROUTER_API_KEY=your_openrouter_api_key_here
```

> **For MongoDB Atlas**, replace `MONGODB_URI` with your Atlas connection string.

### 3. Seed Sample Data

```bash
cd server
node seed.js
```

This inserts:
- 5 Trainers
- 15 Members (13 Active, 2 Inactive)
- 4 Membership Plans (Basic, Standard, Premium, Gold)
- 15 Member Memberships (spread over 6 months for chart data)
- 5 Workout Plans with full exercise lists
- 35+ days of attendance records

### 4. Start the Application

**Terminal 1 — Backend:**
```bash
cd server
npm start
# Server runs on http://localhost:5000
```

**Terminal 2 — Frontend:**
```bash
cd client
npm run dev
# App runs on http://localhost:5173
```

Open **http://localhost:5173** in your browser.

---

## 📁 Project Structure

```
GYM-MANAGEMENT-SYSTEM/
├── client/                     # React + Vite frontend
│   └── src/
│       ├── components/
│       │   ├── layout/         # Sidebar, Navbar, MainLayout
│       │   ├── common/         # Modal, Toast, Loader, etc.
│       │   └── dashboard/      # StatCard, RevenueChart, AttendanceChart
│       ├── pages/              # Dashboard, Members, Trainers, etc.
│       └── services/api.js     # Centralized Axios API client
│
└── server/                     # Express.js backend
    ├── config/db.js            # MongoDB connection
    ├── models/                 # Mongoose schemas
    ├── controllers/            # Business logic
    ├── routes/                 # API routes
    ├── middleware/             # Error handling, validation
    ├── seed.js                 # Sample data seeder
    └── server.js               # App entry point
```

---

## 🔌 API Endpoints

| Resource | Endpoint |
|----------|----------|
| Members | `GET/POST /api/members` |
| Member | `GET/PUT/DELETE /api/members/:id` |
| Trainers | `GET/POST /api/trainers` |
| Memberships | `GET/POST /api/memberships` |
| Member Memberships | `GET/POST /api/member-memberships` |
| Workouts | `GET/POST /api/workouts` |
| Attendance | `GET/POST /api/attendance` |
| Dashboard Stats | `GET /api/dashboard/stats` |
| Monthly Revenue | `GET /api/dashboard/monthly-revenue` |
| Revenue by Plan | `GET /api/dashboard/revenue-by-plan` |
| Members per Trainer | `GET /api/dashboard/members-per-trainer` |
| Daily Attendance | `GET /api/dashboard/daily-attendance` |
| AI Chat | `POST /api/ai/chat` |

---

## 🤖 AI Assistant Setup

1. Get a free API key from [OpenRouter.ai](https://openrouter.ai)
2. Add it to `server/.env`:
   ```env
   OPENROUTER_API_KEY=sk-or-your-key-here
   ```
3. The key **never** reaches the browser — all AI requests go through the Express backend

---

## 🗄️ Database

- **Database name:** `GymManagementDB`
- View data with [MongoDB Compass](https://www.mongodb.com/products/compass) using the same `MONGODB_URI`
- Collections: `members`, `trainers`, `memberships`, `membermemberships`, `workoutplans`, `attendances`

---

## 🛠️ Tech Stack

**Frontend:** React 18, Vite, Tailwind CSS v4, React Router v6, Recharts, Lucide React, Axios

**Backend:** Node.js, Express.js, Mongoose, dotenv, cors

**Database:** MongoDB (local or Atlas)

**AI:** OpenRouter API (server-side proxy)
