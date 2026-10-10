import { ZodError } from 'zod';
import { ENV } from '../config/env.js';
export function errorHandler(err, _req, res, _next) {
    console.error('API Error:', err);
    // 1. Zod Validation Error
    if (err instanceof ZodError) {
        const formattedErrors = err.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
        }));
        res.status(400).json({
            success: false,
            error: 'Validation failed',
            details: formattedErrors,
        });
        return;
    }
    // 2. Mongoose Duplicate Key Error (E11000)
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue || {})[0] || 'record';
        res.status(409).json({
            success: false,
            error: `A ${field} with that identifier already exists.`,
        });
        return;
    }
    // 3. Mongoose CastError (Invalid ObjectId)
    if (err.name === 'CastError') {
        res.status(400).json({
            success: false,
            error: `Invalid identifier: ${err.value}`,
        });
        return;
    }
    // 4. Custom Status Error
    const statusCode = err.statusCode || (err.status >= 400 && err.status < 600 ? err.status : 500);
    const message = statusCode === 500 && ENV.NODE_ENV === 'production'
        ? 'An unexpected internal server error occurred.'
        : err.message || 'Internal server error';
    res.status(statusCode).json({
        success: false,
        error: message,
        ...(ENV.NODE_ENV !== 'production' && { stack: err.stack }),
    });
}
