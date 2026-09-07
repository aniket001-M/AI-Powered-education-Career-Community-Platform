import { env } from '@/config/env';
import { connectDatabase, disconnectDatabase } from '@/config/database';
import { getRedisClient, disconnectRedis } from '@/config/redis';
import { logger } from '@/common/utils/logger';
import app from '@/app';
import dns from "dns";

dns.setServers([
  "1.1.1.1",
  "8.8.8.8",
]);

async function bootstrap(): Promise<void> {
  try {
    // Connect to MongoDB
    await connectDatabase();

    // Connect to Redis
    getRedisClient();

    // Start HTTP server
    const server = app.listen(env.PORT, () => {
      logger.info(`🚀 CareerGraph API running on port ${env.PORT}`);
      logger.info(`📖 Swagger docs: http://localhost:${env.PORT}/api/docs`);
      logger.info(`🏥 Health check: http://localhost:${env.PORT}/health`);
      logger.info(`🔧 Environment: ${env.NODE_ENV}`);
    });

    // ─── Graceful Shutdown ─────────────────────────────────────
    const shutdown = async (signal: string) => {
      logger.info(`Received ${signal}, shutting down gracefully...`);

      server.close(async () => {
        await disconnectDatabase();
        await disconnectRedis();
        logger.info('Server shut down successfully');
        process.exit(0);
      });

      // Force exit if graceful shutdown takes too long
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // Handle unhandled rejections
    process.on('unhandledRejection', (reason: any) => {
      logger.error('Unhandled Rejection', { reason: reason?.message || reason });
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
      process.exit(1);
    });
  } catch (error: any) {
    logger.error('Failed to start server', { error: error.message });
    process.exit(1);
  }
}

bootstrap();
