# RemoteX Backend Deployment Guide: Render.com & Live Prisma Database

This guide explains how to connect your RemoteX backend to a live cloud database using **Prisma ORM** and deploy it to **Render.com**.

---

## 1. Get a Free Live Cloud MySQL Database

Render Web Services connect to any cloud MySQL instance via the standard `DATABASE_URL` format:
```
DATABASE_URL="mysql://<user>:<password>@<host>:<port>/<database>"
```

### Free Cloud MySQL Providers:
1. **Aiven for MySQL** (Free tier available, 100% managed MySQL 8):
   - Sign up at [aiven.io](https://aiven.io)
   - Create a free MySQL service
   - Copy the "Service URI" (looks like `mysql://avnadmin:password@host:port/defaultdb?ssl-mode=REQUIRED`)
2. **TiDB Cloud (MySQL-compatible Serverless)**:
   - Sign up at [pingcap.com/tidb-cloud](https://tidbcloud.com)
   - Create a free Serverless cluster
   - Copy the Prisma connection string
3. **Railway / Clever Cloud / PlanetScale**:
   - Create a MySQL instance and copy the connection URL

---

## 2. Sync Schema to Your Live Database

Once you have your cloud database URL:

1. Open `backend/.env` and update `DATABASE_URL`:
   ```env
   DATABASE_URL="mysql://your_user:your_password@your_host:3306/remotex_db"
   ```

2. Run the push command from `backend/`:
   ```bash
   npm run db:push
   ```
   *Prisma will immediately create all tables (`users`, `devices`, `sessions`, `session_permissions`, `trusted_devices`, `connection_logs`, `file_transfers`), relations, and indexes in your live database!*

3. (Optional) Run the seed script to create initial accounts and devices:
   ```bash
   npm run db:seed
   ```

---

## 3. Deploy to Render.com

### Option A: Using the `render.yaml` Blueprint (Automated)
1. Push your repository to GitHub.
2. Go to [dashboard.render.com](https://dashboard.render.com).
3. Click **New +** -> **Blueprint**.
4. Select your RemoteX GitHub repository. Render will automatically detect `render.yaml`!
5. In the prompt, enter your live `DATABASE_URL`.
6. Click **Apply**. Render will build and deploy your service automatically.

---

### Option B: Manual Web Service Setup on Render
1. Go to [dashboard.render.com](https://dashboard.render.com).
2. Click **New +** -> **Web Service**.
3. Connect your GitHub repository.
4. Configure the following settings:
   - **Name**: `remotex-backend`
   - **Region**: Closest to you (e.g., Singapore, Frankfurt, Oregon)
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**:
     ```bash
     npm install && npx prisma generate && npx prisma db push
     ```
   - **Start Command**:
     ```bash
     npm start
     ```
   - **Instance Type**: `Free`

5. **Environment Variables**:
   Click **Add Environment Variable** and add:
   | Key | Value | Notes |
   |-----|-------|-------|
   | `DATABASE_URL` | `mysql://...` | Your live cloud MySQL URI |
   | `JWT_SECRET` | `remotex_prod_secret_key_...` | Any long secure string |
   | `NODE_ENV` | `production` | Production mode |
   | `CORS_ORIGIN` | `*` | Allows Electron & Web clients |
   | `STUN_SERVER` | `stun:stun.l.google.com:19302` | Google public STUN server |

6. Click **Create Web Service**.

---

## 4. Connect Frontend to Your Live Render Backend

Once Render deploys your backend, it will assign you a live URL, for example:
`https://remotex-backend.onrender.com`

Update `frontend/.env`:
```env
VITE_API_BASE_URL=https://remotex-backend.onrender.com/api
VITE_SOCKET_SERVER_URL=https://remotex-backend.onrender.com
```

Now build the frontend or launch Electron:
```bash
cd frontend
npm run build
npm run electron
```
All devices and desktop clients will now communicate through your live Render cloud backend and live cloud database!
