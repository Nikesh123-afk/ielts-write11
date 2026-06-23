'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, AlertCircle, Info } from 'lucide-react';
import { SubmissionSchema, WORD_LIMITS } from '@ielts-checker/validators';
import { apiClient } from '@/lib/api';
import { countWords, getWordCountStatus, cn } from '@/lib/utils';
import type { z } from 'zod';

type SubmissionForm = z.infer<typeof SubmissionSchema>;

function WordCountBadge({
  count,
  taskType,
}: {
  count: number;
  taskType: 'task1' | 'task2';
}) {
  const status = getWordCountStatus(count, taskType);
  const limits = WORD_LIMITS[taskType];

  return (
    <div
      className={cn(
        'text-xs px-2 py-1 rounded-md font-medium transition-colors',
        status === 'too-short' && 'text-red-400 bg-red-400/10',
        status === 'ideal' && 'text-green-400 bg-green-400/10',
        status === 'over' && 'text-amber-400 bg-amber-400/10',
      )}
    >
      {count} words
      {status === 'too-short' && ` · ${limits.min - count} more needed`}
      {status === 'ideal' && ' · Good length'}
      {status === 'over' && ` · Consider trimming`}
    </div>
  );
}

export default function CheckPage() {
  const router = useRouter();
  const [wordCount, setWordCount] = useState(0);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SubmissionForm>({
    resolver: zodResolver(SubmissionSchema),
    defaultValues: { task_type: 'task2', test_type: 'academic' },
  });

  const taskType = watch('task_type') as 'task1' | 'task2';
  const limits = WORD_LIMITS[taskType];

  const handleEssayChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setWordCount(countWords(e.target.value));
    },
    [],
  );

  const onSubmit = async (data: SubmissionForm) => {
    setSubmitError(null);
    try {
      const result = await apiClient.submitEssay(data);
      router.push(`/dashboard/results/${result.submission_id}`);
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string; status?: number };
      if (error.status === 402) {
        setSubmitError('No checks remaining. Please upgrade your plan or purchase credits.');
      } else {
        setSubmitError(error.message ?? 'Failed to submit essay. Please try again.');
      }
    }
  };

  const wordStatus = getWordCountStatus(wordCount, taskType);
  const canSubmit = wordStatus !== 'too-short' && !isSubmitting;

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-white">Check Your Essay</h2>
        <p className="text-navy-400 text-sm mt-1">
          Paste your IELTS essay for instant AI-powered band score feedback
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Task/Test type */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-navy-300 block mb-1.5">Task Type</label>
            <select
              {...register('task_type')}
              className="w-full bg-navy-800/60 border border-navy-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-navy-500"
            >
              <option value="task1">Task 1</option>
              <option value="task2">Task 2</option>
            </select>
          </div>
          <div>
            <label className="text-sm text-navy-300 block mb-1.5">Test Type</label>
            <select
              {...register('test_type')}
              className="w-full bg-navy-800/60 border border-navy-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-navy-500"
            >
              <option value="academic">Academic</option>
              <option value="general">General Training</option>
            </select>
          </div>
        </div>

        {/* Word count info */}
        <div className="flex items-center gap-2 text-xs text-navy-400 bg-navy-800/40 border border-navy-700 rounded-lg px-3 py-2">
          <Info className="w-3.5 h-3.5 flex-shrink-0" />
          {taskType === 'task1'
            ? 'Task 1: Minimum 150 words, ideal 150–200 words'
            : 'Task 2: Minimum 250 words, ideal 250–350 words'}
        </div>

        {/* Question */}
        <div>
          <label className="text-sm text-navy-300 block mb-1.5">
            IELTS Question / Prompt
          </label>
          <textarea
            {...register('question')}
            rows={3}
            className="w-full bg-navy-800/60 border border-navy-700 rounded-lg px-3 py-2.5 text-white placeholder-navy-500 focus:outline-none focus:border-navy-500 text-sm resize-none"
            placeholder="Paste the IELTS question or task description here..."
          />
          {errors.question && (
            <p className="text-red-400 text-xs mt-1">{errors.question.message}</p>
          )}
        </div>

        {/* Essay */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-sm text-navy-300">Your Essay</label>
            <AnimatePresence mode="wait">
              {wordCount > 0 && (
                <motion.div
                  key={`${wordStatus}-${wordCount}`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <WordCountBadge count={wordCount} taskType={taskType} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <textarea
            {...register('essay', {
              onChange: handleEssayChange,
            })}
            rows={14}
            className="w-full bg-navy-800/60 border border-navy-700 rounded-lg px-3 py-2.5 text-white placeholder-navy-500 focus:outline-none focus:border-navy-500 text-sm resize-y font-mono leading-relaxed"
            placeholder={`Write or paste your ${taskType === 'task1' ? 'Task 1 response' : 'Task 2 essay'} here...`}
          />
          {errors.essay && (
            <p className="text-red-400 text-xs mt-1">{errors.essay.message}</p>
          )}
        </div>

        {/* Error */}
        {submitError && (
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {submitError}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={!canSubmit}
          className={cn(
            'w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all',
            canSubmit
              ? 'bg-white text-navy-900 hover:bg-navy-100'
              : 'bg-navy-700 text-navy-500 cursor-not-allowed',
          )}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Evaluating...
            </>
          ) : wordStatus === 'too-short' ? (
            `Add ${limits.min - wordCount} more words to submit`
          ) : (
            'Get Band Score'
          )}
        </button>
      </form>
    </div>
  );
}
