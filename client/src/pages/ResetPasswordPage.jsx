import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import AuthShell from '../components/auth/AuthShell';
import PasswordInput from '../components/ui/PasswordInput';
import api from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import usePageTitle from '../hooks/usePageTitle';

export default function ResetPasswordPage() {
  usePageTitle('Reset password');
  const [params] = useSearchParams();
  const token = params.get('token');
  const { storeSession } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    if (form.password !== form.confirm) {
      setError('The two passwords do not match.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await api('/auth/reset-password', {
        method: 'POST',
        body: { token, password: form.password },
        token: null,
      });
      storeSession(data.token, data.user);
      setDone(true);
      setTimeout(() => navigate('/dashboard', { replace: true }), 1400);
    } catch (caught) {
      setError(caught.message || 'Could not reset your password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow="New password"
      title="A fresh"
      accent="start."
      subtitle="Choose a strong password with at least eight characters, one letter and one number."
      image="/media/pizzas/margherita.webp"
      quote="“Every good theory deserves a second trial.”"
      footer={<p><Link to="/login">Back to sign in</Link></p>}
    >
      {!token ? (
        <div className="auth-success auth-success--center">
          <span className="auth-success__icon auth-success__icon--bad"><AlertCircle size={30} /></span>
          <h2>That reset link is incomplete.</h2>
          <p>Request a fresh link and try again.</p>
          <Link className="btn btn--block" to="/forgot-password">Request a new link</Link>
        </div>
      ) : done ? (
        <div className="auth-success auth-success--center">
          <span className="auth-success__icon auth-success__icon--good"><CheckCircle2 size={32} /></span>
          <h2>Password updated.</h2>
          <p>You are signed in. Taking you to your dashboard…</p>
        </div>
      ) : (
        <form className="auth-form" onSubmit={submit}>
          <label className="field">
            <span>New password</span>
            <PasswordInput value={form.password} onChange={(event) => { setForm((current) => ({ ...current, password: event.target.value })); setError(''); }} autoComplete="new-password" />
          </label>
          <label className="field">
            <span>Confirm new password</span>
            <PasswordInput value={form.confirm} onChange={(event) => { setForm((current) => ({ ...current, confirm: event.target.value })); setError(''); }} autoComplete="new-password" />
          </label>
          {error ? <p className="form-error"><AlertCircle size={14} /> {error}</p> : null}
          <button className="btn btn--block btn--lg" type="submit" disabled={loading}>
            {loading ? <Loader2 size={17} className="spin" /> : null}
            {loading ? 'Saving…' : 'Save new password'}
          </button>
        </form>
      )}
    </AuthShell>
  );
}
