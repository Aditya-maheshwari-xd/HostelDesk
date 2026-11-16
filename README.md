# HostelDesk – Hostel Complaint and Maintenance Portal

A full-stack web app where hostel students raise complaints (electrical, plumbing, Wi-Fi, etc.) and wardens assign, track and close them. Maintenance staff see only the tasks assigned to them.

**Tech stack:** React (Vite) · Node.js · Express.js · MySQL · JWT · bcrypt · Nodemailer

## Features

- **Login and registration** with JWT tokens and bcrypt-hashed passwords
- **Three role-based dashboards**
  - **Student** – raise a complaint, track its status, comment, delete it while it's still open
  - **Warden** – see all complaints, status summary cards, assign to staff, close or re-open
  - **Staff** – see assigned tasks, mark them *In Progress* or *Resolved* with a note
- **Status filters, category filter and search** (title, description, room number)
- **Full history** for every complaint (who changed what, and when)
- **Email notifications** when a complaint is assigned or its status changes
- **Input validation** on every API, and role checks on the server (not only in the UI)

## Complaint lifecycle

```
open ──(warden assigns)──> assigned ──(staff)──> in_progress ──(staff)──> resolved ──(warden)──> closed
```

## Database (normalized MySQL schema)

| Table | Purpose |
|---|---|
| `users` | students, wardens and staff (`role` column) |
| `categories` | Electrical, Plumbing, Wi-Fi, ... |
| `complaints` | one row per complaint, links student → category → staff |
| `complaint_updates` | history: status changes and comments |

## REST API (12 endpoints)

| # | Method | Endpoint | Who |
|---|---|---|---|
| 1 | POST | `/api/auth/register` | anyone (creates a student) |
| 2 | POST | `/api/auth/login` | anyone |
| 3 | GET | `/api/categories` | logged in |
| 4 | GET | `/api/staff` | warden |
| 5 | POST | `/api/complaints` | student |
| 6 | GET | `/api/complaints?status=&category=&search=` | all (filtered by role) |
| 7 | GET | `/api/complaints/stats` | warden |
| 8 | GET | `/api/complaints/:id` | owner / assigned staff / warden |
| 9 | PUT | `/api/complaints/:id/assign` | warden |
| 10 | PUT | `/api/complaints/:id/status` | staff / warden |
| 11 | POST | `/api/complaints/:id/comments` | owner / assigned staff / warden |
| 12 | DELETE | `/api/complaints/:id` | student (only while open) |

## Run it locally

You need **Node.js 18+** and **MySQL 8** installed.

```bash
# 1. Create the database and tables
mysql -u root -p < database/schema.sql

# 2. Start the backend
cd server
cp .env.example .env      # then put your MySQL password in .env
npm install
npm run seed              # creates demo users
npm start                 # http://localhost:5000

# 3. Start the frontend (in a new terminal)
cd client
npm install
npm run dev               # open http://localhost:5173
```

### Demo accounts (password: `password123`)

| Role | Email |
|---|---|
| Warden | warden@hostel.com |
| Staff | ravi@hostel.com, suresh@hostel.com |
| Student | aman@student.com, priya@student.com |

## Project structure

```
HostelDesk/
├── database/schema.sql          # tables + starting categories
├── server/                      # Node + Express API
│   ├── index.js                 # app setup, mounts routes
│   ├── db.js                    # MySQL connection pool
│   ├── seed.js                  # demo users
│   ├── middleware/auth.js       # JWT check + role check
│   ├── routes/auth.js           # register, login
│   ├── routes/complaints.js     # complaint APIs
│   ├── routes/lookups.js        # categories, staff list
│   └── utils/                   # validation, email
└── client/                      # React app
    └── src/
        ├── App.jsx              # login page or dashboard
        ├── api.js               # fetch wrapper with token
        ├── pages/               # AuthPage, Dashboard
        └── components/          # form, filters, table, detail panel
```
