# ProfitPilot — Production Deployment Guide

This guide details deploying **ProfitPilot** to production using **MongoDB Atlas**, **Render** (Node.js API), and **Vercel** (React Client).

---

## 1. MongoDB Atlas Database Setup

1. Log in to [MongoDB Atlas](https://www.mongodb.com/atlas) and create a free or dedicated cluster (e.g. `Cluster0` in `ap-south-1` or your target region).
2. **Database Access (Least Privilege)**:
   - Create a dedicated database user (e.g. `profitpilot_app_user`).
   - Assign the **`readWrite`** role scoped specifically to the `profitpilot` database.
3. **Network Access**:
   - For Render server hosting, add Render's outbound IPs or temporarily allow `0.0.0.0/0` with a strong password and TLS enabled.
4. **Connection String**:
   - Format: `mongodb+srv://profitpilot_app_user:<PASSWORD>@cluster0.xxxx.mongodb.net/profitpilot?retryWrites=true&w=majority`

---

## 2. Deploying Backend to Render

1. Go to [Render Dashboard](https://dashboard.render.com/) &rarr; **New Web Service**.
2. Connect your GitHub repository.
3. Configure the service:
   - **Root Directory**: `server`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
4. Set **Environment Variables** in Render:
   - `NODE_ENV`: `production`
   - `PORT`: `5000` (or leave default, Render sets `PORT`)
   - `MONGODB_URI`: `<Your MongoDB Atlas connection URI>`
   - `JWT_SECRET`: `<Generate a random 64-char string: openssl rand -hex 32>`
   - `CLIENT_ORIGIN`: `https://your-profitpilot-client.vercel.app`
   - `AI_API_KEY`: `<Your optional Gemini API key>`
   - `AI_MODEL`: `gemini-1.5-flash`
5. Enable **Health Check Path**: `/health`
6. Deploy the web service and copy your public backend URL (e.g. `https://profitpilot-api.onrender.com`).

---

## 3. Deploying Frontend to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/) &rarr; **Add New Project**.
2. Import your GitHub repository.
3. In Project Settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Set **Environment Variables** in Vercel:
   - `VITE_API_BASE_URL`: `https://profitpilot-api.onrender.com/api/v1`
5. Click **Deploy**.
6. Once deployed, copy your Vercel URL and ensure it matches the `CLIENT_ORIGIN` variable configured on Render for CORS and secure cookies.

---

## 4. Production Security Checklist

- [x] Passwords hashed with `bcryptjs` (salt rounds: 12)
- [x] HttpOnly, SameSite cookies with `secure: true` in production
- [x] CORS explicitly restricted to `CLIENT_ORIGIN`
- [x] Helmet security headers active
- [x] Express rate limiting active on `/api` and `/auth` routes
- [x] MongoDB database user uses least-privilege `readWrite` role
- [x] No secrets or `.env` files committed to Git (`.gitignore` enforced)
- [x] Strict server-side ownership isolation (`ownerId` extracted from JWT, client-provided IDs rejected)
- [x] Deterministic financial accounting (integer minor units in paise prevents floating-point drift)
