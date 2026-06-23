'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import { SignupSchema } from '@ielts-checker/validators';
import { apiClient } from '@/lib/api';
import type { z } from 'zod';

type SignupForm = z.infer<typeof SignupSchema>;

export default function SignupPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupForm>({ resolver: zodResolver(SignupSchema) });

  const onSubmit = async (data: SignupForm) => {
    setAuthError(null);
    try {
      await apiClient.signup(data.email, data.password, data.full_name);
      setSuccess(true);
      setTimeout(() => router.push('/login'), 2000);
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };
      if (error.code === 'EMAIL_EXISTS') {
        setAuthError('An account with this email already exists');
      } else {
        setAuthError('Something went wrong. Please try again.');
      }
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
          <p className="text-navy-400 text-sm mt-2">Create your free account</p>
        </div>

        <div className="bg-navy-800/60 border border-navy-700 rounded-2xl p-6">
          {success ? (
            <div className="text-center py-4">
              <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
              <p className="text-white font-semibold">Account created!</p>
              <p className="text-navy-400 text-sm mt-1">Redirecting to login...</p>
            </div>
          ) : (
            <>
              {authError && (
                <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4 text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {authError}
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="text-sm text-navy-300 block mb-1.5">Full name</label>
                  <input
                    type="text"
                    {...register('full_name')}
                    className="w-full bg-navy-700/60 border border-navy-600 rounded-lg px-3 py-2.5 text-white placeholder-navy-500 focus:outline-none focus:border-navy-400 text-sm"
                    placeholder="Jane Smith"
                  />
                  {errors.full_name && (
                    <p className="text-red-400 text-xs mt-1">{errors.full_name.message}</p>
                  )}
                </div>

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
                  {isSubmitting ? 'Creating account...' : 'Create account'}
                </button>
              </form>

              <p className="text-navy-500 text-xs text-center mt-4">
                3 free checks included · No credit card required
              </p>
            </>
          )}
        </div>

        <p className="text-center text-navy-400 text-sm mt-4">
          Already have an account?{' '}
          <Link href="/login" className="text-white hover:underline">Sign in</Link>
        </p>
      </motion.div>
    </div>
  );
}
