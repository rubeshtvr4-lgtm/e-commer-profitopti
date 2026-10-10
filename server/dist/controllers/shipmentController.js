import { Shipment } from '../models/Shipment.js';
import { Order } from '../models/Order.js';
import { toPaise, toRupees } from '../utils/currency.js';
export async function listShipments(req, res) {
    const ownerId = req.ownerId;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const courier = (req.query.courier || '').trim();
    const status = (req.query.status || '').trim();
    const filter = { ownerId };
    if (courier && courier !== 'all')
        filter.courier = courier;
    if (status && status !== 'all')
        filter.shipmentStatus = status;
    const [total, shipments] = await Promise.all([
        Shipment.countDocuments(filter),
        Shipment.find(filter)
            .populate('orderId', 'orderNumber customer status')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean(),
    ]);
    const transformed = shipments.map((s) => ({
        ...s,
        id: s._id,
        orderNumber: s.orderId?.orderNumber || 'Unknown Order',
        shippingCost: toRupees(s.shippingCost),
        reverseShippingCost: toRupees(s.reverseShippingCost),
    }));
    res.json({
        success: true,
        data: {
            shipments: transformed,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        },
    });
}
export async function createShipment(req, res) {
    const ownerId = req.ownerId;
    const { orderId, courier, trackingNumber, shippingCost, reverseShippingCost, shipmentStatus, dispatchDate, deliveryDate, weightGrams, notes, } = req.body;
    const order = await Order.findOne({ _id: orderId, ownerId });
    if (!order) {
        res.status(404).json({ success: false, error: 'Order not found.' });
        return;
    }
    const shipment = await Shipment.create({
        ownerId,
        orderId,
        courier,
        trackingNumber,
        shippingCost: toPaise(shippingCost || 0),
        reverseShippingCost: toPaise(reverseShippingCost || 0),
        shipmentStatus: shipmentStatus || 'manifested',
        dispatchDate: dispatchDate ? new Date(dispatchDate) : new Date(),
        deliveryDate: deliveryDate ? new Date(deliveryDate) : undefined,
        weightGrams,
        notes,
    });
    // Sync order status if shipment is picked up or delivered
    if (shipmentStatus === 'delivered') {
        order.status = 'delivered';
        await order.save();
    }
    else if (shipmentStatus === 'in_transit' || shipmentStatus === 'picked_up') {
        if (order.status === 'pending' || order.status === 'confirmed' || order.status === 'processing') {
            order.status = 'shipped';
            await order.save();
        }
    }
    res.status(201).json({
        success: true,
        message: 'Shipment created successfully',
        data: {
            shipment: {
                ...shipment.toJSON(),
                id: shipment._id,
                shippingCost: toRupees(shipment.shippingCost),
                reverseShippingCost: toRupees(shipment.reverseShippingCost),
            },
        },
    });
}
export async function getShipment(req, res) {
    const ownerId = req.ownerId;
    const shipment = await Shipment.findOne({ _id: req.params.id, ownerId })
        .populate('orderId', 'orderNumber customer items status')
        .lean();
    if (!shipment) {
        res.status(404).json({ success: false, error: 'Shipment not found.' });
        return;
    }
    res.json({
        success: true,
        data: {
            shipment: {
                ...shipment,
                id: shipment._id,
                shippingCost: toRupees(shipment.shippingCost),
                reverseShippingCost: toRupees(shipment.reverseShippingCost),
            },
        },
    });
}
export async function updateShipment(req, res) {
    const ownerId = req.ownerId;
    const shipment = await Shipment.findOne({ _id: req.params.id, ownerId });
    if (!shipment) {
        res.status(404).json({ success: false, error: 'Shipment not found.' });
        return;
    }
    const { courier, trackingNumber, shippingCost, reverseShippingCost, shipmentStatus, dispatchDate, deliveryDate, weightGrams, notes, } = req.body;
    if (courier)
        shipment.courier = courier;
    if (trackingNumber)
        shipment.trackingNumber = trackingNumber;
    if (shippingCost !== undefined)
        shipment.shippingCost = toPaise(shippingCost);
    if (reverseShippingCost !== undefined)
        shipment.reverseShippingCost = toPaise(reverseShippingCost);
    if (shipmentStatus)
        shipment.shipmentStatus = shipmentStatus;
    if (dispatchDate)
        shipment.dispatchDate = new Date(dispatchDate);
    if (deliveryDate)
        shipment.deliveryDate = new Date(deliveryDate);
    if (weightGrams !== undefined)
        shipment.weightGrams = weightGrams;
    if (notes !== undefined)
        shipment.notes = notes;
    await shipment.save();
    // If status is updated to delivered, synchronize order status
    if (shipmentStatus === 'delivered') {
        await Order.updateOne({ _id: shipment.orderId, ownerId }, { status: 'delivered' });
    }
    res.json({
        success: true,
        message: 'Shipment updated successfully',
        data: {
            shipment: {
                ...shipment.toJSON(),
                id: shipment._id,
                shippingCost: toRupees(shipment.shippingCost),
                reverseShippingCost: toRupees(shipment.reverseShippingCost),
            },
        },
    });
}
