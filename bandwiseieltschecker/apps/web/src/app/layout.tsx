import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'BandWise — AI IELTS Writing Checker',
  description: 'Get instant AI-powered band score feedback on your IELTS Writing Task 1 & 2 essays with detailed criterion breakdowns and improvement plans.',
  openGraph: {
    title: 'BandWise — AI IELTS Writing Checker',
    description: 'Instant IELTS band score feedback powered by Claude AI',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
