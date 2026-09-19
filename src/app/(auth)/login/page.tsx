'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { GraduationCap, Lock, Mail, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError(authError.message || 'Invalid email or password. Please try again.');
        setLoading(false);
        return;
      }

      const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
      const redirectTarget = params?.get('redirect') || '/admin/gradebook';
      router.push(redirectTarget);
      router.refresh();
    } catch {
      setError('An unexpected error occurred. Please check your network connection.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-600 hover:text-ink-950 transition-colors mb-6 mx-auto"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Main Portal
        </Link>

        <div className="w-12 h-12 rounded-xl bg-ink-950 flex items-center justify-center text-solar-500 shadow-md mx-auto mb-4">
          <GraduationCap className="w-7 h-7" />
        </div>

        <h1 className="font-heading font-bold text-2xl sm:text-3xl text-ink-950 text-center tracking-tight">
          Staff Portal Login
        </h1>
        <p className="mt-1.5 text-sm text-ink-600 text-center">
          Sign in to access student registers, gradebook, and graduation audits.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-surface py-8 px-6 sm:px-10 rounded-2xl border border-ink-200 shadow-sm">
          {error && (
            <div className="mb-6 p-3.5 rounded-lg bg-status-notyet-bg border border-status-notyet-dot/20 flex items-start gap-2.5 text-status-notyet-text text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-status-notyet-dot" />
              <div className="leading-snug">{error}</div>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-ink-950 mb-1.5">
                Staff Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-ink-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@citizensoflightchurch.org"
                  className="block w-full pl-10 pr-3.5 py-2.5 text-sm rounded-lg border border-ink-200 bg-surface text-ink-950 placeholder-ink-400 focus:outline-none focus:ring-2 focus:ring-solar-500 focus:border-solar-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-ink-950 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-ink-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="block w-full pl-10 pr-3.5 py-2.5 text-sm rounded-lg border border-ink-200 bg-surface text-ink-950 placeholder-ink-400 focus:outline-none focus:ring-2 focus:ring-solar-500 focus:border-solar-500 transition-colors"
                />
              </div>
            </div>

            <div className="pt-1">
              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 flex items-center justify-center gap-2 rounded-lg bg-ink-950 text-white font-medium text-sm hover:bg-ink-800 active:scale-[0.98] transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-solar-500 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-solar-400" />
                    Signing in...
                  </>
                ) : (
                  'Sign In to Dashboard'
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 pt-5 border-t border-ink-100 text-center text-xs text-ink-500">
            Citizens Elementary School · Staff Access Only
          </div>
        </div>
      </div>
    </div>
  );
}
