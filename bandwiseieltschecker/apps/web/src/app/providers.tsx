'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/auth';
import { useAppStore } from '@/store/useAppStore';
import { apiClient } from '@/lib/api';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: (failureCount, error) => {
        if ((error as { status?: number }).status === 401) return false;
        return failureCount < 3;
      },
    },
  },
});

function AuthSync() {
  const { setUser, setToken, setAuthLoading } = useAppStore();
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setToken(session.access_token);
        apiClient.setToken(session.access_token);
        apiClient.getMe().then(setUser).catch(() => {
          setToken(null);
          setUser(null);
        });
      }
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          setToken(session.access_token);
          apiClient.setToken(session.access_token);
          const user = await apiClient.getMe().catch(() => null);
          setUser(user);
        } else if (event === 'SIGNED_OUT') {
          setToken(null);
          setUser(null);
          apiClient.setToken(null);
        } else if (event === 'TOKEN_REFRESHED' && session) {
          setToken(session.access_token);
          apiClient.setToken(session.access_token);
        }
        setAuthLoading(false);
      },
    );

    return () => subscription.unsubscribe();
  }, [setUser, setToken, setAuthLoading]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthSync />
      {children}
      {process.env.NODE_ENV === 'development' && <ReactQueryDevtools />}
    </QueryClientProvider>
  );
}
