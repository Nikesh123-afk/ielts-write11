import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

const rateLimitResponse = (_req: Request, res: Response) => {
  res.status(429).json({
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many requests, please try again later',
    },
  });
};

export const globalRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitResponse,
  skip: (req) => req.path === '/health',
});

export const submissionRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitResponse,
  keyGenerator: (req) => {
    // Key by authenticated user ID, falling back to IP
    const userId = (req as { user?: { id: string } }).user?.id;
    return userId ?? req.ip ?? 'unknown';
  },
});

export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitResponse,
});

export const coachRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitResponse,
  keyGenerator: (req) => {
    const userId = (req as { user?: { id: string } }).user?.id;
    return userId ?? req.ip ?? 'unknown';
  },
});
