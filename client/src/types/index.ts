export interface User {
  id: string;
  name: string;
  email: string;
  businessName: string;
  currency: string;
  timezone: string;
  expenseCategories: string[];
}

export interface Product {
  id: string;
  _id?: string;
  name: string;
  SKU: string;
  category: string;
  sellingPrice: number; // in INR
  unitCost: number;     // in INR
  profitPerUnit?: number;
  profitMargin?: number;
  stockQuantity: number;
  active: boolean;
  createdAt?: string;
}

export interface OrderItem {
  productId?: string;
  nameSnapshot: string;
  skuSnapshot: string;
  quantity: number;
  unitSalePrice: number;     // in INR
  unitCostSnapshot: number;  // in INR
  totalSalePrice?: number;
}

export interface Customer {
  name?: string;
  email?: string;
  phone?: string;
  city?: string;
  state?: string;
}

export interface OrderFinancialBreakdown {
  orderId: string;
  orderNumber: string;
  orderDate: string;
  status: string;
  grossMerchandiseSales: number;
  netRevenue: number;
  adjustedProductCost: number;
  sellerPaidShippingPaise?: number;
  reverseShippingCostPaise?: number;
  advertisingCostPaise?: number;
  orderAttributableExpensesPaise?: number;
  totalDirectCostsPaise?: number;
  netProfit: number;
  profitMargin: number;
}

export interface Order {
  id: string;
  _id?: string;
  orderNumber: string;
  channel: 'Instagram' | 'Shopify' | 'website' | 'marketplace' | 'WhatsApp' | 'other';
  orderDate: string;
  customer?: Customer;
  items: OrderItem[];
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'returned';
  paymentStatus: 'pending' | 'paid' | 'cod' | 'refunded';
  shippingCost: number;
  shippingChargedToCustomer: number;
  discountAmount: number;
  taxAmount: number;
  advertisingCost: number;
  notes?: string;
  financials?: OrderFinancialBreakdown;
  returns?: ReturnRecord[];
  shipments?: ShipmentRecord[];
  expenses?: ExpenseRecord[];
  createdAt?: string;
}

export interface ReturnItem {
  sku: string;
  name: string;
  quantity: number;
  unitCostSnapshot: number;
}

export interface ReturnRecord {
  id: string;
  _id?: string;
  orderId: string;
  orderNumber?: string;
  returnedItems: ReturnItem[];
  returnReason: string;
  refundAmount: number;
  shippingRefundAmount: number;
  reverseShippingCost: number;
  inventoryRecoveryStatus: 'pending_inspection' | 'restocked' | 'damaged_written_off';
  returnedCondition: 'resalable' | 'damaged' | 'missing_parts' | 'unopened';
  status: 'requested' | 'approved' | 'received' | 'completed' | 'rejected';
  returnDate: string;
  notes?: string;
  createdAt?: string;
}

export interface ShipmentRecord {
  id: string;
  _id?: string;
  orderId: string;
  orderNumber?: string;
  courier: string;
  trackingNumber: string;
  shippingCost: number;
  reverseShippingCost: number;
  shipmentStatus:
    | 'manifested'
    | 'picked_up'
    | 'in_transit'
    | 'out_for_delivery'
    | 'delivered'
    | 'rto_initiated'
    | 'rto_delivered'
    | 'failed';
  dispatchDate?: string;
  deliveryDate?: string;
  weightGrams?: number;
  notes?: string;
  createdAt?: string;
}

export interface ExpenseRecord {
  id: string;
  _id?: string;
  category: 'advertising' | 'packaging' | 'software' | 'operations' | 'shipping' | 'salaries' | 'other';
  amount: number;
  date: string;
  description: string;
  orderId?: string;
  orderNumber?: string;
  createdAt?: string;
}

export interface StoreFinancialSummary {
  period: {
    startDate?: string;
    endDate?: string;
  };
  totalOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  returnedOrders: number;
  pendingOrders: number;
  returnRatePercent: number;

  grossMerchandiseSales: number;
  netRevenue: number;
  totalProductCost: number;
  totalShipping: number;
  totalAdvertising: number;
  totalOverhead: number;
  netProfit: number;
  profitMargin: number;
}

export interface AiRecommendation {
  id: string;
  type: 'danger' | 'warning' | 'opportunity' | 'info';
  title: string;
  description: string;
  metricImpact?: string;
  recommendedAction: string;
}

export interface AiInsightsResult {
  source: 'ai_llm' | 'deterministic_engine';
  periodAnalysed: string;
  summaryHighlights: string[];
  recommendations: AiRecommendation[];
  disclaimer: string;
  isFallback: boolean;
  message?: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
