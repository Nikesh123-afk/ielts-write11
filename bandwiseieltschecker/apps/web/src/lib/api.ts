import type {
  Submission,
  SubmissionListItem,
  Evaluation,
  UserUsage,
  UserProgress,
  Plan,
  CoachMessage,
  ApiResponse,
  PaginatedResponse,
} from '@ielts-checker/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
  }

  private async request<T>(
    path: string,
    options: RequestInit = {},
  ): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    });

    const data = (await res.json()) as ApiResponse<T>;

    if (!data.success) {
      throw new ApiError(data.error.code, data.error.message, res.status);
    }

    return data.data;
  }

  // Auth
  async login(email: string, password: string) {
    return this.request<{
      access_token: string;
      refresh_token: string;
      expires_at: number;
      user: { id: string; email: string; full_name: string | null };
    }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async signup(email: string, password: string, full_name: string) {
    return this.request<{ user_id: string; email: string }>('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, full_name }),
    });
  }

  async getMe() {
    return this.request<{
      id: string;
      email: string;
      full_name: string | null;
      avatar_url: string | null;
      plan: string;
      credits: number;
      current_streak: number;
      longest_streak: number;
    }>('/api/auth/me');
  }

  // Submissions
  async submitEssay(data: {
    task_type: 'task1' | 'task2';
    test_type: 'academic' | 'general';
    question: string;
    essay: string;
  }) {
    return this.request<{ submission_id: string; status: string; message: string }>(
      '/api/submissions',
      { method: 'POST', body: JSON.stringify(data) },
    );
  }

  async getSubmissions(page = 1, per_page = 10) {
    return this.request<PaginatedResponse<SubmissionListItem>>(
      `/api/submissions?page=${page}&per_page=${per_page}`,
    );
  }

  async getSubmission(id: string) {
    return this.request<Submission>(`/api/submissions/${id}`);
  }

  async deleteSubmission(id: string) {
    return this.request<null>(`/api/submissions/${id}`, { method: 'DELETE' });
  }

  // Evaluations
  async getEvaluation(id: string) {
    return this.request<Evaluation & { submission: Partial<Submission> }>(
      `/api/evaluations/${id}`,
    );
  }

  async pollEvaluationStatus(submission_id: string) {
    return this.request<{
      status: string;
      evaluation_id: string | null;
      scores: { overall_band: number; ta_score: number; cc_score: number; lr_score: number; gra_score: number } | null;
    }>(`/api/evaluations/status/${submission_id}`);
  }

  // User
  async getUsage() {
    return this.request<UserUsage>('/api/user/usage');
  }

  async getProgress() {
    return this.request<UserProgress>('/api/user/progress');
  }

  async getPlans() {
    return this.request<Plan[]>('/api/plans');
  }

  async createCheckout(plan: 'pro' | 'credits', credit_pack?: '5' | '10' | '20') {
    return this.request<{ url: string }>('/api/user/stripe/checkout', {
      method: 'POST',
      body: JSON.stringify({ plan, credit_pack }),
    });
  }

  async createPortal() {
    return this.request<{ url: string }>('/api/user/stripe/portal', { method: 'POST' });
  }

  // AI Coach
  async sendCoachMessage(submission_id: string, message: string) {
    return this.request<{ message: CoachMessage; session_id: string }>('/api/coach/message', {
      method: 'POST',
      body: JSON.stringify({ submission_id, message }),
    });
  }

  async getCoachSession(submission_id: string) {
    return this.request<{ session_id: string; messages: CoachMessage[]; created_at: string } | null>(
      `/api/coach/session/${submission_id}`,
    );
  }

  // Practice
  async getPracticeQuestions(filters?: {
    task_type?: string;
    test_type?: string;
    topic?: string;
    difficulty?: string;
  }) {
    const params = new URLSearchParams(
      Object.entries(filters ?? {}).filter(([, v]) => v) as [string, string][],
    );
    return this.request<unknown[]>(`/api/practice?${params}`);
  }

  async generatePracticeQuestion(data: {
    task_type: 'task1' | 'task2';
    test_type: 'academic' | 'general';
    topic?: string;
    difficulty?: string;
  }) {
    return this.request<{
      question: string;
      tips: string[];
      band_target: number;
      time_limit_minutes: number;
      task_type: string;
      test_type: string;
    }>('/api/practice/generate', { method: 'POST', body: JSON.stringify(data) });
  }
}

export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const apiClient = new ApiClient();
