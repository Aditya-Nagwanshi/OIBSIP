import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AlertCircle, ArrowRight, CheckCircle2, Loader2, MailCheck } from 'lucide-react';
import AuthShell from '../components/auth/AuthShell';
import PasswordInput from '../components/ui/PasswordInput';
import { useAuth } from '../contexts/AuthContext';
import usePageTitle from '../hooks/usePageTitle';

const passwordChecks = [
  { label: '8+ characters', test: (value) => value.length >= 8 },
  { label: 'One letter', test: (value) => /[A-Za-z]/.test(value) },
  { label: 'One number', test: (value) => /[0-9]/.test(value) },
];

export default function RegisterPage() {
  usePageTitle('Create an account');
  const { register } = useAuth();
  const [params] = useSearchParams();
  const next = params.get('next') || '';
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [terms, setTerms] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const update = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
    setError('');
  };

  const submit = async (event) => {
    event.preventDefault();
    if (form.password !== form.confirm) {
      setError('The two passwords do not match.');
      return;
    }
    if (!terms) {
      setError('Please accept the house rules to continue.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await register({ name: form.name, email: form.email, password: form.password });
      setResult(data);
    } catch (caught) {
      setError(caught.message || 'Could not create your account.');
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return (
      <AuthShell
        eyebrow="You are in"
        title="Check your"
        accent="inbox."
        subtitle={`We sent a verification link to ${form.email}. Verify within 24 hours to fire up your first order.`}
        image="/media/pepperoni.webp"
        quote="“The dough waits 48 hours. Your inbox only needs 24.”"
        footer={<p>Already verified? <Link to="/login">Sign in</Link></p>}
      >
        <div className="auth-success">
          <span className="auth-success__icon"><MailCheck size={30} /></span>
          <h2>One small step.</h2>
          <p>In this demo environment, SMTP is not configured, so the verification email lands in the server outbox. Use the link below to verify instantly.</p>
          {result.devVerifyUrl ? (
            <a className="btn btn--block" href={result.devVerifyUrl}>
              Verify my email now <ArrowRight size={16} />
            </a>
          ) : (
            <p className="auth-success__note">Open the email we sent and click the verification link.</p>
          )}
          <div className="auth-success__checks">
            <span><CheckCircle2 size={14} /> Account created</span>
            <span><CheckCircle2 size={14} /> Order history ready</span>
            <span><CheckCircle2 size={14} /> Cart saved on this device</span>
          </div>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow="Join the lab"
      title="Start your own"
      accent="theory."
      subtitle="One account for faster checkout, saved addresses and live order tracking."
      image="/media/margherita.webp"
      quote="“Everyone has a theory about pizza. Ours is just better tested.”"
      footer={<p>Already a theorist? <Link to={next ? `/login?next=${encodeURIComponent(next)}` : '/login'}>Sign in</Link></p>}
    >
      <form className="auth-form" onSubmit={submit}>
        <label className="field">
          <span>Your name</span>
          <input value={form.name} onChange={update('name')} placeholder="Riya Sharma" autoComplete="name" required minLength={2} />
        </label>
        <label className="field">
          <span>Email address</span>
          <input type="email" value={form.email} onChange={update('email')} placeholder="you@example.com" autoComplete="email" required />
        </label>
        <label className="field">
          <span>Create a password</span>
          <PasswordInput value={form.password} onChange={update('password')} autoComplete="new-password" />
        </label>
        <div className="password-checks">
          {passwordChecks.map((check) => (
            <span key={check.label} className={check.test(form.password) ? 'is-on' : ''}>
              <CheckCircle2 size={12} /> {check.label}
            </span>
          ))}
        </div>
        <label className="field">
          <span>Confirm password</span>
          <PasswordInput value={form.confirm} onChange={update('confirm')} autoComplete="new-password" />
        </label>

        <label className="checkbox">
          <input type="checkbox" checked={terms} onChange={(event) => setTerms(event.target.checked)} />
          <span>I agree to the house rules and understand pizza is a serious business.</span>
        </label>

        {error ? <p className="form-error"><AlertCircle size={14} /> {error}</p> : null}

        <button className="btn btn--block btn--lg" type="submit" disabled={loading}>
          {loading ? <Loader2 size={17} className="spin" /> : null}
          {loading ? 'Creating your account…' : 'Create my account'}
          {!loading ? <ArrowRight size={16} /> : null}
        </button>
        <p className="auth-form__fine">Already have an account? <Link to="/login">Sign in</Link></p>
      </form>
    </AuthShell>
  );
}
