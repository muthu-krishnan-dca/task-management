# 🎯 Task Management System - Technical Assessment

A full-stack, responsive Task Management application built with **Next.js 14**, **Tailwind CSS**, and **NestJS**. Designed with a focus on UI fidelity, dark/light theme persistence, guest authentication, DTO validation, and clean architecture.

---

## 🚀 Features

### 🎨 Frontend (Next.js & Tailwind CSS)
- **Design Fidelity**: Modern, clean UI inspired by high-standard dashboard guidelines with responsive layouts for Desktop, Tablet, and Mobile devices.
- **Theme Persistence**: Dark / Light theme toggle with state persisted across page reloads via `localStorage`.
- **Guest Authentication**: Instant guest login workflow requiring no credentials for frictionless onboarding.
- **Dynamic Task Board**:
  - Filter tasks by status (`TODO`, `IN_PROGRESS`, `COMPLETED`).
  - Search tasks by title or description in real-time.
  - Priority indicators (`HIGH`, `MEDIUM`, `LOW`).
  - Interactive modals for Task Creation, Editing, and Deletion confirmation.

### ⚡ Backend (NestJS & TypeScript)
- **RESTful Endpoints**: Full CRUD endpoints for managing tasks (`GET`, `POST`, `PATCH`, `DELETE`).
- **Validation**: Strict DTO validation powered by `class-validator` and `class-transformer` via global `ValidationPipe`.
- **MongoDB & Mongoose Integration**: Full NoSQL database document persistence layer with Schema definitions, auto-seeding on initial startup, and regex search/filters.
- **CORS Enabled**: Configured for cross-origin integration with frontend client applications.

---

## 🛠️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend Framework** | Next.js 14 (App Router) |
| **Styling** | Tailwind CSS & Vanilla CSS |
| **Language** | TypeScript |
| **Backend Framework** | NestJS v11 |
| **Database & ODM** | **MongoDB Database** & **Mongoose** |
| **Validation** | `class-validator` & `class-transformer` |

---

## 📁 Project Structure

```
task-management/
├── frontend/                 # Next.js App Router Client
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx    # Root layout & Theme provider setup
│   │   │   ├── page.tsx      # Main Task Management Dashboard UI
│   │   │   └── globals.css   # Tailwind & custom CSS utility styles
│   ├── package.json
│   └── tailwind.config.ts
│
├── backend/                  # NestJS REST API Server
│   ├── src/
│   │   ├── tasks/
│   │   │   ├── dto/
│   │   │   │   ├── create-task.dto.ts  # Validation DTO for creation
│   │   │   │   └── update-task.dto.ts  # Validation DTO for update
│   │   │   ├── tasks.controller.ts     # REST endpoints controller
│   │   │   ├── tasks.service.ts        # Business logic & persistence
│   │   │   └── tasks.module.ts         # Tasks feature module
│   │   ├── app.module.ts
│   │   └── main.ts                     # NestJS bootstrap & global pipes
│   ├── data/
│   │   └── tasks.json                  # Persistent data storage
│   └── package.json
│
└── README.md                           # Project Documentation
```

---

## 🚦 Getting Started

### Prerequisites
- Node.js (v18.x or later)
- npm (v9.x or later)

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/your-username/task-management.git
cd task-management
```

### 2️⃣ Backend Setup
```bash
cd backend
npm install
npm run start:dev
```
The NestJS API server will run at: `http://localhost:3000`

### 3️⃣ Frontend Setup
In a new terminal window:
```bash
cd frontend
npm install
npm run dev
```
The Next.js client application will run at: `http://localhost:3001` (or `http://localhost:3000`)

---

## 📡 API Reference

### Base URL: `http://localhost:3000/tasks`

| Method | Endpoint | Description | Query Parameters |
| :--- | :--- | :--- | :--- |
| `GET` | `/tasks` | Retrieve all tasks | `search`, `status`, `priority` |
| `GET` | `/tasks/:id` | Get single task details | N/A |
| `POST` | `/tasks` | Create a new task | N/A |
| `PATCH` | `/tasks/:id` | Update an existing task | N/A |
| `DELETE` | `/tasks/:id` | Delete a task by ID | N/A |

### Example Request Payloads

#### Create Task (`POST /tasks`)
```json
{
  "title": "Build NestJS REST API",
  "description": "Implement DTO validation and CRUD endpoints",
  "status": "IN_PROGRESS",
  "priority": "HIGH",
  "dueDate": "2026-08-15"
}
```

#### Update Task (`PATCH /tasks/:id`)
```json
{
  "status": "COMPLETED"
}
```

## 📜 Evaluation Criteria Checklist
- [x] **Design Fidelity & Theme Support** (Dark/Light mode persistence)
- [x] **Guest Authentication Flow**
- [x] **NestJS Clean Architecture & DTO Validation**
- [x] **Fully Responsive Design (Desktop, Tablet, Mobile)**
