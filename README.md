# Client Request & Website Maintenance Portal

A MERN-style portal for a single developer to manage client websites and maintenance requests. Clients can register, submit requests, upload screenshots, comment, and follow request status. AI features are intentionally not included in the MVP.

## Requirements

- Node.js 20 or newer
- MongoDB Atlas or another MongoDB replica set (clarification is committed transactionally)
- Cloudinary account only if screenshot uploads are needed

## Configure the server

From the repository root:

```bash
cd server
npm install
cp .env.example .env
```

Edit `server/.env` and set:

- `MONGODB_URI`: your MongoDB connection string. URL-encode special characters in the username or password.
- `JWT_SECRET`: a long random secret; generate one with `openssl rand -hex 32`.
- `CLIENT_ORIGIN`: the exact browser origin, normally `http://localhost:5173` for local development.
- `DEVELOPER_NAME`, `DEVELOPER_EMAIL`, and `DEVELOPER_PASSWORD`: credentials for the single developer account.
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET`: required only for screenshot uploads.

The API refuses to start unless `JWT_SECRET` is at least 32 bytes.

Never commit `.env` or paste secret values into source control or chat. If a secret is exposed, rotate it with its provider and update the local environment file.

Create the developer account after MongoDB is configured:

```bash
npm run seed:developer
```

Start the API from `server/`:

```bash
npm run dev
```

The API listens on port `5000` by default. Its health endpoint is `http://localhost:5000/api/health`.

## Run the client

In a second terminal from the repository root:

```bash
cd client
npm install
npm run dev
```

Open `http://localhost:5173`. Vite proxies `/api` requests to the local API.

## Tests and production build

Run the backend unit tests:

```bash
cd server
npm test
```

The API integration tests use an isolated in-memory MongoDB replica set. The MongoDB binary may be downloaded the first time the tests run; the tests do not read `.env` or connect to Atlas.

Build the client:

```bash
cd client
npm run build
```

## Security notes

- Browser authentication uses an HttpOnly, SameSite cookie; the JWT is not returned to frontend JavaScript.
- Set `CLIENT_ORIGIN` to the exact frontend origin. Unsafe requests with a different browser origin are rejected.
- Login and registration are rate-limited per IP. The default limiter store is in-memory and is intended for a single API instance; use a shared store if deploying multiple instances.
- Logging out increments the user's token version, revoking all of that user's current sessions.
- In production, set `NODE_ENV=production` and serve over HTTPS so the auth cookie is marked Secure.
- Screenshot uploads require Cloudinary credentials and are restricted by size, count, declared image type, and checked image signatures.

## Current MVP scope

The server provides authentication, role-protected website management, client-owned requests, constrained status transitions, comments, and activity history. Developer accounts are created through the seed script; public registration creates clients only. AI, payments, subscriptions, and multi-developer organizations are out of scope.
