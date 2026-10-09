# ProfitPilot Financial Engine Rules & Accounting Specification

## 1. Currency & Precision Standard
- All monetary fields in the database are stored as **integer minor currency units** (e.g. **paise** for INR, where `1 INR = 100 paise`, or cents for USD).
- Using integer minor units eliminates floating-point rounding drifts (e.g., `0.1 + 0.2 !== 0.3`) in financial aggregates.
- For display, values are converted to standard currency units using half-up standard decimal rounding:
  $$\text{Major Units} = \frac{\text{Paise}}{100}$$

---

## 2. Order-Level Financial Calculation Formulas

For each order $i$, the engine computes the following core variables:

### 2.1 Gross Merchandise Sales (GMS)
$$\text{GrossMerchandiseSales} = \sum_{j \in \text{items}} (\text{Quantity}_j \times \text{UnitSalePrice}_j)$$

### 2.2 Net Merchandise Sales
$$\text{NetMerchandiseSales} = \max(0, \text{GrossMerchandiseSales} - \text{Discounts} - \text{MerchandiseRefunds})$$

### 2.3 Net Revenue
$$\text{NetRevenue} = \text{NetMerchandiseSales} + \text{ShippingChargedToCustomer} - \text{ShippingRefunds}$$

*(Note: Taxes collected from customers on behalf of government authorities are segregated and not treated as net revenue).*

### 2.4 Product Cost of Goods Sold (Adjusted COGS)
$$\text{BaselineCOGS} = \sum_{j \in \text{items}} (\text{Quantity}_j \times \text{UnitCostSnapshot}_j)$$
$$\text{RecoveredInventoryValue} = \sum_{r \in \text{returns}} \sum_{k \in r.\text{items}} (\text{RecoveredQty}_k \times \text{UnitCostSnapshot}_k) \quad \text{if condition} = \text{'resalable' and status} = \text{'restocked'}$$
$$\text{ProductCost} = \max(0, \text{BaselineCOGS} - \text{RecoveredInventoryValue})$$

### 2.5 Attributable Direct Order Costs
$$\text{DirectOrderCosts} = \text{SellerPaidShipping} + \text{AdvertisingCost} + \text{ReverseLogisticsCost} + \text{NonRecoveredReturnLosses} + \text{AttributableExpenses}$$

Where:
- $\text{SellerPaidShipping}$: Outward courier freight paid by the merchant.
- $\text{AdvertisingCost}$: Order-level customer acquisition or ad spend attributed to this order.
- $\text{ReverseLogisticsCost}$: Return shipping fee charged by courier.
- $\text{NonRecoveredReturnLosses}$: Value of damaged goods written off + unrecovered packaging.
- $\text{AttributableExpenses}$: Specific packaging or custom order expenses tied to this order ID.

### 2.6 Net Profit & Profit Margin
$$\text{NetProfit} = \text{NetRevenue} - \text{ProductCost} - \text{DirectOrderCosts}$$

$$\text{ProfitMargin (\%)} = \begin{cases} 
\frac{\text{NetProfit}}{\text{NetRevenue}} \times 100 & \text{if } \text{NetRevenue} > 0 \\
0\% & \text{if } \text{NetRevenue} \le 0 \text{ and } \text{NetProfit} = 0 \\
-100\% & \text{if } \text{NetRevenue} \le 0 \text{ and } \text{NetProfit} < 0
\end{cases}$$

---

## 3. Double-Counting Prevention Rules

1. **Refund Isolation**:
   - Merchandise refunds reduce `NetMerchandiseSales` strictly once.
   - Separate tracking exists for `merchandiseRefund` vs `shippingRefund`.
2. **Inventory Recovery Condition**:
   - A returned unit does NOT deduct from baseline COGS unless its condition is verified as `resalable` and restock status is `restocked`.
   - If a returned unit is `damaged` or `written_off`, the COGS remains incurred and represents an inventory loss.
3. **Expense Segregation**:
   - Expenses with an `orderId` reference are classified as **Order-Attributable Expenses**.
   - Store-level general expenses (e.g., monthly SaaS subscriptions, warehouse rent, creator sponsorships) have `orderId = null` and are aggregated solely at the store-level aggregate P&L.
   - The engine explicitly excludes order-linked expenses from general overhead calculations to prevent double deductions.
4. **Courier Shipping Reconciliation**:
   - Forward shipping charges are captured either on the `Order` or in linked `Shipment` records without duplicate addition.

---

## 4. Lifecycle & Order Status Handling

- **Delivered**: Full revenue, COGS, and shipping recognized.
- **Cancelled (Pre-dispatch)**: Net revenue = 0, COGS = 0, Courier shipping = 0, Merchant refund = 100%. If non-refundable payment processing fees occurred, they are retained as a loss.
- **Cancelled / RTO (In-transit / Post-dispatch)**: Net merchandise revenue = 0, Forward courier fee incurred, Reverse courier fee incurred, Stock fully recovered once returned to warehouse.
- **Returned (Partial or Full)**: Pro-rated refund deducted from revenue, reverse shipping added to direct costs, inventory restock adjusted based on physical inspection status.
