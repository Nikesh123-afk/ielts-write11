'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import { LoginSchema } from '@ielts-checker/validators';
import { supabase } from '@/lib/auth';
import { useAppStore } from '@/store/useAppStore';
import { apiClient } from '@/lib/api';
import type { z } from 'zod';

type LoginForm = z.infer<typeof LoginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { setUser, setToken } = useAppStore();
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(LoginSchema) });

  const onSubmit = async (data: LoginForm) => {
    setAuthError(null);
    try {
      const { data: session, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        setAuthError('Invalid email or password');
        return;
      }

      setToken(session.session!.access_token);
      apiClient.setToken(session.session!.access_token);
      const user = await apiClient.getMe();
      setUser(user);
      router.push('/dashboard');
    } catch {
      setAuthError('Something went wrong. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-navy-900 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <Link href="/" className="font-serif text-2xl font-semibold text-white">BandWise</Link>
          <p className="text-navy-400 text-sm mt-2">Sign in to your account</p>
        </div>

        <div className="bg-navy-800/60 border border-navy-700 rounded-2xl p-6">
          {authError && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {authError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="text-sm text-navy-300 block mb-1.5">Email</label>
              <input
                type="email"
                {...register('email')}
                className="w-full bg-navy-700/60 border border-navy-600 rounded-lg px-3 py-2.5 text-white placeholder-navy-500 focus:outline-none focus:border-navy-400 text-sm"
                placeholder="you@example.com"
              />
              {errors.email && (
                <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="text-sm text-navy-300 block mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  {...register('password')}
                  className="w-full bg-navy-700/60 border border-navy-600 rounded-lg px-3 py-2.5 text-white placeholder-navy-500 focus:outline-none focus:border-navy-400 text-sm pr-10"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-500 hover:text-navy-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-white text-navy-900 py-2.5 rounded-lg font-semibold text-sm hover:bg-navy-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </div>

        <p className="text-center text-navy-400 text-sm mt-4">
          Don't have an account?{' '}
          <Link href="/signup" className="text-white hover:underline">Sign up free</Link>
        </p>
      </motion.div>
    </div>
  );
}
