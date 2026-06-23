import { Router, Request, Response } from 'express';
import { prisma } from '../db/prisma.js';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { generatePracticeQuestion } from '../services/claude.js';
import { logger } from '../middleware/logger.js';
import { PracticeGenerateSchema } from '@ielts-checker/validators';
import rateLimit from 'express-rate-limit';

const router = Router();
router.use(requireAuth);

const practiceGenLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  keyGenerator: (req) => (req as AuthenticatedRequest).user?.id ?? req.ip ?? 'unknown',
  handler: (_req, res) => {
    res.status(429).json({
      success: false,
      error: { code: 'RATE_LIMITED', message: 'Practice question limit reached, try again later' },
    });
  },
});

// Get practice questions from DB (pre-seeded)
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { task_type, test_type, topic, difficulty } = req.query as Record<string, string>;

    const questions = await prisma.practiceQuestion.findMany({
      where: {
        ...(task_type ? { task_type: task_type as 'task1' | 'task2' } : {}),
        ...(test_type ? { test_type: test_type as 'academic' | 'general' } : {}),
        ...(topic ? { topic: topic as never } : {}),
        ...(difficulty ? { difficulty: difficulty as never } : {}),
      },
      take: 20,
      orderBy: { created_at: 'desc' },
    });

    res.json({ success: true, data: questions });
  } catch (err) {
    logger.error('Get practice questions error', { error: err });
    res.status(500).json({
      success: false,
      error: { code: 'FETCH_FAILED', message: 'Failed to fetch practice questions' },
    });
  }
});

// AI-generate a personalized practice question
router.post(
  '/generate',
  practiceGenLimit,
  validateBody(PracticeGenerateSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id: user_id } = (req as AuthenticatedRequest).user;
      const { task_type, test_type, topic, difficulty } = req.body as {
        task_type: 'task1' | 'task2';
        test_type: 'academic' | 'general';
        topic?: string;
        difficulty?: string;
      };

      // Find user's weak criteria from recent evaluations
      const recentEvals = await prisma.evaluation.findMany({
        where: { submission: { user_id } },
        orderBy: { created_at: 'desc' },
        take: 5,
        select: { ta_score: true, cc_score: true, lr_score: true, gra_score: true },
      });

      const weak_areas: string[] = [];
      if (recentEvals.length > 0) {
        const avg = {
          ta: recentEvals.reduce((s, e) => s + Number(e.ta_score), 0) / recentEvals.length,
          cc: recentEvals.reduce((s, e) => s + Number(e.cc_score), 0) / recentEvals.length,
          lr: recentEvals.reduce((s, e) => s + Number(e.lr_score), 0) / recentEvals.length,
          gra: recentEvals.reduce((s, e) => s + Number(e.gra_score), 0) / recentEvals.length,
        };
        const minScore = Math.min(avg.ta, avg.cc, avg.lr, avg.gra);
        if (avg.ta === minScore) weak_areas.push('Task Achievement');
        if (avg.cc === minScore) weak_areas.push('Coherence & Cohesion');
        if (avg.lr === minScore) weak_areas.push('Lexical Resource');
        if (avg.gra === minScore) weak_areas.push('Grammatical Range');
      }

      const generated = await generatePracticeQuestion({
        task_type,
        test_type,
        topic,
        difficulty,
        weak_areas,
      });

      res.json({ success: true, data: { ...generated, task_type, test_type, topic, difficulty } });
    } catch (err) {
      logger.error('Generate practice question error', { error: err });
      res.status(500).json({
        success: false,
        error: { code: 'GENERATE_FAILED', message: 'Failed to generate practice question' },
      });
    }
  },
);

export default router;
