import React, { FormEvent, useState } from 'react';
import { ArrowRight, Eye, EyeOff, ShieldCheck, Terminal } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(username, password);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to sign in. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: 'var(--bg)', color: 'var(--text-primary)' }}>
      <section className="w-full max-w-md rounded-3xl p-7 sm:p-9" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', boxShadow: '0 24px 80px rgba(30, 30, 28, .10)' }}>
        <div className="flex items-center gap-3 mb-8">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl" style={{ background: 'var(--text-primary)', color: 'var(--bg-surface)' }}>
            <Terminal className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-bold">Intelligent Logging Auditor</p>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Private audit workspace</p>
          </div>
        </div>

        <div className="mb-7">
          <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl" style={{ background: 'var(--bg-muted)', color: 'var(--text-primary)' }}>
            <ShieldCheck className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
          <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>Sign in with the admin credentials configured for this deployment.</p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <label className="block text-sm font-medium" htmlFor="username">Username</label>
          <input id="username" autoComplete="username" required value={username} onChange={(event) => setUsername(event.target.value)} className="-mt-2 w-full rounded-xl px-4 py-3 text-sm outline-none focus:ring-2" style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />

          <label className="block text-sm font-medium" htmlFor="password">Password</label>
          <div className="relative -mt-2">
            <input id="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-xl px-4 py-3 pr-12 text-sm outline-none focus:ring-2" style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
            <button type="button" onClick={() => setShowPassword((shown) => !shown)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1" style={{ color: 'var(--text-secondary)' }} aria-label={showPassword ? 'Hide password' : 'Show password'}>
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          {error && <p role="alert" className="rounded-xl px-3 py-2 text-sm" style={{ color: '#a52a3a', background: 'rgba(190, 24, 55, .08)' }}>{error}</p>}

          <button type="submit" disabled={submitting} className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-opacity disabled:opacity-60" style={{ background: 'var(--text-primary)', color: 'var(--bg-surface)' }}>
            {submitting ? 'Signing in…' : 'Sign in'} {!submitting && <ArrowRight className="h-4 w-4" />}
          </button>
        </form>
        <p className="mt-6 text-center text-xs" style={{ color: 'var(--text-secondary)' }}>Your session is private to this browser and expires automatically.</p>
      </section>
    </main>
  );
};

