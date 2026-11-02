import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Pizza } from 'lucide-react';
import usePageTitle from '../hooks/usePageTitle';

export default function NotFoundPage() {
  usePageTitle('Page not found');
  return (
    <section className="not-found">
      <div className="container not-found__inner">
        <div className="not-found__art" aria-hidden="true">
          <span className="not-found__code">404</span>
          <span className="not-found__pizza"><Pizza size={72} /></span>
          <span className="not-found__spark">✦</span>
        </div>
        <p className="eyebrow">This slice went missing</p>
        <h1>Wrong theory, <em>right appetite.</em></h1>
        <p>The page you are looking for was eaten, moved, or never made it out of the oven.</p>
        <div className="not-found__actions">
          <Link to="/" className="btn"><ArrowLeft size={16} /> Back home</Link>
          <Link to="/menu" className="btn btn--ghost">Browse the menu <ArrowRight size={16} /></Link>
        </div>
      </div>
    </section>
  );
}
