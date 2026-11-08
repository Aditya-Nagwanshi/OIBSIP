import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Facebook, Instagram, LockKeyhole, Twitter, Youtube } from 'lucide-react';
import Logo from '../ui/Logo';
import { useToast } from '../../contexts/ToastContext';

export default function Footer() {
  const [email, setEmail] = useState('');
  const { toast } = useToast();

  const subscribe = (event) => {
    event.preventDefault();
    if (!email.includes('@')) {
      toast({ type: 'error', title: 'Almost there', message: 'Enter a valid email address.' });
      return;
    }
    toast({
      type: 'success',
      title: 'You are on the list',
      message: 'Fresh drops and secret offers will land in your inbox.',
    });
    setEmail('');
  };

  const socialSoon = (network) =>
    toast({ type: 'info', title: `${network} is preheating`, message: 'Social links are coming soon.' });

  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <Logo />
            <p>
              Dough with lore. Cheese with range. A theory in every slice, a little chaos in every
              box.
            </p>
            <div className="footer-socials">
              <button onClick={() => socialSoon('Instagram')} aria-label="Instagram">
                <Instagram size={16} />
              </button>
              <button onClick={() => socialSoon('YouTube')} aria-label="YouTube">
                <Youtube size={16} />
              </button>
              <button onClick={() => socialSoon('Facebook')} aria-label="Facebook">
                <Facebook size={16} />
              </button>
              <button onClick={() => socialSoon('Twitter')} aria-label="Twitter">
                <Twitter size={16} />
              </button>
            </div>
          </div>
          <div className="footer-col">
            <h4>Explore</h4>
            <ul>
              <li><Link to="/">Home</Link></li>
              <li><Link to="/menu">Menu</Link></li>
              <li><Link to="/build">Build your pizza</Link></li>
              <li><Link to="/#story">Our story</Link></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Account</h4>
            <ul>
              <li><Link to="/login">Sign in</Link></li>
              <li><Link to="/register">Create account</Link></li>
              <li><Link to="/dashboard">Track orders</Link></li>
              <li><Link to="/forgot-password">Forgot password</Link></li>
            </ul>
          </div>
          <div className="footer-news">
            <h4>Newsletter</h4>
            <p>First dibs on new drops, secret codes and late-night experiments. No spam. Just pizza.</p>
            <form className="newsletter-form" onSubmit={subscribe}>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Your email"
                aria-label="Email for newsletter"
              />
              <button type="submit" aria-label="Subscribe">
                <ArrowRight size={16} />
              </button>
            </form>
            <p className="footer-note">Unsubscribe whenever. The pizza will understand.</p>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} Slice Theory. All rights reserved.</span>
          <div className="footer-bottom__links">
            <Link to="/#story">Our story</Link>
            <a href="#top" onClick={(event) => { event.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
              Back to top
            </a>
            <Link to="/admin" className="admin-link" aria-label="Open Admin Studio">
              <LockKeyhole size={12} />
              Admin Studio
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
