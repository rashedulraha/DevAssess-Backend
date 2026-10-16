import Redis from 'ioredis';
import config from '../config';

const rawRedisUrl = (config.redisUrl as string) || '';
const cleanRedisUrl = rawRedisUrl.replace(/^redis-cli\s+-u\s+/, '').trim();

export const redis = new Redis(cleanRedisUrl, {
  maxRetriesPerRequest: 2,
  enableOfflineQueue: false,
  lazyConnect: true,
});

redis.on('error', (err) => {
  console.warn('[Redis Warning]: Connection issue, falling back to DB:', err.message);
});
