import { Expense } from '../models/Expense.js';
import { Order } from '../models/Order.js';
import { toPaise, toRupees } from '../utils/currency.js';
export async function listExpenses(req, res) {
    const ownerId = req.ownerId;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const category = (req.query.category || '').trim();
    const search = (req.query.search || '').trim();
    const filter = { ownerId };
    if (category && category !== 'all')
        filter.category = category;
    if (search) {
        filter.description = { $regex: search, $options: 'i' };
    }
    const [total, expenses] = await Promise.all([
        Expense.countDocuments(filter),
        Expense.find(filter)
            .populate('orderId', 'orderNumber customer')
            .sort({ date: -1, createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean(),
    ]);
    const transformed = expenses.map((e) => ({
        ...e,
        id: e._id,
        amount: toRupees(e.amount),
        orderNumber: e.orderId?.orderNumber,
    }));
    res.json({
        success: true,
        data: {
            expenses: transformed,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        },
    });
}
export async function createExpense(req, res) {
    const ownerId = req.ownerId;
    const { category, amount, date, description, orderId } = req.body;
    let validatedOrderId = undefined;
    if (orderId) {
        const ord = await Order.findOne({ _id: orderId, ownerId });
        if (ord) {
            validatedOrderId = ord._id;
        }
    }
    const expense = await Expense.create({
        ownerId,
        category: category || 'other',
        amount: toPaise(amount),
        date: date ? new Date(date) : new Date(),
        description,
        orderId: validatedOrderId,
    });
    res.status(201).json({
        success: true,
        message: 'Expense created successfully',
        data: {
            expense: {
                ...expense.toJSON(),
                id: expense._id,
                amount: toRupees(expense.amount),
            },
        },
    });
}
export async function updateExpense(req, res) {
    const ownerId = req.ownerId;
    const expense = await Expense.findOne({ _id: req.params.id, ownerId });
    if (!expense) {
        res.status(404).json({ success: false, error: 'Expense not found.' });
        return;
    }
    const { category, amount, date, description, orderId } = req.body;
    if (category)
        expense.category = category;
    if (amount !== undefined)
        expense.amount = toPaise(amount);
    if (date)
        expense.date = new Date(date);
    if (description)
        expense.description = description;
    if (orderId !== undefined) {
        if (orderId) {
            const ord = await Order.findOne({ _id: orderId, ownerId });
            expense.orderId = ord ? ord._id : undefined;
        }
        else {
            expense.orderId = undefined;
        }
    }
    await expense.save();
    res.json({
        success: true,
        message: 'Expense updated successfully',
        data: {
            expense: {
                ...expense.toJSON(),
                id: expense._id,
                amount: toRupees(expense.amount),
            },
        },
    });
}
export async function deleteExpense(req, res) {
    const ownerId = req.ownerId;
    const expense = await Expense.findOneAndDelete({ _id: req.params.id, ownerId });
    if (!expense) {
        res.status(404).json({ success: false, error: 'Expense not found.' });
        return;
    }
    res.json({
        success: true,
        message: 'Expense deleted successfully',
    });
}
