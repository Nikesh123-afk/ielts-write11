import { z } from 'zod';

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const SignupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  full_name: z.string().min(2, 'Name must be at least 2 characters').max(100),
});

export const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// ─── Submissions ──────────────────────────────────────────────────────────────

export const WORD_LIMITS = {
  task1: { min: 150, ideal_min: 150, ideal_max: 200, max: 300 },
  task2: { min: 250, ideal_min: 250, ideal_max: 350, max: 500 },
} as const;

export const SubmissionSchema = z.object({
  task_type: z.enum(['task1', 'task2']),
  test_type: z.enum(['academic', 'general']),
  question: z
    .string()
    .min(10, 'Question must be at least 10 characters')
    .max(2000, 'Question is too long'),
  essay: z
    .string()
    .min(50, 'Essay is too short')
    .max(10000, 'Essay exceeds maximum length'),
});

export type SubmissionInput = z.infer<typeof SubmissionSchema>;

// ─── Stripe ───────────────────────────────────────────────────────────────────

export const CheckoutSchema = z.object({
  plan: z.enum(['pro', 'credits']),
  credit_pack: z.enum(['5', '10', '20']).optional(),
});

// ─── Coach ────────────────────────────────────────────────────────────────────

export const CoachMessageSchema = z.object({
  submission_id: z.string().uuid(),
  message: z
    .string()
    .min(1, 'Message cannot be empty')
    .max(2000, 'Message too long'),
});

// ─── Practice ─────────────────────────────────────────────────────────────────

export const PracticeGenerateSchema = z.object({
  task_type: z.enum(['task1', 'task2']),
  test_type: z.enum(['academic', 'general']),
  topic: z
    .enum(['environment', 'technology', 'education', 'health', 'society', 'economy', 'culture', 'government'])
    .optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
});

// ─── Vocabulary ───────────────────────────────────────────────────────────────

export const VocabEnhanceSchema = z.object({
  submission_id: z.string().uuid(),
});

// ─── Environment validation ───────────────────────────────────────────────────

export const ServerEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.string().default('3001'),
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid URL'),
  DIRECT_URL: z.string().url('DIRECT_URL must be a valid URL'),
  REDIS_URL: z.string().min(1, 'REDIS_URL is required'),
  ANTHROPIC_API_KEY: z.string().min(1, 'ANTHROPIC_API_KEY is required'),
  SUPABASE_URL: z.string().url('SUPABASE_URL must be a valid URL'),
  SUPABASE_ANON_KEY: z.string().min(1, 'SUPABASE_ANON_KEY is required'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY is required'),
  SUPABASE_JWT_SECRET: z.string().min(1, 'SUPABASE_JWT_SECRET is required'),
  STRIPE_SECRET_KEY: z.string().min(1, 'STRIPE_SECRET_KEY is required'),
  STRIPE_WEBHOOK_SECRET: z.string().min(1, 'STRIPE_WEBHOOK_SECRET is required'),
  STRIPE_PRO_PRICE_ID: z.string().min(1, 'STRIPE_PRO_PRICE_ID is required'),
  RESEND_API_KEY: z.string().min(1, 'RESEND_API_KEY is required'),
  RESEND_FROM_EMAIL: z.string().email().default('noreply@ielts-checker.com'),
  SENTRY_DSN: z.string().optional(),
  FRONTEND_URL: z.string().url().default('http://localhost:3000'),
  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET_NAME: z.string().optional(),
});

export type ServerEnv = z.infer<typeof ServerEnvSchema>;
