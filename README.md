# Task Management REST API

A production-ready, secure, and fully-featured RESTful API for task management built with **Node.js**, **Express.js**, **MongoDB**, and **Mongoose**. Features robust JWT authentication, strict schema validation, case-insensitive keyword search, multi-field filtering, pagination, rate limiting, and NoSQL injection protection.

---

## 📑 Table of Contents
- [Tech Stack](#-tech-stack)
- [Project Architecture](#-project-architecture)
- [Features](#-features)
- [Security & Best Practices](#-security--best-practices)
- [Prerequisites](#-prerequisites)
- [Installation & Setup](#-installation--setup)
- [Running the Application](#-running-the-application)
- [API Documentation & Endpoints](#-api-documentation--endpoints)
  - [Health Check](#1-health-check)
  - [Authentication Endpoints](#2-authentication-endpoints)
  - [Task Management Endpoints](#3-task-management-endpoints)
  - [Query Parameters Guide for Tasks](#query-parameters-guide-for-get-apitasks)
- [Standardized Response Format](#-standardized-response-format)
- [Postman Collection Setup](#-postman-collection-setup)
- [Automated Testing](#-automated-testing)
- [Production Deployment Guide](#-production-deployment-guide)

---

## 🛠 Tech Stack

- **Runtime Environment:** [Node.js](https://nodejs.org/) (LTS v18+)
- **Web Framework:** [Express.js](https://expressjs.com/) v4
- **Database & ODM:** [MongoDB](https://www.mongodb.com/) with [Mongoose](https://mongoosejs.com/) v8
- **Authentication & Security:** 
  - `jsonwebtoken` (Stateless JWT token generation & verification)
  - `bcryptjs` (Salt rounds >= 10 password hashing)
  - `helmet` (Security HTTP headers)
  - `cors` (Cross-Origin Resource Sharing)
  - `express-rate-limit` (Brute-force and DDoS prevention)
  - `express-mongo-sanitize` (NoSQL injection prevention)
- **Validation:** [Joi](https://joi.dev/) (Request body, params, and query validation)
- **Logging & Environment:** `morgan`, `dotenv`

---

## 📁 Project Architecture

```
task-management-api/
├── src/
│   ├── config/
│   │   ├── db.js                   # Mongoose connection & lifecycle handlers
│   │   └── env.js                  # Centralized environment variable management
│   ├── controllers/
│   │   ├── auth.controller.js      # Register, Login, Get Profile controllers
│   │   └── task.controller.js      # CRUD, Search, Filter & Pagination controllers
│   ├── middleware/
│   │   ├── auth.middleware.js      # JWT verification & request user attachment
│   │   ├── error.middleware.js     # Centralized global error handling
│   │   ├── notFound.middleware.js  # 404 Route Not Found middleware
│   │   └── validate.middleware.js  # Generic Joi request validator
│   ├── models/
│   │   ├── Task.js                 # Task schema, indexes & JSON transforms
│   │   └── User.js                 # User schema, password hashing & comparison
│   ├── routes/
│   │   ├── auth.routes.js          # Authentication router
│   │   └── task.routes.js          # Task management router
│   ├── validators/
│   │   ├── auth.validator.js       # Joi schemas for auth payloads
│   │   └── task.validator.js       # Joi schemas for tasks, queries & params
│   ├── utils/
│   │   ├── ApiError.js             # Standard operational error class
│   │   ├── asyncHandler.js         # Async error wrapper for routes
│   │   └── generateToken.js        # JWT signing utility
│   ├── app.js                      # Express app setup & middleware stack
│   └── server.js                   # Server bootstrap & graceful shutdown
├── postman/
│   └── Task-Management-API.postman_collection.json  # Postman v2.1 collection
├── test/
│   └── api.test.js                 # Complete automated test suite
├── .env.example                    # Environment variable template
├── .gitignore                      # Git ignored files & directories
├── package.json                    # Project metadata & npm scripts
└── README.md                       # Complete documentation
```

---

## ✨ Features

1. **User Authentication & Authorization:**
   - User registration with unique, lowercase email enforcement.
   - Strong password validation (minimum 8 characters, at least 1 letter and 1 number).
   - Bcrypt password hashing (`salt rounds = 10`).
   - `select: false` on password field — passwords never leak in responses or queries.
   - JWT tokens with configurable expiration (e.g. `7d`).
   - Generic error messages for failed logins to avoid user enumeration.

2. **Task Management (Full CRUD):**
   - Create, list, retrieve, update, and delete tasks.
   - Task Schema fields: `title` (max 100), `description` (max 500), `status` (`Pending`, `In Progress`, `Completed`), `priority` (`Low`, `Medium`, `High`), `dueDate`, and `timestamps`.
   - Complete multi-tenant data isolation: all task queries are strictly scoped to the authenticated user's ID (`req.user._id`).
   - Secure error masking: Accessing or mutating tasks belonging to another user returns **404 Not Found** (not 403) to prevent resource enumeration.

3. **Search, Filtering, Sorting & Pagination:**
   - **Search:** Case-insensitive search across both `title` and `description` with ReDoS-safe regex escaping.
   - **Filter:** Multi-criteria filtering by `status` and `priority`.
   - **Sort:** Customizable `sortBy` (`createdAt`, `updatedAt`, `title`, `dueDate`, `priority`, `status`) and `order` (`asc`, `desc`).
   - **Pagination:** Configurable `page` and `limit` (max 100) with complete metadata (`total`, `totalPages`, `hasNextPage`, `hasPrevPage`).

4. **Security & Production Hardening:**
   - **Helmet:** Sets secure HTTP response headers.
   - **CORS:** Configured for cross-origin client integration.
   - **Rate Limiting:**
     - Global API limiter: 100 requests per 15 minutes.
     - Strict Auth limiter: 20 requests per 15 minutes on `/api/auth/*`.
   - **NoSQL Injection Sanitization:** Strips `$` and `.` operators from client inputs.
   - **Request Size Limiter:** Enforces a 10kb body payload limit.
   - **Error Handling:** Centralized middleware handles Mongoose CastError, Duplicate Key (11000), Joi validation errors, JWT expiration, and unhandled server errors without exposing stack traces in production.

---

## 🔒 Security & Best Practices

| Mechanism | Implementation |
| :--- | :--- |
| **Password Security** | Bcrypt hashing with pre-save hooks; `select: false` in schema |
| **JWT Authorization** | Bearer token verified against secret key; attached to `req.user` |
| **Strict Data Isolation** | Queries include `{ _id: taskId, user: req.user._id }` |
| **Status 404 for Cross-User** | Prevents attackers from probing if another user's task ID exists |
| **NoSQL Injection Defense** | `express-mongo-sanitize` strips operator keys |
| **ReDoS Prevention** | Special regex characters escaped before compiling queries |
| **Input Validation** | Joi validates headers, params, query strings, and body schemas |
| **Brute Force Defense** | Strict `express-rate-limit` limits login/register attempts |
| **Payload Capping** | `express.json({ limit: '10kb' })` prevents oversized payload attacks |

---

## 📋 Prerequisites

Before running the API, make sure you have:
- **Node.js** (v18.x or higher) -> [Download](https://nodejs.org/)
- **npm** (v9.x or higher)
- **MongoDB** running locally on port `27017` OR a **MongoDB Atlas** cluster URI

---

## 🚀 Installation & Setup

1. **Clone or Navigate to the Project:**
   ```bash
   cd task-management-api
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Copy `.env.example` to create `.env`:
   ```bash
   cp .env.example .env
   ```

4. **Update `.env` values:**
   ```env
   PORT=5000
   NODE_ENV=development
   MONGO_URI=mongodb://localhost:27017/task_management_db
   JWT_SECRET=super_secret_production_ready_jwt_key_987654321
   JWT_EXPIRES_IN=7d
   ```

---

## 🏃 Running the Application

### Development Mode (with Nodemon Auto-Reload):
```bash
npm run dev
```

### Production Mode:
```bash
npm start
```

When the server starts successfully, you will see:
```
[Database] MongoDB Connected: localhost/task_management_db
[Server] Task Management API running in development mode on http://localhost:5000
[Server] Health Check available at http://localhost:5000/api/health
```

---

## 📡 API Documentation & Endpoints

Base URL: `http://localhost:5000/api`

### Summary Table

| Method | Endpoint | Auth Required | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/api/health` | No | Health check & system status |
| `POST` | `/api/auth/register` | No | Register a new user |
| `POST` | `/api/auth/login` | No | Authenticate user & get JWT token |
| `GET` | `/api/auth/profile` | **Yes** | Get profile of logged-in user |
| `POST` | `/api/tasks` | **Yes** | Create a new task |
| `GET` | `/api/tasks` | **Yes** | List tasks (search, filter, paginate) |
| `GET` | `/api/tasks/:id` | **Yes** | Get task by ID |
| `PUT` | `/api/tasks/:id` | **Yes** | Update task by ID |
| `DELETE` | `/api/tasks/:id` | **Yes** | Delete task by ID |

---

### 1. Health Check

#### `GET /api/health`
**Response (200 OK):**
```json
{
  "success": true,
  "message": "API is healthy and operational",
  "data": {
    "status": "UP",
    "uptime": 12.345,
    "timestamp": "2026-10-03T11:40:00.000Z",
    "environment": "development"
  }
}
```

---

### 2. Authentication Endpoints

#### `POST /api/auth/register`
**Request Body:**
```json
{
  "name": "Alice Developer",
  "email": "alice@example.com",
  "password": "Password123!"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "_id": "6740b2f901c4b4a2e9d62f11",
      "name": "Alice Developer",
      "email": "alice@example.com",
      "createdAt": "2026-10-03T11:40:00.000Z",
      "updatedAt": "2026-10-03T11:40:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

#### `POST /api/auth/login`
**Request Body:**
```json
{
  "email": "alice@example.com",
  "password": "Password123!"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "_id": "6740b2f901c4b4a2e9d62f11",
      "name": "Alice Developer",
      "email": "alice@example.com",
      "createdAt": "2026-10-03T11:40:00.000Z",
      "updatedAt": "2026-10-03T11:40:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

#### `GET /api/auth/profile`
**Headers:** `Authorization: Bearer <token>`

**Response (200 OK):**
```json
{
  "success": true,
  "message": "User profile retrieved successfully",
  "data": {
    "user": {
      "_id": "6740b2f901c4b4a2e9d62f11",
      "name": "Alice Developer",
      "email": "alice@example.com",
      "createdAt": "2026-10-03T11:40:00.000Z",
      "updatedAt": "2026-10-03T11:40:00.000Z"
    }
  }
}
```

---

### 3. Task Management Endpoints

All task routes require the `Authorization: Bearer <token>` header.

#### `POST /api/tasks`
**Request Body:**
```json
{
  "title": "Build Production REST API",
  "description": "Implement authentication, CRUD endpoints, and test coverage",
  "status": "In Progress",
  "priority": "High",
  "dueDate": "2026-12-31T23:59:59.000Z"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Task created successfully",
  "data": {
    "task": {
      "_id": "6740b3a901c4b4a2e9d62f22",
      "title": "Build Production REST API",
      "description": "Implement authentication, CRUD endpoints, and test coverage",
      "status": "In Progress",
      "priority": "High",
      "dueDate": "2026-12-31T23:59:59.000Z",
      "user": "6740b2f901c4b4a2e9d62f11",
      "createdAt": "2026-10-03T11:41:00.000Z",
      "updatedAt": "2026-10-03T11:41:00.000Z"
    }
  }
}
```

---

#### `GET /api/tasks`
**Example Request:**
`GET /api/tasks?status=In Progress&priority=High&page=1&limit=10&sortBy=createdAt&order=desc`

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Tasks retrieved successfully",
  "data": {
    "tasks": [
      {
        "_id": "6740b3a901c4b4a2e9d62f22",
        "title": "Build Production REST API",
        "description": "Implement authentication, CRUD endpoints, and test coverage",
        "status": "In Progress",
        "priority": "High",
        "dueDate": "2026-12-31T23:59:59.000Z",
        "user": "6740b2f901c4b4a2e9d62f11",
        "createdAt": "2026-10-03T11:41:00.000Z",
        "updatedAt": "2026-10-03T11:41:00.000Z"
      }
    ],
    "pagination": {
      "total": 1,
      "page": 1,
      "limit": 10,
      "totalPages": 1,
      "hasNextPage": false,
      "hasPrevPage": false
    }
  }
}
```

---

#### `GET /api/tasks/:id`
**Response (200 OK):**
```json
{
  "success": true,
  "message": "Task retrieved successfully",
  "data": {
    "task": {
      "_id": "6740b3a901c4b4a2e9d62f22",
      "title": "Build Production REST API",
      "description": "Implement authentication, CRUD endpoints, and test coverage",
      "status": "In Progress",
      "priority": "High",
      "dueDate": "2026-12-31T23:59:59.000Z",
      "user": "6740b2f901c4b4a2e9d62f11",
      "createdAt": "2026-10-03T11:41:00.000Z",
      "updatedAt": "2026-10-03T11:41:00.000Z"
    }
  }
}
```

---

#### `PUT /api/tasks/:id`
**Request Body (Partial or Full Update):**
```json
{
  "status": "Completed",
  "priority": "Medium"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Task updated successfully",
  "data": {
    "task": {
      "_id": "6740b3a901c4b4a2e9d62f22",
      "title": "Build Production REST API",
      "description": "Implement authentication, CRUD endpoints, and test coverage",
      "status": "Completed",
      "priority": "Medium",
      "dueDate": "2026-12-31T23:59:59.000Z",
      "user": "6740b2f901c4b4a2e9d62f11",
      "createdAt": "2026-10-03T11:41:00.000Z",
      "updatedAt": "2026-10-03T11:42:00.000Z"
    }
  }
}
```

---

#### `DELETE /api/tasks/:id`
**Response (200 OK):**
```json
{
  "success": true,
  "message": "Task deleted successfully",
  "data": null
}
```

---

### Query Parameters Guide for `GET /api/tasks`

| Parameter | Type | Default | Allowed Values / Format | Description |
| :--- | :--- | :---: | :--- | :--- |
| `search` | String | *None* | Any text string | Case-insensitive regex search in `title` OR `description` |
| `status` | String | *None* | `Pending`, `In Progress`, `Completed` | Filter by task status |
| `priority`| String | *None* | `Low`, `Medium`, `High` | Filter by task priority level |
| `page` | Integer | `1` | `>= 1` | Pagination page number |
| `limit` | Integer | `10` | `1` to `100` | Number of tasks per page |
| `sortBy` | String | `createdAt`| `createdAt`, `updatedAt`, `title`, `dueDate`, `priority`, `status` | Field to sort results by |
| `order` | String | `desc` | `asc`, `desc` | Sorting direction |

---

## 📦 Standardized Response Format

### Success Response:
```json
{
  "success": true,
  "message": "Human readable success message",
  "data": { ... }
}
```

### Error Response:
```json
{
  "success": false,
  "message": "Human readable error description",
  "errors": [
    {
      "field": "email",
      "message": "Please provide a valid email address"
    }
  ]
}
```

---

## 📬 Postman Collection Setup

A complete, pre-configured Postman v2.1 collection is included at:
[`postman/Task-Management-API.postman_collection.json`](./postman/Task-Management-API.postman_collection.json)

### How to Import & Use:
1. Open **Postman**.
2. Click **Import** in the top left corner.
3. Drag and drop `postman/Task-Management-API.postman_collection.json`.
4. The collection contains collection variables:
   - `baseUrl` (default: `http://localhost:5000/api`)
   - `token` (automatically updated upon Register / Login)
   - `taskId` (automatically updated upon creating a task)
5. Execute **Authentication -> Register User** or **Login User**. Postman will automatically save the JWT token to `{{token}}` for all subsequent protected requests!

---

## 🧪 Automated Testing

To run the complete automated test suite covering authentication, validation, data isolation, search, filtering, pagination, and error scenarios:

1. Ensure the server or local MongoDB is running.
2. Execute:
   ```bash
   npm test
   ```

**Test Coverage Highlights:**
- Health endpoint status
- User registration, duplicate email rejection, weak password rejection
- Login with correct vs incorrect credentials
- Profile access and token validation
- Task creation, field validation, and default values
- Strict cross-user data isolation (404 verification)
- Case-insensitive search with regex character escaping
- Multi-criteria status & priority filtering
- Pagination calculations & metadata accuracy
- Update and deletion verification

---

## ☁️ Production Deployment Guide

### Option 1: Render / Railway + MongoDB Atlas

1. **Setup MongoDB Atlas:**
   - Create a free cluster on [MongoDB Atlas](https://www.mongodb.com/atlas).
   - Under **Database Access**, create a database user and password.
   - Under **Network Access**, whitelist IP `0.0.0.0/0` (allow all).
   - Copy your connection string: `mongodb+srv://<username>:<password>@cluster0.mongodb.net/task_manager?retryWrites=true&w=majority`.

2. **Deploy on Render / Railway:**
   - Connect your GitHub repository.
   - Set **Build Command:** `npm install`
   - Set **Start Command:** `npm start`
   - Add the following **Environment Variables**:
     - `NODE_ENV=production`
     - `PORT=10000` (or leave default for Railway)
     - `MONGO_URI=<your_atlas_connection_string>`
     - `JWT_SECRET=<a_secure_random_64_char_string>`
     - `JWT_EXPIRES_IN=7d`
   - Deploy!

---

## 📄 License
This project is licensed under the ISC License.
