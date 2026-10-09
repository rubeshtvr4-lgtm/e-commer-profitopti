import { createApp } from './app.js';
import { connectDB, disconnectDB } from './config/db.js';
import { ENV } from './config/env.js';

async function bootstrap() {
  try {
    await connectDB();
    const app = createApp();

    const server = app.listen(ENV.PORT, () => {
      console.log(`
🚀 ===================================================
   ProfitPilot Server running at http://localhost:${ENV.PORT}
   Environment: ${ENV.NODE_ENV}
   Health:      http://localhost:${ENV.PORT}/health
   API Base:    http://localhost:${ENV.PORT}/api/v1
🚀 ===================================================
      `);
    });

    const shutdown = async (signal: string) => {
      console.log(`\nReceived ${signal}. Shutting down gracefully...`);
      server.close(async () => {
        console.log('HTTP server closed.');
        await disconnectDB();
        console.log('Database disconnected. Process exiting.');
        process.exit(0);
      });
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  } catch (error) {
    console.error('Fatal initialization error:', error);
    process.exit(1);
  }
}

bootstrap();
