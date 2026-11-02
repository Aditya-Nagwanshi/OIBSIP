import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, ArrowRight, CheckCircle2, Loader2, MailOpen } from 'lucide-react';
import AuthShell from '../components/auth/AuthShell';
import { useAuth } from '../contexts/AuthContext';
import usePageTitle from '../hooks/usePageTitle';

export default function VerifyEmailPage() {
  usePageTitle('Verify email');
  const [params] = useSearchParams();
  const token = params.get('token');
  const { verifyEmail } = useAuth();
  const navigate = useNavigate();
  const [state, setState] = useState(token ? 'verifying' : 'missing');
  const [message, setMessage] = useState('');
  const started = useRef(false);

  useEffect(() => {
    if (!token || started.current) return;
    started.current = true;
    verifyEmail(token)
      .then(() => {
        setState('success');
        setTimeout(() => navigate('/dashboard', { replace: true }), 1600);
      })
      .catch((caught) => {
        setState('error');
        setMessage(caught.message || 'This verification link is invalid or has expired.');
      });
  }, [token, verifyEmail, navigate]);

  return (
    <AuthShell
      eyebrow="Email verification"
      title={state === 'success' ? 'You are' : 'Confirming'}
      accent={state === 'success' ? 'verified.' : 'you.'}
      subtitle={
        state === 'success'
          ? 'The lab has your details. You are signed in and ready to order.'
          : 'Hold on while we confirm that this inbox belongs to a fellow slice theorist.'
      }
      image="/media/oven.webp"
      quote="“Verification is just a handshake. The pizza is the real conversation.”"
      footer={<p><Link to="/login">Back to sign in</Link> · <Link to="/menu">Browse the menu</Link></p>}
    >
      <div className="auth-success auth-success--center">
        {state === 'verifying' ? (
          <>
            <span className="auth-success__icon"><Loader2 size={30} className="spin" /></span>
            <h2>Verifying your email…</h2>
            <p>This usually takes less than a second. The oven is already warming up.</p>
          </>
        ) : null}
        {state === 'success' ? (
          <>
            <span className="auth-success__icon auth-success__icon--good"><CheckCircle2 size={32} /></span>
            <h2>Verified. Welcome aboard.</h2>
            <p>Taking you to your dashboard in a moment.</p>
            <Link to="/menu" className="btn btn--block">Start ordering <ArrowRight size={16} /></Link>
          </>
        ) : null}
        {state === 'error' || state === 'missing' ? (
          <>
            <span className="auth-success__icon auth-success__icon--bad"><AlertCircle size={30} /></span>
            <h2>{state === 'missing' ? 'Verification token missing.' : 'That link did not work.'}</h2>
            <p>{message || 'The link is incomplete. Open the verification email again, or request a fresh link from the sign-in page.'}</p>
            <Link to="/login" className="btn btn--block"><MailOpen size={16} /> Request a new link</Link>
          </>
        ) : null}
      </div>
    </AuthShell>
  );
}
