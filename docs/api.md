# ProfitPilot — REST API Reference

All APIs are versioned under the `/api/v1` prefix. All requests and responses use `application/json` unless downloading CSV files.

---

## Base URL & Headers

- Base URL: `http://localhost:5000/api/v1`
- Authentication Header: `Authorization: Bearer <token>` OR `Cookie: token=<jwt>`

---

## 1. Authentication Endpoints

### `POST /auth/register`
Creates a new seller account. Returns user info, JWT token, and sets HttpOnly cookie.
```json
{
  "name": "Siddharth Verma",
  "email": "sid@urbanthreads.com",
  "password": "Password123!",
  "businessName": "Urban Threads"
}
```

### `POST /auth/login`
Authenticates existing seller. Sets HttpOnly cookie.
```json
{
  "email": "sid@urbanthreads.com",
  "password": "Password123!"
}
```

### `POST /auth/logout`
Clears session cookie.

### `GET /auth/me`
Returns current authenticated user identity and settings.

### `POST /auth/forgot-password`
Generates cryptographically hashed reset token.
```json
{
  "email": "sid@urbanthreads.com"
}
```

### `POST /auth/reset-password`
Consumes token to set a new password.
```json
{
  "token": "a4f89d...",
  "newPassword": "NewStrongPassword123!"
}
```

---

## 2. Products Endpoints

### `GET /products`
Query params: `page`, `limit`, `search`, `category`, `active`
Returns paginated products list with unit costs, selling prices, and margin metrics.

### `POST /products`
Creates a new SKU in inventory.
```json
{
  "name": "Oversized Vintage Tee",
  "SKU": "TEE-VNT-BLK",
  "category": "Apparel",
  "sellingPrice": 1199,
  "unitCost": 380,
  "stockQuantity": 80,
  "active": true
}
```

### `GET /products/:id`
Returns individual product along with historical unit sales, revenue, return rate, and realized profit.

### `PATCH /products/:id`
Updates product metadata, price, or stock levels.

### `DELETE /products/:id`
Removes product SKU.

---

## 3. Orders Endpoints

### `GET /orders`
Query params: `page`, `limit`, `search`, `status`, `channel`, `startDate`, `endDate`
Returns paginated orders enriched with line item economics and net profit breakdown.

### `POST /orders`
Creates order and snapshots unit costs.
```json
{
  "orderNumber": "ORD-2041",
  "channel": "Shopify",
  "customer": {
    "name": "Priya Sharma",
    "email": "priya@example.com",
    "city": "Bengaluru"
  },
  "items": [
    {
      "productId": "65b...",
      "nameSnapshot": "Oversized Vintage Tee",
      "skuSnapshot": "TEE-VNT-BLK",
      "quantity": 2,
      "unitSalePrice": 1199,
      "unitCostSnapshot": 380
    }
  ],
  "status": "delivered",
  "shippingCost": 80,
  "shippingChargedToCustomer": 50,
  "discountAmount": 100,
  "advertisingCost": 120
}
```

### `GET /orders/:id`
Returns full order with financial waterfall calculation and associated returns/shipments.

### `PATCH /orders/:id/status`
Updates order state:
```json
{
  "status": "delivered",
  "paymentStatus": "paid"
}
```

### `POST /orders/:id/returns`
Records full or partial return on an order:
```json
{
  "returnedItems": [
    {
      "sku": "TEE-VNT-BLK",
      "name": "Oversized Vintage Tee",
      "quantity": 1,
      "unitCostSnapshot": 380
    }
  ],
  "returnReason": "Customer requested size exchange",
  "refundAmount": 1199,
  "reverseShippingCost": 90,
  "returnedCondition": "resalable",
  "inventoryRecoveryStatus": "restocked"
}
```

---

## 4. Analytics Endpoints

- `GET /analytics/overview?startDate=...&endDate=...`: Real-time financial summary KPIs, low-margin alerts.
- `GET /analytics/trends?days=30`: Daily time-series breakdown of revenue, COGS, shipping, and net profit.
- `GET /analytics/products`: Product profitability league table.
- `GET /analytics/returns`: Return rate and root cause breakdown.
- `GET /analytics/expenses`: Operating overhead category allocation.

---

## 5. AI Business Insights

### `POST /ai/insights`
Body (optional): `{ "startDate": "...", "endDate": "..." }`
Invokes the backend-only AI optimization engine using minimum anonymized aggregate data. Returns structured recommendations with financial impacts.

---

## 6. Reports (CSV Exports)

- `GET /reports/orders.csv?status=...`: Streams formatted orders ledger as CSV.
- `GET /reports/profitability.csv`: Streams SKU profitability matrix as CSV.

---

## 7. Demo Data Seeding

### `POST /demo/seed`
One-click seeding of realistic e-commerce products, orders, returns, shipments, and expenses for the authenticated seller.
