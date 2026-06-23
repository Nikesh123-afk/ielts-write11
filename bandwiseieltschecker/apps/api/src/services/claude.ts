import Anthropic from '@anthropic-ai/sdk';
import { prisma } from '../db/prisma.js';
import { logger } from '../middleware/logger.js';
import type { EvaluationFeedback } from '@ielts-checker/types';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const EVALUATION_PROMPT_NAME = 'ielts_evaluation_v1';
const COACH_PROMPT_NAME = 'ielts_coach_v1';

async function getActivePrompt(name: string): Promise<string> {
  const prompt = await prisma.prompt.findFirst({
    where: { name, is_active: true },
    orderBy: { version: 'desc' },
  });
  if (!prompt) {
    throw new Error(`No active prompt found for: ${name}`);
  }
  return prompt.content;
}

function buildEvaluationUserMessage(
  taskType: string,
  testType: string,
  question: string,
  essay: string,
  wordCount: number,
): string {
  return `TASK TYPE: ${taskType === 'task1' ? 'Task 1' : 'Task 2'}
TEST TYPE: ${testType === 'academic' ? 'Academic' : 'General Training'}
WORD COUNT: ${wordCount}

IELTS QUESTION:
${question}

STUDENT ESSAY:
${essay}`;
}

async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
): Promise<T> {
  let lastError: Error | undefined;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < maxAttempts) {
        const delay = Math.pow(2, attempt - 1) * 1000;
        logger.warn(`Claude API attempt ${attempt} failed, retrying in ${delay}ms`, {
          error: lastError.message,
        });
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError;
}

export interface EvaluationResult {
  feedback: EvaluationFeedback;
  improved_essay: string;
  overall_band: number;
  ta_score: number;
  cc_score: number;
  lr_score: number;
  gra_score: number;
  input_tokens: number;
  output_tokens: number;
}

export async function evaluateEssay(params: {
  task_type: string;
  test_type: string;
  question: string;
  essay: string;
  word_count: number;
}): Promise<EvaluationResult> {
  const systemPrompt = await getActivePrompt(EVALUATION_PROMPT_NAME);
  const userMessage = buildEvaluationUserMessage(
    params.task_type,
    params.test_type,
    params.question,
    params.essay,
    params.word_count,
  );

  return withRetry(async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120_000);

    try {
      let fullText = '';
      let inputTokens = 0;
      let outputTokens = 0;

      const stream = await client.messages.stream({
        model: 'claude-sonnet-4-6',
        max_tokens: 4000,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
      });

      for await (const event of stream) {
        if (controller.signal.aborted) break;
        if (
          event.type === 'content_block_delta' &&
          event.delta.type === 'text_delta'
        ) {
          fullText += event.delta.text;
        }
        if (event.type === 'message_delta' && event.usage) {
          outputTokens = event.usage.output_tokens;
        }
        if (event.type === 'message_start' && event.message.usage) {
          inputTokens = event.message.usage.input_tokens;
        }
      }

      return parseEvaluationResponse(fullText, inputTokens, outputTokens);
    } finally {
      clearTimeout(timeout);
    }
  });
}

function parseEvaluationResponse(
  raw: string,
  inputTokens: number,
  outputTokens: number,
): EvaluationResult {
  // Extract JSON from the response — Claude returns a structured JSON block
  const jsonMatch = raw.match(/```json\s*([\s\S]*?)\s*```/);
  const jsonStr = jsonMatch ? jsonMatch[1] : raw.trim();

  let parsed: {
    overall_band: number;
    ta_score: number;
    cc_score: number;
    lr_score: number;
    gra_score: number;
    feedback: EvaluationFeedback;
    improved_essay: string;
  };

  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    throw new Error('Claude returned malformed JSON response');
  }

  const requiredFields = ['overall_band', 'ta_score', 'cc_score', 'lr_score', 'gra_score', 'feedback', 'improved_essay'];
  for (const field of requiredFields) {
    if (!(field in parsed)) {
      throw new Error(`Missing required field in Claude response: ${field}`);
    }
  }

  return {
    ...parsed,
    input_tokens: inputTokens,
    output_tokens: outputTokens,
  };
}

export interface CoachResponse {
  message: string;
  input_tokens: number;
  output_tokens: number;
}

export async function chatWithCoach(params: {
  submission_context: string;
  evaluation_summary: string;
  conversation_history: Array<{ role: 'user' | 'assistant'; content: string }>;
  user_message: string;
}): Promise<CoachResponse> {
  const systemPrompt = await getActivePrompt(COACH_PROMPT_NAME);

  const contextualSystem = `${systemPrompt}

ESSAY CONTEXT:
${params.submission_context}

EVALUATION SUMMARY:
${params.evaluation_summary}`;

  return withRetry(async () => {
    const messages: Anthropic.MessageParam[] = [
      ...params.conversation_history.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user', content: params.user_message },
    ];

    let fullText = '';
    let inputTokens = 0;
    let outputTokens = 0;

    const stream = await client.messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      system: contextualSystem,
      messages,
    });

    for await (const event of stream) {
      if (
        event.type === 'content_block_delta' &&
        event.delta.type === 'text_delta'
      ) {
        fullText += event.delta.text;
      }
      if (event.type === 'message_delta' && event.usage) {
        outputTokens = event.usage.output_tokens;
      }
      if (event.type === 'message_start' && event.message.usage) {
        inputTokens = event.message.usage.input_tokens;
      }
    }

    return { message: fullText.trim(), input_tokens: inputTokens, output_tokens: outputTokens };
  });
}

export async function generatePracticeQuestion(params: {
  task_type: string;
  test_type: string;
  topic?: string;
  difficulty?: string;
  weak_areas?: string[];
}): Promise<{
  question: string;
  tips: string[];
  band_target: number;
  time_limit_minutes: number;
}> {
  const systemPrompt = `You are an expert IELTS examiner who creates practice questions.
Generate a realistic IELTS ${params.task_type === 'task1' ? 'Task 1' : 'Task 2'} (${params.test_type}) practice question.
${params.weak_areas?.length ? `Focus on helping the student improve their: ${params.weak_areas.join(', ')}.` : ''}

Return ONLY valid JSON in this exact format:
{
  "question": "The full question text",
  "tips": ["tip 1", "tip 2", "tip 3"],
  "band_target": 6.5,
  "time_limit_minutes": 40
}`;

  const userMessage = `Topic: ${params.topic ?? 'any'}, Difficulty: ${params.difficulty ?? 'medium'}`;

  const response = await withRetry(() =>
    client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 500,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    }),
  );

  const text = response.content[0].type === 'text' ? response.content[0].text : '';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Failed to generate practice question');

  return JSON.parse(jsonMatch[0]);
}
