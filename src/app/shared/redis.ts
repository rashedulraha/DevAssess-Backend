import Redis from 'ioredis';
import config from '../config';

export const redis = new Redis(config.redisUrl as string, {
  maxRetriesPerRequest: 2,
  enableOfflineQueue: false,
  lazyConnect: true,
});

redis.on('error', (err) => {
  console.warn('[Redis Warning]: Connection issue, falling back to DB:', err.message);
});
