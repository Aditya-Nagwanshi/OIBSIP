import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowRight, Loader2, LockKeyhole, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useConfig } from '../../contexts/ConfigContext';
import usePageTitle from '../../hooks/usePageTitle';

export default function AdminLoginPage() {
  usePageTitle('Admin Studio');
  const { adminLogin } = useAuth();
  const { config } = useConfig();
  const navigate = useNavigate();
  const [email, setEmail] = useState(config?.admin?.email || 'Demo_SliceTheory@pizza');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      await adminLogin(email);
      navigate('/admin', { replace: true });
    } catch (caught) {
      setError(caught.message || 'Admin access denied.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login">
      <div className="admin-login__panel">
        <Link to="/" className="auth-card__back"><ArrowRight size={14} style={{ transform: 'rotate(180deg)' }} /> Back to storefront</Link>
        <div className="admin-login__logo">
          <span className="admin-login__mark">ST</span>
          <div>
            <strong>Slice Theory</strong>
            <span>Admin Studio · demo mode</span>
          </div>
        </div>
        <p className="eyebrow eyebrow--yellow">Kitchen command</p>
        <h1>Passwordless <em>admin.</em></h1>
        <p className="admin-login__copy">
          This demo uses the provisioned admin email as the only key. Enter it below to open the kitchen dashboard.
          No password, no friction, no forgotten credentials.
        </p>
        <form onSubmit={submit}>
          <label className="field field--dark">
            <span>Admin email</span>
            <input type="email" value={email} onChange={(event) => { setEmail(event.target.value); setError(''); }} placeholder="admin@example.com" required />
          </label>
          {error ? <p className="form-error form-error--dark"><AlertCircle size={14} /> {error}</p> : null}
          <button className="btn btn--block btn--lg" type="submit" disabled={loading}>
            {loading ? <Loader2 size={17} className="spin" /> : <LockKeyhole size={16} />}
            {loading ? 'Opening the studio…' : 'Enter Admin Studio'}
          </button>
        </form>
        <div className="admin-login__note">
          <ShieldCheck size={15} />
          <p>The email is configured server-side. Any other address is rejected. Passwords can be added later without changing this flow.</p>
        </div>
        <p className="admin-login__email">Provisioned email: <strong>{config?.admin?.email || 'Demo_SliceTheory@pizza'}</strong></p>
      </div>
      <div className="admin-login__visual">
        <img src="/media/oven.webp" alt="" />
        <div className="admin-login__overlay" />
        <blockquote>
          “A kitchen runs on timing, stock counts and a little bit of theatre.”
        </blockquote>
        <span className="admin-login__stamp">Slice Theory · 2026</span>
      </div>
    </div>
  );
}
