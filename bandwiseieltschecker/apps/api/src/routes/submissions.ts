import { Router, Request, Response } from 'express';
import { prisma } from '../db/prisma.js';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { submissionRateLimit } from '../middleware/rateLimit.js';
import { enqueueEvaluation } from '../services/queue.js';
import { logger } from '../middleware/logger.js';
import { SubmissionSchema, WORD_LIMITS } from '@ielts-checker/validators';

const router = Router();

router.use(requireAuth);

// Credit/access gating
async function checkAndDeductCredit(user_id: string): Promise<{ allowed: boolean; reason?: string }> {
  const user = await prisma.user.findUnique({ where: { id: user_id } });
  if (!user) return { allowed: false, reason: 'User not found' };

  // Pro users — always allowed
  if (user.plan === 'pro') return { allowed: true };

  // Credit users
  if (user.plan === 'credits' && user.credits > 0) {
    await prisma.user.update({ where: { id: user_id }, data: { credits: { decrement: 1 } } });
    return { allowed: true };
  }

  // Free plan — reset monthly counter if needed
  const now = new Date();
  const resetDate = new Date(user.free_checks_reset);
  const shouldReset =
    now.getFullYear() > resetDate.getFullYear() ||
    now.getMonth() > resetDate.getMonth();

  if (shouldReset) {
    await prisma.user.update({
      where: { id: user_id },
      data: { free_checks_used: 0, free_checks_reset: now },
    });
    user.free_checks_used = 0;
  }

  const FREE_MONTHLY_LIMIT = 3;
  if (user.free_checks_used < FREE_MONTHLY_LIMIT) {
    await prisma.user.update({
      where: { id: user_id },
      data: { free_checks_used: { increment: 1 } },
    });
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: 'No checks remaining. Upgrade to Pro or purchase credits.',
  };
}

router.post('/', submissionRateLimit, validateBody(SubmissionSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const { id: user_id } = (req as AuthenticatedRequest).user;
    const { task_type, test_type, question, essay } = req.body as {
      task_type: 'task1' | 'task2';
      test_type: 'academic' | 'general';
      question: string;
      essay: string;
    };

    const word_count = essay.trim().split(/\s+/).filter(Boolean).length;
    const limits = WORD_LIMITS[task_type];
    if (word_count < limits.min) {
      res.status(400).json({
        success: false,
        error: {
          code: 'ESSAY_TOO_SHORT',
          message: `Essay must be at least ${limits.min} words (currently ${word_count})`,
        },
      });
      return;
    }

    const creditCheck = await checkAndDeductCredit(user_id);
    if (!creditCheck.allowed) {
      res.status(402).json({
        success: false,
        error: { code: 'INSUFFICIENT_CREDITS', message: creditCheck.reason! },
      });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: user_id } });
    const submission = await prisma.submission.create({
      data: { user_id, task_type, test_type, question, essay, word_count },
    });

    await enqueueEvaluation(
      { submission_id: submission.id, user_id, task_type, test_type, question, essay, word_count, priority: user?.plan === 'pro' ? 'high' : 'normal' },
      user?.plan === 'pro' ? 'high' : 'normal',
    );

    logger.info('Submission created', { submission_id: submission.id, user_id });

    res.status(201).json({
      success: true,
      data: {
        submission_id: submission.id,
        status: 'pending',
        message: 'Your essay is being evaluated. Check back in a moment.',
      },
    });
  } catch (err) {
    logger.error('Submission error', { error: err });
    res.status(500).json({
      success: false,
      error: { code: 'SUBMISSION_FAILED', message: 'Failed to submit essay' },
    });
  }
});

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id: user_id } = (req as AuthenticatedRequest).user;
    const page = Math.max(1, parseInt(String(req.query.page ?? '1')));
    const per_page = Math.min(20, parseInt(String(req.query.per_page ?? '10')));
    const skip = (page - 1) * per_page;

    // Free plan: only last 7 days
    const user = await prisma.user.findUnique({ where: { id: user_id } });
    const dateFilter =
      user?.plan === 'free'
        ? { gte: new Date(Date.now() - 7 * 86_400_000) }
        : undefined;

    const [submissions, total] = await Promise.all([
      prisma.submission.findMany({
        where: { user_id, ...(dateFilter ? { created_at: dateFilter } : {}) },
        orderBy: { created_at: 'desc' },
        skip,
        take: per_page,
        select: {
          id: true,
          task_type: true,
          test_type: true,
          word_count: true,
          status: true,
          created_at: true,
          evaluation: { select: { overall_band: true } },
        },
      }),
      prisma.submission.count({
        where: { user_id, ...(dateFilter ? { created_at: dateFilter } : {}) },
      }),
    ]);

    res.json({
      success: true,
      data: {
        items: submissions.map((s) => ({
          ...s,
          overall_band: s.evaluation?.overall_band ?? null,
          evaluation: undefined,
        })),
        total,
        page,
        per_page,
        has_more: skip + per_page < total,
      },
    });
  } catch (err) {
    logger.error('List submissions error', { error: err });
    res.status(500).json({
      success: false,
      error: { code: 'FETCH_FAILED', message: 'Failed to fetch submissions' },
    });
  }
});

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id: user_id } = (req as AuthenticatedRequest).user;
    const submission = await prisma.submission.findFirst({
      where: { id: req.params.id, user_id },
      include: { evaluation: true },
    });

    if (!submission) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Submission not found' },
      });
      return;
    }

    res.json({ success: true, data: submission });
  } catch (err) {
    logger.error('Get submission error', { error: err });
    res.status(500).json({
      success: false,
      error: { code: 'FETCH_FAILED', message: 'Failed to fetch submission' },
    });
  }
});

router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id: user_id } = (req as AuthenticatedRequest).user;
    const submission = await prisma.submission.findFirst({
      where: { id: req.params.id, user_id },
    });

    if (!submission) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Submission not found' },
      });
      return;
    }

    await prisma.submission.delete({ where: { id: req.params.id } });
    res.json({ success: true, data: null });
  } catch (err) {
    logger.error('Delete submission error', { error: err });
    res.status(500).json({
      success: false,
      error: { code: 'DELETE_FAILED', message: 'Failed to delete submission' },
    });
  }
});

export default router;
