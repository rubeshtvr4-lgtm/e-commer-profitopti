import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { ENV } from '../config/env.js';
export function generateToken(userId) {
    return jwt.sign({ id: userId }, ENV.JWT_SECRET, {
        expiresIn: '7d',
    });
}
export async function requireAuth(req, res, next) {
    try {
        let token;
        // 1. Check HttpOnly cookie first
        if (req.cookies && req.cookies.token) {
            token = req.cookies.token;
        }
        // 2. Fallback to Authorization: Bearer <token>
        else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
            token = req.headers.authorization.split(' ')[1];
        }
        if (!token) {
            res.status(401).json({
                success: false,
                error: 'Authentication required. Please log in to continue.',
            });
            return;
        }
        const decoded = jwt.verify(token, ENV.JWT_SECRET);
        if (!decoded || !decoded.id) {
            res.status(401).json({
                success: false,
                error: 'Invalid or expired authentication session.',
            });
            return;
        }
        const user = await User.findById(decoded.id);
        if (!user) {
            res.status(401).json({
                success: false,
                error: 'User account no longer exists.',
            });
            return;
        }
        // Attach verified identity and derived ownerId
        req.user = user;
        req.ownerId = user._id;
        next();
    }
    catch (error) {
        res.status(401).json({
            success: false,
            error: 'Invalid or expired token.',
        });
    }
}
