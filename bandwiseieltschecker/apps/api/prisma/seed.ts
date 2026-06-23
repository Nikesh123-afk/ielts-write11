import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const EVALUATION_PROMPT = `You are an expert IELTS examiner with 15+ years of experience grading writing tasks. Your evaluations are precise, constructive, and follow official IELTS band descriptors exactly.

You will receive an IELTS writing submission and must evaluate it according to the four official criteria:
1. Task Achievement (Task 1) / Task Response (Task 2)
2. Coherence & Cohesion
3. Lexical Resource
4. Grammatical Range & Accuracy

IMPORTANT RULES:
- Band scores must be in increments of 0.5 (e.g., 5.0, 5.5, 6.0, 6.5, 7.0, 7.5, 8.0, 8.5, 9.0)
- Overall band = average of 4 criteria, rounded to nearest 0.5
- Be realistic — do not inflate scores
- Never log or repeat the essay content in your response
- Grammar errors should be actual quotes from the essay

You MUST respond with ONLY a valid JSON object in this exact format (no markdown, no explanation, just JSON):
{
  "overall_band": 6.5,
  "ta_score": 6.0,
  "cc_score": 7.0,
  "lr_score": 6.5,
  "gra_score": 6.5,
  "feedback": {
    "task_achievement": {
      "score": 6.0,
      "summary": "Brief overall summary of performance on this criterion",
      "strengths": ["strength 1", "strength 2"],
      "weaknesses": ["weakness 1", "weakness 2"],
      "suggestions": ["specific suggestion 1", "specific suggestion 2"],
      "quotes": ["relevant quote from essay"]
    },
    "coherence_cohesion": {
      "score": 7.0,
      "summary": "...",
      "strengths": [],
      "weaknesses": [],
      "suggestions": [],
      "quotes": []
    },
    "lexical_resource": {
      "score": 6.5,
      "summary": "...",
      "strengths": [],
      "weaknesses": [],
      "suggestions": [],
      "quotes": []
    },
    "grammatical_range": {
      "score": 6.5,
      "summary": "...",
      "strengths": [],
      "weaknesses": [],
      "suggestions": [],
      "quotes": []
    },
    "grammar_errors": [
      {
        "original": "exact text from essay with error",
        "corrected": "corrected version",
        "explanation": "brief explanation of the error",
        "error_type": "grammar",
        "position": 0
      }
    ],
    "band_improvement_plan": {
      "current_band": 6.5,
      "target_band": 7.0,
      "timeline_weeks": 8,
      "focus_areas": ["area 1", "area 2", "area 3"],
      "weekly_tasks": [
        {
          "week": 1,
          "focus": "focus area",
          "tasks": ["task 1", "task 2"]
        }
      ]
    },
    "vocabulary_suggestions": [
      {
        "original_word": "word from essay",
        "better_alternatives": ["alternative1", "alternative2"],
        "context": "sentence context",
        "reason": "why these alternatives are better"
      }
    ]
  },
  "improved_essay": "A complete rewritten version of the essay at a Band 7-8 level, maintaining the student's core ideas but improving structure, vocabulary, and grammar."
}`;

const COACH_PROMPT = `You are a friendly, expert IELTS writing tutor with deep knowledge of IELTS band descriptors and writing strategies. You have access to the student's essay evaluation results.

Your role is to:
1. Answer questions about their specific feedback clearly and helpfully
2. Explain band descriptors and scoring criteria
3. Provide targeted advice based on their weak areas
4. Give concrete examples and techniques
5. Be encouraging while being honest

Keep responses concise (2-4 paragraphs max) and actionable. Use specific examples when possible. If the student asks something unrelated to IELTS writing, gently redirect them.`;

async function main() {
  console.log('Seeding database...');

  await prisma.prompt.upsert({
    where: { name: 'ielts_evaluation_v1' },
    create: { name: 'ielts_evaluation_v1', content: EVALUATION_PROMPT, version: 1, is_active: true },
    update: { content: EVALUATION_PROMPT, is_active: true },
  });

  await prisma.prompt.upsert({
    where: { name: 'ielts_coach_v1' },
    create: { name: 'ielts_coach_v1', content: COACH_PROMPT, version: 1, is_active: true },
    update: { content: COACH_PROMPT, is_active: true },
  });

  await prisma.plan.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Free',
      price_monthly: 0,
      checks_per_month: 3,
      features: [
        { label: '3 essay checks/month', included: true },
        { label: 'Task 1 & Task 2', included: true },
        { label: 'Full evaluation report', included: true },
        { label: 'Grammar corrections', included: true },
        { label: 'Band improvement plan', included: true },
        { label: 'PDF export', included: false },
        { label: 'Essay history > 7 days', included: false },
        { label: 'Priority queue', included: false },
      ],
    },
    update: {},
  });

  await prisma.plan.upsert({
    where: { id: '00000000-0000-0000-0000-000000000002' },
    create: {
      id: '00000000-0000-0000-0000-000000000002',
      name: 'Pro',
      price_monthly: 9,
      checks_per_month: null,
      stripe_price_id: process.env.STRIPE_PRO_PRICE_ID ?? 'price_xxx',
      features: [
        { label: 'Unlimited essay checks', included: true },
        { label: 'Full evaluation report', included: true },
        { label: 'Grammar corrections', included: true },
        { label: 'Band improvement plan', included: true },
        { label: 'PDF export', included: true },
        { label: 'Full history forever', included: true },
        { label: 'Priority queue', included: true },
        { label: 'AI Writing Coach', included: true },
      ],
    },
    update: {},
  });

  const practiceQuestions = [
    {
      task_type: 'task2' as const,
      test_type: 'academic' as const,
      topic: 'technology' as const,
      difficulty: 'medium' as const,
      question: 'Some people believe that technology has made our lives more complex and stressful, while others argue that it has made life easier and more convenient. Discuss both views and give your own opinion.',
      band_target: 6.5,
      time_limit_minutes: 40,
      tips: ['Present both sides fairly', 'Use specific examples', 'Structure: intro → view 1 → view 2 → opinion → conclusion', 'Aim for 270-300 words'],
    },
    {
      task_type: 'task2' as const,
      test_type: 'academic' as const,
      topic: 'education' as const,
      difficulty: 'medium' as const,
      question: 'Universities should accept equal numbers of male and female students in every subject. To what extent do you agree or disagree?',
      band_target: 6.5,
      time_limit_minutes: 40,
      tips: ['Take a clear position', 'Consider gender equality vs merit-based selection', 'Acknowledge counterarguments'],
    },
    {
      task_type: 'task2' as const,
      test_type: 'academic' as const,
      topic: 'environment' as const,
      difficulty: 'hard' as const,
      question: 'The increasing demand for energy from non-renewable sources is causing global environmental problems. What are the causes of this continued reliance, and what solutions can be proposed?',
      band_target: 7.0,
      time_limit_minutes: 40,
      tips: ['Identify specific causes (economic, political, technological)', 'Propose realistic solutions with examples', 'Use cause-effect language: due to, as a result, consequently'],
    },
    {
      task_type: 'task1' as const,
      test_type: 'academic' as const,
      topic: 'society' as const,
      difficulty: 'medium' as const,
      question: 'The chart below shows the percentage of households in owned and rented accommodation in England and Wales between 1918 and 2011. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.',
      band_target: 6.0,
      time_limit_minutes: 20,
      tips: ['Start with an overview (2 key trends)', 'Use precise figures', 'Compare data across years', 'No opinion — just describe'],
    },
    {
      task_type: 'task2' as const,
      test_type: 'general' as const,
      topic: 'health' as const,
      difficulty: 'easy' as const,
      question: 'Many people believe that regular exercise is the most important factor in maintaining good health. Do you agree or disagree?',
      band_target: 6.0,
      time_limit_minutes: 40,
      tips: ['Give a clear opinion in the introduction', 'Use personal examples if helpful', 'Consider diet, sleep, mental health as other factors'],
    },
  ];

  for (const q of practiceQuestions) {
    await prisma.practiceQuestion.create({
      data: q,
    }).catch(() => {});
  }

  console.log('Seed complete ✓');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
