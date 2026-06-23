import { Queue, Worker, QueueEvents } from 'bullmq';
import IORedis from 'ioredis';
import type { EvaluationJobData, EvaluationJobResult } from '@ielts-checker/types';
import { logger } from '../middleware/logger.js';

let connection: IORedis | undefined;

export function getRedisConnection(): IORedis {
  if (!connection) {
    connection = new IORedis(process.env.REDIS_URL!, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });
    connection.on('error', (err) => logger.error('Redis error', { error: err.message }));
  }
  return connection;
}

const QUEUE_NAME = 'essay-evaluation';

export function createEvaluationQueue(): Queue<EvaluationJobData, EvaluationJobResult> {
  return new Queue(QUEUE_NAME, {
    connection: getRedisConnection(),
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 },
      removeOnComplete: { count: 100 },
      removeOnFail: { count: 50 },
    },
  });
}

export const evaluationQueue = createEvaluationQueue();

export function createQueueEvents(): QueueEvents {
  return new QueueEvents(QUEUE_NAME, { connection: getRedisConnection() });
}

export async function enqueueEvaluation(
  data: EvaluationJobData,
  priority: 'normal' | 'high' = 'normal',
): Promise<string> {
  const job = await evaluationQueue.add('evaluate', data, {
    priority: priority === 'high' ? 1 : 10,
  });
  logger.info('Evaluation job enqueued', { job_id: job.id, submission_id: data.submission_id });
  return job.id!;
}
