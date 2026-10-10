import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { Return } from '../models/Return.js';
import { Shipment } from '../models/Shipment.js';
import { Expense } from '../models/Expense.js';
import { FinancialEngine } from '../services/financialEngine.js';
import { toPaise, toRupees } from '../utils/currency.js';
export async function listOrders(req, res) {
    const ownerId = req.ownerId;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const search = (req.query.search || '').trim();
    const status = (req.query.status || '').trim();
    const channel = (req.query.channel || '').trim();
    const startDate = req.query.startDate ? new Date(req.query.startDate) : null;
    const endDate = req.query.endDate ? new Date(req.query.endDate) : null;
    const filter = { ownerId };
    if (status && status !== 'all') {
        filter.status = status;
    }
    if (channel && channel !== 'all') {
        filter.channel = channel;
    }
    if (startDate || endDate) {
        filter.orderDate = {};
        if (startDate)
            filter.orderDate.$gte = startDate;
        if (endDate) {
            const endOfDay = new Date(endDate);
            endOfDay.setHours(23, 59, 59, 999);
            filter.orderDate.$lte = endOfDay;
        }
    }
    if (search) {
        filter.$or = [
            { orderNumber: { $regex: search, $options: 'i' } },
            { 'customer.name': { $regex: search, $options: 'i' } },
            { 'customer.email': { $regex: search, $options: 'i' } },
            { 'customer.phone': { $regex: search, $options: 'i' } },
        ];
    }
    const [total, orders] = await Promise.all([
        Order.countDocuments(filter),
        Order.find(filter)
            .sort({ orderDate: -1, createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean(),
    ]);
    // Bulk query associated returns, shipments, and expenses for accurate financial summary
    const orderIds = orders.map((o) => o._id);
    const [returns, shipments, expenses] = await Promise.all([
        Return.find({ ownerId, orderId: { $in: orderIds } }).lean(),
        Shipment.find({ ownerId, orderId: { $in: orderIds } }).lean(),
        Expense.find({ ownerId, orderId: { $in: orderIds } }).lean(),
    ]);
    const returnsMap = new Map();
    returns.forEach((r) => {
        const k = r.orderId.toString();
        const l = returnsMap.get(k) || [];
        l.push(r);
        returnsMap.set(k, l);
    });
    const shipmentsMap = new Map();
    shipments.forEach((s) => {
        const k = s.orderId.toString();
        const l = shipmentsMap.get(k) || [];
        l.push(s);
        shipmentsMap.set(k, l);
    });
    const expensesMap = new Map();
    expenses.forEach((e) => {
        const k = e.orderId?.toString();
        if (k) {
            const l = expensesMap.get(k) || [];
            l.push(e);
            expensesMap.set(k, l);
        }
    });
    const enrichedOrders = orders.map((ord) => {
        const k = ord._id.toString();
        const ordReturns = returnsMap.get(k) || [];
        const ordShipments = shipmentsMap.get(k) || [];
        const ordExpenses = expensesMap.get(k) || [];
        const financials = FinancialEngine.calculateOrderFinancials(ord, ordReturns, ordShipments, ordExpenses);
        return {
            ...ord,
            id: ord._id,
            financials,
            shippingCost: toRupees(ord.shippingCost),
            shippingChargedToCustomer: toRupees(ord.shippingChargedToCustomer),
            discountAmount: toRupees(ord.discountAmount),
            taxAmount: toRupees(ord.taxAmount),
            advertisingCost: toRupees(ord.advertisingCost),
            items: ord.items.map((i) => ({
                ...i,
                unitSalePrice: toRupees(i.unitSalePrice),
                unitCostSnapshot: toRupees(i.unitCostSnapshot),
                totalSalePrice: toRupees(i.quantity * i.unitSalePrice),
            })),
        };
    });
    res.json({
        success: true,
        data: {
            orders: enrichedOrders,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        },
    });
}
export async function createOrder(req, res) {
    const ownerId = req.ownerId;
    const { orderNumber, channel, orderDate, customer, items, status, paymentStatus, shippingCost, shippingChargedToCustomer, discountAmount, taxAmount, advertisingCost, notes, } = req.body;
    // Check unique orderNumber per seller
    const existing = await Order.findOne({ ownerId, orderNumber });
    if (existing) {
        res.status(409).json({
            success: false,
            error: `An order with number "${orderNumber}" already exists.`,
        });
        return;
    }
    // Build items with snapshots in minor units (paise)
    const preparedItems = [];
    for (const item of items) {
        let unitCostSnapshot = toPaise(item.unitCostSnapshot);
        let unitSalePrice = toPaise(item.unitSalePrice);
        let nameSnapshot = item.nameSnapshot;
        let skuSnapshot = item.skuSnapshot;
        // If productId is provided, lookup product to verify SKU and decrement inventory
        if (item.productId) {
            const prod = await Product.findOne({ _id: item.productId, ownerId });
            if (prod) {
                skuSnapshot = prod.SKU;
                nameSnapshot = prod.name;
                if (!item.unitCostSnapshot)
                    unitCostSnapshot = prod.unitCost;
                if (!item.unitSalePrice)
                    unitSalePrice = prod.sellingPrice;
                // Decrement stock
                prod.stockQuantity = Math.max(0, prod.stockQuantity - item.quantity);
                await prod.save();
            }
        }
        preparedItems.push({
            productId: item.productId,
            nameSnapshot,
            skuSnapshot: skuSnapshot.toUpperCase(),
            quantity: item.quantity,
            unitSalePrice,
            unitCostSnapshot,
        });
    }
    const order = await Order.create({
        ownerId,
        orderNumber,
        channel: channel || 'website',
        orderDate: orderDate ? new Date(orderDate) : new Date(),
        customer,
        items: preparedItems,
        status: status || 'pending',
        paymentStatus: paymentStatus || 'pending',
        shippingCost: toPaise(shippingCost || 0),
        shippingChargedToCustomer: toPaise(shippingChargedToCustomer || 0),
        discountAmount: toPaise(discountAmount || 0),
        taxAmount: toPaise(taxAmount || 0),
        advertisingCost: toPaise(advertisingCost || 0),
        notes,
    });
    const financials = FinancialEngine.calculateOrderFinancials(order, [], [], []);
    res.status(201).json({
        success: true,
        message: 'Order created successfully',
        data: {
            order: {
                ...order.toJSON(),
                id: order._id,
                financials,
            },
        },
    });
}
export async function getOrder(req, res) {
    const ownerId = req.ownerId;
    const order = await Order.findOne({ _id: req.params.id, ownerId });
    if (!order) {
        res.status(404).json({ success: false, error: 'Order not found.' });
        return;
    }
    const [returns, shipments, expenses] = await Promise.all([
        Return.find({ ownerId, orderId: order._id }).lean(),
        Shipment.find({ ownerId, orderId: order._id }).lean(),
        Expense.find({ ownerId, orderId: order._id }).lean(),
    ]);
    const financials = FinancialEngine.calculateOrderFinancials(order, returns, shipments, expenses);
    res.json({
        success: true,
        data: {
            order: {
                ...order.toJSON(),
                id: order._id,
                shippingCost: toRupees(order.shippingCost),
                shippingChargedToCustomer: toRupees(order.shippingChargedToCustomer),
                discountAmount: toRupees(order.discountAmount),
                taxAmount: toRupees(order.taxAmount),
                advertisingCost: toRupees(order.advertisingCost),
                items: order.items.map((i) => ({
                    ...i,
                    unitSalePrice: toRupees(i.unitSalePrice),
                    unitCostSnapshot: toRupees(i.unitCostSnapshot),
                    totalSalePrice: toRupees(i.quantity * i.unitSalePrice),
                })),
                returns: returns.map((r) => ({
                    ...r,
                    id: r._id,
                    refundAmount: toRupees(r.refundAmount),
                    reverseShippingCost: toRupees(r.reverseShippingCost),
                })),
                shipments: shipments.map((s) => ({
                    ...s,
                    id: s._id,
                    shippingCost: toRupees(s.shippingCost),
                    reverseShippingCost: toRupees(s.reverseShippingCost),
                })),
                expenses: expenses.map((e) => ({
                    ...e,
                    id: e._id,
                    amount: toRupees(e.amount),
                })),
                financials,
            },
        },
    });
}
export async function updateOrder(req, res) {
    const ownerId = req.ownerId;
    const order = await Order.findOne({ _id: req.params.id, ownerId });
    if (!order) {
        res.status(404).json({ success: false, error: 'Order not found.' });
        return;
    }
    const { orderNumber, channel, orderDate, customer, items, status, paymentStatus, shippingCost, shippingChargedToCustomer, discountAmount, taxAmount, advertisingCost, notes, } = req.body;
    if (orderNumber && orderNumber !== order.orderNumber) {
        const existing = await Order.findOne({ ownerId, orderNumber });
        if (existing) {
            res.status(409).json({
                success: false,
                error: `Order number "${orderNumber}" is already in use.`,
            });
            return;
        }
        order.orderNumber = orderNumber;
    }
    if (channel)
        order.channel = channel;
    if (orderDate)
        order.orderDate = new Date(orderDate);
    if (customer)
        order.customer = customer;
    if (status)
        order.status = status;
    if (paymentStatus)
        order.paymentStatus = paymentStatus;
    if (notes !== undefined)
        order.notes = notes;
    if (shippingCost !== undefined)
        order.shippingCost = toPaise(shippingCost);
    if (shippingChargedToCustomer !== undefined)
        order.shippingChargedToCustomer = toPaise(shippingChargedToCustomer);
    if (discountAmount !== undefined)
        order.discountAmount = toPaise(discountAmount);
    if (taxAmount !== undefined)
        order.taxAmount = toPaise(taxAmount);
    if (advertisingCost !== undefined)
        order.advertisingCost = toPaise(advertisingCost);
    if (items && Array.isArray(items)) {
        order.items = items.map((i) => ({
            productId: i.productId,
            nameSnapshot: i.nameSnapshot,
            skuSnapshot: i.skuSnapshot.toUpperCase(),
            quantity: i.quantity,
            unitSalePrice: toPaise(i.unitSalePrice),
            unitCostSnapshot: toPaise(i.unitCostSnapshot),
        }));
    }
    await order.save();
    res.json({
        success: true,
        message: 'Order updated successfully',
        data: { order: { ...order.toJSON(), id: order._id } },
    });
}
export async function updateOrderStatus(req, res) {
    const ownerId = req.ownerId;
    const { status, paymentStatus } = req.body;
    const order = await Order.findOne({ _id: req.params.id, ownerId });
    if (!order) {
        res.status(404).json({ success: false, error: 'Order not found.' });
        return;
    }
    order.status = status;
    if (paymentStatus) {
        order.paymentStatus = paymentStatus;
    }
    await order.save();
    res.json({
        success: true,
        message: `Order status updated to "${status}".`,
        data: { order: { ...order.toJSON(), id: order._id } },
    });
}
export async function createOrderReturn(req, res) {
    const ownerId = req.ownerId;
    const order = await Order.findOne({ _id: req.params.id, ownerId });
    if (!order) {
        res.status(404).json({ success: false, error: 'Order not found.' });
        return;
    }
    const { returnedItems, returnReason, refundAmount, shippingRefundAmount, reverseShippingCost, inventoryRecoveryStatus, returnedCondition, status, notes, } = req.body;
    const returnRecord = await Return.create({
        ownerId,
        orderId: order._id,
        returnedItems: returnedItems.map((ri) => ({
            sku: ri.sku.toUpperCase(),
            name: ri.name,
            quantity: ri.quantity,
            unitCostSnapshot: toPaise(ri.unitCostSnapshot),
        })),
        returnReason,
        refundAmount: toPaise(refundAmount || 0),
        shippingRefundAmount: toPaise(shippingRefundAmount || 0),
        reverseShippingCost: toPaise(reverseShippingCost || 0),
        inventoryRecoveryStatus: inventoryRecoveryStatus || 'pending_inspection',
        returnedCondition: returnedCondition || 'resalable',
        status: status || 'received',
        notes,
    });
    // If status is returned or items all returned, update order status
    order.status = 'returned';
    if (refundAmount && refundAmount > 0) {
        order.paymentStatus = 'refunded';
    }
    await order.save();
    // If inventory is restocked and condition is resalable, increment product inventory
    if (returnRecord.inventoryRecoveryStatus === 'restocked' &&
        (returnRecord.returnedCondition === 'resalable' || returnRecord.returnedCondition === 'unopened')) {
        for (const item of returnRecord.returnedItems) {
            await Product.updateOne({ ownerId, SKU: item.sku }, { $inc: { stockQuantity: item.quantity } });
        }
    }
    res.status(201).json({
        success: true,
        message: 'Return recorded successfully',
        data: { return: { ...returnRecord.toJSON(), id: returnRecord._id } },
    });
}
