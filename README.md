# ProfitPilot — E-commerce Order & Profit Optimizer

> **Production-Ready Full-Stack SaaS for Small-Business E-commerce Merchants**  
> Accurate unit economics, net profit attribution, courier logistics, ad spend tracking, and AI-driven cost-saving insights.

---

## ⚡ Overview

Most e-commerce merchants monitor vanity metrics like Gross Merchandise Value (GMV) while operating at unexpected net losses due to courier freight charges, customer returns, packaging, advertising burn (CAC), and damaged inventory write-offs.

**ProfitPilot** replaces imprecise spreadsheets with an automated, auditable, and deterministic financial accounting platform. Every order is evaluated down to its exact product unit cost snapshot, forward shipping, reverse courier fees, discounts, and order-attributed ad spend.

---

## 🌟 Key Features

### 1. Executive Profit & Loss Dashboard
- Real-time aggregation of **Gross Sales**, **Net Revenue**, **Adjusted COGS**, **Seller Shipping**, **Ad Spend**, and **Realized Net Profit**.
- Live Profit Margin % gauge with alert thresholds (`Emerald >20%`, `Amber 15–20%`, `Red <15%`).
- Visual time-series revenue trajectory vs net profit and proportional expense breakdown donut chart.
- Proactive low-margin SKU alerts and low-stock warnings.

### 2. Multi-Channel Order Unit Economics
- Supports Instagram, Shopify, Website Direct, WhatsApp, and Marketplaces.
- Immutable unit cost snapshots at the time of purchase (protects historical accuracy against future supplier price changes).
- Per-order financial calculation waterfall modal.
- One-click order status transitions (Delivered, Shipped, Processing, Pending, Cancelled, Returned).

### 3. Inventory SKU Catalog & Margin Optimization
- SKU-level gross profit margin analysis.
- Live tracking of units sold, units returned, return rate %, and net profit contribution.
- Real-time margin preview when setting selling prices and manufacturer unit costs.

### 4. Returns & Inventory Recovery Engine
- Accurately reconciles customer refunds, merchant-paid reverse courier freight, and restock inspection condition.
- **Strict Accounting Rule**: If returned stock is marked `resalable` and `restocked`, the COGS is automatically credited back to store inventory. If marked `damaged` or `written_off`, the inventory cost remains a net loss.

### 5. Courier Logistics & Tracking
- Manages Delhivery, Bluedart, Shiprocket, and Ekart consignments.
- Reconciles forward freight vs reverse logistics fees.
- Real-time delivery status updates with RTO (Return to Origin) tracking.

### 6. Operating Overhead & Double-Counting Prevention
- Tracks marketing campaigns (Meta Ads, Google Ads), packaging mailers, SaaS subscriptions, and warehouse labor.
- **Double-Counting Prevention Engine**: Order-attributable expenses (e.g. gift wrap or order ad spend) are isolated from store-level general overhead to guarantee expenses are deducted exactly once.

### 7. AI Business Optimization Insights
- Server-side only proxy to Google Gemini API using minimum anonymized, aggregate metrics (no customer PII is ever sent).
- Identifies high-sales/low-margin SKUs, elevated return rates, excessive courier burdens, and high CAC.
- **Deterministic Rules Fallback**: If no AI API key is configured or the provider experiences network issues, the application automatically runs its embedded rules-based financial heuristics engine.

### 8. Audited CSV Exports
- Export filtered orders ledger as CSV.
- Export complete product profitability league table as CSV.

### 9. One-Click Demo Store Data Seeding
- Onboarding state includes a single-click **"Seed Demo Store Data"** button that populates realistic products, orders, returns, shipments, and expenses in MongoDB so evaluators can instantly inspect the live dashboard and charts.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, TypeScript, Tailwind CSS, Lucide Icons, Recharts, React Router v7 |
| **Backend** | Node.js, Express, TypeScript, Mongoose, Zod, Helmet, Morgan, Express Rate Limit |
| **Database** | MongoDB Atlas (with in-memory development fallback) |
| **Security** | bcrypt (12 salt rounds), JWT HttpOnly cookies, SameSite, CORS origin isolation |
| **Testing** | Vitest, Supertest (27 automated integration & unit tests) |

---

## 📐 Mathematical Financial Formulas

All internal calculations operate in **integer minor currency units (paise)** to eliminate floating-point drift:

$$\text{GrossMerchandiseSales} = \sum (\text{Quantity} \times \text{UnitSalePrice})$$
$$\text{NetMerchandiseSales} = \max(0, \text{GrossMerchandiseSales} - \text{Discounts} - \text{MerchandiseRefunds})$$
$$\text{NetRevenue} = \text{NetMerchandiseSales} + \text{ShippingChargedToCustomer} - \text{ShippingRefunds}$$
$$\text{ProductCost} = \max(0, \text{BaselineCOGS} - \text{RecoveredInventoryValue})$$
$$\text{NetProfit} = \text{NetRevenue} - \text{ProductCost} - \text{SellerPaidShipping} - \text{AdCost} - \text{ReverseShipping} - \text{Overhead}$$
$$\text{ProfitMargin (\%)} = \frac{\text{NetProfit}}{\text{NetRevenue}} \times 100 \quad (\text{when NetRevenue} > 0)$$

*For full documentation, see [docs/financial-rules.md](file:///c:/Users/Abinaya/Desktop/e-comer-optmi/docs/financial-rules.md).*

---

## 🚀 Quick Start (Local Setup)

```bash
# 1. Clone repository and install dependencies
git clone <repo-url>
cd e-comer-optmi
npm install

# 2. Run backend & frontend concurrently
npm run dev
```

Visit **[http://localhost:5173](http://localhost:5173)** in your browser.

- Sign up with any email or log in.
- Click **"Seed Demo Store Data"** in the top navigation bar to populate realistic multi-channel store data!

---

## 🧪 Automated Test Results

Run the automated test suite covering financial logic, authentication security, and multi-tenant seller isolation:

```bash
npm run test:server
```

### Verified Test Results:
```text
✓ tests/financialEngine.test.ts (7 tests)
✓ tests/api.test.ts (7 tests)
✓ tests/authorization.test.ts (7 tests)
✓ tests/auth.test.ts (6 tests)

Test Files  4 passed (4)
     Tests  27 passed (27)
```

---

## 📚 Documentation Links

- [Setup & Local Development](file:///c:/Users/Abinaya/Desktop/e-comer-optmi/docs/setup.md)
- [REST API Reference](file:///c:/Users/Abinaya/Desktop/e-comer-optmi/docs/api.md)
- [Financial Calculation Rules](file:///c:/Users/Abinaya/Desktop/e-comer-optmi/docs/financial-rules.md)
- [Production Deployment Guide (Render, Vercel, Atlas)](file:///c:/Users/Abinaya/Desktop/e-comer-optmi/docs/deployment.md)
