import { Router, Request, Response } from 'express';
import { prisma } from '../db/prisma.js';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';
import { logger } from '../middleware/logger.js';

const router = Router();

router.use(requireAuth);

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id: user_id } = (req as AuthenticatedRequest).user;

    const evaluation = await prisma.evaluation.findFirst({
      where: {
        id: req.params.id,
        submission: { user_id },
      },
      include: {
        submission: {
          select: {
            id: true,
            task_type: true,
            test_type: true,
            word_count: true,
            question: true,
            status: true,
          },
        },
      },
    });

    if (!evaluation) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Evaluation not found' },
      });
      return;
    }

    res.json({ success: true, data: evaluation });
  } catch (err) {
    logger.error('Get evaluation error', { error: err });
    res.status(500).json({
      success: false,
      error: { code: 'FETCH_FAILED', message: 'Failed to fetch evaluation' },
    });
  }
});

// Poll evaluation status by submission ID
router.get('/status/:submission_id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id: user_id } = (req as AuthenticatedRequest).user;

    const submission = await prisma.submission.findFirst({
      where: { id: req.params.submission_id, user_id },
      select: {
        id: true,
        status: true,
        evaluation: {
          select: {
            id: true,
            overall_band: true,
            ta_score: true,
            cc_score: true,
            lr_score: true,
            gra_score: true,
          },
        },
      },
    });

    if (!submission) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Submission not found' },
      });
      return;
    }

    res.json({
      success: true,
      data: {
        status: submission.status,
        evaluation_id: submission.evaluation?.id ?? null,
        scores: submission.evaluation
          ? {
              overall_band: Number(submission.evaluation.overall_band),
              ta_score: Number(submission.evaluation.ta_score),
              cc_score: Number(submission.evaluation.cc_score),
              lr_score: Number(submission.evaluation.lr_score),
              gra_score: Number(submission.evaluation.gra_score),
            }
          : null,
      },
    });
  } catch (err) {
    logger.error('Poll evaluation status error', { error: err });
    res.status(500).json({
      success: false,
      error: { code: 'FETCH_FAILED', message: 'Failed to poll evaluation status' },
    });
  }
});

export default router;
