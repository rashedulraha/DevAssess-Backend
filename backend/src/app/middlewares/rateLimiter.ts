import rateLimit from 'express-rate-limit';

const rateLimitHandler = (
  _req: unknown,
  res: { status: (code: number) => { json: (body: unknown) => void } },
) => {
  res.status(429).json({
    success: false,
    message: 'Too many requests from this IP. Please try again later.',
    errors: [
      {
        field: 'rateLimit',
        message: 'Rate limit quota exceeded.',
      },
    ],
  });
};

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // 30 requests per IP per window
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

export const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per IP per minute
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});
