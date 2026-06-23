'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowRight, CheckCircle, Zap, Target, BookOpen,
  TrendingUp, MessageSquare, Award, Star, Users,
} from 'lucide-react';

const FEATURES = [
  {
    icon: Target,
    title: 'Accurate Band Scores',
    description: 'Get scores across all 4 IELTS criteria: Task Achievement, Coherence & Cohesion, Lexical Resource, and Grammatical Range.',
  },
  {
    icon: Zap,
    title: 'Instant AI Feedback',
    description: 'Powered by Claude AI — receive detailed, examiner-quality feedback in under 60 seconds.',
  },
  {
    icon: BookOpen,
    title: 'Grammar Error Analysis',
    description: 'Every grammar mistake identified, explained, and corrected with the exact error type.',
  },
  {
    icon: TrendingUp,
    title: 'Band Improvement Plan',
    description: 'Personalised week-by-week plan tailored to your current score and target band.',
  },
  {
    icon: MessageSquare,
    title: 'AI Writing Coach',
    description: 'Chat with your personal AI coach about your essay — ask questions, get clarifications, explore improvements.',
  },
  {
    icon: Award,
    title: 'Progress Tracking',
    description: 'Track your band score improvement over time with streak tracking and achievement badges.',
  },
];

const TESTIMONIALS = [
  { name: 'Priya M.', country: 'India', band: 7.5, quote: 'Went from 6.0 to 7.5 in 6 weeks using BandWise daily. The AI coach feature is incredible.' },
  { name: 'Carlos R.', country: 'Brazil', band: 8.0, quote: 'The grammar error breakdown is the best I\'ve seen. Exactly what an IELTS examiner would catch.' },
  { name: 'Fatima A.', country: 'UAE', band: 7.0, quote: 'I was targeting band 7 and the improvement plan was spot on. Very accurate scoring.' },
];

const BAND_DESCRIPTIONS = [
  { band: '9.0', label: 'Expert User' },
  { band: '8.0', label: 'Very Good User' },
  { band: '7.0', label: 'Good User' },
  { band: '6.0', label: 'Competent User' },
  { band: '5.0', label: 'Modest User' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-navy-900 text-white overflow-x-hidden">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 bg-navy-900/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <span className="font-serif text-xl font-semibold text-white">BandWise</span>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-navy-200 hover:text-white text-sm transition-colors">
              Sign in
            </Link>
            <Link
              href="/signup"
              className="bg-white text-navy-900 px-4 py-2 rounded-lg text-sm font-medium hover:bg-navy-100 transition-colors"
            >
              Get started free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-24 px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 text-sm text-navy-200 mb-8">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            Powered by Claude AI
          </div>
          <h1 className="font-serif text-5xl md:text-7xl font-medium mb-6 leading-tight">
            Know your IELTS band
            <br />
            <span className="text-navy-200">before exam day.</span>
          </h1>
          <p className="text-navy-200 text-lg md:text-xl max-w-2xl mx-auto mb-10">
            Paste your essay. Get examiner-quality band scores, grammar corrections,
            and a personalised improvement plan — in under 60 seconds.
          </p>

          {/* Hero CTA */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/signup"
              className="group flex items-center justify-center gap-2 bg-white text-navy-900 px-6 py-3.5 rounded-xl font-semibold hover:bg-navy-100 transition-all"
            >
              Check your essay free
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/login"
              className="flex items-center justify-center gap-2 border border-white/20 text-white px-6 py-3.5 rounded-xl hover:bg-white/5 transition-all"
            >
              Sign in
            </Link>
          </div>
          <p className="text-navy-400 text-sm mt-4">3 free checks · No credit card required</p>
        </motion.div>

        {/* Score preview */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="mt-16 max-w-sm mx-auto"
        >
          <div className="bg-navy-800 border border-navy-700 rounded-2xl p-8 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-white/3 to-transparent" />
            <div className="relative">
              <p className="text-navy-400 text-xs tracking-widest uppercase mb-2">Estimated Band</p>
              <div className="font-serif text-8xl font-medium text-white">6.5</div>
              <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                <div className="bg-navy-700/60 rounded-lg p-2">
                  <div className="text-amber-400 font-semibold text-sm">6.0</div>
                  <div className="text-navy-400">Task Response</div>
                </div>
                <div className="bg-navy-700/60 rounded-lg p-2">
                  <div className="text-green-400 font-semibold text-sm">7.0</div>
                  <div className="text-navy-400">Coherence</div>
                </div>
                <div className="bg-navy-700/60 rounded-lg p-2">
                  <div className="text-amber-400 font-semibold text-sm">6.5</div>
                  <div className="text-navy-400">Lexical Resource</div>
                </div>
                <div className="bg-navy-700/60 rounded-lg p-2">
                  <div className="text-red-400 font-semibold text-sm">6.0</div>
                  <div className="text-navy-400">Grammar</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Social proof */}
      <section className="py-8 border-y border-white/5">
        <div className="max-w-6xl mx-auto px-4 flex flex-wrap items-center justify-center gap-8 text-navy-400 text-sm">
          <span className="flex items-center gap-2"><Users className="w-4 h-4" /> 12,000+ students</span>
          <span className="flex items-center gap-2"><Star className="w-4 h-4 text-amber-400 fill-amber-400" /> 4.9 / 5 rating</span>
          <span className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-400" /> Task 1 & Task 2</span>
          <span className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-400" /> Academic & General</span>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-serif text-4xl font-medium text-white mb-4">Everything you need to improve</h2>
            <p className="text-navy-300 text-lg max-w-2xl mx-auto">
              BandWise goes beyond a simple score — it gives you the full picture to understand exactly where you stand and how to improve.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-navy-800/60 border border-navy-700 rounded-xl p-6 hover:border-navy-600 transition-colors"
              >
                <feature.icon className="w-8 h-8 text-navy-200 mb-4" />
                <h3 className="font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-navy-300 text-sm leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Band scale */}
      <section className="py-20 px-4 bg-navy-950/50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-serif text-3xl font-medium mb-12">The IELTS Band Scale</h2>
          <div className="space-y-3">
            {BAND_DESCRIPTIONS.map((b) => (
              <div key={b.band} className="flex items-center gap-4 bg-navy-800/40 border border-navy-700 rounded-xl p-4">
                <div className="font-serif text-3xl font-medium w-16 text-right flex-shrink-0 text-white">{b.band}</div>
                <div className="flex-1 h-2 rounded-full bg-navy-700 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-navy-400 to-navy-200"
                    style={{ width: `${(parseFloat(b.band) / 9) * 100}%` }}
                  />
                </div>
                <div className="text-navy-300 text-sm w-32 text-left">{b.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-serif text-3xl font-medium text-center mb-12">Student results</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="bg-navy-800/60 border border-navy-700 rounded-xl p-6"
              >
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-9 h-9 rounded-full bg-navy-600 flex items-center justify-center text-sm font-semibold">
                    {t.name[0]}
                  </div>
                  <div>
                    <div className="text-sm font-medium">{t.name}</div>
                    <div className="text-xs text-navy-400">{t.country}</div>
                  </div>
                  <div className="ml-auto font-serif text-lg font-medium text-green-400">{t.band}</div>
                </div>
                <p className="text-navy-300 text-sm leading-relaxed">"{t.quote}"</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing preview */}
      <section className="py-20 px-4 bg-navy-950/50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-serif text-3xl font-medium mb-4">Simple, honest pricing</h2>
          <p className="text-navy-300 mb-12">Start free. Upgrade when you need more.</p>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: 'Free', price: '$0', desc: '3 checks/month', features: ['Full evaluation report', 'Grammar corrections', 'Improvement plan', '7-day history'] },
              { name: 'Pro', price: '$9/mo', desc: 'Unlimited checks', features: ['Everything in Free', 'Unlimited checks', 'PDF export', 'Full history', 'Priority queue'], highlight: true },
              { name: 'Credits', price: '$2/check', desc: 'Pay as you go', features: ['Buy in bundles', 'Never expire', 'Same as Pro per check'] },
            ].map((plan) => (
              <div
                key={plan.name}
                className={`rounded-xl p-6 border ${plan.highlight ? 'bg-white/10 border-white/30' : 'bg-navy-800/60 border-navy-700'}`}
              >
                <h3 className="font-semibold text-lg mb-1">{plan.name}</h3>
                <div className="font-serif text-3xl font-medium mb-1">{plan.price}</div>
                <p className="text-navy-400 text-sm mb-4">{plan.desc}</p>
                <ul className="space-y-2 text-left">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-navy-300">
                      <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="font-serif text-4xl font-medium mb-6">Start improving your band score today</h2>
          <p className="text-navy-300 text-lg mb-8">Join 12,000+ IELTS students who use BandWise to track their progress and reach their target band.</p>
          <Link
            href="/signup"
            className="group inline-flex items-center gap-2 bg-white text-navy-900 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-navy-100 transition-all"
          >
            Check your essay free
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <p className="text-navy-500 text-sm mt-4">No credit card required · 3 free checks</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-navy-500 text-sm">
          <span className="font-serif font-semibold text-navy-300">BandWise</span>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
          </div>
          <span>© {new Date().getFullYear()} BandWise</span>
        </div>
      </footer>
    </div>
  );
}
