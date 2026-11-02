import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowDown, ArrowRight, Flame, Play, Star, Truck, WandSparkles } from 'lucide-react';
import Pizza3D from '../three/Pizza3D';
import { BasilDoodle, CheeseDoodle, OliveDoodle, TomatoDoodle } from '../ui/IngredientDoodles';
import Modal from '../ui/Modal';

const item = {
  hidden: { opacity: 0, y: 26 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay, duration: 0.7, ease: [0.16, 1, 0.3, 1] },
  }),
};

export default function Hero() {
  const [filmOpen, setFilmOpen] = useState(false);

  return (
    <section className="hero" id="top">
      <div className="float-ingredient float-ingredient--tomato">
        <TomatoDoodle />
      </div>
      <div className="float-ingredient float-ingredient--basil">
        <BasilDoodle />
      </div>
      <div className="float-ingredient float-ingredient--olive">
        <OliveDoodle />
      </div>
      <div className="float-ingredient float-ingredient--cheese">
        <CheeseDoodle />
      </div>

      <div className="container hero__grid">
        <div className="hero__copy">
          <motion.div className="hero__kicker" variants={item} initial="hidden" animate="visible" custom={0}>
            <span className="hero__kicker-dot" />
            Now firing at your nearest Slice Theory kitchen
          </motion.div>

          <motion.div className="hero__script" variants={item} initial="hidden" animate="visible" custom={0.08}>
            More than pizza.
            <Flame size={26} strokeWidth={2.4} />
          </motion.div>

          <h1 className="hero__title">
            <motion.span className="hero__title-line hero__title-line--one" variants={item} initial="hidden" animate="visible" custom={0.16}>
              It&apos;s a
            </motion.span>
            <motion.span className="hero__title-line hero__title-line--two" variants={item} initial="hidden" animate="visible" custom={0.24}>
              Theory.
            </motion.span>
          </h1>

          <motion.p className="hero__lede" variants={item} initial="hidden" animate="visible" custom={0.34}>
            Dive into a slice of happiness with every bite. Hand-stretched dough, slow-cooked sauce and a cheese pull
            worth talking about.
          </motion.p>

          <motion.div className="hero__actions" variants={item} initial="hidden" animate="visible" custom={0.42}>
            <a href="#menu" className="btn btn--lg">
              Order now
              <ArrowRight size={18} />
            </a>
            <Link to="/build" className="btn btn--ghost btn--lg">
              <WandSparkles size={18} />
              Build your slice
            </Link>
            <button className="hero__film" onClick={() => setFilmOpen(true)}>
              <span className="hero__film-play">
                <Play size={14} fill="currentColor" />
              </span>
              <span>
                Watch the film
                <small>00:19 · The making of a slice</small>
              </span>
            </button>
          </motion.div>

          <motion.div className="hero__proof" variants={item} initial="hidden" animate="visible" custom={0.5}>
            <div className="hero__proof-avatars">
              <span style={{ background: '#ffd9a8' }}>RS</span>
              <span style={{ background: '#ffc2cf' }}>AV</span>
              <span style={{ background: '#c8e6b9' }}>SP</span>
              <span style={{ background: '#d8c7f1' }}>MN</span>
            </div>
            <div className="hero__proof-copy">
              <div className="hero__proof-stars">
                {[0, 1, 2, 3, 4].map((star) => (
                  <Star key={star} size={11} fill="currentColor" />
                ))}
              </div>
              <strong>Loved by 12,000+ slice theorists</strong>
              Real reviews. Real cheese. Real theories.
            </div>
          </motion.div>
        </div>

        <motion.div
          className="hero__stage"
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
        >
          <div className="hero__canvas">
            <Pizza3D
              className="hero__three"
              showFloating
              autoRotate
              toppers={['smoked-pepperoni', 'fresh-basil', 'black-olives', 'cherry-tomato']}
              cameraPosition={[0, 3.5, 5.5]}
            />
            <div className="hero__canvas-hint">
              <span className="hero__canvas-hint-dot" />
              Drag the pizza to inspect your theory
            </div>
          </div>
          <motion.div
            className="hero__badge hero__badge--one"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8 }}
          >
            <span className="hero__badge-emoji">🔥</span>
            <span>
              Stone-baked
              <small>450°C · 90 seconds</small>
            </span>
          </motion.div>
          <motion.div
            className="hero__badge hero__badge--two"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.95 }}
          >
            <span className="hero__badge-emoji">🛵</span>
            <span>
              Hot in 30 min
              <small>Live tracked delivery</small>
            </span>
          </motion.div>
          <motion.div
            className="hero__sticker hero__sticker--one"
            initial={{ opacity: 0, rotate: -20, scale: 0.7 }}
            animate={{ opacity: 1, rotate: 10, scale: 1 }}
            transition={{ delay: 1.05, type: 'spring', stiffness: 200 }}
          >
            <span>
              100%<br />
              <strong>good</strong>
              mood
            </span>
          </motion.div>
        </motion.div>
      </div>

      <a href="#menu" className="hero__scroll" aria-label="Scroll to menu">
        <span>Scroll down</span>
        <span className="hero__scroll-line" />
      </a>

      <div className="hero__trust">
        <span><Flame size={13} /> Fresh dough daily</span>
        <span><Truck size={13} /> 30-min delivery promise</span>
        <span><Star size={13} /> 4.9 average rating</span>
      </div>

      <Modal
        open={filmOpen}
        onClose={() => setFilmOpen(false)}
        title="The making of a slice"
        subtitle="Dough. Sauce. Cheese. Fire. A 19-second theory."
        wide
      >
        <video
          className="story-film"
          controls
          autoPlay
          playsInline
          poster="/media/story-poster.webp"
          src="/media/story.mp4"
        >
          Your browser does not support video playback.
        </video>
        <div className="story-film__foot">
          <span>Shot for Slice Theory · Pizza build, 4K</span>
          <Link to="/build" className="link-arrow" onClick={() => setFilmOpen(false)}>
            Build your own <ArrowDown size={14} />
          </Link>
        </div>
      </Modal>
    </section>
  );
}
