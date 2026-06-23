'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PenLine, Menu } from 'lucide-react';

const TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/dashboard/check': 'Check Essay',
  '/dashboard/history': 'History',
  '/dashboard/practice': 'Practice',
  '/dashboard/coach': 'AI Coach',
  '/dashboard/settings': 'Settings',
};

export function Navbar() {
  const pathname = usePathname();
  const title = TITLES[pathname] ?? 'BandWise';

  return (
    <header className="h-14 border-b border-navy-800 flex items-center justify-between px-4 md:px-6 bg-navy-900/60 backdrop-blur-sm sticky top-0 z-10">
      <div className="flex items-center gap-3">
        <button className="md:hidden text-navy-400 hover:text-white">
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-white font-medium text-sm">{title}</h1>
      </div>

      <Link
        href="/dashboard/check"
        className="flex items-center gap-2 bg-white text-navy-900 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-navy-100 transition-colors"
      >
        <PenLine className="w-3.5 h-3.5" />
        Check Essay
      </Link>
    </header>
  );
}
