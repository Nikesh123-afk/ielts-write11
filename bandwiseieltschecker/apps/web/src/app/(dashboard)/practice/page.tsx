'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Loader2, Sparkles, Clock, Target, BookOpen, ChevronRight } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { cn } from '@/lib/utils';

const TOPICS = [
  { value: 'environment', label: 'Environment' },
  { value: 'technology', label: 'Technology' },
  { value: 'education', label: 'Education' },
  { value: 'health', label: 'Health' },
  { value: 'society', label: 'Society' },
  { value: 'economy', label: 'Economy' },
  { value: 'culture', label: 'Culture' },
  { value: 'government', label: 'Government' },
] as const;

const DIFFICULTIES = [
  { value: 'easy', label: 'Easy', color: 'text-green-400', bg: 'bg-green-400/10 border-green-400/20' },
  { value: 'medium', label: 'Medium', color: 'text-amber-400', bg: 'bg-amber-400/10 border-amber-400/20' },
  { value: 'hard', label: 'Hard', color: 'text-red-400', bg: 'bg-red-400/10 border-red-400/20' },
] as const;

interface GeneratedQuestion {
  question: string;
  tips: string[];
  band_target: number;
  time_limit_minutes: number;
  task_type: string;
  test_type: string;
}

export default function PracticePage() {
  const router = useRouter();
  const [taskType, setTaskType] = useState<'task1' | 'task2'>('task2');
  const [testType, setTestType] = useState<'academic' | 'general'>('academic');
  const [topic, setTopic] = useState<string | undefined>();
  const [difficulty, setDifficulty] = useState<string>('medium');
  const [generated, setGenerated] = useState<GeneratedQuestion | null>(null);
  const [timer, setTimer] = useState<number | null>(null);
  const [timerActive, setTimerActive] = useState(false);

  const generateMutation = useMutation({
    mutationFn: () =>
      apiClient.generatePracticeQuestion({ task_type: taskType, test_type: testType, topic, difficulty }),
    onSuccess: (data) => {
      setGenerated(data);
      setTimer(data.time_limit_minutes * 60);
      setTimerActive(false);
    },
  });

  const startPractice = () => {
    if (!generated) return;
    // Pre-fill the check page with this question
    const params = new URLSearchParams({
      task_type: generated.task_type,
      test_type: generated.test_type,
      question: generated.question,
    });
    router.push(`/dashboard/check?${params}`);
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white">Practice Mode</h2>
        <p className="text-navy-400 text-sm mt-1">
          Generate personalised IELTS questions based on your weak areas
        </p>
      </div>

      {/* Settings */}
      <div className="bg-navy-800/60 border border-navy-700 rounded-xl p-5 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-navy-400 block mb-1.5">Task Type</label>
            <div className="flex gap-2">
              {(['task1', 'task2'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTaskType(t)}
                  className={cn(
                    'flex-1 py-2 rounded-lg text-sm font-medium transition-colors border',
                    taskType === t
                      ? 'bg-white/10 text-white border-white/20'
                      : 'text-navy-400 border-navy-700 hover:border-navy-600',
                  )}
                >
                  {t === 'task1' ? 'Task 1' : 'Task 2'}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-navy-400 block mb-1.5">Test Type</label>
            <div className="flex gap-2">
              {(['academic', 'general'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTestType(t)}
                  className={cn(
                    'flex-1 py-2 rounded-lg text-sm font-medium transition-colors border capitalize',
                    testType === t
                      ? 'bg-white/10 text-white border-white/20'
                      : 'text-navy-400 border-navy-700 hover:border-navy-600',
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Topic */}
        <div>
          <label className="text-xs text-navy-400 block mb-2">Topic (optional)</label>
          <div className="flex flex-wrap gap-2">
            {TOPICS.map((t) => (
              <button
                key={t.value}
                onClick={() => setTopic(topic === t.value ? undefined : t.value)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border',
                  topic === t.value
                    ? 'bg-white/10 text-white border-white/20'
                    : 'text-navy-400 border-navy-700 hover:border-navy-600',
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Difficulty */}
        <div>
          <label className="text-xs text-navy-400 block mb-2">Difficulty</label>
          <div className="flex gap-2">
            {DIFFICULTIES.map((d) => (
              <button
                key={d.value}
                onClick={() => setDifficulty(d.value)}
                className={cn(
                  'flex-1 py-2 rounded-lg text-sm font-medium transition-colors border',
                  difficulty === d.value ? d.bg + ' ' + d.color : 'text-navy-400 border-navy-700 hover:border-navy-600',
                )}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => generateMutation.mutate()}
          disabled={generateMutation.isPending}
          className="w-full flex items-center justify-center gap-2 bg-white text-navy-900 py-2.5 rounded-lg font-semibold text-sm hover:bg-navy-100 disabled:opacity-50 transition-colors"
        >
          {generateMutation.isPending ? (
            <><Loader2 className="w-4 h-4 animate-spin" />Generating...</>
          ) : (
            <><Sparkles className="w-4 h-4" />Generate Question</>
          )}
        </button>
      </div>

      {/* Generated question */}
      {generated && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-navy-800/60 border border-navy-600 rounded-xl p-5 space-y-4"
        >
          <div className="flex items-center gap-3 text-xs text-navy-400">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              {generated.time_limit_minutes} minutes
            </span>
            <span className="flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5" />
              Target Band {generated.band_target}
            </span>
          </div>

          <div>
            <h3 className="text-xs text-navy-400 uppercase tracking-wide mb-2">Question</h3>
            <p className="text-white text-sm leading-relaxed">{generated.question}</p>
          </div>

          {generated.tips.length > 0 && (
            <div>
              <h3 className="text-xs text-navy-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <BookOpen className="w-3 h-3" /> Tips
              </h3>
              <ul className="space-y-1.5">
                {generated.tips.map((tip, i) => (
                  <li key={i} className="text-navy-300 text-sm flex gap-2">
                    <span className="text-navy-600 flex-shrink-0">{i + 1}.</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <button
            onClick={startPractice}
            className="w-full flex items-center justify-center gap-2 bg-white text-navy-900 py-2.5 rounded-lg font-semibold text-sm hover:bg-navy-100 transition-colors"
          >
            Start Writing
            <ChevronRight className="w-4 h-4" />
          </button>
        </motion.div>
      )}
    </div>
  );
}
