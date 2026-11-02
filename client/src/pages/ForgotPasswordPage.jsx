import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, ArrowRight, Loader2, MailCheck } from 'lucide-react';
import AuthShell from '../components/auth/AuthShell';
import api from '../lib/api';
import usePageTitle from '../hooks/usePageTitle';

export default function ForgotPasswordPage() {
  usePageTitle('Forgot password');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await api('/auth/forgot-password', { method: 'POST', body: { email }, token: null });
      setResult(data);
    } catch (caught) {
      setError(caught.message || 'Could not send the reset link.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Password amnesia"
      title="Reset your"
      accent="slice."
      subtitle="Enter the email on your account and we will send a secure reset link. It stays valid for 30 minutes."
      image="/media/pepperoni.webp"
      quote="“Forgetting a password is temporary. Forgetting this crust is impossible.”"
      footer={<p>Remembered it? <Link to="/login">Sign in</Link></p>}
    >
      {result ? (
        <div className="auth-success">
          <span className="auth-success__icon"><MailCheck size={30} /></span>
          <h2>Check your inbox.</h2>
          <p>{result.message}</p>
          {result.devResetUrl ? (
            <a className="btn btn--block" href={result.devResetUrl}>
              Open demo reset link <ArrowRight size={16} />
            </a>
          ) : (
            <p className="auth-success__note">If it doesn&apos;t arrive in a minute, check spam or try again.</p>
          )}
          <Link to="/login" className="link-arrow">Back to sign in <ArrowRight size={14} /></Link>
        </div>
      ) : (
        <form className="auth-form" onSubmit={submit}>
          <label className="field">
            <span>Email address</span>
            <input type="email" value={email} onChange={(event) => { setEmail(event.target.value); setError(''); }} placeholder="you@example.com" autoComplete="email" required />
          </label>
          {error ? <p className="form-error"><AlertCircle size={14} /> {error}</p> : null}
          <button className="btn btn--block btn--lg" type="submit" disabled={loading}>
            {loading ? <Loader2 size={17} className="spin" /> : null}
            {loading ? 'Sending the link…' : 'Send reset link'}
            {!loading ? <ArrowRight size={16} /> : null}
          </button>
          <p className="auth-form__fine"><Link to="/login">Never mind, take me back</Link></p>
        </form>
      )}
    </AuthShell>
  );
}
