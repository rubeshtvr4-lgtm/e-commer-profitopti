import { z } from 'zod';

// ==================== AUTH SCHEMAS ====================
export const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(60),
    email: z.string().email('Please enter a valid email address').toLowerCase(),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    businessName: z.string().min(2, 'Business name must be at least 2 characters').max(100),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address').toLowerCase(),
    password: z.string().min(1, 'Password is required'),
  }),
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address').toLowerCase(),
  }),
});

export const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string().min(1, 'Reset token is required'),
    newPassword: z.string().min(6, 'Password must be at least 6 characters'),
  }),
});

export const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    businessName: z.string().min(2).optional(),
    currency: z.string().max(5).optional(),
    timezone: z.string().max(50).optional(),
    expenseCategories: z.array(z.string()).optional(),
  }),
});

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(6, 'New password must be at least 6 characters'),
  }),
});

// ==================== PRODUCT SCHEMAS ====================
export const createProductSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Product name is required').max(150),
    SKU: z.string().min(1, 'SKU is required').max(50).toUpperCase(),
    category: z.string().default('General'),
    sellingPrice: z.number().min(0, 'Selling price must be 0 or greater'), // In major units from frontend (e.g. 999.00)
    unitCost: z.number().min(0, 'Unit cost must be 0 or greater'),       // In major units from frontend (e.g. 450.00)
    stockQuantity: z.number().int().min(0).default(0),
    active: z.boolean().default(true),
  }),
});

export const updateProductSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(150).optional(),
    SKU: z.string().min(1).max(50).toUpperCase().optional(),
    category: z.string().optional(),
    sellingPrice: z.number().min(0).optional(),
    unitCost: z.number().min(0).optional(),
    stockQuantity: z.number().int().min(0).optional(),
    active: z.boolean().optional(),
  }),
});

// ==================== ORDER SCHEMAS ====================
const orderItemInputSchema = z.object({
  productId: z.string().optional(),
  nameSnapshot: z.string().min(1),
  skuSnapshot: z.string().min(1),
  quantity: z.number().int().min(1),
  unitSalePrice: z.number().min(0),     // in major currency
  unitCostSnapshot: z.number().min(0),  // in major currency
});

export const createOrderSchema = z.object({
  body: z.object({
    orderNumber: z.string().min(1, 'Order number is required').max(50),
    channel: z.enum(['Instagram', 'Shopify', 'website', 'marketplace', 'WhatsApp', 'other']).default('website'),
    orderDate: z.string().datetime().or(z.string()).optional(),
    customer: z
      .object({
        name: z.string().optional(),
        email: z.string().email().optional().or(z.literal('')),
        phone: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
      })
      .optional(),
    items: z.array(orderItemInputSchema).min(1, 'At least one line item is required'),
    status: z
      .enum(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'])
      .default('pending'),
    paymentStatus: z.enum(['pending', 'paid', 'cod', 'refunded']).default('pending'),
    shippingCost: z.number().min(0).default(0),              // major units
    shippingChargedToCustomer: z.number().min(0).default(0), // major units
    discountAmount: z.number().min(0).default(0),            // major units
    taxAmount: z.number().min(0).default(0),                 // major units
    advertisingCost: z.number().min(0).default(0),           // major units
    notes: z.string().optional(),
  }),
});

export const updateOrderSchema = z.object({
  body: z.object({
    orderNumber: z.string().min(1).max(50).optional(),
    channel: z.enum(['Instagram', 'Shopify', 'website', 'marketplace', 'WhatsApp', 'other']).optional(),
    orderDate: z.string().optional(),
    customer: z
      .object({
        name: z.string().optional(),
        email: z.string().email().optional().or(z.literal('')),
        phone: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
      })
      .optional(),
    items: z.array(orderItemInputSchema).optional(),
    status: z
      .enum(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'])
      .optional(),
    paymentStatus: z.enum(['pending', 'paid', 'cod', 'refunded']).optional(),
    shippingCost: z.number().min(0).optional(),
    shippingChargedToCustomer: z.number().min(0).optional(),
    discountAmount: z.number().min(0).optional(),
    taxAmount: z.number().min(0).optional(),
    advertisingCost: z.number().min(0).optional(),
    notes: z.string().optional(),
  }),
});

export const updateOrderStatusSchema = z.object({
  body: z.object({
    status: z.enum(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned']),
    paymentStatus: z.enum(['pending', 'paid', 'cod', 'refunded']).optional(),
  }),
});

// ==================== RETURN SCHEMAS ====================
export const createReturnSchema = z.object({
  body: z.object({
    orderId: z.string().min(1, 'Order ID is required'),
    returnedItems: z.array(
      z.object({
        sku: z.string().min(1),
        name: z.string().min(1),
        quantity: z.number().int().min(1),
        unitCostSnapshot: z.number().min(0), // major currency
      })
    ).min(1),
    returnReason: z.string().min(1, 'Return reason is required'),
    refundAmount: z.number().min(0).default(0),             // major currency
    shippingRefundAmount: z.number().min(0).default(0),     // major currency
    reverseShippingCost: z.number().min(0).default(0),      // major currency
    inventoryRecoveryStatus: z
      .enum(['pending_inspection', 'restocked', 'damaged_written_off'])
      .default('pending_inspection'),
    returnedCondition: z
      .enum(['resalable', 'damaged', 'missing_parts', 'unopened'])
      .default('resalable'),
    status: z.enum(['requested', 'approved', 'received', 'completed', 'rejected']).default('received'),
    returnDate: z.string().optional(),
    notes: z.string().optional(),
  }),
});

export const updateReturnSchema = z.object({
  body: z.object({
    inventoryRecoveryStatus: z
      .enum(['pending_inspection', 'restocked', 'damaged_written_off'])
      .optional(),
    returnedCondition: z
      .enum(['resalable', 'damaged', 'missing_parts', 'unopened'])
      .optional(),
    status: z.enum(['requested', 'approved', 'received', 'completed', 'rejected']).optional(),
    refundAmount: z.number().min(0).optional(),
    reverseShippingCost: z.number().min(0).optional(),
    notes: z.string().optional(),
  }),
});

// ==================== SHIPMENT SCHEMAS ====================
export const createShipmentSchema = z.object({
  body: z.object({
    orderId: z.string().min(1, 'Order ID is required'),
    courier: z.string().min(1, 'Courier name is required'),
    trackingNumber: z.string().min(1, 'Tracking number is required'),
    shippingCost: z.number().min(0).default(0),        // major currency
    reverseShippingCost: z.number().min(0).default(0), // major currency
    shipmentStatus: z
      .enum([
        'manifested',
        'picked_up',
        'in_transit',
        'out_for_delivery',
        'delivered',
        'rto_initiated',
        'rto_delivered',
        'failed',
      ])
      .default('manifested'),
    dispatchDate: z.string().optional(),
    deliveryDate: z.string().optional(),
    weightGrams: z.number().min(0).optional(),
    notes: z.string().optional(),
  }),
});

export const updateShipmentSchema = z.object({
  body: z.object({
    courier: z.string().optional(),
    trackingNumber: z.string().optional(),
    shippingCost: z.number().min(0).optional(),
    reverseShippingCost: z.number().min(0).optional(),
    shipmentStatus: z
      .enum([
        'manifested',
        'picked_up',
        'in_transit',
        'out_for_delivery',
        'delivered',
        'rto_initiated',
        'rto_delivered',
        'failed',
      ])
      .optional(),
    dispatchDate: z.string().optional(),
    deliveryDate: z.string().optional(),
    weightGrams: z.number().min(0).optional(),
    notes: z.string().optional(),
  }),
});

// ==================== EXPENSE SCHEMAS ====================
export const createExpenseSchema = z.object({
  body: z.object({
    category: z.enum(['advertising', 'packaging', 'software', 'operations', 'shipping', 'salaries', 'other']),
    amount: z.number().min(0.01, 'Amount must be greater than zero'), // major currency
    date: z.string().optional(),
    description: z.string().min(1, 'Description is required').max(200),
    orderId: z.string().optional().or(z.literal('')),
  }),
});

export const updateExpenseSchema = z.object({
  body: z.object({
    category: z.enum(['advertising', 'packaging', 'software', 'operations', 'shipping', 'salaries', 'other']).optional(),
    amount: z.number().min(0.01).optional(),
    date: z.string().optional(),
    description: z.string().min(1).max(200).optional(),
    orderId: z.string().optional().or(z.literal('')),
  }),
});
