import { Link } from 'react-router-dom';
import { ArrowLeft, Flame, Star } from 'lucide-react';
import Logo from '../ui/Logo';

export default function AuthShell({ eyebrow, title, accent, subtitle, children, footer, image = '/media/oven.webp', quote }) {
  return (
    <section className="auth-page">
      <div className="container auth-page__grid">
        <div className="auth-card">
          <Link to="/" className="auth-card__back"><ArrowLeft size={14} /> Back to the menu</Link>
          <div className="auth-card__logo"><Logo /></div>
          <p className="eyebrow">{eyebrow}</p>
          <h1>
            {title} {accent ? <em>{accent}</em> : null}
          </h1>
          {subtitle ? <p className="auth-card__subtitle">{subtitle}</p> : null}
          {children}
          {footer ? <div className="auth-card__footer">{footer}</div> : null}
        </div>

        <aside className="auth-visual">
          <img src={image} alt="" loading="lazy" />
          <div className="auth-visual__overlay" />
          <div className="auth-visual__content">
            <span className="auth-visual__badge"><Flame size={13} /> 450°C, always</span>
            <blockquote>
              {quote || '“A pizza is a hypothesis. The first bite is the peer review.”'}
            </blockquote>
            <div className="auth-visual__foot">
              <div className="review-stars">
                {[0, 1, 2, 3, 4].map((star) => <Star key={star} size={13} fill="currentColor" />)}
              </div>
              <span>4.9 from 12,000+ slice theorists</span>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
