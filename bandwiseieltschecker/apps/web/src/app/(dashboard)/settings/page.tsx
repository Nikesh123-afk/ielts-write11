'use client';

import { useQuery, useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ExternalLink, Loader2, Crown, CreditCard, Zap } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { useAppStore } from '@/store/useAppStore';

export default function SettingsPage() {
  const { user } = useAppStore();

  const { data: usage, isLoading } = useQuery({
    queryKey: ['usage'],
    queryFn: () => apiClient.getUsage(),
  });

  const portalMutation = useMutation({
    mutationFn: () => apiClient.createPortal(),
    onSuccess: (data) => { window.open(data.url, '_blank'); },
  });

  const checkoutProMutation = useMutation({
    mutationFn: () => apiClient.createCheckout('pro'),
    onSuccess: (data) => { window.open(data.url, '_blank'); },
  });

  const checkoutCreditsMutation = useMutation({
    mutationFn: (pack: '5' | '10' | '20') => apiClient.createCheckout('credits', pack),
    onSuccess: (data) => { window.open(data.url, '_blank'); },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-5 h-5 text-navy-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white">Settings</h2>
      </div>

      {/* Profile */}
      <div className="bg-navy-800/60 border border-navy-700 rounded-xl p-5">
        <h3 className="text-sm font-medium text-white mb-4">Profile</h3>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-navy-600 flex items-center justify-center text-lg font-semibold">
            {user?.full_name?.[0] ?? user?.email?.[0] ?? '?'}
          </div>
          <div>
            <p className="text-white font-medium">{user?.full_name ?? 'User'}</p>
            <p className="text-navy-400 text-sm">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Plan & credits */}
      <div className="bg-navy-800/60 border border-navy-700 rounded-xl p-5">
        <h3 className="text-sm font-medium text-white mb-4">Plan & Credits</h3>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center gap-2">
            {usage?.plan === 'pro' ? (
              <Crown className="w-4 h-4 text-amber-400" />
            ) : usage?.plan === 'credits' ? (
              <CreditCard className="w-4 h-4 text-blue-400" />
            ) : (
              <Zap className="w-4 h-4 text-navy-400" />
            )}
            <span className="text-white font-medium capitalize">{usage?.plan} plan</span>
          </div>
          {usage?.plan !== 'pro' && (
            <span className="text-xs text-navy-400 bg-navy-700 px-2 py-0.5 rounded">
              {usage?.plan === 'credits'
                ? `${usage.credits} credits remaining`
                : `${usage?.free_checks_remaining}/${usage?.free_checks_limit} free checks`}
            </span>
          )}
        </div>

        {usage?.plan === 'pro' ? (
          <button
            onClick={() => portalMutation.mutate()}
            disabled={portalMutation.isPending}
            className="flex items-center gap-2 text-sm text-navy-300 hover:text-white transition-colors"
          >
            {portalMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ExternalLink className="w-4 h-4" />
            )}
            Manage subscription
          </button>
        ) : (
          <div className="space-y-3">
            <motion.div
              whileHover={{ scale: 1.01 }}
              className="border border-white/20 rounded-xl p-4 cursor-pointer"
              onClick={() => checkoutProMutation.mutate()}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Crown className="w-4 h-4 text-amber-400" />
                    <span className="text-white font-medium">Pro Plan</span>
                  </div>
                  <p className="text-navy-400 text-xs mt-0.5">Unlimited checks, PDF export, full history</p>
                </div>
                <div className="text-right">
                  <div className="text-white font-semibold">$9/mo</div>
                  <button
                    disabled={checkoutProMutation.isPending}
                    className="text-xs text-navy-300 hover:text-white"
                  >
                    {checkoutProMutation.isPending ? 'Loading...' : 'Upgrade'}
                  </button>
                </div>
              </div>
            </motion.div>

            <div className="border border-navy-700 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <CreditCard className="w-4 h-4 text-blue-400" />
                <span className="text-white font-medium">Buy Credits</span>
                <span className="text-navy-400 text-xs">Never expire</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { pack: '5', checks: 5, price: '$10' },
                  { pack: '10', checks: 10, price: '$18' },
                  { pack: '20', checks: 20, price: '$32' },
                ].map(({ pack, checks, price }) => (
                  <button
                    key={pack}
                    onClick={() => checkoutCreditsMutation.mutate(pack as '5' | '10' | '20')}
                    disabled={checkoutCreditsMutation.isPending}
                    className="border border-navy-600 rounded-lg p-3 text-center hover:border-navy-500 transition-colors disabled:opacity-50"
                  >
                    <div className="text-white font-semibold text-sm">{checks}</div>
                    <div className="text-navy-400 text-xs">checks</div>
                    <div className="text-navy-300 text-xs mt-1">{price}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
