'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Loader2, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { getBandColor, formatDate, cn } from '@/lib/utils';

const STATUS_STYLES = {
  done: 'text-green-400 bg-green-400/10',
  processing: 'text-amber-400 bg-amber-400/10',
  pending: 'text-navy-400 bg-navy-700',
  failed: 'text-red-400 bg-red-400/10',
};

export default function HistoryPage() {
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['submissions', page],
    queryFn: () => apiClient.getSubmissions(page, 15),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.deleteSubmission(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['submissions'] }),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 text-navy-400 animate-spin" />
      </div>
    );
  }

  const submissions = data?.items ?? [];

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-white">Essay History</h2>
        <p className="text-navy-400 text-sm mt-1">
          {data?.total ?? 0} total submission{data?.total !== 1 ? 's' : ''}
        </p>
      </div>

      {submissions.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-navy-500 text-sm">No submissions yet</p>
          <Link href="/dashboard/check" className="mt-4 inline-block text-white underline text-sm">
            Check your first essay
          </Link>
        </div>
      ) : (
        <div className="bg-navy-800/60 border border-navy-700 rounded-xl overflow-hidden">
          <div className="divide-y divide-navy-700/50">
            {submissions.map((s, i) => (
              <motion.div
                key={s.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.03 }}
                className="flex items-center gap-4 px-5 py-3.5 hover:bg-navy-700/30 transition-colors group"
              >
                <Link href={`/dashboard/results/${s.id}`} className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs bg-navy-700 text-navy-300 px-2 py-0.5 rounded capitalize">
                      {s.task_type}
                    </span>
                    <span className="text-xs bg-navy-700 text-navy-300 px-2 py-0.5 rounded capitalize">
                      {s.test_type}
                    </span>
                    <span className={cn('text-xs px-2 py-0.5 rounded capitalize', STATUS_STYLES[s.status])}>
                      {s.status}
                    </span>
                  </div>
                  <p className="text-navy-400 text-xs">
                    {formatDate(s.created_at)} · {s.word_count} words
                  </p>
                </Link>

                {s.status === 'done' && s.overall_band && (
                  <span className={cn('font-serif text-lg font-medium flex-shrink-0', getBandColor(Number(s.overall_band)))}>
                    {Number(s.overall_band).toFixed(1)}
                  </span>
                )}
                {(s.status === 'pending' || s.status === 'processing') && (
                  <Loader2 className="w-4 h-4 text-navy-500 animate-spin flex-shrink-0" />
                )}

                <button
                  onClick={() => deleteMutation.mutate(s.id)}
                  disabled={deleteMutation.isPending}
                  className="opacity-0 group-hover:opacity-100 text-navy-600 hover:text-red-400 transition-all p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </div>

          {/* Pagination */}
          {(data?.total ?? 0) > 15 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-navy-700 text-sm text-navy-400">
              <span>Page {page} of {Math.ceil((data?.total ?? 0) / 15)}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="p-1 hover:text-white disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={!data?.has_more}
                  className="p-1 hover:text-white disabled:opacity-40"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
