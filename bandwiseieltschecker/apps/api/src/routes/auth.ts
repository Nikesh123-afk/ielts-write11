import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import { prisma } from '../db/prisma.js';
import { validateBody } from '../middleware/validate.js';
import { authRateLimit } from '../middleware/rateLimit.js';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';
import { sendWelcomeEmail } from '../services/email.js';
import { logger } from '../middleware/logger.js';
import { SignupSchema, LoginSchema } from '@ielts-checker/validators';

const router = Router();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

router.post('/signup', authRateLimit, validateBody(SignupSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, full_name } = req.body as {
      email: string;
      password: string;
      full_name: string;
    };

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { full_name },
      email_confirm: true,
    });

    if (error) {
      if (error.message.includes('already registered')) {
        res.status(409).json({
          success: false,
          error: { code: 'EMAIL_EXISTS', message: 'An account with this email already exists' },
        });
        return;
      }
      throw error;
    }

    const user = await prisma.user.upsert({
      where: { id: data.user.id },
      create: { id: data.user.id, email, full_name },
      update: { full_name },
    });

    await sendWelcomeEmail({ to: email, full_name });
    logger.info('User signed up', { user_id: user.id });

    res.status(201).json({ success: true, data: { user_id: user.id, email } });
  } catch (err) {
    logger.error('Signup error', { error: err });
    res.status(500).json({
      success: false,
      error: { code: 'SIGNUP_FAILED', message: 'Failed to create account' },
    });
  }
});

router.post('/login', authRateLimit, validateBody(LoginSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body as { email: string; password: string };

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' },
      });
      return;
    }

    res.json({
      success: true,
      data: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
        user: {
          id: data.user.id,
          email: data.user.email,
          full_name: data.user.user_metadata.full_name ?? null,
        },
      },
    });
  } catch (err) {
    logger.error('Login error', { error: err });
    res.status(500).json({
      success: false,
      error: { code: 'LOGIN_FAILED', message: 'Login failed' },
    });
  }
});

router.post('/logout', requireAuth, async (_req: Request, res: Response): Promise<void> => {
  res.json({ success: true, data: null });
});

router.get('/me', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = (req as AuthenticatedRequest).user;
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        full_name: true,
        avatar_url: true,
        plan: true,
        credits: true,
        current_streak: true,
        longest_streak: true,
        created_at: true,
      },
    });

    if (!user) {
      res.status(404).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'User not found' },
      });
      return;
    }

    res.json({ success: true, data: user });
  } catch (err) {
    logger.error('Get me error', { error: err });
    res.status(500).json({
      success: false,
      error: { code: 'FETCH_FAILED', message: 'Failed to fetch user' },
    });
  }
});

export default router;
