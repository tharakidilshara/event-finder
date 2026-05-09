# EventFinder (HittaEvent)

A small full-stack app for browsing campus-style events: search and paginate listings, open details, save bookmarks (in the browser), and add or edit events when signed in. The UI is a static **Vite** front end; the API is **Express** with **MongoDB** (Mongoose) and **JWT** auth.

## Stack

| Layer    | Technology                          |
| -------- | ----------------------------------- |
| Frontend | Vanilla JS (ES modules), Vite       |
| Backend  | Node.js, Express, Mongoose        |
| Auth     | bcryptjs, jsonwebtoken            |
| Database | MongoDB (Atlas or self-hosted)    |

## Prerequisites

- **Node.js** 18+ (20 LTS recommended)
- A **MongoDB** connection string (`MONGODB_URI`)

## Quick start

1. **Clone the repo** and open the project folder.

2. **Backend environment**

   ```bash
   cp backend/.env.example backend/.env
   ```

   Edit `backend/.env`:

   - `MONGODB_URI` — your MongoDB URI (database name can be part of the path, e.g. `.../eventfinder`).
   - `JWT_SECRET` — long random secret (required for register/login). Example: `openssl rand -hex 32`
   - `PORT` — API port (default `5000`).
   - `CORS_ORIGIN` — origin of the Vite app (default `http://localhost:5173`).

3. **Install dependencies**

   ```bash
   npm install --prefix backend
   npm install --prefix frontend
   ```

   Optional: from the repo root, `npm install` installs **concurrently** so you can run both servers with one command (see below).

4. **Seed sample data** (optional but useful for a non-empty home page)

   ```bash
   npm run seed --prefix backend
   ```

   This creates a demo organizer user and example events. Demo login:

   - **Email:** `demo.organizer@eventfinder.example`
   - **Password:** `demo1234`

5. **Run in development**

   **Option A — two terminals**

   ```bash
   npm run dev --prefix backend
   npm run dev --prefix frontend
   ```

   **Option B — one command** (after `npm install` at the repo root)

   ```bash
   npm run dev
   ```

   Then open the URL Vite prints (usually **http://localhost:5173**). The app expects the API at **http://localhost:5000** unless you override it (see below).

6. **Health check**

   `GET http://localhost:5000/api/health` — returns `{ ok, mongo }` when the API and database are up.

## Frontend API base URL

By default the client uses `http://localhost:5000`. To point at another host, create `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000
```

Rebuild or restart Vite after changing env files.

## NPM scripts

| Location   | Command              | Purpose                                      |
| ---------- | -------------------- | -------------------------------------------- |
| Repo root  | `npm run dev`        | Runs backend + frontend dev servers together |
| `backend/` | `npm run dev`        | Express with `--watch`                       |
| `backend/` | `npm start`          | Production-style `node src/server.js`        |
| `backend/` | `npm run seed`       | Seed demo user + example events              |
| `frontend/` | `npm run dev`       | Vite dev server                              |
| `frontend/` | `npm run build`     | Production build to `frontend/dist`          |
| `frontend/` | `npm run preview`   | Preview production build                     |

The root `package.json` only adds **concurrently** for the combined `dev` script; it does not replace `backend` or `frontend` dependencies.

## API overview

Base path: `/api`

| Method & path              | Auth   | Description                    |
| -------------------------- | ------ | ------------------------------ |
| `GET /health`              | —      | Liveness / Mongo state         |
| `POST /auth/register`      | —      | Create account               |
| `POST /auth/login`         | —      | Issue JWT                    |
| `GET /auth/me`             | Bearer | Current user                 |
| `GET /events`              | —      | List + search + `limit`/`skip` |
| `GET /events/stats/by-category` | — | Category stats            |
| `GET /events/:id`          | —      | Single event                 |
| `POST /events`             | Bearer | Create event                 |
| `PATCH /events/:id`      | Bearer | Update (creator)             |
| `DELETE /events/:id`     | Bearer | Delete (creator)             |
| `GET /users/:userId/events` | —   | Events linked to a user id   |

Send `Authorization: Bearer <token>` for protected routes.

## Project layout

```
EventFinder/
├── package.json          # optional: concurrently + npm run dev
├── README.md
├── backend/
│   ├── .env              # your secrets (not committed)
│   ├── .env.example
│   └── src/
│       ├── server.js
│       ├── routes/
│       ├── controllers/
│       ├── models/
│       └── scripts/seedExampleData.js
└── frontend/
    ├── index.html
    └── src/
        ├── main.js
        ├── api/
        └── components/
```

## License

Private / coursework — adjust as needed for your course or organization.
