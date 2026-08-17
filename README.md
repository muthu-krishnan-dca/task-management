# 🎯 AbleSpace — Enterprise Task Management System

A full-stack, responsive Task Management application built with **Next.js**, **TypeScript**, **Tailwind CSS**, **NestJS**, **MongoDB**, and **Mongoose**. AbleSpace provides task management, authentication, calendar scheduling, notifications, profiles, workspace settings, analytics, admin management, and CSV/Excel export.

---

## 🚀 Features

### 👤 User Features

#### Authentication
- User registration and login
- Logout/session handling
- Protected user/admin areas
- Role-based access

#### Dashboard
- Total task count
- In-progress tasks
- Completed tasks
- Overdue task summary
- My Tasks overview

#### Task Management
- Create tasks
- Edit tasks
- Delete tasks
- Duplicate tasks
- Change task status
- Priority management
- Project information
- Due date and time
- Estimated duration
- Task description

#### Search & Filtering
- Search by task information
- Filter by status
- Filter by priority
- Filter overdue tasks
- Field visibility controls

#### Calendar
- Monthly calendar view
- View scheduled task dates
- Navigate between months
- Create tasks with due dates

#### Notifications
- Task update notifications
- Overdue alerts
- Deadline alerts
- Mark notifications as read
- Clear notifications

#### Profile
- View profile information
- Edit profile
- Upload profile photo
- View account role

#### Workspace Settings
- Light/Dark/System theme
- Account preferences
- Notification preferences
- Default task preferences

#### 📤 Task Export
- Export currently filtered tasks as CSV
- Export tasks as Excel
- Export task details such as title, description, status, priority, project, assignee, due date, and duration

---

### 👑 Admin Features

- Admin authentication
- Admin dashboard
- User management
- Task management
- Notifications
- Calendar
- Advanced analytics
- Workspace/system settings
- Global task defaults
- System announcement banner
- Add new users
- Add and manage tasks
- Admin-only management controls

---

### 📱 Responsive Design

The application is designed for:
- Desktop
- Tablet
- Mobile

---

## 🛠️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend Framework** | Next.js 16.3.0 (App Router) |
| **Frontend Language** | TypeScript |
| **UI / Styling** | Tailwind CSS & CSS |
| **Backend Framework** | NestJS v11 |
| **Backend Language** | TypeScript |
| **Database** | MongoDB |
| **ODM** | Mongoose |
| **Validation** | class-validator & class-transformer |
| **API** | REST API |
| **Version Control** | Git & GitHub |
| **Excel Export** | XLSX |
| **Development Tools** | VS Code / Antigravity IDE |

---

## 📁 Project Structure

```
task-management/
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── admin/
│   │   │   │   ├── dashboard/
│   │   │   │   └── login/
│   │   │   ├── Dashboard/
│   │   │   ├── calendar/
│   │   │   ├── login/
│   │   │   ├── notifications/
│   │   │   ├── profile/
│   │   │   ├── register/
│   │   │   ├── settings/
│   │   │   ├── tasks/
│   │   │   └── user/
│   │   │       └── dashboard/
│   │   ├── components/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── TaskList.tsx
│   │   │   ├── TaskFormModal.tsx
│   │   │   ├── CalendarView.tsx
│   │   │   ├── NotificationsView.tsx
│   │   │   ├── ProfileView.tsx
│   │   │   └── ...
│   │   └── types/
│   └── package.json
│
├── backend/
│   ├── src/
│   │   ├── tasks/
│   │   ├── users/
│   │   ├── auth/
│   │   ├── app.module.ts
│   │   └── main.ts
│   └── package.json
│
├── compass-connections/
├── .gitignore
└── README.md
```

---

## 🚦 Getting Started

### Prerequisites
- Node.js 18 or later
- npm
- MongoDB / MongoDB Atlas
- Git

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

> Make sure the backend environment variables are configured for the MongoDB connection and authentication settings.

---

### 3️⃣ Frontend Setup

Open a new terminal:

```bash
cd frontend
npm install
npm run dev
```

Then open the local frontend URL shown by Next.js (`http://localhost:3000`).

---

## 🧪 Production Build

Before deployment, run:

```bash
cd frontend
npm run build
```

The production build should complete successfully before deployment.

---

## 📡 REST API

The backend exposes REST APIs for authentication, users, and task management.

### Task API

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/tasks` | Retrieve tasks |
| `GET` | `/tasks/:id` | Retrieve one task |
| `POST` | `/tasks` | Create a task |
| `PATCH` | `/tasks/:id` | Update a task |
| `DELETE` | `/tasks/:id` | Delete a task |

#### Typical Task Operations

```json
{
  "title": "Build Documentation",
  "description": "Create project documentation",
  "status": "IN_PROGRESS",
  "priority": "HIGH",
  "dueDate": "2026-08-15"
}
```

---

## 🔐 Authentication & Authorization

The application separates normal user and administrator functionality.

### 👤 User
Users can:
- Manage their tasks
- View dashboard information
- Use the calendar
- View notifications
- Manage their profile
- Configure personal settings
- Export tasks

### 👑 Admin
Administrators can additionally:
- Manage users
- Manage system tasks
- View analytics
- Configure global workspace settings
- Manage system announcements

---

## 📊 Analytics

The admin analytics area provides a high-level view of:
- Total system throughput
- Active user ratio
- Overdue risk
- User workload distribution
- Task completion progress

---

## 📤 Export Tasks

Users can export task information from the task management interface.

- **CSV**: `ablespace-tasks-YYYY-MM-DD.csv`
- **Excel**: `ablespace-tasks-YYYY-MM-DD.xlsx`

The export uses the tasks currently available after the active search/filter conditions.

---

## 📱 Responsive Testing

The application should be tested at:
- **Mobile**: approximately 360–430px
- **Tablet**: approximately 768px
- **Desktop**: 1280px and above

### Important screens:
- Dashboard
- Tasks
- Calendar
- Notifications
- Profile
- Settings
- Admin Dashboard
- Admin Users
- Admin Analytics

---

## 🧹 Final Quality Checklist

- [x] Authentication
- [x] User Dashboard
- [x] Admin Dashboard
- [x] Task CRUD
- [x] Task Edit
- [x] Task Delete
- [x] Task Duplicate
- [x] Search
- [x] Filters
- [x] Calendar
- [x] Notifications
- [x] Profile
- [x] Settings
- [x] Analytics
- [x] CSV Export
- [x] Excel Export
- [x] Responsive UI
- [x] TypeScript production build
- [x] GitHub push

---

## 🌿 Git Workflow

```bash
git status
git add .
git commit -m "Update AbleSpace documentation"
git push
```

**Repository**:
[https://github.com/muthu-krishnan-dca/task-management](https://github.com/muthu-krishnan-dca/task-management)

---

## 📄 License

This project is licensed under the **MIT License**.
