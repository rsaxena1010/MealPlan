import { useState } from 'react';
import type { User } from '../types';
import { createAccount, login } from '../services/auth';
import { getUsers } from '../services/storage';

interface Props {
  onSuccess: (user: User) => void;
  onClose: () => void;
}

export default function AuthModal({ onSuccess, onClose }: Props) {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const reset = (t: 'login' | 'register') => {
    setTab(t);
    setError('');
  };

  const handleSubmit = async () => {
    setError('');
    if (!userId || !password) { setError('Account ID and password are required.'); return; }
    if (tab === 'register' && password !== confirm) { setError('Passwords do not match.'); return; }

    setLoading(true);
    const result = tab === 'login'
      ? await login(userId.trim(), password)
      : await createAccount(userId.trim(), password, email || undefined);
    setLoading(false);

    if (!result.success) { setError(result.error!); return; }
    onSuccess(getUsers()[userId.trim()]);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card auth-modal-card" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>
        <div className="auth-logo">🍛</div>
        <h2 className="auth-title">Indian Meal Planner</h2>

        <div className="auth-tabs">
          <button className={tab === 'login' ? 'active' : ''} onClick={() => reset('login')}>Log In</button>
          <button className={tab === 'register' ? 'active' : ''} onClick={() => reset('register')}>Create Account</button>
        </div>

        <div className="auth-form">
          <div className="auth-field">
            <label>Account ID</label>
            <input
              type="text"
              value={userId}
              onChange={e => setUserId(e.target.value)}
              placeholder="e.g. rahul123"
              autoFocus
            />
          </div>
          <div className="auth-field">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              onKeyDown={e => e.key === 'Enter' && tab === 'login' && handleSubmit()}
            />
          </div>
          {tab === 'register' && (
            <>
              <div className="auth-field">
                <label>Confirm Password</label>
                <input
                  type="password"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
              <div className="auth-field">
                <label>
                  Email <span className="optional-label">(optional — for mailing meal plans)</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </div>
            </>
          )}

          {error && <div className="auth-error">{error}</div>}

          <button className="auth-submit-btn" onClick={handleSubmit} disabled={loading}>
            {loading ? '…' : tab === 'login' ? 'Log In' : 'Create Account'}
          </button>

          {tab === 'register' && (
            <p className="auth-note">Your data is stored locally in this browser.</p>
          )}
        </div>
      </div>
    </div>
  );
}
