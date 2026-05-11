## EventFinder (HittaEvent)

**Problem it solves**: people often have to jump between chat groups, posters, social media posts, and half-updated pages to figure out what events are actually happening. EventFinder brings listings into one searchable place with **saved events** and **organizer tools** behind sign-in.

This project was built for **DA219B (Fullstack Lab, Kristianstad University)** and follows the required patterns: **React (Vite)** frontend, **Express + Mongoose** backend, **MongoDB Atlas**, Router → Controller → Model, CRUD, validation, and seeded example data.

### Stack

- **Frontend**: React (Vite)
- **Backend**: Node.js + Express (ES modules)
- **Database**: MongoDB (Atlas connection string in `.env`)
- **Auth**: JWT (bearer tokens), bcrypt password hashing

### Features

- **Browse + search** events with pagination (`limit` / `skip`)
- **Event details modal** (creator info populated from backend)
- **Register/login** with JWT auth, “Me” endpoint
- **Saved events** list (bookmark table/collection)
- **Post an event** (create), **edit/delete** your own events
- **My events** view (events created by the logged-in user)
- **Category statistics** endpoint (aggregation)
- **Image handling**: if an event has no image URL (or it fails to load), the UI shows a fallback image

## Prerequisites

- **Node.js 18+** (Node 20 LTS recommended)
- A **MongoDB Atlas** database (or any MongoDB connection string)

## Quick start (Windows / PowerShell friendly)

### 1) Install dependencies

From the repo root:

```bash
npm install
npm install --prefix backend
npm install --prefix frontend
```

Why both? The root install is required for the root `npm run dev` script (it installs `concurrently`). Backend and frontend each have their own dependencies too.

### 2) Backend environment (`backend/.env`)

Create the file:

```bash
npm run init-env --prefix backend
```

Or copy manually:

```powershell
Copy-Item backend\.env.example backend\.env
```

Then edit `backend/.env` (based on `backend/.env.example`):

- **`PORT`**: API port (default `5000`)
- **`MONGODB_URI`**: Atlas connection string (include a database name, e.g. `.../eventfinder`)
- **`CORS_ORIGIN`**: Vite origin (default `http://localhost:5173`)
- **`JWT_SECRET`**: long random string used to sign tokens

### 3) Frontend environment (`frontend/.env`) (optional)

Only needed if your API is not `http://localhost:5000`.

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000
```

Restart Vite after changing env files.

### 4) Seed example data (recommended)

```bash
npm run seed --prefix backend
```

Seed creates example users/events/bookmarks. Demo organizer login:

- **Email**: `demo.organizer@eventfinder.example`
- **Password**: `demo1234`

### 5) Run in development

Option A (one command, two servers):

```bash
npm run dev
```

Run this command **from the repo root** (same folder as the root `package.json`) to start **both** the backend and frontend together.

Option B (two terminals):

```bash
npm run dev --prefix backend
```

```bash
npm run dev --prefix frontend
```

Open the URL Vite prints (usually `http://localhost:5173`).

### 6) Health check

Request:

- `GET /api/health` (on the backend base URL, default `http://localhost:5000/api/health`)

## NPM scripts

- **Repo root**
  - **`npm run dev`**: run backend + frontend together (uses `concurrently`)
- **`backend/`**
  - **`npm run dev`**: start API using `node --watch`
  - **`npm start`**: start API (no watch)
  - **`npm run init-env`**: create `backend/.env` from `.env.example` if missing
  - **`npm run seed`**: seed users/events/bookmarks
- **`frontend/`**
  - **`npm run dev`**: start Vite
  - **`npm run build`**: production build to `frontend/dist`
  - **`npm run preview`**: preview the production build

## Database collections (DA219B)

- **`users`**: accounts (name, email, password hash)
- **`events`**: event listings (`createdBy` → `users._id`)
- **`savedbookmarks`**: join collection (unique `user` + `event` pair)

Relationship summary:

- `Event.createdBy` → `User`
- `SavedBookmark.user` → `User`
- `SavedBookmark.event` → `Event`

When an event is deleted, its bookmark rows are removed.

## API overview

Base path: `/api`

### Auth

- `POST /auth/register` — create an account
- `POST /auth/login` — login and get a JWT
- `GET /auth/me` — current user (requires `Authorization: Bearer <token>`)

### Events

- `GET /events` — list + search + pagination (`q`, `limit`, `skip`)
- `GET /events/:id` — single event (includes populated `createdBy`)
- `POST /events` — create event (auth required)
- `PATCH /events/:id` — update event (auth + creator only)
- `DELETE /events/:id` — delete event (auth + creator only)
- `GET /events/stats/by-category` — aggregation stats

### Relational routes

- `GET /users/:userId/events` — events created by a user

### Saved events

- `GET /saved-events` — current user’s saved events (auth required)
- `POST /saved-events` — save an event, body `{ "eventId": "<id>" }` (auth required)
- `DELETE /saved-events/:eventId` — unsave (auth required)

## Frontend structure (React)

- `frontend/src/App.jsx` — navigation, views, modals, refresh after mutations
- `frontend/src/hooks/useBrowseEvents.js` — browse/search/pagination + silent refresh interval support
- `frontend/src/components/` — key UI components:
  - `HeaderNav.jsx`
  - `BrowseView.jsx`
  - `MyEventsView.jsx`
  - `SavedView.jsx`
  - `PostEventForm.jsx`
  - `EventCard.jsx`
  - `EventDetailModal.jsx`

## Troubleshooting

### Port already in use (`EADDRINUSE :5000`)

Another process is already using port 5000. Stop the old backend process or change `PORT` in `backend/.env`, then restart the backend (and update `VITE_API_URL` if needed).

### CORS errors in the browser

Make sure `CORS_ORIGIN` in `backend/.env` matches the exact frontend origin (usually `http://localhost:5173`). Then restart the backend.

### Mongo connection fails

Double-check `MONGODB_URI` in `backend/.env` (Atlas username/password, IP allowlist, and that the URI includes a database name).

