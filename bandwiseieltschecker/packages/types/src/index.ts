// ─── User & Auth ──────────────────────────────────────────────────────────────

export type UserPlan = 'free' | 'pro' | 'credits';

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  plan: UserPlan;
  credits: number;
  stripe_customer_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserUsage {
  plan: UserPlan;
  credits: number;
  free_checks_used: number;
  free_checks_limit: number;
  free_checks_remaining: number;
  can_submit: boolean;
}

// ─── Submissions ──────────────────────────────────────────────────────────────

export type TaskType = 'task1' | 'task2';
export type TestType = 'academic' | 'general';
export type SubmissionStatus = 'pending' | 'processing' | 'done' | 'failed';

export interface Submission {
  id: string;
  user_id: string;
  task_type: TaskType;
  test_type: TestType;
  question: string;
  essay: string;
  word_count: number;
  status: SubmissionStatus;
  created_at: string;
  evaluation?: Evaluation;
}

export interface SubmissionListItem {
  id: string;
  task_type: TaskType;
  test_type: TestType;
  word_count: number;
  status: SubmissionStatus;
  created_at: string;
  overall_band: number | null;
}

// ─── Evaluations ──────────────────────────────────────────────────────────────

export interface GrammarError {
  original: string;
  corrected: string;
  explanation: string;
  error_type: 'spelling' | 'grammar' | 'punctuation' | 'word_choice' | 'article' | 'tense' | 'preposition';
  position?: number;
}

export interface CriterionFeedback {
  score: number;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  quotes: string[];
}

export interface EvaluationFeedback {
  task_achievement: CriterionFeedback;
  coherence_cohesion: CriterionFeedback;
  lexical_resource: CriterionFeedback;
  grammatical_range: CriterionFeedback;
  grammar_errors: GrammarError[];
  band_improvement_plan: BandImprovementPlan;
  vocabulary_suggestions: VocabularySuggestion[];
}

export interface BandImprovementPlan {
  current_band: number;
  target_band: number;
  timeline_weeks: number;
  focus_areas: string[];
  weekly_tasks: WeeklyTask[];
}

export interface WeeklyTask {
  week: number;
  focus: string;
  tasks: string[];
}

export interface VocabularySuggestion {
  original_word: string;
  better_alternatives: string[];
  context: string;
  reason: string;
}

export interface Evaluation {
  id: string;
  submission_id: string;
  overall_band: number;
  ta_score: number;
  cc_score: number;
  lr_score: number;
  gra_score: number;
  feedback: EvaluationFeedback;
  improved_essay: string;
  tokens_used: number | null;
  processing_ms: number | null;
  created_at: string;
}

// ─── Plans ────────────────────────────────────────────────────────────────────

export interface PlanFeature {
  label: string;
  included: boolean;
}

export interface Plan {
  id: string;
  name: string;
  price_monthly: number | null;
  checks_per_month: number | null;
  stripe_price_id: string | null;
  features: PlanFeature[];
}

// ─── AI Coach (new feature) ───────────────────────────────────────────────────

export interface CoachMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface CoachSession {
  id: string;
  submission_id: string;
  messages: CoachMessage[];
  created_at: string;
}

// ─── Practice Mode (new feature) ─────────────────────────────────────────────

export type PracticeDifficulty = 'easy' | 'medium' | 'hard';
export type PracticeTopic =
  | 'environment' | 'technology' | 'education' | 'health'
  | 'society' | 'economy' | 'culture' | 'government';

export interface PracticeQuestion {
  id: string;
  task_type: TaskType;
  test_type: TestType;
  topic: PracticeTopic;
  difficulty: PracticeDifficulty;
  question: string;
  band_target: number;
  time_limit_minutes: number;
  tips: string[];
}

// ─── Progress & Streaks (new feature) ────────────────────────────────────────

export interface UserProgress {
  user_id: string;
  current_streak: number;
  longest_streak: number;
  total_submissions: number;
  average_band: number;
  band_history: BandHistoryPoint[];
  achievements: Achievement[];
  weak_criteria: string[];
}

export interface BandHistoryPoint {
  date: string;
  overall_band: number;
  submission_id: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked_at: string | null;
  requirement: number;
  progress: number;
}

// ─── API Response types ───────────────────────────────────────────────────────

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
  has_more: boolean;
}

// ─── Stripe / Payments ────────────────────────────────────────────────────────

export interface CheckoutSession {
  url: string;
}

export interface BillingPortalSession {
  url: string;
}

// ─── Job Queue ────────────────────────────────────────────────────────────────

export interface EvaluationJobData {
  submission_id: string;
  user_id: string;
  task_type: TaskType;
  test_type: TestType;
  question: string;
  essay: string;
  word_count: number;
  priority: 'normal' | 'high';
}

export interface EvaluationJobResult {
  evaluation_id: string;
  tokens_used: number;
  processing_ms: number;
}
