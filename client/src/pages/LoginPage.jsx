import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, ArrowRight, Loader2, MailCheck, ShieldAlert } from 'lucide-react';
import AuthShell from '../components/auth/AuthShell';
import PasswordInput from '../components/ui/PasswordInput';
import api from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import usePageTitle from '../hooks/usePageTitle';

export default function LoginPage() {
  usePageTitle('Sign in');
  const { login } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = params.get('next') || '';
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [unverified, setUnverified] = useState('');
  const [devUrl, setDevUrl] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const update = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
    setError('');
    setInfo('');
  };

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setInfo('');
    try {
      const data = await login(form);
      const destination = next || (data.user.role === 'admin' ? '/admin' : '/dashboard');
      navigate(destination, { replace: true });
    } catch (caught) {
      if (caught.code === 'EMAIL_UNVERIFIED') {
        setUnverified(caught.details?.email || form.email);
      }
      setError(caught.message || 'Could not sign you in.');
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    setResending(true);
    setInfo('');
    setError('');
    try {
      const data = await api('/auth/resend-verification', {
        method: 'POST',
        body: { email: unverified || form.email },
        token: null,
      });
      setInfo(data.message);
      if (data.devVerifyUrl) setDevUrl(data.devVerifyUrl);
    } catch (caught) {
      setError(caught.message);
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Good to see you,"
      accent="theorist."
      subtitle="Sign in to reorder favourites, track the oven and keep your theories in one place."
      image="/media/pizzas/margherita.webp"
      quote="“I came for the crust. I stayed for the live order tracker.”"
      footer={
        <p>New around here? <Link to={next ? `/register?next=${encodeURIComponent(next)}` : '/register'}>Create an account</Link></p>
      }
    >
      <form className="auth-form" onSubmit={submit}>
        <label className="field">
          <span>Email address</span>
          <input type="email" value={form.email} onChange={update('email')} placeholder="you@example.com" autoComplete="email" required />
        </label>
        <label className="field">
          <span className="field__row">
            Password
            <Link to="/forgot-password">Forgot password?</Link>
          </span>
          <PasswordInput value={form.password} onChange={update('password')} autoComplete="current-password" />
        </label>

        {error ? (
          <div className="form-error-block">
            <AlertCircle size={15} />
            <span>{error}</span>
          </div>
        ) : null}
        {info ? <p className="form-success">{info}</p> : null}

        {unverified ? (
          <div className="auth-inline-action">
            <MailCheck size={16} />
            <span>Need a fresh verification link?</span>
            <button type="button" onClick={resend} disabled={resending}>
              {resending ? <Loader2 size={13} className="spin" /> : null} Resend
            </button>
            {devUrl ? <a href={devUrl}>Open link</a> : null}
          </div>
        ) : null}

        {error && error.toLowerCase().includes('admin') ? (
          <Link to="/admin/login" className="auth-inline-link"><ShieldAlert size={15} /> Go to Admin Studio</Link>
        ) : null}

        <button className="btn btn--block btn--lg" type="submit" disabled={loading}>
          {loading ? <Loader2 size={17} className="spin" /> : null}
          {loading ? 'Signing you in…' : 'Sign in'}
          {!loading ? <ArrowRight size={16} /> : null}
        </button>

        <p className="auth-form__fine">Admin? <Link to="/admin/login">Use the passwordless Admin Studio login.</Link></p>
      </form>
    </AuthShell>
  );
}
