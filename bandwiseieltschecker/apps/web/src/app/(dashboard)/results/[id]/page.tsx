'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Loader2, CheckCircle, XCircle, ChevronDown,
  MessageSquare, ArrowRight,
} from 'lucide-react';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { getBandColor, getBandBgColor, getBandLabel, cn } from '@/lib/utils';
import type { EvaluationFeedback, GrammarError } from '@ielts-checker/types';

const ERROR_TYPE_COLORS: Record<GrammarError['error_type'], string> = {
  spelling: 'bg-red-400/10 text-red-400 border-red-400/20',
  grammar: 'bg-orange-400/10 text-orange-400 border-orange-400/20',
  punctuation: 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20',
  word_choice: 'bg-blue-400/10 text-blue-400 border-blue-400/20',
  article: 'bg-purple-400/10 text-purple-400 border-purple-400/20',
  tense: 'bg-pink-400/10 text-pink-400 border-pink-400/20',
  preposition: 'bg-cyan-400/10 text-cyan-400 border-cyan-400/20',
};

function ScoreGauge({ score, size = 'lg' }: { score: number; size?: 'sm' | 'lg' }) {
  const isLg = size === 'lg';
  const radius = isLg ? 54 : 32;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 9) * circumference;

  return (
    <div className={cn('relative flex items-center justify-center', isLg ? 'w-40 h-40' : 'w-20 h-20')}>
      <svg className="absolute inset-0 -rotate-90" width="100%" height="100%" viewBox={`0 0 ${isLg ? 160 : 80} ${isLg ? 160 : 80}`}>
        <circle
          cx={isLg ? 80 : 40} cy={isLg ? 80 : 40} r={radius}
          fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={isLg ? 10 : 7}
        />
        <circle
          cx={isLg ? 80 : 40} cy={isLg ? 80 : 40} r={radius}
          fill="none"
          stroke={score >= 7 ? '#4ade80' : score >= 5 ? '#fbbf24' : '#f87171'}
          strokeWidth={isLg ? 10 : 7}
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
        />
      </svg>
      <div className="text-center">
        <div className={cn('font-serif font-medium', getBandColor(score), isLg ? 'text-4xl' : 'text-xl')}>
          {score.toFixed(1)}
        </div>
        {isLg && <div className="text-navy-400 text-xs mt-0.5">{getBandLabel(score)}</div>}
      </div>
    </div>
  );
}

function CriterionCard({
  label, score, feedback,
}: {
  label: string;
  score: number;
  feedback: EvaluationFeedback['task_achievement'];
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className={cn('border rounded-xl overflow-hidden transition-colors', getBandBgColor(score))}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 text-left"
      >
        <div className="flex items-center gap-3">
          <ScoreGauge score={score} size="sm" />
          <div>
            <p className="text-white font-medium text-sm">{label}</p>
            <p className="text-navy-400 text-xs mt-0.5 line-clamp-1">{feedback.summary}</p>
          </div>
        </div>
        <ChevronDown className={cn('w-4 h-4 text-navy-400 transition-transform flex-shrink-0', open && 'rotate-180')} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="px-4 pb-4 space-y-3 border-t border-white/10 pt-3">
              {feedback.strengths.length > 0 && (
                <div>
                  <p className="text-xs text-green-400 font-medium mb-1.5">Strengths</p>
                  <ul className="space-y-1">
                    {feedback.strengths.map((s, i) => (
                      <li key={i} className="text-xs text-navy-200 flex gap-2">
                        <CheckCircle className="w-3 h-3 text-green-400 flex-shrink-0 mt-0.5" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {feedback.weaknesses.length > 0 && (
                <div>
                  <p className="text-xs text-red-400 font-medium mb-1.5">Areas to improve</p>
                  <ul className="space-y-1">
                    {feedback.weaknesses.map((w, i) => (
                      <li key={i} className="text-xs text-navy-200 flex gap-2">
                        <XCircle className="w-3 h-3 text-red-400 flex-shrink-0 mt-0.5" />
                        {w}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {feedback.suggestions.length > 0 && (
                <div>
                  <p className="text-xs text-amber-400 font-medium mb-1.5">Suggestions</p>
                  <ul className="space-y-1">
                    {feedback.suggestions.map((s, i) => (
                      <li key={i} className="text-xs text-navy-200 flex gap-2">
                        <ArrowRight className="w-3 h-3 text-amber-400 flex-shrink-0 mt-0.5" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function GrammarErrorItem({ error }: { error: GrammarError }) {
  return (
    <div className="bg-navy-800/60 border border-navy-700 rounded-lg p-3">
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className={cn('text-xs px-2 py-0.5 rounded border capitalize', ERROR_TYPE_COLORS[error.error_type])}>
          {error.error_type.replace('_', ' ')}
        </span>
      </div>
      <div className="flex items-start gap-2">
        <div className="flex-1">
          <p className="text-red-400 text-sm line-through">{error.original}</p>
          <p className="text-green-400 text-sm mt-0.5">{error.corrected}</p>
        </div>
      </div>
      <p className="text-navy-400 text-xs mt-2">{error.explanation}</p>
    </div>
  );
}

export default function ResultsPage() {
  const { id } = useParams<{ id: string }>();
  const [pollingEnabled, setPollingEnabled] = useState(true);

  const { data: statusData } = useQuery({
    queryKey: ['eval-status', id],
    queryFn: () => apiClient.pollEvaluationStatus(id),
    refetchInterval: pollingEnabled ? 3000 : false,
    enabled: !!id,
  });

  const evaluationId = statusData?.evaluation_id;

  useEffect(() => {
    if (statusData?.status === 'done' || statusData?.status === 'failed') {
      setPollingEnabled(false);
    }
  }, [statusData?.status]);

  const { data: evaluation } = useQuery({
    queryKey: ['evaluation', evaluationId],
    queryFn: () => apiClient.getEvaluation(evaluationId!),
    enabled: !!evaluationId,
  });

  if (!statusData || statusData.status === 'pending' || statusData.status === 'processing') {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center">
        <div className="relative mb-6">
          <div className="w-20 h-20 rounded-full border-2 border-navy-700 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-navy-300 animate-spin" />
          </div>
          <div className="absolute inset-0 rounded-full border-2 border-white/5 animate-pulse-ring" />
        </div>
        <h2 className="text-white font-semibold text-lg">Evaluating your essay</h2>
        <p className="text-navy-400 text-sm mt-2 max-w-xs">
          Claude AI is analysing your writing. This usually takes 15–30 seconds.
        </p>
      </div>
    );
  }

  if (statusData.status === 'failed') {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center">
        <XCircle className="w-12 h-12 text-red-400 mb-4" />
        <h2 className="text-white font-semibold text-lg">Evaluation failed</h2>
        <p className="text-navy-400 text-sm mt-2 max-w-xs">
          Something went wrong. Your credit has been refunded. Please try again.
        </p>
        <Link href="/dashboard/check" className="mt-4 bg-white text-navy-900 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-navy-100">
          Try Again
        </Link>
      </div>
    );
  }

  if (!evaluation) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-navy-400 animate-spin" />
      </div>
    );
  }

  const feedback = evaluation.feedback as EvaluationFeedback;
  const overallBand = Number(evaluation.overall_band);

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-6">
      {/* Overall score */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-navy-800/60 border border-navy-700 rounded-2xl p-6 text-center"
      >
        <p className="text-navy-400 text-xs tracking-widest uppercase mb-4">Estimated Band</p>
        <ScoreGauge score={overallBand} size="lg" />
        <div className="mt-4 grid grid-cols-4 gap-2 text-xs">
          {[
            { label: 'Task', score: Number(evaluation.ta_score) },
            { label: 'Coherence', score: Number(evaluation.cc_score) },
            { label: 'Lexical', score: Number(evaluation.lr_score) },
            { label: 'Grammar', score: Number(evaluation.gra_score) },
          ].map(({ label, score }) => (
            <div key={label} className="bg-navy-700/60 rounded-lg p-2">
              <div className={`font-serif font-medium text-base ${getBandColor(score)}`}>{score.toFixed(1)}</div>
              <div className="text-navy-400 text-xs">{label}</div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Criterion breakdown */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-white">Criterion Breakdown</h3>
        {[
          { label: 'Task Achievement / Response', score: Number(evaluation.ta_score), feedback: feedback.task_achievement },
          { label: 'Coherence & Cohesion', score: Number(evaluation.cc_score), feedback: feedback.coherence_cohesion },
          { label: 'Lexical Resource', score: Number(evaluation.lr_score), feedback: feedback.lexical_resource },
          { label: 'Grammatical Range & Accuracy', score: Number(evaluation.gra_score), feedback: feedback.grammatical_range },
        ].map(({ label, score, feedback: fb }) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <CriterionCard label={label} score={score} feedback={fb} />
          </motion.div>
        ))}
      </div>

      {/* Grammar errors */}
      {feedback.grammar_errors.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-white mb-3">
            Grammar Errors ({feedback.grammar_errors.length})
          </h3>
          <div className="grid sm:grid-cols-2 gap-2">
            {feedback.grammar_errors.map((error, i) => (
              <GrammarErrorItem key={i} error={error} />
            ))}
          </div>
        </div>
      )}

      {/* Vocabulary suggestions */}
      {feedback.vocabulary_suggestions?.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-white mb-3">Vocabulary Suggestions</h3>
          <div className="space-y-2">
            {feedback.vocabulary_suggestions.map((v, i) => (
              <div key={i} className="bg-navy-800/60 border border-navy-700 rounded-lg p-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-navy-400 text-sm line-through">{v.original_word}</span>
                  <ArrowRight className="w-3 h-3 text-navy-500" />
                  <div className="flex gap-1 flex-wrap">
                    {v.better_alternatives.map((alt) => (
                      <span key={alt} className="text-green-400 text-sm bg-green-400/10 px-2 py-0.5 rounded">{alt}</span>
                    ))}
                  </div>
                </div>
                <p className="text-navy-400 text-xs mt-1">{v.reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Improved essay */}
      {evaluation.improved_essay && (
        <div>
          <h3 className="text-sm font-medium text-white mb-3">Improved Essay</h3>
          <div className="bg-navy-800/60 border border-navy-700 rounded-xl p-4">
            <p className="text-navy-200 text-sm leading-relaxed whitespace-pre-wrap">
              {evaluation.improved_essay}
            </p>
          </div>
        </div>
      )}

      {/* Band improvement plan */}
      {feedback.band_improvement_plan && (
        <div>
          <h3 className="text-sm font-medium text-white mb-3">
            Improvement Plan — Target Band {feedback.band_improvement_plan.target_band}
          </h3>
          <div className="bg-navy-800/60 border border-navy-700 rounded-xl p-4 space-y-4">
            <div className="flex items-center gap-4 text-sm">
              <div className="text-navy-400">Current: <span className={getBandColor(feedback.band_improvement_plan.current_band)}>{feedback.band_improvement_plan.current_band}</span></div>
              <ArrowRight className="w-4 h-4 text-navy-600" />
              <div className="text-navy-400">Target: <span className="text-green-400">{feedback.band_improvement_plan.target_band}</span></div>
              <div className="text-navy-400 ml-auto">{feedback.band_improvement_plan.timeline_weeks} weeks</div>
            </div>
            <div className="space-y-2">
              {feedback.band_improvement_plan.focus_areas.map((area, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-navy-300">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  {area}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* AI Coach CTA */}
      <Link
        href={`/dashboard/coach?submission=${id}`}
        className="flex items-center justify-between bg-navy-800/60 border border-navy-600 rounded-xl p-4 hover:border-navy-500 transition-colors group"
      >
        <div className="flex items-center gap-3">
          <MessageSquare className="w-5 h-5 text-navy-300" />
          <div>
            <p className="text-white font-medium text-sm">Chat with AI Coach</p>
            <p className="text-navy-400 text-xs">Ask questions about your feedback</p>
          </div>
        </div>
        <ArrowRight className="w-4 h-4 text-navy-400 group-hover:translate-x-1 transition-transform" />
      </Link>
    </div>
  );
}
