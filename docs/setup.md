# ProfitPilot — Local Setup & Development Guide

This guide walks you through setting up and running **ProfitPilot** on your local machine.

---

## 1. Prerequisites

- **Node.js**: `v20+` or `v24+` installed (`node -v`)
- **npm**: `v10+` or `v11+` (`npm -v`)
- **MongoDB**: Either a free [MongoDB Atlas Cluster](https://www.mongodb.com/atlas) connection string OR local MongoDB.
  *(Note: ProfitPilot features an automatic in-memory MongoDB fallback in development mode if no URI is supplied).*

---

## 2. Clone & Install Dependencies

From the repository root:

```bash
# Clone the repository
git clone <your-repo-url>
cd e-comer-optmi

# Install monorepo dependencies for both client and server
npm install
```

---

## 3. Environment Variables Configuration

Create a `.env` file in the repository root or in `server/.env` based on `.env.example`:

```bash
# Server Port & Mode
PORT=5000
NODE_ENV=development

# MongoDB Connection String (Atlas or Local)
# Leave blank to use development in-memory MongoDB
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/profitpilot?retryWrites=true&w=majority

# JWT Authentication Secret (Use a strong random 32+ character key)
JWT_SECRET=profitpilot_super_secure_jwt_secret_key_change_in_production_2026

# Allowed Frontend Origin for CORS
CLIENT_ORIGIN=http://localhost:5173

# Optional: Google Gemini API Key for AI Optimization Insights
# If left empty, ProfitPilot runs the built-in deterministic rules-based engine
AI_API_KEY=
AI_MODEL=gemini-1.5-flash
```

---

## 4. Running the Development Server

You can run both backend and frontend concurrently:

```bash
# Run both Server (port 5000) and Client (port 5173) concurrently
npm run dev
```

Or run them individually in separate terminal tabs:

```bash
# Terminal 1: Backend API
npm run dev:server

# Terminal 2: Frontend Vite App
npm run dev:client
```

Open your browser at **[http://localhost:5173](http://localhost:5173)**.

---

## 5. Instant Demo Data Seeding

When you register a new seller account, the store database will initially be empty:
1. Log in or create a seller account.
2. In the top navigation bar, click **"Seed Demo Store Data"** (or click the seed button on any empty state).
3. ProfitPilot will generate:
   - 6 products across Apparel, Footwear, Electronics, and Home categories with realistic unit economics
   - 16 orders with realistic channels (Shopify, Instagram, Direct Website) and statuses
   - Returns with physical restock condition and reverse freight
   - Courier shipments (Delhivery, Bluedart, Shiprocket)
   - Real business expenses (Meta ads, Google ads, packaging boxes, SaaS subscriptions)
4. Your Executive Overview, Charts, Analytics, and AI Insights will instantly light up with live figures.

---

## 6. Running Automated Tests

Run the full automated test suite (Financial Engine calculations, Auth, Multi-tenant seller isolation, API CRUD, CSV exports):

```bash
# Run all Vitest suites
npm run test:server
```

Run TypeScript verification:

```bash
# Typecheck backend
npm --workspace=server run typecheck

# Typecheck frontend
npm --workspace=client run typecheck
```

Build production bundles:

```bash
# Build both frontend and backend
npm run build
```
