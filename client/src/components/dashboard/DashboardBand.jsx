import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, Clock3, Sparkles } from 'lucide-react';

export default function DashboardBand({ firstName = 'theorist', activeCount = 0 }) {
  const ref = useRef(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const rotateY = useTransform(scrollYProgress, [0, 1], reduced ? [0, 0] : [-9, 9]);
  const rotateX = useTransform(scrollYProgress, [0, 1], reduced ? [0, 0] : [7, -7]);
  const y = useTransform(scrollYProgress, [0, 1], reduced ? [0, 0] : [34, -34]);
  const ringRotate = useTransform(scrollYProgress, [0, 1], reduced ? [0, 0] : [-18, 18]);

  return (
    <section className="dash-band" ref={ref}>
      <div className="dash-band__copy">
        <p className="dash-band__kicker"><Sparkles size={13} /> Fresh from the oven</p>
        <h2>
          Welcome back, <em>{firstName}.</em>
        </h2>
        <p>
          {activeCount > 0
            ? `${activeCount} ${activeCount === 1 ? 'experiment is' : 'experiments are'} in motion. We will keep the oven warm.`
            : 'The lab is quiet. A fresh theory is only a few clicks away.'}
        </p>
        <div className="dash-band__actions">
          <Link to="/menu" className="btn btn--cream btn--sm">Start an order <ArrowRight size={14} /></Link>
          <span className="dash-band__meta"><Clock3 size={13} /> 30-minute average</span>
        </div>
      </div>

      <div className="dash-band__stage">
        <motion.div className="dash-band__disc" style={{ rotateY, rotateX, y }}>
          <img src="/media/pizzas/margherita.webp" alt="Freshly baked margherita pizza" loading="lazy" />
        </motion.div>
        <motion.span className="dash-band__ring" style={{ rotate: ringRotate }} aria-hidden="true" />
        <motion.span className="dash-band__ring dash-band__ring--inner" style={{ rotate: ringRotate }} aria-hidden="true" />
        <span className="dash-band__chip"><Sparkles size={13} /> Lab member perk</span>
      </div>
    </section>
  );
}
