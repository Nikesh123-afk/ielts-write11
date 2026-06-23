'use client';

import { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Loader2, MessageSquare, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { cn, formatRelativeTime } from '@/lib/utils';
import type { CoachMessage } from '@ielts-checker/types';

const STARTER_QUESTIONS = [
  'Why did I score lower on Task Achievement?',
  'How can I improve my vocabulary?',
  'What coherence techniques should I use?',
  'Can you explain my grammar errors?',
  'How do I reach band 7?',
];

export default function CoachPage() {
  const searchParams = useSearchParams();
  const submissionId = searchParams.get('submission');
  const [messages, setMessages] = useState<CoachMessage[]>([]);
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  // Load existing session
  const { data: session, isLoading: sessionLoading } = useQuery({
    queryKey: ['coach-session', submissionId],
    queryFn: () => apiClient.getCoachSession(submissionId!),
    enabled: !!submissionId,
  });

  useEffect(() => {
    if (session?.messages) {
      setMessages(session.messages as CoachMessage[]);
    }
  }, [session]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const { data: submissions } = useQuery({
    queryKey: ['submissions', 1],
    queryFn: () => apiClient.getSubmissions(1, 10),
    enabled: !submissionId,
  });

  const sendMutation = useMutation({
    mutationFn: (message: string) =>
      apiClient.sendCoachMessage(submissionId!, message),
    onSuccess: (data) => {
      setMessages((prev) => [...prev, data.message]);
    },
  });

  const send = () => {
    if (!input.trim() || !submissionId || sendMutation.isPending) return;
    const userMsg: CoachMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input.trim(),
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    sendMutation.mutate(input.trim());
    setInput('');
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  if (!submissionId) {
    return (
      <div className="p-4 md:p-6 max-w-2xl mx-auto">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-white">AI Writing Coach</h2>
          <p className="text-navy-400 text-sm mt-1">Select an essay to start coaching</p>
        </div>

        {sessionLoading ? (
          <Loader2 className="w-5 h-5 animate-spin text-navy-400" />
        ) : (
          <div className="space-y-2">
            {(submissions?.items ?? []).filter((s) => s.status === 'done').map((s) => (
              <Link
                key={s.id}
                href={`/dashboard/coach?submission=${s.id}`}
                className="flex items-center justify-between bg-navy-800/60 border border-navy-700 rounded-xl p-4 hover:border-navy-600 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <BookOpen className="w-4 h-4 text-navy-400" />
                  <div>
                    <span className="text-sm text-white capitalize">{s.task_type} — {s.word_count} words</span>
                    <p className="text-xs text-navy-500">{formatRelativeTime(s.created_at)}</p>
                  </div>
                </div>
                {s.overall_band && (
                  <span className="font-serif text-lg font-medium text-navy-200">
                    {Number(s.overall_band).toFixed(1)}
                  </span>
                )}
              </Link>
            ))}
            {(submissions?.items ?? []).filter((s) => s.status === 'done').length === 0 && (
              <div className="text-center py-16 text-navy-500 text-sm">
                No evaluated essays yet.{' '}
                <Link href="/dashboard/check" className="text-white underline">Check an essay first</Link>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)]">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-navy-800 bg-navy-900/60">
        <MessageSquare className="w-5 h-5 text-navy-300" />
        <div>
          <p className="text-sm font-medium text-white">AI Writing Coach</p>
          <Link href={`/dashboard/results/${submissionId}`} className="text-xs text-navy-400 hover:text-white transition-colors">
            View essay results
          </Link>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && !sessionLoading && (
          <div className="text-center pt-8">
            <div className="w-12 h-12 rounded-full bg-navy-800 border border-navy-700 flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-5 h-5 text-navy-400" />
            </div>
            <p className="text-navy-400 text-sm mb-6">Ask anything about your essay and feedback</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-md mx-auto">
              {STARTER_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => { setInput(q); }}
                  className="text-left text-xs text-navy-300 bg-navy-800/60 border border-navy-700 rounded-lg p-3 hover:border-navy-600 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}
            >
              <div
                className={cn(
                  'max-w-[80%] rounded-xl px-4 py-3 text-sm',
                  msg.role === 'user'
                    ? 'bg-white text-navy-900'
                    : 'bg-navy-800/80 border border-navy-700 text-navy-200',
                )}
              >
                <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {sendMutation.isPending && (
          <div className="flex justify-start">
            <div className="bg-navy-800/80 border border-navy-700 rounded-xl px-4 py-3">
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-navy-400 animate-bounce"
                    style={{ animationDelay: `${i * 0.1}s` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-navy-800">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            rows={1}
            placeholder="Ask about your essay..."
            className="flex-1 bg-navy-800/60 border border-navy-700 rounded-xl px-3 py-2.5 text-white placeholder-navy-500 text-sm focus:outline-none focus:border-navy-500 resize-none"
          />
          <button
            onClick={send}
            disabled={!input.trim() || sendMutation.isPending}
            className="flex-shrink-0 bg-white text-navy-900 rounded-xl px-3 py-2.5 hover:bg-navy-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {sendMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
        <p className="text-navy-600 text-xs mt-1.5 text-center">Press Enter to send · Shift+Enter for new line</p>
      </div>
    </div>
  );
}
