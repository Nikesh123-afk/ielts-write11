'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, PenLine, History, Settings,
  BookOpen, MessageSquare, Flame, LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';

const NAV_ITEMS = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/dashboard/check', icon: PenLine, label: 'Check Essay' },
  { href: '/dashboard/history', icon: History, label: 'History' },
  { href: '/dashboard/practice', icon: BookOpen, label: 'Practice' },
  { href: '/dashboard/coach', icon: MessageSquare, label: 'AI Coach' },
  { href: '/dashboard/settings', icon: Settings, label: 'Settings' },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAppStore();

  return (
    <aside className="hidden md:flex flex-col w-56 bg-navy-950/80 border-r border-navy-800 h-screen sticky top-0">
      {/* Logo */}
      <div className="p-5 border-b border-navy-800">
        <span className="font-serif text-xl font-semibold text-white">BandWise</span>
      </div>

      {/* Streak badge */}
      {(user?.current_streak ?? 0) > 0 && (
        <div className="mx-3 mt-3 flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
          <Flame className="w-4 h-4 text-amber-400" />
          <span className="text-amber-400 text-sm font-medium">{user?.current_streak} day streak</span>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 mt-2">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                active
                  ? 'bg-white/10 text-white'
                  : 'text-navy-400 hover:text-white hover:bg-white/5',
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User info + logout */}
      <div className="p-3 border-t border-navy-800">
        <div className="flex items-center gap-2 px-2 py-2 mb-1">
          <div className="w-7 h-7 rounded-full bg-navy-600 flex items-center justify-center text-xs font-semibold text-white">
            {user?.full_name?.[0] ?? user?.email?.[0] ?? '?'}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-white truncate">{user?.full_name ?? 'User'}</p>
            <p className="text-xs text-navy-500 capitalize">{user?.plan} plan</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-navy-400 hover:text-white hover:bg-white/5 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
