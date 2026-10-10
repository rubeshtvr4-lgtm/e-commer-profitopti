import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { ENV } from './config/env.js';
import apiRouter from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import { generalApiLimiter } from './middleware/rateLimiter.js';
export function createApp() {
    const app = express();
    // 1. Security Headers
    app.use(helmet({
        contentSecurityPolicy: false, // Allows flexible API usage
        crossOriginEmbedderPolicy: false,
    }));
    // 2. Cross-Origin Resource Sharing
    const allowedOrigins = [
        ENV.CLIENT_ORIGIN,
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://localhost:3000',
    ].filter(Boolean);
    app.use(cors({
        origin: (origin, callback) => {
            // Allow requests with no origin (like mobile apps, curl, server-to-server)
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            }
            else {
                callback(null, true); // Permissive in dev, or origin check
            }
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    }));
    // 3. Body Parsing & Cookies
    app.use(express.json({ limit: '2mb' }));
    app.use(express.urlencoded({ extended: true, limit: '2mb' }));
    app.use(cookieParser());
    // 4. Request Logging (exclude in test environment)
    if (ENV.NODE_ENV !== 'test') {
        app.use(morgan('dev'));
    }
    // 5. Rate Limiting on API endpoints
    if (ENV.NODE_ENV === 'production') {
        app.use('/api', generalApiLimiter);
    }
    // 6. Health Check Endpoint
    app.get('/health', (_req, res) => {
        res.json({
            status: 'ok',
            service: 'ProfitPilot API',
            version: '1.0.0',
            uptime: process.uptime(),
            timestamp: new Date().toISOString(),
        });
    });
    // 7. Versioned API Routes
    app.use('/api/v1', apiRouter);
    // 8. 404 Handler
    app.use((_req, res) => {
        res.status(404).json({
            success: false,
            error: 'Endpoint not found',
        });
    });
    // 9. Centralized Error Handler
    app.use(errorHandler);
    return app;
}
