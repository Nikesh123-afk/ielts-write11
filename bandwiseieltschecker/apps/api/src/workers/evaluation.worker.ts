import { Worker, Job } from 'bullmq';
import { getRedisConnection } from '../services/queue.js';
import { evaluateEssay } from '../services/claude.js';
import { sendEvaluationCompleteEmail, sendCreditRefundEmail } from '../services/email.js';
import { prisma } from '../db/prisma.js';
import { logger } from '../middleware/logger.js';
import type { EvaluationJobData, EvaluationJobResult } from '@ielts-checker/types';

async function refundCredit(user_id: string, plan: string): Promise<void> {
  if (plan === 'pro') return;
  if (plan === 'credits') {
    await prisma.user.update({
      where: { id: user_id },
      data: { credits: { increment: 1 } },
    });
  } else {
    await prisma.user.update({
      where: { id: user_id },
      data: { free_checks_used: { decrement: 1 } },
    });
  }
}

async function updateStreak(user_id: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: user_id } });
  if (!user) return;

  const now = new Date();
  const lastSubmission = user.last_submission_at;
  const dayMs = 86_400_000;

  let newStreak = 1;
  if (lastSubmission) {
    const daysSince = Math.floor((now.getTime() - lastSubmission.getTime()) / dayMs);
    if (daysSince === 0) {
      newStreak = user.current_streak; // Same day, no change
    } else if (daysSince === 1) {
      newStreak = user.current_streak + 1; // Consecutive day
    }
  }

  await prisma.user.update({
    where: { id: user_id },
    data: {
      current_streak: newStreak,
      longest_streak: Math.max(newStreak, user.longest_streak),
      last_submission_at: now,
    },
  });
}

export function startEvaluationWorker(): Worker<EvaluationJobData, EvaluationJobResult> {
  const worker = new Worker<EvaluationJobData, EvaluationJobResult>(
    'essay-evaluation',
    async (job: Job<EvaluationJobData, EvaluationJobResult>) => {
      const { submission_id, user_id, task_type, test_type, question, essay, word_count } =
        job.data;

      logger.info('Processing evaluation job', { submission_id, job_id: job.id });
      const startMs = Date.now();

      // Mark as processing
      await prisma.submission.update({
        where: { id: submission_id },
        data: { status: 'processing' },
      });

      let result: Awaited<ReturnType<typeof evaluateEssay>>;
      try {
        result = await evaluateEssay({ task_type, test_type, question, essay, word_count });
      } catch (err) {
        logger.error('Claude evaluation failed', { submission_id, error: err });

        await prisma.submission.update({
          where: { id: submission_id },
          data: { status: 'failed' },
        });

        const user = await prisma.user.findUnique({ where: { id: user_id } });
        if (user) {
          await refundCredit(user_id, user.plan);
          await sendCreditRefundEmail({ to: user.email, full_name: user.full_name });
        }

        throw err;
      }

      const processingMs = Date.now() - startMs;

      // Save evaluation to DB
      const evaluation = await prisma.evaluation.create({
        data: {
          submission_id,
          overall_band: result.overall_band,
          ta_score: result.ta_score,
          cc_score: result.cc_score,
          lr_score: result.lr_score,
          gra_score: result.gra_score,
          feedback: result.feedback as object,
          improved_essay: result.improved_essay,
          tokens_used: result.input_tokens + result.output_tokens,
          processing_ms: processingMs,
        },
      });

      await prisma.submission.update({
        where: { id: submission_id },
        data: { status: 'done' },
      });

      // Update streak
      await updateStreak(user_id);

      // Send completion email
      const user = await prisma.user.findUnique({ where: { id: user_id } });
      if (user) {
        await sendEvaluationCompleteEmail({
          to: user.email,
          full_name: user.full_name,
          overall_band: result.overall_band,
          submission_id,
        });
      }

      logger.info('Evaluation complete', {
        submission_id,
        overall_band: result.overall_band,
        processing_ms: processingMs,
        tokens: result.input_tokens + result.output_tokens,
      });

      return {
        evaluation_id: evaluation.id,
        tokens_used: result.input_tokens + result.output_tokens,
        processing_ms: processingMs,
      };
    },
    {
      connection: getRedisConnection(),
      concurrency: 3,
    },
  );

  worker.on('failed', (job, err) => {
    logger.error('Worker job failed', { job_id: job?.id, error: err.message });
  });

  worker.on('completed', (job) => {
    logger.info('Worker job completed', { job_id: job.id });
  });

  return worker;
}
