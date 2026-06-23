import { Router, Request, Response } from 'express';
import { prisma } from '../db/prisma.js';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { coachRateLimit } from '../middleware/rateLimit.js';
import { chatWithCoach } from '../services/claude.js';
import { logger } from '../middleware/logger.js';
import { CoachMessageSchema } from '@ielts-checker/validators';
import type { CoachMessage } from '@ielts-checker/types';

const router = Router();

router.use(requireAuth);

router.post(
  '/message',
  coachRateLimit,
  validateBody(CoachMessageSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id: user_id } = (req as AuthenticatedRequest).user;
      const { submission_id, message } = req.body as {
        submission_id: string;
        message: string;
      };

      // Verify submission belongs to user and has evaluation
      const submission = await prisma.submission.findFirst({
        where: { id: submission_id, user_id },
        include: {
          evaluation: {
            select: {
              overall_band: true,
              ta_score: true,
              cc_score: true,
              lr_score: true,
              gra_score: true,
              feedback: true,
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

      if (!submission.evaluation) {
        res.status(400).json({
          success: false,
          error: { code: 'NO_EVALUATION', message: 'Evaluation not complete yet' },
        });
        return;
      }

      // Get or create coach session
      let session = await prisma.coachSession.findFirst({
        where: { submission_id, user_id },
        orderBy: { created_at: 'desc' },
      });

      if (!session) {
        session = await prisma.coachSession.create({
          data: { user_id, submission_id, messages: [] },
        });
      }

      const history = (session.messages as CoachMessage[]).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const submission_context = `Task: ${submission.task_type}, Test: ${submission.test_type}, Words: ${submission.word_count}`;
      const evaluation_summary = `Overall Band: ${submission.evaluation.overall_band}, TA: ${submission.evaluation.ta_score}, CC: ${submission.evaluation.cc_score}, LR: ${submission.evaluation.lr_score}, GRA: ${submission.evaluation.gra_score}`;

      const response = await chatWithCoach({
        submission_context,
        evaluation_summary,
        conversation_history: history.slice(-10), // Last 10 messages for context
        user_message: message,
      });

      const userMsg: CoachMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content: message,
        created_at: new Date().toISOString(),
      };

      const assistantMsg: CoachMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response.message,
        created_at: new Date().toISOString(),
      };

      const updatedMessages = [...(session.messages as CoachMessage[]), userMsg, assistantMsg];

      await prisma.coachSession.update({
        where: { id: session.id },
        data: { messages: updatedMessages as object[] },
      });

      res.json({ success: true, data: { message: assistantMsg, session_id: session.id } });
    } catch (err) {
      logger.error('Coach message error', { error: err });
      res.status(500).json({
        success: false,
        error: { code: 'COACH_ERROR', message: 'Failed to get coach response' },
      });
    }
  },
);

router.get('/session/:submission_id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id: user_id } = (req as AuthenticatedRequest).user;

    const session = await prisma.coachSession.findFirst({
      where: { submission_id: req.params.submission_id, user_id },
      orderBy: { created_at: 'desc' },
    });

    res.json({
      success: true,
      data: session
        ? { session_id: session.id, messages: session.messages, created_at: session.created_at }
        : null,
    });
  } catch (err) {
    logger.error('Get coach session error', { error: err });
    res.status(500).json({
      success: false,
      error: { code: 'FETCH_FAILED', message: 'Failed to fetch coach session' },
    });
  }
});

export default router;
