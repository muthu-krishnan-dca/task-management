# 🚀 AbleSpace — Enterprise Task Management System

A high-performance, full-stack, enterprise-ready Task Management Workspace built with **Next.js 16 (Turbopack)**, **Tailwind CSS**, and **NestJS (TypeScript)** backed by **MongoDB & Mongoose**.

---

## 🌟 Key Features

### 1. 👥 Complete Authentication & Role-Based Access Control (RBAC)
- **User Registration (`/register`)**: Full name, email, password strength check, confirm password matching, and duplicate email prevention.
- **Role-Based Redirects (`/login`, `/admin/login`)**:
  - `Admin` ➔ `/admin/dashboard`
  - `User` ➔ `/Dashboard`
- **Session Persistence**: Stays logged in across browser refreshes (`F5`), maintaining user state, role, and avatar.
- **Route Guard Protection (`<ProtectedRoute>`)**: Unauthenticated requests to `/Dashboard`, `/tasks`, `/calendar`, `/notifications`, `/profile`, or `/settings` bounce directly to `/login`.
- **Admin Security Guard**: Normal users attempting to access `/admin/*` are automatically denied access and safely routed to `/Dashboard`.
- **Clean Logout Lifecycle**: Session data is purged on logout, preventing unauthorized back-button browser history access.

---

### 2. 👑 Admin Command Center (`/admin/dashboard`)
- **7 Integrated Management Modules**:
  1. **Overview Dashboard**: High-level KPI metrics (Total Tasks, Active Users, System Completion Velocity).
  2. **Task Master Management**: Global view of all workspace tasks with filter, assign, edit, and status controls.
  3. **Users Management**: User directory with search, role toggle (`User ↔ Admin`), status toggle (`Active ↔ Inactive`), permanent user deletion, and self-account deletion protection.
  4. **Live Data-Driven Analytics**:
     - *Total System Throughput*: `(Completed ÷ Total Tasks) × 100`
     - *Active User Ratio*: `(Active ÷ Total Users) × 100`
     - *Overdue Risk Index*: `(Overdue ÷ Total Tasks) × 100`
     - *Task Status Distribution Chart* (To Do, In Progress, Completed, On Hold).
     - *Weekly Velocity Bar Chart* (Mon → Sun).
  5. **Broadcast Announcement Center**: Send global alerts to All Users or Admins.
  6. **4-Tier Settings Suite**: Global Workspace Policies, Notification Preferences, Security & Access Rules, and Data Management (with confirmation modal for resets).
  7. **Security & Audit Logs**: Real-time event log tracking system actions.

---

### 3. 📋 User Workspace & Task Board (`/Dashboard`, `/tasks`, `/calendar`)
- **Interactive Kanban & Table Views**: Filter by status (`TODO`, `IN_PROGRESS`, `COMPLETED`, `ON_HOLD`) and priority (`HIGH`, `MEDIUM`, `LOW`).
- **Dynamic Field Visibility (`⚙️ Fields`)**: Customize visible table columns (Assignee, Due Date, Due Time, Estimated Time, Project, Labels).
- **Calendar View (`/calendar`)**: Interactive date-based view of upcoming milestones and deadlines.
- **Real-Time Search & Multi-Filters**: Instant keyword filtering by Title, Description, Priority, and Project.

---

### 4. 🔔 Real-Time Notification Engine
- **🔊 Web Audio Synthesized Chime**: Pleasant 2-tone audio chime (D5 → A5) synthesized via native browser Web Audio API when alerts trigger.
- **🔔 Native Browser Desktop Push Notifications**: Integrates with native `window.Notification` API for OS-level alerts.
- **✨ Global Live Toaster Alerts (`<RealtimeNotificationToaster />`)**: Animated floating cards at top-right with progress bar timers and instant click-to-read actions.
- **Instant Event Triggers**: Task Created, Status Changed, Task Completed, Task Assigned, and Admin Broadcast Announcements.

---

### 5. 📤 Dynamic Task Export Engine (CSV & Excel)
- **Header Export Button**: `[ 📤 Export ]` dropdown in Desktop and Mobile toolbars.
- **Supports Multiple Formats**:
  - 📄 **Export as CSV** (`.csv` with UTF-8 BOM encoding for seamless Excel opening).
  - 📊 **Export as Excel** (`.xlsx` formatted workbook via `xlsx` library).
- **Filter-Respecting (`filteredTasks`)**: Exports currently visible tasks matching active search queries and filters.
- **11 Formatted Metadata Columns**: `Task ID`, `Title`, `Description`, `Status`, `Priority`, `Project`, `Assignee`, `Due Date`, `Due Time`, `Estimated Time`, `Created At`.
- **Empty Guard**: Prevents empty file downloads when 0 tasks match current criteria.

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend Framework** | Next.js 16.3 (App Router, Turbopack) |
| **Frontend UI & Styling** | Tailwind CSS, Vanilla CSS, Lucide Icons |
| **Spreadsheet Engine** | `xlsx` |
| **Backend Framework** | NestJS v11 (TypeScript) |
| **Database & ODM** | MongoDB & Mongoose |
| **Validation** | `class-validator` & `class-transformer` |
| **Audio Engine** | Web Audio API (Synthesizer Chime) |

---

## 🔑 Default Credentials

| Role | Email | Password | Landing Page |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@ablespace.io` | `admin` | `/admin/dashboard` |
| **Standard User** | `user@ablespace.io` | `user` | `/Dashboard` |
| **Guest Evaluator** | Instant 1-Click Guest Access | — | `/Dashboard` |

---

## 📁 Repository Structure

```
task-management/
├── frontend/                     # Next.js 16 Client
│   ├── src/
│   │   ├── app/
│   │   │   ├── admin/
│   │   │   │   ├── dashboard/    # Admin Command Center (7 Modules)
│   │   │   │   └── login/        # Admin Authentication
│   │   │   ├── calendar/         # Workspace Calendar View
│   │   │   ├── Dashboard/        # User Workspace Dashboard
│   │   │   ├── login/            # User Login Portal
│   │   │   ├── notifications/    # Notifications Hub
│   │   │   ├── profile/          # Profile & Password Settings
│   │   │   ├── register/         # User Registration
│   │   │   ├── settings/         # Workspace Appearance Settings
│   │   │   ├── tasks/            # Task Board & Management
│   │   │   └── layout.tsx        # Root layout with Realtime Toaster & Theme
│   │   ├── components/           # UI Components (Header, Sidebar, Modals, Toaster)
│   │   ├── types/                # TypeScript Interfaces (Task, User, Notification)
│   │   └── utils/                # AuthStore, ExportUtils, NotificationStore, SettingsStore
│   └── package.json
│
├── backend/                      # NestJS REST API Server
│   ├── src/
│   │   ├── auth/                 # Auth Service, Controller & MongoDB User Schema
│   │   ├── tasks/                # Tasks CRUD Service, Controller & DTOs
│   │   ├── app.module.ts         # Root AppModule & Mongoose Connection
│   │   └── main.ts               # NestJS Bootstrap with ValidationPipes & CORS
│   └── package.json
│
└── README.md                     # Documentation
```

---

## 🚦 Local Development Setup

### Prerequisites
- **Node.js** (v18.x or later)
- **npm** (v9.x or later)
- **MongoDB** (Local instance running at `mongodb://localhost:27017` or Atlas URI)

---

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/muthu-krishnan-dca/task-management.git
cd task-management
```

---

### 2️⃣ Backend Setup
```bash
cd backend
npm install
npm run start:dev
```
> The NestJS API server will run at: **`http://localhost:3001`**

---

### 3️⃣ Frontend Setup
In a separate terminal window:
```bash
cd frontend
npm install
npm run dev
```
> The Next.js web application will run at: **`http://localhost:3000`**

---

## 📡 REST API Reference

### 🔐 Authentication (`/auth`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/auth/register` | Register a new user account |
| `POST` | `/auth/login` | Authenticate user credentials & issue session |
| `GET` | `/auth/users` | List all registered users (Admin) |
| `PATCH` | `/auth/users/:id` | Update user details, status, or role |
| `DELETE` | `/auth/users/:id` | Permanently delete user from MongoDB |

---

### 📋 Task Management (`/tasks`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/tasks` | Retrieve all tasks with status/priority filtering |
| `POST` | `/tasks` | Create a new task with DTO validation |
| `GET` | `/tasks/:id` | Retrieve single task details |
| `PUT` | `/tasks/:id` | Update task details, status, or assignment |
| `DELETE` | `/tasks/:id` | Delete task from database |

---

## 📝 License
This project is licensed under the MIT License.
