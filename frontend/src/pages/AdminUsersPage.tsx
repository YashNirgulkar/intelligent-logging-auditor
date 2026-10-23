import React, { useCallback, useEffect, useState } from 'react';
import { RefreshCw, ShieldCheck, Users, UserCheck, UserX } from 'lucide-react';
import { toast } from 'sonner';
import { adminApi, formatApiError } from '../api/client';
import { useAuth } from '../context/AuthContext';
import type { UserAccount } from '../types/api';

const date = (value: number | null) => value ? new Date(value * 1000).toLocaleString() : 'Never signed in';

export const AdminUsersPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { setUsers(await adminApi.getUsers()); }
    catch (error) { toast.error(formatApiError(error)); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const toggleAccess = async (account: UserAccount) => {
    setUpdating(account.id);
    try {
      const updated = await adminApi.setAccess(account.id, !account.is_active);
      setUsers((items) => items.map((item) => item.id === updated.id ? updated : item));
      toast.success(updated.is_active ? 'Account access enabled' : 'Account access disabled');
    } catch (error) { toast.error(formatApiError(error)); }
    finally { setUpdating(null); }
  };

  const activeCount = users.filter((item) => item.is_active).length;
  const onlineActivity = users.filter((item) => item.last_login_at && Date.now() - item.last_login_at * 1000 < 24 * 60 * 60 * 1000).length;

  return (
    <div className="max-w-6xl mx-auto space-y-7 animate-fade-slide">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#62625f' }}><ShieldCheck className="w-4 h-4" /> Workspace administration</div><h1 className="text-2xl font-bold tracking-tight" style={{ color: '#20201f', fontFamily: "'Outfit', sans-serif" }}>User access</h1><p className="text-sm mt-1" style={{ color: '#62625f' }}>Review registered accounts, recent sign-ins, and application access.</p></div>
        <button onClick={() => void load()} disabled={loading} className="flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-medium disabled:opacity-60" style={{ border: '1px solid #e2e2df', background: '#fff', color: '#333331' }}><RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Refresh</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[{ label: 'Registered users', value: users.length, icon: Users }, { label: 'Can use the app', value: activeCount, icon: UserCheck }, { label: 'Signed in (24h)', value: onlineActivity, icon: ShieldCheck }].map(({ label, value, icon: Icon }) => <div key={label} className="rounded-2xl p-5" style={{ background: '#fff', border: '1px solid #e7e7e5' }}><div className="flex items-center justify-between"><span className="text-sm" style={{ color: '#62625f' }}>{label}</span><Icon size={17} style={{ color: '#62625f' }} /></div><p className="text-3xl font-semibold mt-3" style={{ color: '#20201f' }}>{loading ? '—' : value}</p></div>)}
      </div>

      <section className="rounded-2xl overflow-hidden" style={{ background: '#fff', border: '1px solid #e7e7e5' }}>
        <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid #e7e7e5' }}><div><h2 className="font-semibold text-sm" style={{ color: '#20201f' }}>Accounts</h2><p className="text-xs mt-1" style={{ color: '#70706d' }}>Disabling an account immediately revokes its active sessions.</p></div><span className="text-xs rounded-full px-2.5 py-1" style={{ background: '#f4f4f2', color: '#555552' }}>{users.length} total</span></div>
        {loading ? <div className="p-8 text-center text-sm" style={{ color: '#70706d' }}>Loading accounts…</div> : users.length === 0 ? <div className="p-8 text-center text-sm" style={{ color: '#70706d' }}>No accounts have registered yet.</div> : <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead style={{ background: '#fafaf9', color: '#62625f' }}><tr>{['User', 'Role', 'Access', 'Created', 'Last sign-in', ''].map((heading) => <th key={heading} className="px-5 py-3 text-xs font-semibold whitespace-nowrap">{heading}</th>)}</tr></thead><tbody>{users.map((account) => <tr key={account.id} style={{ borderTop: '1px solid #f0f0ee' }}><td className="px-5 py-4 font-medium whitespace-nowrap" style={{ color: '#20201f' }}>{account.email}{account.id === currentUser?.id && <span className="ml-2 text-[10px] font-normal" style={{ color: '#70706d' }}>You</span>}</td><td className="px-5 py-4"><span className="rounded-full px-2 py-1 text-[11px] capitalize" style={{ color: account.role === 'admin' ? '#454543' : '#555552', background: account.role === 'admin' ? '#efefed' : '#f5f5f4' }}>{account.role}</span></td><td className="px-5 py-4"><span className="flex items-center gap-1.5 whitespace-nowrap" style={{ color: account.is_active ? '#177c5b' : '#b42335' }}><span className="w-1.5 h-1.5 rounded-full" style={{ background: account.is_active ? '#20a477' : '#d84355' }} />{account.is_active ? 'Enabled' : 'Disabled'}</span></td><td className="px-5 py-4 text-xs whitespace-nowrap" style={{ color: '#62625f' }}>{date(account.created_at)}</td><td className="px-5 py-4 text-xs whitespace-nowrap" style={{ color: '#62625f' }}>{date(account.last_login_at)}</td><td className="px-5 py-4 text-right">{account.role !== 'admin' && <button onClick={() => void toggleAccess(account)} disabled={updating === account.id} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold disabled:opacity-50" style={{ color: account.is_active ? '#a12a38' : '#177c5b', border: `1px solid ${account.is_active ? '#f0d5d9' : '#d1e8de'}`, background: account.is_active ? '#fff8f8' : '#f5fbf8' }}>{account.is_active ? <><UserX size={14} /> Disable</> : <><UserCheck size={14} /> Enable</>}</button>}</td></tr>)}</tbody></table></div>}
      </section>
    </div>
  );
};

