# EventFinder (HittaEvent)

**Problem it solves:** Students and staff waste time jumping between chat groups, PDF posters, and half-updated websites to figure out what is actually on this week — HittaEvent pulls campus-style listings into one searchable place, with saved shortlists and organizer tools behind sign-in.

This project targets **DA219B (Fullstack Lab, Kristianstad University)**: **React (Vite)**, **Express**, **MongoDB Atlas**, Router → Controller → Model, CRUD + relational routes, validation, seed data, and a README another developer can follow in a few minutes.

## Stack

| Layer    | Technology                                      |
| -------- | ----------------------------------------------- |
| Frontend | **React 19** (Vite 5), ES modules, JSX          |
| Backend  | Node.js, **Express**, **Mongoose**              |
| Auth     | bcryptjs, jsonwebtoken                          |
| Database | **MongoDB** (Atlas URI in `.env`; lab expects Atlas) |

## Prerequisites

- **Node.js** 18+ (20 LTS recommended)
- **MongoDB Atlas** (or compatible URI in `MONGODB_URI`)

## Quick start

1. **Clone the repo** and open the project folder.

2. **Backend environment**

   Cross-platform (creates `backend/.env` only if it does not exist yet):

   ```bash
   npm run init-env --prefix backend
   ```

   Or copy manually: `cp backend/.env.example backend/.env` (Unix) / `Copy-Item backend\.env.example backend\.env` (PowerShell).

   Edit `backend/.env`:

   - `MONGODB_URI` — Atlas connection string (include database name, e.g. `.../eventfinder`).
   - `JWT_SECRET` — long random secret (required for register/login). Example: `openssl rand -hex 32`
   - `PORT` — API port (default `5000`).
   - `CORS_ORIGIN` — origin of the Vite app (default `http://localhost:5173`).

3. **Install dependencies**

   ```bash
   npm install --prefix backend
   npm install --prefix frontend
   ```

   Optional: from the repo root, `npm install` installs **concurrently** so both servers start with one command.

4. **Seed the database** (recommended — creates **≥5 users**, **6 events**, **11 saved-bookmark** rows; all accounts use the same demo password)

   ```bash
   npm run seed --prefix backend
   ```

   Primary organizer login:

   - **Email:** `demo.organizer@eventfinder.example`
   - **Password:** `demo1234`

   Other seeded users share the same password (see `backend/src/scripts/seedExampleData.js` for `@student.kristianstad.se` / alumni emails).

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

   Open the URL Vite prints (usually **http://localhost:5173**). The client calls **http://localhost:5000** unless you set `VITE_API_URL` (see below).

6. **Health check**

   `GET http://localhost:5000/api/health` — returns `{ ok, mongo }` when the API and database are up.

## Frontend API base URL

Create `frontend/.env` if the API is not on port 5000:

```env
VITE_API_URL=http://localhost:5000
```

Restart Vite after changing env files.

## Database collections (DA219B §3)

| Collection (Mongoose) | Purpose |
| ---------------------- | -------- |
| `users` | Accounts (name, email, password hash). |
| `events` | Listings (`createdBy` → `users._id`). |
| `savedbookmarks` | Who saved which event (`user` + `event` → ObjectIds, unique pair). |

Relationships: `Event.createdBy` → `User`; `SavedBookmark.user` → `User`; `SavedBookmark.event` → `Event`. Deleting an event removes its bookmark rows.

## NPM scripts

| Location    | Command        | Purpose                                      |
| ----------- | -------------- | -------------------------------------------- |
| Repo root   | `npm run dev`  | Runs backend + frontend dev servers together |
| `backend/`  | `npm run dev`  | Express with `--watch`                       |
| `backend/`  | `npm start`    | `node src/server.js`                         |
| `backend/`  | `npm run init-env` | Copy `.env.example` → `.env` if missing   |
| `backend/`  | `npm run seed` | Seed users, events, bookmarks                |
| `frontend/` | `npm run dev`  | Vite + React dev server                      |
| `frontend/` | `npm run build`| Production build → `frontend/dist`          |
| `frontend/` | `npm run preview` | Preview production build                  |

## API overview

Base path: `/api`

| Method & path | Auth | Description |
| ------------- | ---- | ------------- |
| `GET /health` | — | Liveness / Mongo state |
| `POST /auth/register` | — | Create account |
| `POST /auth/login` | — | Issue JWT |
| `GET /auth/me` | Bearer | Current user |
| `GET /events` | — | List + search + `limit` / `skip` |
| `GET /events/stats/by-category` | — | Category statistics (aggregation) |
| `GET /events/:id` | — | Single event (populates `createdBy`) |
| `POST /events` | Bearer | Create event |
| `PATCH /events/:id` | Bearer | Update (creator) |
| `DELETE /events/:id` | Bearer | Delete (creator) |
| `GET /users/:userId/events` | — | Events created by user |
| `GET /saved-events` | Bearer | Current user’s saved events (populated) |
| `POST /saved-events` | Bearer | Body `{ "eventId": "<id>" }` — save |
| `DELETE /saved-events/:eventId` | Bearer | Remove saved row |

Send `Authorization: Bearer <token>` for protected routes.

## Frontend structure (React)

- `src/main.jsx` — mount root.
- `src/App.jsx` — navigation, saved state, modals, global refresh after mutations.
- `src/hooks/useBrowseEvents.js` — browse/search/pagination + exposes `silentRefreshBrowse` for the **auto-refresh interval** (see `BrowseView.jsx` + `useEffect` cleanup per DA219B).
- Components: `HeaderNav.jsx`, `BrowseView.jsx`, `EventListSection.jsx`, `EventCard.jsx`, `SavedView.jsx`, `PostEventForm.jsx`, `EventDetailModal.jsx`, `AuthModal.jsx`, `RegisterTicketModal.jsx`.

## Git & report (your responsibility)

The lab requires **meaningful Git history**, **report PDF** (overview, ERD, example endpoints, reflection, iteration with commit hashes), and seminar prep. This repo does not enforce commits for you — plan incremental commits and conventional messages (`feat:`, `fix:`) as you go.

## License

Private / coursework — adjust as needed for your course or organization.
