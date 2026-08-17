# 🚀 AbleSpace – Task Management System

---

## 📌 Project Overview
**AbleSpace** is an enterprise-grade, full-stack Task Management workspace designed to streamline collaboration, task scheduling, and administrative governance. Built with modern web architecture (**Next.js 16**, **Tailwind CSS**, and **NestJS with MongoDB**), AbleSpace offers high visual polish, lightning-fast interactivity, real-time alert dispatching, and comprehensive role-based access control.

---

## ✨ Features

- **User Authentication**: Secure user registration, validation, credential verification, and persistent session state.
- **Admin Authentication**: Dedicated administrative portal with guarded routing and elevated super-admin privileges.
- **Task CRUD**: Create, view, edit, duplicate, assign, and delete tasks with instant status transitions.
- **Search & Filter**: Real-time multi-parameter filtering across keywords, status (`TODO`, `IN_PROGRESS`, `COMPLETED`, `ON_HOLD`), priority (`HIGH`, `MEDIUM`, `LOW`), and project names.
- **Calendar**: Interactive monthly/weekly visual scheduling linked with task deadlines and priorities.
- **Notifications**: Real-time notification hub with Web Audio synthesized chime, browser OS push alerts, and global floating toasts.
- **Profile**: Personal user management with profile editing, avatar customization, and password updates.
- **Settings**: 4-Tier governance covering Global Workspace Policies, Notification Preferences, Security & Access Rules, and Data Management.
- **Analytics**: Live, 100% data-driven metrics including Total System Throughput, Active User Ratio, Overdue Risk Index, Status Breakdown, and Weekly Velocity Trend.
- **User Management**: Administrative user directory with search, role switching (`User ↔ Admin`), status toggling (`Active ↔ Inactive`), permanent deletion, and self-protection safeguards.
- **CSV / Excel Export**: Instant client-side export of currently filtered tasks to `.csv` and `.xlsx` spreadsheets.
- **Responsive UI**: Pixel-perfect responsive design tailored for Desktop, Tablet, and Mobile devices with Dark/Light theme support.

---

## 🛠️ Technologies Used

| Category | Technology |
| :--- | :--- |
| **Frontend Framework** | Next.js 16 (App Router, Turbopack) & React 19 |
| **Language** | TypeScript |
| **Styling & Icons** | Tailwind CSS & Vanilla CSS |
| **Spreadsheet Engine** | `xlsx` |
| **Backend Framework** | NestJS v11 (Node.js) |
| **Database & ODM** | MongoDB & Mongoose |
| **Validation Layer** | `class-validator` & `class-transformer` |
| **Audio Engine** | Native Web Audio API (Chime synthesizer) |
| **Architecture Pattern** | Modular RESTful Architecture |

---

## 👥 User Roles

### 1. 👑 Administrator (`Admin`)
- Full workspace governance.
- Manage all team tasks, assign responsibility, and edit deadlines.
- User management: create users, switch roles, activate/deactivate accounts, and delete records.
- System announcement broadcasts and global workspace policies.
- Deep-dive into live analytical performance dashboards and security audit logs.
- *Protected*: Cannot delete, demote, or deactivate their own active admin session account.

### 2. 👤 Standard User (`User` / `Guest`)
- Access to personal dashboard (`/Dashboard`) and task board (`/tasks`).
- Create and organize personal/project tasks.
- Deadline tracking via interactive Calendar (`/calendar`).
- Receive real-time updates and broadcast alerts (`/notifications`).
- Update personal profile details and theme preferences (`/profile`, `/settings`).
- *Restricted*: Strict denial of access to `/admin/*` routes.

---

## 📁 Project Architecture

```
task-management/
├── frontend/                     # Next.js App Router Client Application
│   ├── src/
│   │   ├── app/
│   │   │   ├── admin/
│   │   │   │   ├── dashboard/    # Admin Supercenter (7 Integrated Modules)
│   │   │   │   └── login/        # Dedicated Admin Login Portal
│   │   │   ├── calendar/         # Visual Calendar View
│   │   │   ├── Dashboard/        # User Workspace & KPI Dashboard
│   │   │   ├── login/            # User Authentication Portal
│   │   │   ├── notifications/    # Notifications Hub
│   │   │   ├── profile/          # User Profile Settings
│   │   │   ├── register/         # User Registration Page
│   │   │   ├── settings/         # Workspace Settings & Preferences
│   │   │   ├── tasks/            # Interactive Task Board (Kanban & Table)
│   │   │   └── layout.tsx        # Root Layout with Theme & Real-time Toaster
│   │   ├── components/           # Reusable UI Components (Header, Sidebar, Modals, Toaster)
│   │   ├── types/                # TypeScript Type Definitions (Task, User, Notification)
│   │   └── utils/                # AuthStore, ExportUtils, NotificationStore, SettingsStore
│   ├── package.json
│   └── tailwind.config.ts
│
├── backend/                      # NestJS REST API Server
│   ├── src/
│   │   ├── auth/                 # Auth Controller, Service, and MongoDB User Schema
│   │   ├── tasks/                # Tasks Controller, Service, DTOs, and Task Schema
│   │   ├── app.module.ts         # Root Application Module & MongoDB Connection
│   │   └── main.ts               # NestJS Bootstrap with Global ValidationPipes & CORS
│   └── package.json
│
├── compass-connections/          # Database Connection Profiles & Configuration
└── README.md                     # Comprehensive Project Documentation
```

---

## ⚙️ Installation & Setup

### Prerequisites
- **Node.js** (v18.x or higher)
- **npm** (v9.x or higher)
- **MongoDB** (Local instance running at `mongodb://localhost:27017` or MongoDB Atlas URI)

---

## 🔐 Authentication Flow

1. **Registration (`/register`)**:
   - User inputs Name, Email, Password, and Confirm Password.
   - Enforces password strength, field validation, and duplicate email prevention.
   - Defaults new sign-ups to the `User` role.

2. **Login (`/login`, `/admin/login`)**:
   - Matches credentials via backend `/auth/login` endpoint.
   - On success, generates session token and redirects based on role:
     - **Admin** ➔ `/admin/dashboard`
     - **User** ➔ `/Dashboard`

3. **Session Persistence & Route Guards (`<ProtectedRoute>`)**:
   - Session state is securely maintained across browser reloads (`F5`).
   - Unauthenticated visitors attempting to view protected pages are redirected to `/login`.
   - Regular users attempting to view `/admin/*` are denied access and redirected to `/Dashboard`.

4. **Logout**:
   - Purges local session tokens and redirects to `/login`.
   - Prevents browser back-button access to cached protected views.

---

## 📋 Task Management

- **Lifecycle States**: `TODO` ➔ `IN_PROGRESS` ➔ `COMPLETED` (or `ON_HOLD`).
- **Priority Matrix**: `HIGH` (Red), `MEDIUM` (Amber), `LOW` (Green).
- **Metadata Fields**: Title, Description, Status, Priority, Project, Assignee, Due Date, Due Time, and Estimated Time.
- **Dynamic Field Visibility**: Click `⚙️ Fields` in the toolbar to toggle visible table columns.
- **Task Duplication**: One-click duplication to rapidly clone task templates.

---

## 📅 Calendar

- Month-based visual timeline displaying scheduled task cards by due date.
- Color-coded priority indicators and status badges.
- Quick navigation across past and future months.
- Direct click on any date card to view or create a new task.

---

## 🔔 Notifications

- **🔊 Audio Engine**: Soft, pleasant 2-tone chime synthesized via browser Web Audio API.
- **🔔 Desktop Push Alerts**: OS-level native notifications when browser permissions are granted.
- **✨ Global Live Toasters**: Top-right animated floating notification cards with progress-bar auto-dismiss timers.
- **Action Triggers**: Instant alerts on task creation, assignment, completion, overdue deadlines, and admin announcements.

---

## 📊 Analytics

Real-time calculation engine with visible mathematical formulas:
- **Total System Throughput**: `(Completed Tasks ÷ Total Tasks) × 100`
- **Active User Ratio**: `(Active Users ÷ Total Users) × 100`
- **Overdue Risk Index**: `(Overdue Tasks ÷ Total Tasks) × 100`
- **Task Status Distribution**: Visual proportional breakdown bar (To Do, In Progress, Completed, On Hold).
- **Weekly Completion Trend**: Mon → Sun velocity chart.

---

## 📤 Export CSV / Excel

- Click the `[ 📤 Export ]` button in the header toolbar to trigger:
  - 📄 **Export as CSV** (`.csv` format with UTF-8 BOM encoding for Excel compatibility).
  - 📊 **Export as Excel** (`.xlsx` formatted spreadsheet with optimized column widths).
- **Filter Respecting**: Exports only the currently filtered subset of tasks (`filteredTasks`).
- **Empty Guard**: Prevents downloading empty files if no tasks match the filter criteria.

---

## 📱 Responsive Design

- **Desktop (>= 1024px)**: Full sidebar navigation, rich KPI grids, expanded search & filter toolbars.
- **Tablet (768px - 1023px)**: Adaptive grid layouts and collapsable control panels.
- **Mobile (< 768px)**: Slide-out hamburger navigation drawer, stacked action sub-bar, touch-friendly touch targets, and overflow-protected dropdowns.

---

## 🔗 API Endpoints

### 🔐 Authentication (`/auth`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/auth/register` | Register a new user |
| `POST` | `/auth/login` | Authenticate user credentials & return session |
| `GET` | `/auth/users` | Retrieve all registered users |
| `PATCH` | `/auth/users/:id` | Update user details, role, or status |
| `DELETE` | `/auth/users/:id` | Permanently delete user from database |

### 📋 Tasks (`/tasks`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/tasks` | List all tasks with search & filter params |
| `POST` | `/tasks` | Create a new task (DTO validated) |
| `GET` | `/tasks/:id` | Fetch task details by ID |
| `PUT` | `/tasks/:id` | Update task details, status, or assignee |
| `DELETE` | `/tasks/:id` | Delete task from database |

---

## ▶️ How to Run

### Default Credentials
| Role | Email | Password | Landing Page |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@ablespace.io` | `admin` | `/admin/dashboard` |
| **User** | `user@ablespace.io` | `user` | `/Dashboard` |
| **Guest** | Instant 1-Click Guest Login | — | `/Dashboard` |

### 1. Start Backend API
```bash
cd backend
npm install
npm run start:dev
```
> Server runs on: **`http://localhost:3001`**

### 2. Start Frontend Application
```bash
cd frontend
npm install
npm run dev
```
> Web Application runs on: **`http://localhost:3000`**

---

## 🚀 Deployment

- **Frontend**: Deployable to **Vercel** / **Netlify** (Set `NEXT_PUBLIC_BACKEND_URL` environment variable).
- **Backend**: Deployable to **Render** / **Railway** / **AWS ECS** (Configure `MONGODB_URI` and `PORT`).
- **Database**: **MongoDB Atlas** cloud cluster with automated backups and connection pooling.

---

## 📄 License

This project is licensed under the **MIT License**.
