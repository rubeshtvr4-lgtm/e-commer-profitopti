import mongoose from 'mongoose';
import { Product } from '../models/Product.js';
import { Order } from '../models/Order.js';
import { Return } from '../models/Return.js';
import { Shipment } from '../models/Shipment.js';
import { Expense } from '../models/Expense.js';
import { toPaise } from '../utils/currency.js';

export class DemoDataService {
  public static async seedDemoData(ownerId: mongoose.Types.ObjectId): Promise<{
    productsCount: number;
    ordersCount: number;
    returnsCount: number;
    shipmentsCount: number;
    expensesCount: number;
  }> {
    // 1. Clear existing data for this seller only
    await Promise.all([
      Product.deleteMany({ ownerId }),
      Order.deleteMany({ ownerId }),
      Return.deleteMany({ ownerId }),
      Shipment.deleteMany({ ownerId }),
      Expense.deleteMany({ ownerId }),
    ]);

    // 2. Create Realistic Products
    const products = await Product.create([
      {
        ownerId,
        name: 'Oversized Vintage Cotton Tee',
        SKU: 'TEE-OVR-BLK-01',
        category: 'Apparel',
        sellingPrice: toPaise(1199),
        unitCost: toPaise(380),
        stockQuantity: 120,
        active: true,
      },
      {
        ownerId,
        name: 'Everyday Minimalist Canvas Tote',
        SKU: 'ACC-TOTE-ECRU-02',
        category: 'Accessories',
        sellingPrice: toPaise(799),
        unitCost: toPaise(210),
        stockQuantity: 85,
        active: true,
      },
      {
        ownerId,
        name: 'Active Comfort Running Shoes',
        SKU: 'FTW-RUN-SLV-03',
        category: 'Footwear',
        sellingPrice: toPaise(2999),
        unitCost: toPaise(1250),
        stockQuantity: 40,
        active: true,
      },
      {
        ownerId,
        name: 'MagSafe Wireless Charging Pad',
        SKU: 'ELC-CHG-WHT-04',
        category: 'Electronics',
        sellingPrice: toPaise(1599),
        unitCost: toPaise(720),
        stockQuantity: 65,
        active: true,
      },
      {
        ownerId,
        name: 'Handcrafted Ceramic Coffee Mug',
        SKU: 'HOM-MUG-TERRA-05',
        category: 'Home & Living',
        sellingPrice: toPaise(599),
        unitCost: toPaise(490), // Low margin product intentionally!
        stockQuantity: 28,
        active: true,
      },
      {
        ownerId,
        name: 'Waterproof Travel Duffle Bag',
        SKU: 'ACC-DUFF-NVY-06',
        category: 'Accessories',
        sellingPrice: toPaise(2499),
        unitCost: toPaise(890),
        stockQuantity: 15,
        active: true,
      },
    ]);

    // 3. Create Orders spanning past 30 days
    const channels: ('Shopify' | 'Instagram' | 'website')[] = ['Shopify', 'Instagram', 'website'];
    const customers = [
      { name: 'Aditya Sharma', email: 'aditya.sharma@example.com', phone: '+91 98765 43210', city: 'Bengaluru', state: 'Karnataka' },
      { name: 'Priya Sundaram', email: 'priya.s@example.com', phone: '+91 98112 34567', city: 'Chennai', state: 'Tamil Nadu' },
      { name: 'Rohan Mehta', email: 'rohan.m@example.com', phone: '+91 98220 98765', city: 'Mumbai', state: 'Maharashtra' },
      { name: 'Ananya Patel', email: 'ananya.p@example.com', phone: '+91 99001 12233', city: 'Ahmedabad', state: 'Gujarat' },
      { name: 'Vikram Verma', email: 'vikram.v@example.com', phone: '+91 98711 55443', city: 'Delhi', state: 'Delhi' },
      { name: 'Sneha Rao', email: 'sneha.r@example.com', phone: '+91 98450 77889', city: 'Hyderabad', state: 'Telangana' },
    ];

    const ordersToInsert: any[] = [];
    const now = Date.now();

    for (let i = 1; i <= 16; i++) {
      const daysAgo = Math.floor(Math.random() * 25);
      const orderDate = new Date(now - daysAgo * 24 * 60 * 60 * 1000);
      const cust = customers[i % customers.length];
      const prod1 = products[i % products.length];
      const prod2 = products[(i + 2) % products.length];

      const isMultiItem = i % 3 === 0;
      const items = [
        {
          productId: prod1._id,
          nameSnapshot: prod1.name,
          skuSnapshot: prod1.SKU,
          quantity: 1 + (i % 2),
          unitSalePrice: prod1.sellingPrice,
          unitCostSnapshot: prod1.unitCost,
        },
      ];

      if (isMultiItem) {
        items.push({
          productId: prod2._id,
          nameSnapshot: prod2.name,
          skuSnapshot: prod2.SKU,
          quantity: 1,
          unitSalePrice: prod2.sellingPrice,
          unitCostSnapshot: prod2.unitCost,
        });
      }

      let status: 'delivered' | 'shipped' | 'pending' | 'cancelled' | 'returned' = 'delivered';
      let paymentStatus: 'paid' | 'pending' | 'cod' | 'refunded' = 'paid';

      if (i === 14) {
        status = 'cancelled';
        paymentStatus = 'refunded';
      } else if (i === 15 || i === 8) {
        status = 'returned';
        paymentStatus = 'refunded';
      } else if (i === 16) {
        status = 'pending';
        paymentStatus = 'pending';
      } else if (i === 12 || i === 13) {
        status = 'shipped';
        paymentStatus = 'cod';
      }

      ordersToInsert.push({
        ownerId,
        orderNumber: `ORD-${1000 + i}`,
        channel: channels[i % channels.length],
        orderDate,
        customer: cust,
        items,
        status,
        paymentStatus,
        shippingCost: toPaise(80 + (i % 3) * 20), // ₹80 - ₹120 seller courier fee
        shippingChargedToCustomer: i % 2 === 0 ? toPaise(50) : 0, // ₹50 shipping charged on some
        discountAmount: i % 4 === 0 ? toPaise(100) : 0,
        taxAmount: toPaise(60),
        advertisingCost: toPaise(90 + (i % 4) * 30), // ₹90 - ₹180 order ad spend
        notes: `Demo order #${1000 + i}`,
      });
    }

    const createdOrders = await Order.insertMany(ordersToInsert);

    // 4. Create Returns for returned orders
    const returnsToInsert: any[] = [];
    const returnedOrders = createdOrders.filter((o) => o.status === 'returned');

    if (returnedOrders.length > 0) {
      // Return 1: Resalable, restocked
      const ord1 = returnedOrders[0];
      const item1 = ord1.items[0];
      returnsToInsert.push({
        ownerId,
        orderId: ord1._id,
        returnedItems: [
          {
            sku: item1.skuSnapshot,
            name: item1.nameSnapshot,
            quantity: 1,
            unitCostSnapshot: item1.unitCostSnapshot,
          },
        ],
        returnReason: 'Customer requested size exchange',
        refundAmount: item1.unitSalePrice,
        shippingRefundAmount: 0,
        reverseShippingCost: toPaise(90),
        inventoryRecoveryStatus: 'restocked',
        returnedCondition: 'resalable',
        status: 'completed',
        returnDate: new Date(ord1.orderDate.getTime() + 4 * 24 * 3600 * 1000),
      });

      if (returnedOrders.length > 1) {
        // Return 2: Damaged stock, written off
        const ord2 = returnedOrders[1];
        const item2 = ord2.items[0];
        returnsToInsert.push({
          ownerId,
          orderId: ord2._id,
          returnedItems: [
            {
              sku: item2.skuSnapshot,
              name: item2.nameSnapshot,
              quantity: 1,
              unitCostSnapshot: item2.unitCostSnapshot,
            },
          ],
          returnReason: 'Item arrived with transit scuffs',
          refundAmount: item2.unitSalePrice,
          shippingRefundAmount: toPaise(50),
          reverseShippingCost: toPaise(100),
          inventoryRecoveryStatus: 'damaged_written_off',
          returnedCondition: 'damaged',
          status: 'completed',
          returnDate: new Date(ord2.orderDate.getTime() + 3 * 24 * 3600 * 1000),
        });
      }
    }

    const createdReturns = await Return.insertMany(returnsToInsert);

    // 5. Create Shipments
    const shipmentsToInsert: any[] = [];
    const couriers = ['Delhivery', 'Bluedart', 'Shiprocket', 'Ekart Logistics'];

    for (let i = 0; i < Math.min(8, createdOrders.length); i++) {
      const ord = createdOrders[i];
      if (ord.status === 'cancelled') continue;

      shipmentsToInsert.push({
        ownerId,
        orderId: ord._id,
        courier: couriers[i % couriers.length],
        trackingNumber: `TRK${8920100 + i}`,
        shippingCost: ord.shippingCost,
        reverseShippingCost: ord.status === 'returned' ? toPaise(90) : 0,
        shipmentStatus: ord.status === 'delivered' ? 'delivered' : 'in_transit',
        dispatchDate: new Date(ord.orderDate.getTime() + 1 * 24 * 3600 * 1000),
        deliveryDate: ord.status === 'delivered' ? new Date(ord.orderDate.getTime() + 4 * 24 * 3600 * 1000) : undefined,
        weightGrams: 350 + i * 50,
      });
    }

    const createdShipments = await Shipment.insertMany(shipmentsToInsert);

    // 6. Create Overhead & Business Expenses
    const expensesToInsert = [
      {
        ownerId,
        category: 'advertising' as const,
        amount: toPaise(4500),
        date: new Date(now - 14 * 24 * 3600 * 1000),
        description: 'Meta Advantage+ Catalog Campaign',
      },
      {
        ownerId,
        category: 'advertising' as const,
        amount: toPaise(3200),
        date: new Date(now - 6 * 24 * 3600 * 1000),
        description: 'Google Performance Max Search Ads',
      },
      {
        ownerId,
        category: 'packaging' as const,
        amount: toPaise(1850),
        date: new Date(now - 20 * 24 * 3600 * 1000),
        description: 'Custom Corrugated Mailer Boxes (100 units)',
      },
      {
        ownerId,
        category: 'software' as const,
        amount: toPaise(2100),
        date: new Date(now - 25 * 24 * 3600 * 1000),
        description: 'Shopify Basic & Email Marketing Suite',
      },
      {
        ownerId,
        category: 'operations' as const,
        amount: toPaise(1500),
        date: new Date(now - 10 * 24 * 3600 * 1000),
        description: 'Thermal Printer Barcode Labels & Tape',
      },
    ];

    const createdExpenses = await Expense.insertMany(expensesToInsert);

    return {
      productsCount: products.length,
      ordersCount: createdOrders.length,
      returnsCount: createdReturns.length,
      shipmentsCount: createdShipments.length,
      expensesCount: createdExpenses.length,
    };
  }
}
