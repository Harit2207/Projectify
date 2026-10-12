# Projectify

<div align="center">



<p align="center"> <img src="docs/images/banner.png" alt="Projectify Banner" width="100%"> </p> <p align="center">  </p>

**A production-grade multi-tenant project management platform with real-time collaboration, asynchronous email queues, and role-based permissions.**

Built by **[Harit Gevariya](https://github.com/Harit2207)**

<br/>

[![Live Demo](https://img.shields.io/badge/Live_Demo-Vercel-black?style=for-the-badge&logo=vercel&logoColor=white)](https://projectify-steel.vercel.app)

<br/>

> 🌐 **Live Application:** [https://projectify-steel.vercel.app](https://projectify-steel.vercel.app)  
> 🔑 **Demo Credentials:** `demo@projectify.dev` / `Demo@1234`

[![Node.js](https://img.shields.io/badge/Node.js-22.x-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-4.x-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://mongodb.com)
[![Redis](https://img.shields.io/badge/Redis-Upstash-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://upstash.com)
[![Socket.io](https://img.shields.io/badge/Socket.io-4.x-010101?style=for-the-badge&logo=socketdotio&logoColor=white)](https://socket.io)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![JWT](https://img.shields.io/badge/JWT-HttpOnly_Cookies-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)](https://jwt.io)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=for-the-badge)](http://makeapullrequest.com)

</div>

---

## What is this?

Projectify is a full-stack project management platform featuring dynamic Kanban boards, real-time collaboration, workspace-based multi-tenancy, and role-based permissions — inspired by Jira and Linear, built entirely from scratch.

The goal wasn't just to clone an existing tool, but to solve the real engineering challenges behind building one:
* **Token Security & CSRF:** HttpOnly double-cookie pattern (Access + Refresh tokens) eliminating XSS token theft.
* **Concurrency:** Request queuing mechanism preventing token refresh race conditions on simultaneous 401s.
* **Asynchronous Resilience:** In-memory background email worker queue with exponential backoff retries (3s, 6s).
* **Kanban Performance:** $O(1)$ drag-and-drop card reordering using floating-point fractional indexing.
* **Targeted Real-time:** Room-scoped Socket.io events preventing broadcast floods across 500+ active users.

---

---

# 🏗️ System Architecture

<p align="center">
  <img
    src="docs/images/system-architecture.png"
    alt="Projectify System Architecture"
    width="70%">
</p>

Projectify follows a feature-based layered architecture where the React (Vite) frontend communicates with the Express backend via REST APIs and WebSockets (Socket.io). Business logic is strictly decoupled in service layers (`route → controller → service`), an in-memory asynchronous worker queue handles email dispatching with exponential backoff retries, Redis powers distributed tiered rate limiting, and MongoDB stores all multi-tenant workspaces, projects, tasks, and notifications.

---

## Features

### Backend
- **JWT Authentication** — HttpOnly cookies with dual-token system (15min access + 7day refresh). Token refresh race condition handled with a request queue
- **Google OAuth** — Passport.js with account linking for existing email/password accounts
- **Role-Based Access Control** — Per-workspace roles (owner / admin / member) enforced in middleware, not controllers
- **Multi-tenant Workspaces** — Complete data isolation between workspaces
- **Project & Epic Management** — Projects contain epics which group related tasks
- **Kanban Task Board** — Tasks with fractional position indexing for O(1) drag-and-drop reordering
- **Real-time Updates** — Socket.io with room-scoped events. Task updates reach only users viewing that board
- **Analytics Dashboard** — 7 parallel aggregation queries via Promise.all (~50ms vs ~350ms sequential)
- **Search** — Case-insensitive task search across workspace
- **Notifications** — Per-user event notifications with TTL auto-expiry after 30 days
- **Tiered Rate Limiting** — Three Redis-backed tiers: auth (10/15min), API (60/min), global (200/15min)
- **Security Stack** — Helmet, CSRF protection, NoSQL injection sanitization, HPP
- **Structured Logging** — Winston with JSON output in production, request ID tracing on every log line
- **Background Email Queue & Templates** — In-memory asynchronous job queue with exponential backoff retries (3s, 6s) and rate-limiting protection. Dispatches real HTML emails via Nodemailer (Gmail/SMTP) for Welcome Onboarding, Password Resets (15-min SHA-256 tokens), Workspace Invites, and Task Assignments
- **Password Reset Security** — Crypto-generated SHA-256 hash tokens stored in DB with 15-minute expiration window to prevent brute force or replay attacks


### Frontend
- **Kanban Board** — Drag and drop with `@dnd-kit`, optimistic updates with rollback on failure
- **Real-time sync** — Socket.io room-based live updates without polling
- **Command palette** — Cmd+K search across projects and tasks
- **Analytics charts** — Recharts: area chart (completion trend), pie (status), bar (priority)
- **Dark mode** — System preference detection via next-themes
- **Form validation** — React Hook Form + Zod (same schemas as backend)
- **Instant Search & Suggestion Chips** — Modern Linear/Notion-style debounced search (300ms) supporting 1-character lookups with empty-state quick suggestion chips (`Bug`, `Feature`, `Frontend`, `Backend`)
- **Dedicated Workspace Members Management** — Standalone workspace members view with role badges, invite modal, and membership control
- **Forgot & Reset Password Views** — Complete multi-step password recovery flow with live password strength meters and toggleable visibility

---
---

# 🔐 Authentication Flow

<p align="center">
  <img
    src="docs/images/authentication-flow.png"
    alt="Authentication Flow"
    width="40%">
</p>

Projectify uses a dual-token authentication system with HttpOnly cookies, Google OAuth, automatic token refresh, and request queuing to eliminate refresh race conditions.

---
## Tech Stack

### Backend
| Technology | Purpose | Why chosen |
|---|---|---|
| Node.js + Express | HTTP server | Async I/O fits this data-heavy workload |
| MongoDB + Mongoose | Database | Nested task data (checklists, arrays) maps naturally to documents |
| Redis (Upstash) | Rate limiting | Shared counter across server instances |
| Socket.io | Real-time | Room abstraction for scoped event delivery |
| JWT + Passport.js | Auth | Stateless sessions + Google OAuth |
| Zod | Validation | Schema-first, type coercion, same library on frontend |
| Winston | Logging | JSON structured output + custom http log level |


### Frontend
| Technology | Purpose |
|---|---|
| React + Vite | UI framework + build tool |
| TanStack Query v5 | Server state, caching, optimistic updates |
| Zustand | Client state (auth, UI) |
| TailwindCSS + Shadcn UI | Styling + accessible components |
| @dnd-kit | Drag and drop |
| Recharts | Analytics charts |
| Socket.io-client | Real-time connection |

---

## Project Structure

```
Projectify/
├── server/                          # Backend
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js                # MongoDB connection
│   │   │   ├── redis.js             # Redis/Upstash client
│   │   │   ├── env.js               # Env validation
│   │   │  
│   │   ├── core/
│   │   │   ├── errors/              # Custom error classes
│   │   │   ├── logger/              # Winston setup
│   │   │   ├── services/
│   │   │   │   └── email.service.js # Background email worker queue & templates
│   │   │   ├── middleware/
│   │   │   │   ├── authenticate.js  # JWT verification
│   │   │   │   ├── validate.js      # Zod request validation
│   │   │   │   ├── rateLimiter.js   # Tiered Redis rate limits
│   │   │   │   ├── csrfProtection.js
│   │   │   │   └── validateObjectId.js
│   │   │   └── utils/
│   │   │       ├── response.js      # sendSuccess / sendCreated
│   │   │       └── socketEmitter.js # Centralized socket emissions
│   │   ├── features/
│   │   │   ├── auth/                # Login, signup, Google OAuth
│   │   │   ├── workspace/           # Workspace CRUD + members
│   │   │   ├── projects/            # Projects + epics
│   │   │   ├── tasks/               # Tasks + Kanban + search
│   │   │   ├── analytics/           # Aggregation-based stats
│   │   │   └── notifications/       # User notifications
│   │   ├── seeders/
│   │   │   └── seed.js              # Demo data seeder
│   │   ├── app.js                   # Express app + middleware chain
│   │   └── server.js                # HTTP server + Socket.io init
│   └── .env
│
└── client/                          # Frontend
    └── src/
        ├── core/                    # API client, stores, providers, router
        ├── features/                # auth, workspace, projects, tasks, analytics
        └── shared/                  # UI components, hooks, utils
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB Atlas account (free M0 tier works)
- Upstash Redis account (free tier works)
- Google Cloud Console project (for OAuth)

### 1. Clone the repository

```bash
git clone https://github.com/Harit2207/Projectify
cd Projectify
```

### 2. Backend setup

```bash
cd server
npm install
```

Create `server/.env`:

```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/projectify

# Redis (use rediss:// for Upstash TLS)
REDIS_URL=rediss://default:password@your-instance.upstash.io:6379

# JWT — generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_ACCESS_SECRET=your_64_char_hex_here
JWT_REFRESH_SECRET=different_64_char_hex_here

# Frontend URL (for CORS)
CLIENT_URL=http://localhost:5173

# Google OAuth — from console.cloud.google.com
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

# Email (Gmail SMTP with Background Worker Queue)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_gmail_app_password
SMTP_FROM=Projectify <your_email@gmail.com>
```

Start the server:

```bash
npm run dev
```

### 3. Seed the database (optional)

Populate the database with realistic demo data for testing and development.

```bash
# Add demo data
npm run seed

# Clear existing data and reseed
npm run seed:clear
```

The seeder creates:

- 👥 4 demo users
- 🏢 2 workspaces
- 📁 4 projects
- 📌 8 epics
- ✅ ~60 tasks
- 🔔 Sample notifications

**Demo account**

```text
Email:    demo@projectify.dev
Password: Demo@1234
```

### 4. Frontend setup

```bash
cd ../client
npm install

# Install Shadcn UI components
npx shadcn-ui@latest init
npx shadcn-ui@latest add button input label textarea card dialog dropdown-menu \
  select avatar badge separator progress skeleton scroll-area popover \
  collapsible command tooltip
```

Create `client/.env`:

```env
VITE_API_URL=http://localhost:5000
```

Start the frontend:

```bash
npm run dev
```

Open `http://localhost:5173`

---



Raw OpenAPI JSON:

```
http://localhost:5000/api/docs.json
```

### Quick endpoint reference

| Method | Endpoint | Auth | Min Role |
|--------|----------|------|----------|
| POST | /api/auth/signup | ❌ | — |
| POST | /api/auth/login | ❌ | — |
| POST | /api/auth/forgot-password | ❌ | — |
| POST | /api/auth/reset-password | ❌ | — |
| GET | /api/auth/me | ✅ | any |
| POST | /api/auth/logout | ✅ | any |
| POST | /api/auth/refresh | ❌ | — |
| GET | /api/workspaces | ✅ | any |
| POST | /api/workspaces | ✅ | any |
| GET | /api/workspaces/:id | ✅ | member |
| PATCH | /api/workspaces/:id | ✅ | admin |
| DELETE | /api/workspaces/:id | ✅ | owner |
| POST | /api/workspaces/:id/members/invite | ✅ | admin |
| PATCH | /api/workspaces/:id/members/:mId/role | ✅ | admin |
| DELETE | /api/workspaces/:id/members/:mId | ✅ | admin |
| GET | /api/workspaces/:id/projects | ✅ | member |
| POST | /api/workspaces/:id/projects | ✅ | member |
| GET | /api/workspaces/:id/projects/:pid | ✅ | member |
| PATCH | /api/workspaces/:id/projects/:pid | ✅ | member |
| DELETE | /api/workspaces/:id/projects/:pid | ✅ | admin |
| GET | /api/workspaces/:id/projects/:pid/epics | ✅ | member |
| POST | /api/workspaces/:id/projects/:pid/epics | ✅ | member |
| PATCH | /api/workspaces/:id/projects/:pid/epics/:eid | ✅ | member |
| DELETE | /api/workspaces/:id/projects/:pid/epics/:eid | ✅ | admin |
| GET | /api/workspaces/:id/projects/:pid/tasks | ✅ | member |
| GET | /api/workspaces/:id/projects/:pid/tasks/grouped | ✅ | member |
| POST | /api/workspaces/:id/projects/:pid/tasks | ✅ | member |
| GET | /api/workspaces/:id/tasks/:tid | ✅ | member |
| PATCH | /api/workspaces/:id/tasks/:tid | ✅ | member |
| DELETE | /api/workspaces/:id/tasks/:tid | ✅ | creator/admin |
| POST | /api/workspaces/:id/tasks/reorder | ✅ | member |
| GET | /api/workspaces/:id/tasks/search | ✅ | member |
| GET | /api/workspaces/:id/tasks/search/paginated | ✅ | member |
| GET | /api/workspaces/:id/stats | ✅ | member |
| GET | /api/workspaces/:id/projects/:pid/stats | ✅ | member |
| GET | /api/notifications | ✅ | any |
| PATCH | /api/notifications/:nid/read | ✅ | any |
| PATCH | /api/notifications/read-all | ✅ | any |

---

## Key Engineering Decisions

### 1. HttpOnly Cookies instead of localStorage
localStorage can be read by any JavaScript on the page. HttpOnly cookies cannot be read by JavaScript at all — not your code, not an injected script. Token theft via XSS is eliminated at the storage layer.

### 2. Dual tokens with path-scoped refresh
The refresh token cookie has `path: '/api/auth/refresh'` — the browser only sends it on that one endpoint. Every other API call never carries the most sensitive token.

### 3. Token refresh race condition
When multiple API calls get 401 simultaneously, a request queue ensures only one refresh fires. Others wait and retry after. Without this, concurrent 401s cause logout when refresh tokens rotate.

### 4. Fractional indexing for Kanban position
Task positions are floating point numbers. Inserting between positions 1000 and 2000 yields 1500 — only one document updated per drag. Integer positions would require updating every subsequent card.

### 5. Promise.all for analytics
Seven independent database queries run simultaneously instead of sequentially. Result: ~50ms instead of ~350ms for the analytics dashboard.

### 6. Room-scoped Socket.io events
`io.emit()` sends to every connected user. Rooms send only to users viewing the relevant board. 500 users online, one task update — 10 receive it, 490 are unaffected.

### 7. Feature-based folder structure
Each feature owns its routes, controller, service, model, and schemas together. Services never touch `req` or `res` — they receive plain arguments and return plain data, making them independently testable and reusable.

### 8. In-Memory Asynchronous Job Queue for Background Emails
Directly awaiting SMTP email delivery inside controllers introduces a 2–3 second latency penalty and risks request timeouts. An in-memory queue decouples email dispatching from the HTTP lifecycle, returning instant 200 OK responses to users while a background worker processes jobs with automatic exponential backoff retries (3s, 6s).

---

## Security Measures

| Layer | Protects Against |
|-------|-----------------|
| Helmet | XSS via CSP, clickjacking, MIME sniffing |
| express-mongo-sanitize | NoSQL injection (`$gt`, `$where` operators) |
| HPP | HTTP parameter pollution |
| Custom CSRF header | Cross-site request forgery |
| SameSite=Lax cookies | CSRF on cross-site requests |
| HttpOnly cookies | XSS-based token theft |
| Redis rate limiting (3 tiers) | Brute force, credential stuffing |
| Zod validation | Malformed and malicious input |
| validateObjectId middleware | MongoDB CastError crashes |

---
---

# 🛡️ Security Middleware Pipeline

<p align="center">
  <img
    src="docs/images/security_middleware_stack.png"
    alt="Security Middleware Pipeline"
    width="50%">
</p>

Every incoming request passes through multiple middleware layers before reaching business logic. Each layer removes a specific attack vector such as XSS, CSRF, NoSQL injection, brute-force attacks, malformed input, or unauthorized access.

---
## Known Limitations

These are deliberate tradeoffs, not oversights:

| Limitation | Impact | Fix |
|---|---|---|
| No MongoDB transactions on cascade delete | Project delete is not atomic across 3 collections | Wrap in `session.startTransaction()` |
| Refresh tokens not stored | Can't revoke individual sessions immediately | Store in Redis, delete to revoke |
| Regex search (no text index) | Full collection scan on every search | Add `$text` index or Atlas Search |
| No Socket.io Redis adapter | Rooms break across multiple server instances | Add `@socket.io/redis-adapter` |
| No optimistic locking on task reorder | Concurrent drags = last write wins | Add `version` field, reject stale writes |

---

## Environment Variables Reference

| Variable | Where to get it |
|----------|-----------------|
| `PORT` | Choose any available port (default: 5000) |
| `NODE_ENV` | Set to `development` locally, `production` on server |
| `MONGODB_URI` | MongoDB Atlas → Connect → Drivers → copy connection string |
| `REDIS_URL` | Upstash → Database → Details tab → Redis Connect URL (`rediss://`) |
| `JWT_ACCESS_SECRET` | Generate: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` |
| `JWT_REFRESH_SECRET` | Same command, different value |
| `CLIENT_URL` | Your frontend URL (`http://localhost:5173` locally) |
| `SMTP_HOST` | SMTP host (e.g. `smtp.gmail.com`) |
| `SMTP_PORT` | SMTP port (`465` for SSL, `587` for TLS) |
| `SMTP_USER` | Gmail address used to dispatch notifications |
| `SMTP_PASS` | Google Account → Security → 2-Step Verification → App Passwords (16-char) |
| `SMTP_FROM` | Sender display name and email (e.g. `Projectify <your@email.com>`) |
| `GOOGLE_CLIENT_ID` | Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 Client |
| `GOOGLE_CLIENT_SECRET` | Same as above |
| `GOOGLE_CALLBACK_URL` | Must match exactly what you set in Google Console |

---

## Real-time Events (Socket.io)

The server emits to scoped rooms — not broadcast.

| Room | Joined when | Events received |
|------|------------|-----------------|
| `project:{id}` | User opens a Kanban board | `task:created`, `task:updated`, `task:deleted`, `task:reordered` |
| `workspace:{id}` | User enters any workspace page | `member:joined`, `member:removed` |
| `user:{id}` | User connects (automatic) | `notification:new` |

---
---

# ⚡ Real-time Architecture

<p align="center">
  <img
    src="docs/images/real-time-architecture.png"
    alt="Socket.io Architecture"
    width="60%">
</p>

Every task update is scoped to Socket.io rooms. Only users currently viewing the relevant project receive updates, eliminating unnecessary broadcasts.

---
## Scripts

### Backend

```bash
npm run dev       # Start with nodemon (hot reload)
npm start         # Production start
npm run lint      # ESLint check

# Seeder
node src/seeders/seed.js           # Add demo data
node src/seeders/seed.js --clear   # Clear all + reseed
```

### Frontend

```bash
npm run dev       # Vite dev server with HMR
npm run build     # Production build
npm run preview   # Preview production build
npm run lint      # ESLint check
```

---

## Deployment

### Backend (Railway / Render / Fly.io)

1. Set all environment variables in the dashboard
2. Set `NODE_ENV=production`
3. Set `CLIENT_URL` to your deployed frontend URL
4. Update `GOOGLE_CALLBACK_URL` to your production backend URL
5. In Google Cloud Console, add the production callback URL to authorized redirect URIs

### Frontend (Vercel / Netlify)

1. Set `VITE_API_URL` to your deployed backend URL
2. Build command: `npm run build`
3. Output directory: `dist`

---


## License

MIT License — see [LICENSE](LICENSE) for details.


---
## 👨‍💻 Author

**Harit Gevariya**  
*Full-Stack Software Engineer*

- **GitHub:** [@Harit2207](https://github.com/Harit2207)
- **Repository:** [Projectify](https://github.com/Harit2207/Projectify)
- **Live Demo:** [https://projectify-steel.vercel.app](https://projectify-steel.vercel.app)

Built as a production-grade full-stack project management platform solving real-world engineering challenges: secure dual-token HttpOnly authentication, real-time room-scoped Socket.io collaboration, O(1) fractional indexing in Kanban boards, in-memory asynchronous background email worker queues, and multi-tenant role-based access control.

If you found this project helpful or learned something from it, consider giving it a ⭐ to support the project!

