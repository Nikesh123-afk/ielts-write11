import { Router, Request, Response } from 'express';
import { prisma } from '../db/prisma.js';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';
import { createCheckoutSession, createPortalSession } from '../services/stripe.js';
import { validateBody } from '../middleware/validate.js';
import { CheckoutSchema } from '@ielts-checker/validators';
import { logger } from '../middleware/logger.js';

const router = Router();
router.use(requireAuth);

router.get('/usage', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id: user_id } = (req as AuthenticatedRequest).user;
    const user = await prisma.user.findUnique({
      where: { id: user_id },
      select: {
        plan: true,
        credits: true,
        free_checks_used: true,
        free_checks_reset: true,
        current_streak: true,
        longest_streak: true,
      },
    });

    if (!user) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'User not found' } });
      return;
    }

    const FREE_MONTHLY_LIMIT = 3;
    const now = new Date();
    const resetDate = new Date(user.free_checks_reset);
    const shouldReset =
      now.getFullYear() > resetDate.getFullYear() ||
      now.getMonth() > resetDate.getMonth();

    const free_checks_used = shouldReset ? 0 : user.free_checks_used;

    res.json({
      success: true,
      data: {
        plan: user.plan,
        credits: user.credits,
        free_checks_used,
        free_checks_limit: FREE_MONTHLY_LIMIT,
        free_checks_remaining: Math.max(0, FREE_MONTHLY_LIMIT - free_checks_used),
        can_submit:
          user.plan === 'pro' ||
          user.credits > 0 ||
          free_checks_used < FREE_MONTHLY_LIMIT,
        current_streak: user.current_streak,
        longest_streak: user.longest_streak,
      },
    });
  } catch (err) {
    logger.error('Get usage error', { error: err });
    res.status(500).json({ success: false, error: { code: 'FETCH_FAILED', message: 'Failed to fetch usage' } });
  }
});

router.get('/progress', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id: user_id } = (req as AuthenticatedRequest).user;

    const [user, evaluations] = await Promise.all([
      prisma.user.findUnique({
        where: { id: user_id },
        select: { current_streak: true, longest_streak: true },
      }),
      prisma.evaluation.findMany({
        where: { submission: { user_id } },
        orderBy: { created_at: 'desc' },
        take: 10,
        select: {
          overall_band: true,
          ta_score: true,
          cc_score: true,
          lr_score: true,
          gra_score: true,
          created_at: true,
          submission_id: true,
        },
      }),
    ]);

    const band_history = evaluations.map((e) => ({
      date: e.created_at.toISOString(),
      overall_band: Number(e.overall_band),
      submission_id: e.submission_id,
    })).reverse();

    const average_band =
      evaluations.length > 0
        ? evaluations.reduce((s, e) => s + Number(e.overall_band), 0) / evaluations.length
        : 0;

    // Find weakest criterion
    const weak_criteria: string[] = [];
    if (evaluations.length > 0) {
      const avgScores = {
        'Task Achievement': evaluations.reduce((s, e) => s + Number(e.ta_score), 0) / evaluations.length,
        'Coherence & Cohesion': evaluations.reduce((s, e) => s + Number(e.cc_score), 0) / evaluations.length,
        'Lexical Resource': evaluations.reduce((s, e) => s + Number(e.lr_score), 0) / evaluations.length,
        'Grammatical Range': evaluations.reduce((s, e) => s + Number(e.gra_score), 0) / evaluations.length,
      };
      const minScore = Math.min(...Object.values(avgScores));
      for (const [k, v] of Object.entries(avgScores)) {
        if (v === minScore) weak_criteria.push(k);
      }
    }

    res.json({
      success: true,
      data: {
        current_streak: user?.current_streak ?? 0,
        longest_streak: user?.longest_streak ?? 0,
        total_submissions: evaluations.length,
        average_band: Math.round(average_band * 10) / 10,
        band_history,
        weak_criteria,
      },
    });
  } catch (err) {
    logger.error('Get progress error', { error: err });
    res.status(500).json({ success: false, error: { code: 'FETCH_FAILED', message: 'Failed to fetch progress' } });
  }
});

router.get('/plans', async (_req: Request, res: Response): Promise<void> => {
  try {
    const plans = await prisma.plan.findMany({ orderBy: { price_monthly: 'asc' } });
    res.json({ success: true, data: plans });
  } catch (err) {
    logger.error('Get plans error', { error: err });
    res.status(500).json({ success: false, error: { code: 'FETCH_FAILED', message: 'Failed to fetch plans' } });
  }
});

router.post('/stripe/checkout', validateBody(CheckoutSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const { id: user_id } = (req as AuthenticatedRequest).user;
    const { plan, credit_pack } = req.body as { plan: 'pro' | 'credits'; credit_pack?: '5' | '10' | '20' };

    const user = await prisma.user.findUnique({
      where: { id: user_id },
      select: { email: true, stripe_customer_id: true },
    });

    if (!user) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'User not found' } });
      return;
    }

    const frontend = process.env.FRONTEND_URL!;
    const url = await createCheckoutSession({
      user_id,
      email: user.email,
      plan,
      credit_pack,
      customer_id: user.stripe_customer_id,
      success_url: `${frontend}/dashboard?checkout=success`,
      cancel_url: `${frontend}/pricing?checkout=cancelled`,
    });

    res.json({ success: true, data: { url } });
  } catch (err) {
    logger.error('Checkout error', { error: err });
    res.status(500).json({ success: false, error: { code: 'CHECKOUT_FAILED', message: 'Failed to create checkout session' } });
  }
});

router.post('/stripe/portal', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id: user_id } = (req as AuthenticatedRequest).user;

    const user = await prisma.user.findUnique({
      where: { id: user_id },
      select: { stripe_customer_id: true },
    });

    if (!user?.stripe_customer_id) {
      res.status(400).json({
        success: false,
        error: { code: 'NO_SUBSCRIPTION', message: 'No active subscription found' },
      });
      return;
    }

    const url = await createPortalSession({
      customer_id: user.stripe_customer_id,
      return_url: `${process.env.FRONTEND_URL}/dashboard/settings`,
    });

    res.json({ success: true, data: { url } });
  } catch (err) {
    logger.error('Portal error', { error: err });
    res.status(500).json({ success: false, error: { code: 'PORTAL_FAILED', message: 'Failed to create billing portal session' } });
  }
});

export default router;
