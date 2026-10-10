import { Return } from '../models/Return.js';
import { Product } from '../models/Product.js';
import { toPaise, toRupees } from '../utils/currency.js';
export async function listReturns(req, res) {
    const ownerId = req.ownerId;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const search = (req.query.search || '').trim();
    const status = (req.query.status || '').trim();
    const condition = (req.query.condition || '').trim();
    const recoveryStatus = (req.query.recoveryStatus || '').trim();
    const filter = { ownerId };
    if (status && status !== 'all')
        filter.status = status;
    if (condition && condition !== 'all')
        filter.returnedCondition = condition;
    if (recoveryStatus && recoveryStatus !== 'all')
        filter.inventoryRecoveryStatus = recoveryStatus;
    if (search) {
        filter.$or = [
            { returnReason: { $regex: search, $options: 'i' } },
            { 'returnedItems.sku': { $regex: search, $options: 'i' } },
            { 'returnedItems.name': { $regex: search, $options: 'i' } },
        ];
    }
    const [total, returns] = await Promise.all([
        Return.countDocuments(filter),
        Return.find(filter)
            .populate('orderId', 'orderNumber customer orderDate')
            .sort({ returnDate: -1, createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean(),
    ]);
    const transformed = returns.map((r) => ({
        ...r,
        id: r._id,
        orderNumber: r.orderId?.orderNumber || 'Unknown Order',
        refundAmount: toRupees(r.refundAmount),
        shippingRefundAmount: toRupees(r.shippingRefundAmount),
        reverseShippingCost: toRupees(r.reverseShippingCost),
        returnedItems: r.returnedItems.map((i) => ({
            ...i,
            unitCostSnapshot: toRupees(i.unitCostSnapshot),
        })),
    }));
    res.json({
        success: true,
        data: {
            returns: transformed,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        },
    });
}
export async function getReturn(req, res) {
    const ownerId = req.ownerId;
    const returnRecord = await Return.findOne({ _id: req.params.id, ownerId })
        .populate('orderId', 'orderNumber customer orderDate status')
        .lean();
    if (!returnRecord) {
        res.status(404).json({ success: false, error: 'Return record not found.' });
        return;
    }
    res.json({
        success: true,
        data: {
            return: {
                ...returnRecord,
                id: returnRecord._id,
                refundAmount: toRupees(returnRecord.refundAmount),
                shippingRefundAmount: toRupees(returnRecord.shippingRefundAmount),
                reverseShippingCost: toRupees(returnRecord.reverseShippingCost),
                returnedItems: returnRecord.returnedItems.map((i) => ({
                    ...i,
                    unitCostSnapshot: toRupees(i.unitCostSnapshot),
                })),
            },
        },
    });
}
export async function updateReturn(req, res) {
    const ownerId = req.ownerId;
    const returnRecord = await Return.findOne({ _id: req.params.id, ownerId });
    if (!returnRecord) {
        res.status(404).json({ success: false, error: 'Return record not found.' });
        return;
    }
    const { inventoryRecoveryStatus, returnedCondition, status, refundAmount, reverseShippingCost, notes, } = req.body;
    const previousRecoveryStatus = returnRecord.inventoryRecoveryStatus;
    if (inventoryRecoveryStatus)
        returnRecord.inventoryRecoveryStatus = inventoryRecoveryStatus;
    if (returnedCondition)
        returnRecord.returnedCondition = returnedCondition;
    if (status)
        returnRecord.status = status;
    if (refundAmount !== undefined)
        returnRecord.refundAmount = toPaise(refundAmount);
    if (reverseShippingCost !== undefined)
        returnRecord.reverseShippingCost = toPaise(reverseShippingCost);
    if (notes !== undefined)
        returnRecord.notes = notes;
    await returnRecord.save();
    // If transitioned from pending/damaged to restocked, increment stock
    if (previousRecoveryStatus !== 'restocked' &&
        returnRecord.inventoryRecoveryStatus === 'restocked' &&
        (returnRecord.returnedCondition === 'resalable' || returnRecord.returnedCondition === 'unopened')) {
        for (const item of returnRecord.returnedItems) {
            await Product.updateOne({ ownerId, SKU: item.sku }, { $inc: { stockQuantity: item.quantity } });
        }
    }
    res.json({
        success: true,
        message: 'Return updated successfully',
        data: {
            return: {
                ...returnRecord.toJSON(),
                id: returnRecord._id,
                refundAmount: toRupees(returnRecord.refundAmount),
                reverseShippingCost: toRupees(returnRecord.reverseShippingCost),
            },
        },
    });
}
