import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../db/prisma.js';
import { logger } from './logger.js';

export interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
  };
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
      return;
    }

    const token = authHeader.slice(7);
    const jwtSecret = process.env.SUPABASE_JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('SUPABASE_JWT_SECRET not configured');
    }

    const decoded = jwt.verify(token, jwtSecret) as {
      sub: string;
      email: string;
      exp: number;
    };

    // Ensure user record exists in our DB (synced from Supabase Auth)
    let user = await prisma.user.findUnique({ where: { id: decoded.sub } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          id: decoded.sub,
          email: decoded.email,
        },
      });
    }

    (req as AuthenticatedRequest).user = {
      id: decoded.sub,
      email: decoded.email,
    };

    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        error: { code: 'TOKEN_EXPIRED', message: 'Session expired, please log in again' },
      });
      return;
    }
    if (err instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        error: { code: 'INVALID_TOKEN', message: 'Invalid authentication token' },
      });
      return;
    }
    logger.error('Auth middleware error', { error: err });
    res.status(500).json({
      success: false,
      error: { code: 'AUTH_ERROR', message: 'Authentication error' },
    });
  }
}
