import { Product } from '../models/Product.js';
import { Order } from '../models/Order.js';
import { Return } from '../models/Return.js';
import { toPaise, toRupees, calculateProfitMargin } from '../utils/currency.js';
export async function listProducts(req, res) {
    const ownerId = req.ownerId;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const search = (req.query.search || '').trim();
    const category = (req.query.category || '').trim();
    const activeOnly = req.query.active === 'true';
    const filter = { ownerId };
    if (category && category !== 'all') {
        filter.category = category;
    }
    if (activeOnly) {
        filter.active = true;
    }
    if (search) {
        filter.$or = [
            { name: { $regex: search, $options: 'i' } },
            { SKU: { $regex: search, $options: 'i' } },
        ];
    }
    const [total, products] = await Promise.all([
        Product.countDocuments(filter),
        Product.find(filter)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean(),
    ]);
    // Transform prices to major units for frontend convenience
    const transformed = products.map((p) => {
        const profitPerUnitPaise = p.sellingPrice - p.unitCost;
        const margin = calculateProfitMargin(profitPerUnitPaise, p.sellingPrice);
        return {
            ...p,
            id: p._id,
            sellingPrice: toRupees(p.sellingPrice),
            unitCost: toRupees(p.unitCost),
            profitPerUnit: toRupees(profitPerUnitPaise),
            profitMargin: margin,
        };
    });
    res.json({
        success: true,
        data: {
            products: transformed,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        },
    });
}
export async function createProduct(req, res) {
    const ownerId = req.ownerId;
    const { name, SKU, category, sellingPrice, unitCost, stockQuantity, active } = req.body;
    const existing = await Product.findOne({ ownerId, SKU: SKU.toUpperCase() });
    if (existing) {
        res.status(409).json({
            success: false,
            error: `A product with SKU "${SKU.toUpperCase()}" already exists in your inventory.`,
        });
        return;
    }
    const product = await Product.create({
        ownerId,
        name,
        SKU: SKU.toUpperCase(),
        category: category || 'General',
        sellingPrice: toPaise(sellingPrice),
        unitCost: toPaise(unitCost),
        stockQuantity: stockQuantity ?? 0,
        active: active ?? true,
    });
    res.status(201).json({
        success: true,
        message: 'Product created successfully',
        data: {
            product: {
                ...product.toJSON(),
                id: product._id,
                sellingPrice: toRupees(product.sellingPrice),
                unitCost: toRupees(product.unitCost),
            },
        },
    });
}
export async function getProduct(req, res) {
    const ownerId = req.ownerId;
    const product = await Product.findOne({ _id: req.params.id, ownerId });
    if (!product) {
        res.status(404).json({ success: false, error: 'Product not found.' });
        return;
    }
    // Aggregate product performance metrics from delivered/confirmed orders
    const orders = await Order.find({
        ownerId,
        status: { $ne: 'cancelled' },
        'items.skuSnapshot': product.SKU,
    }).lean();
    let unitsSold = 0;
    let grossRevenuePaise = 0;
    let totalCostPaise = 0;
    for (const ord of orders) {
        for (const item of ord.items) {
            if (item.skuSnapshot === product.SKU) {
                unitsSold += item.quantity;
                grossRevenuePaise += item.quantity * item.unitSalePrice;
                totalCostPaise += item.quantity * item.unitCostSnapshot;
            }
        }
    }
    // Fetch returns for this product SKU
    const returns = await Return.find({
        ownerId,
        status: { $ne: 'rejected' },
        'returnedItems.sku': product.SKU,
    }).lean();
    let unitsReturned = 0;
    for (const ret of returns) {
        for (const item of ret.returnedItems) {
            if (item.sku === product.SKU) {
                unitsReturned += item.quantity;
            }
        }
    }
    const netRevenuePaise = grossRevenuePaise;
    const netProfitPaise = netRevenuePaise - totalCostPaise;
    const profitMargin = calculateProfitMargin(netProfitPaise, netRevenuePaise);
    const returnRate = unitsSold > 0 ? Number(((unitsReturned / unitsSold) * 100).toFixed(1)) : 0;
    res.json({
        success: true,
        data: {
            product: {
                ...product.toJSON(),
                id: product._id,
                sellingPrice: toRupees(product.sellingPrice),
                unitCost: toRupees(product.unitCost),
            },
            performance: {
                unitsSold,
                unitsReturned,
                returnRate,
                grossRevenue: toRupees(grossRevenuePaise),
                totalCost: toRupees(totalCostPaise),
                netProfit: toRupees(netProfitPaise),
                profitMargin,
            },
        },
    });
}
export async function updateProduct(req, res) {
    const ownerId = req.ownerId;
    const product = await Product.findOne({ _id: req.params.id, ownerId });
    if (!product) {
        res.status(404).json({ success: false, error: 'Product not found.' });
        return;
    }
    const { name, SKU, category, sellingPrice, unitCost, stockQuantity, active } = req.body;
    if (SKU && SKU.toUpperCase() !== product.SKU) {
        const existing = await Product.findOne({ ownerId, SKU: SKU.toUpperCase() });
        if (existing) {
            res.status(409).json({
                success: false,
                error: `A product with SKU "${SKU.toUpperCase()}" already exists.`,
            });
            return;
        }
        product.SKU = SKU.toUpperCase();
    }
    if (name !== undefined)
        product.name = name;
    if (category !== undefined)
        product.category = category;
    if (sellingPrice !== undefined)
        product.sellingPrice = toPaise(sellingPrice);
    if (unitCost !== undefined)
        product.unitCost = toPaise(unitCost);
    if (stockQuantity !== undefined)
        product.stockQuantity = stockQuantity;
    if (active !== undefined)
        product.active = active;
    await product.save();
    res.json({
        success: true,
        message: 'Product updated successfully',
        data: {
            product: {
                ...product.toJSON(),
                id: product._id,
                sellingPrice: toRupees(product.sellingPrice),
                unitCost: toRupees(product.unitCost),
            },
        },
    });
}
export async function deleteProduct(req, res) {
    const ownerId = req.ownerId;
    const product = await Product.findOneAndDelete({ _id: req.params.id, ownerId });
    if (!product) {
        res.status(404).json({ success: false, error: 'Product not found.' });
        return;
    }
    res.json({
        success: true,
        message: 'Product deleted successfully',
    });
}
