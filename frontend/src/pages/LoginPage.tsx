import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LockKeyhole, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { formatApiError } from '../api/client';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC<{ registerMode?: boolean }> = ({ registerMode = false }) => {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [position, setPosition] = useState('Student');
  const [busy, setBusy] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      if (registerMode) await register({ first_name: firstName, last_name: lastName, email, password, position });
      else await login(email, password);
      toast.success(registerMode ? 'Account created' : 'Signed in');
      navigate('/', { replace: true });
    } catch (error) {
      toast.error(formatApiError(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-5" style={{ background: 'var(--bg, #f5f5f3)' }}>
      <section className="w-full max-w-md rounded-3xl p-7 sm:p-9" style={{ background: '#fff', border: '1px solid #e2e2df', boxShadow: '0 20px 60px rgba(32,32,31,.08)' }}>
        <div className="flex items-center gap-3 mb-8">
          <div className="grid place-items-center w-11 h-11 rounded-2xl" style={{ color: '#fff', background: '#292928' }}><ShieldCheck size={22} /></div>
          <div><p className="text-sm font-bold" style={{ color: '#20201f' }}>Logging Auditor</p><p className="text-xs" style={{ color: '#70706d' }}>Secure workspace access</p></div>
        </div>
        <div className="mb-6"><div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: '#70706d' }}><LockKeyhole size={14} /> Account access</div><h1 className="text-2xl font-bold" style={{ color: '#20201f' }}>{registerMode ? 'Create your account' : 'Welcome back'}</h1><p className="text-sm mt-2" style={{ color: '#62625f' }}>{registerMode ? 'Create an account to start using the auditor.' : 'Sign in to continue to your auditor workspace.'}</p></div>
        <form onSubmit={submit} className="space-y-4">
          {registerMode && <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block text-sm font-medium" style={{ color: '#333331' }}>First name<input required type="text" autoComplete="given-name" maxLength={80} value={firstName} onChange={(event) => setFirstName(event.target.value)} placeholder="First name" className="mt-1.5 w-full rounded-xl px-3.5 py-3 text-sm outline-none focus:ring-2 focus:ring-stone-300" style={{ border: '1px solid #d8d8d5', color: '#20201f', background: '#fff' }} /></label>
            <label className="block text-sm font-medium" style={{ color: '#333331' }}>Last name<input required type="text" autoComplete="family-name" maxLength={80} value={lastName} onChange={(event) => setLastName(event.target.value)} placeholder="Last name" className="mt-1.5 w-full rounded-xl px-3.5 py-3 text-sm outline-none focus:ring-2 focus:ring-stone-300" style={{ border: '1px solid #d8d8d5', color: '#20201f', background: '#fff' }} /></label>
          </div>}
          <label className="block text-sm font-medium" style={{ color: '#333331' }}>Email address<input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" className="mt-1.5 w-full rounded-xl px-3.5 py-3 text-sm outline-none focus:ring-2 focus:ring-stone-300" style={{ border: '1px solid #d8d8d5', color: '#20201f', background: '#fff' }} /></label>
          {registerMode && <label className="block text-sm font-medium" style={{ color: '#333331' }}>I am a…<select required value={position} onChange={(event) => setPosition(event.target.value)} className="mt-1.5 w-full rounded-xl px-3.5 py-3 text-sm outline-none focus:ring-2 focus:ring-stone-300" style={{ border: '1px solid #d8d8d5', color: '#20201f', background: '#fff' }}><option>Student</option><option>Working professional</option><option>Educator</option><option>Researcher</option><option>Freelancer</option><option>Business owner</option><option>Other</option></select></label>}
          <label className="block text-sm font-medium" style={{ color: '#333331' }}>Password<input required type="password" autoComplete={registerMode ? 'new-password' : 'current-password'} minLength={12} maxLength={128} value={password} onChange={(event) => setPassword(event.target.value)} placeholder={registerMode ? 'At least 12 characters' : 'Your password'} className="mt-1.5 w-full rounded-xl px-3.5 py-3 text-sm outline-none focus:ring-2 focus:ring-stone-300" style={{ border: '1px solid #d8d8d5', color: '#20201f', background: '#fff' }} /></label>
          {registerMode && <p className="text-xs" style={{ color: '#70706d' }}>Your name, email, and position are saved to your account and visible to the administrator. Passwords are stored securely as hashes.</p>}
          <button type="submit" disabled={busy} className="w-full rounded-xl px-4 py-3 text-sm font-semibold disabled:opacity-60" style={{ background: '#292928', color: '#fff' }}>{busy ? 'Please wait…' : registerMode ? 'Create account' : 'Sign in'}</button>
        </form>
        <p className="text-sm text-center mt-6" style={{ color: '#62625f' }}>{registerMode ? 'Already have an account?' : 'New to the auditor?'}{' '}<Link className="font-semibold underline underline-offset-4" style={{ color: '#292928' }} to={registerMode ? '/login' : '/register'}>{registerMode ? 'Sign in' : 'Create an account'}</Link></p>
      </section>
    </main>
  );
};
