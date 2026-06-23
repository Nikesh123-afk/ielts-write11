'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  PenLine, TrendingUp, Flame, CreditCard,
  ChevronRight, Clock, CheckCircle, Loader2,
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import { useAppStore } from '@/store/useAppStore';
import { getBandColor, formatRelativeTime } from '@/lib/utils';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';

function BandTrendChart({ data }: { data: { date: string; overall_band: number }[] }) {
  if (data.length < 2) return null;
  return (
    <ResponsiveContainer width="100%" height={120}>
      <LineChart data={data}>
        <XAxis dataKey="date" hide />
        <YAxis domain={[0, 9]} hide />
        <Tooltip
          contentStyle={{ background: '#1a3a55', border: '1px solid #2d5578', borderRadius: 8, color: '#fff', fontSize: 12 }}
          formatter={(v: number) => [v.toFixed(1), 'Band']}
        />
        <Line
          type="monotone"
          dataKey="overall_band"
          stroke="#9fb4c9"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, fill: '#fff' }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export default function DashboardPage() {
  const { user } = useAppStore();

  const { data: usage } = useQuery({
    queryKey: ['usage'],
    queryFn: () => apiClient.getUsage(),
  });

  const { data: progress } = useQuery({
    queryKey: ['progress'],
    queryFn: () => apiClient.getProgress(),
  });

  const { data: submissionsPage } = useQuery({
    queryKey: ['submissions', 1],
    queryFn: () => apiClient.getSubmissions(1, 5),
  });

  const recentSubmissions = submissionsPage?.items ?? [];

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
      {/* Welcome */}
      <div>
        <h2 className="text-xl font-semibold text-white">
          Welcome back{user?.full_name ? `, ${user.full_name.split(' ')[0]}` : ''}
        </h2>
        <p className="text-navy-400 text-sm mt-0.5">
          {progress?.total_submissions === 0
            ? 'Submit your first essay to get started'
            : `You've completed ${progress?.total_submissions} evaluation${progress?.total_submissions !== 1 ? 's' : ''}`}
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}
          className="bg-navy-800/60 border border-navy-700 rounded-xl p-4">
          <div className="flex items-center gap-2 text-navy-400 text-xs mb-2">
            <TrendingUp className="w-3.5 h-3.5" />
            Avg Band
          </div>
          <div className={`font-serif text-3xl font-medium ${getBandColor(progress?.average_band ?? 0)}`}>
            {progress?.average_band ? progress.average_band.toFixed(1) : '—'}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="bg-navy-800/60 border border-navy-700 rounded-xl p-4">
          <div className="flex items-center gap-2 text-navy-400 text-xs mb-2">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            Streak
          </div>
          <div className="font-serif text-3xl font-medium text-amber-400">
            {progress?.current_streak ?? 0}
            <span className="text-sm font-sans font-normal text-navy-400 ml-1">days</span>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-navy-800/60 border border-navy-700 rounded-xl p-4">
          <div className="flex items-center gap-2 text-navy-400 text-xs mb-2">
            <CreditCard className="w-3.5 h-3.5" />
            {usage?.plan === 'pro' ? 'Plan' : 'Checks Left'}
          </div>
          <div className="font-serif text-3xl font-medium text-white">
            {usage?.plan === 'pro'
              ? 'Pro'
              : usage?.plan === 'credits'
              ? `${usage.credits}`
              : `${usage?.free_checks_remaining ?? 0}`}
          </div>
          {usage?.plan !== 'pro' && (
            <p className="text-navy-500 text-xs mt-1">
              {usage?.plan === 'credits' ? 'credits' : `of ${usage?.free_checks_limit} free`}
            </p>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="bg-navy-800/60 border border-navy-700 rounded-xl p-4">
          <div className="flex items-center gap-2 text-navy-400 text-xs mb-2">
            <CheckCircle className="w-3.5 h-3.5 text-green-400" />
            Total
          </div>
          <div className="font-serif text-3xl font-medium text-white">
            {progress?.total_submissions ?? 0}
            <span className="text-sm font-sans font-normal text-navy-400 ml-1">essays</span>
          </div>
        </motion.div>
      </div>

      {/* Main content */}
      <div className="grid md:grid-cols-5 gap-6">
        {/* Band trend */}
        <div className="md:col-span-3 bg-navy-800/60 border border-navy-700 rounded-xl p-5">
          <h3 className="text-sm font-medium text-white mb-4">Band Score Trend</h3>
          {(progress?.band_history?.length ?? 0) >= 2 ? (
            <BandTrendChart data={progress!.band_history} />
          ) : (
            <div className="h-32 flex items-center justify-center text-navy-500 text-sm">
              Submit at least 2 essays to see your trend
            </div>
          )}
        </div>

        {/* Quick action + weak areas */}
        <div className="md:col-span-2 space-y-3">
          <Link
            href="/dashboard/check"
            className="flex items-center justify-between bg-white text-navy-900 rounded-xl p-4 hover:bg-navy-100 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <PenLine className="w-5 h-5" />
              <div>
                <p className="font-semibold text-sm">Check an Essay</p>
                <p className="text-xs text-navy-600">Task 1 or Task 2</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>

          {(progress?.weak_criteria?.length ?? 0) > 0 && (
            <div className="bg-navy-800/60 border border-navy-700 rounded-xl p-4">
              <p className="text-xs text-navy-400 mb-3">Focus areas</p>
              <div className="space-y-1.5">
                {progress!.weak_criteria.slice(0, 2).map((area) => (
                  <div key={area} className="flex items-center gap-2 text-sm text-amber-400">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    {area}
                  </div>
                ))}
              </div>
            </div>
          )}

          {!usage?.can_submit && (
            <Link
              href="/pricing"
              className="flex items-center justify-between bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 hover:border-amber-400/50 transition-colors"
            >
              <div>
                <p className="text-amber-400 font-medium text-sm">Out of checks</p>
                <p className="text-navy-400 text-xs">Upgrade to continue</p>
              </div>
              <ChevronRight className="w-4 h-4 text-amber-400" />
            </Link>
          )}
        </div>
      </div>

      {/* Recent submissions */}
      {recentSubmissions.length > 0 && (
        <div className="bg-navy-800/60 border border-navy-700 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-navy-700">
            <h3 className="text-sm font-medium text-white">Recent Submissions</h3>
            <Link href="/dashboard/history" className="text-xs text-navy-400 hover:text-white transition-colors">
              View all
            </Link>
          </div>
          <div className="divide-y divide-navy-700/50">
            {recentSubmissions.map((s) => (
              <Link
                key={s.id}
                href={`/dashboard/results/${s.id}`}
                className="flex items-center gap-4 px-5 py-3 hover:bg-navy-700/30 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-navy-700 text-navy-300 px-2 py-0.5 rounded capitalize">
                      {s.task_type}
                    </span>
                    <span className="text-xs text-navy-500">{s.word_count}w</span>
                  </div>
                  <p className="text-xs text-navy-500 mt-0.5">{formatRelativeTime(s.created_at)}</p>
                </div>
                <div className="flex items-center gap-3">
                  {s.status === 'done' && s.overall_band ? (
                    <span className={`font-serif text-lg font-medium ${getBandColor(Number(s.overall_band))}`}>
                      {Number(s.overall_band).toFixed(1)}
                    </span>
                  ) : s.status === 'processing' || s.status === 'pending' ? (
                    <Loader2 className="w-4 h-4 text-navy-500 animate-spin" />
                  ) : (
                    <span className="text-xs text-red-400">Failed</span>
                  )}
                  <Clock className="w-3.5 h-3.5 text-navy-600" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
