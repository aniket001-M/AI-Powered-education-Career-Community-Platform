import Redis from 'ioredis';
import { env, isTest } from './env';
import { logger } from '@/common/utils/logger';

let redisClient: Redis;

export function getRedisClient(): Redis {
  if (!redisClient) {
    redisClient = createRedisClient();
  }
  return redisClient;
}

export function createRedisClient(): Redis {
  const client = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      const delay = Math.min(times * 200, 2000);
      return delay;
    },
    lazyConnect: isTest,
  });

  client.on('connect', () => {
    logger.info('Redis connected successfully');
  });

  client.on('error', (err) => {
    logger.error('Redis connection error', { error: err.message });
  });

  client.on('close', () => {
    if (!isTest) {
      logger.warn('Redis connection closed');
    }
  });

  return client;
}

export async function disconnectRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
  }
}

/**
 * Allow tests to inject a mock Redis client.
 */
export function setRedisClient(client: Redis): void {
  redisClient = client;
}
