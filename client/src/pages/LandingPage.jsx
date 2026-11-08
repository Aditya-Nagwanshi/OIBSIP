import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Banknote,
  Check,
  Clock3,
  Copy,
  Flame,
  HeartHandshake,
  Leaf,
  Quote,
  ShieldCheck,
  Sparkles,
  Star,
  TicketPercent,
  Timer,
  Truck,
  WandSparkles,
  Wheat,
} from 'lucide-react';
import { lazy, Suspense, useRef, useState } from 'react';
import { motion, useInView, useMotionValue, useScroll, useSpring, useTransform } from 'framer-motion';
import MenuCarousel from '../components/landing/MenuCarousel';
import StorySection from '../components/landing/StorySection';
import usePizzas from '../hooks/usePizzas';
import usePageTitle from '../hooks/usePageTitle';

const Pizza3D = lazy(() => import('../components/three/Pizza3D'));

const deliveryPromises = [
  {
    number: '01',
    icon: Truck,
    title: 'Free delivery over ₹599',
    copy: 'Any cart above ₹599 rides to your door for free. No coupon games, no fine print.',
    chip: 'Automatic at checkout',
  },
  {
    number: '02',
    icon: Banknote,
    title: 'Cash on delivery',
    copy: 'Save your card. Pay the rider in cash when the box is in your hands. Demo mode, zero risk.',
    chip: 'Select at checkout',
  },
  {
    number: '03',
    icon: Timer,
    title: 'Hot in 30 minutes',
    copy: 'Stone-baked, boxed and live-tracked from our oven to your doorstep. Watch it fly.',
    chip: 'Live tracking',
  },
];

const reviews = [
  {
    quote:
      'The crust arrives blistered, the mozzarella still trembling. It tastes like someone cared about every single degree of the oven.',
    name: 'Riya S.',
    role: 'Ordered 14 times',
    initials: 'RS',
    color: '#e7ddff',
    pizza: 'Margherita',
  },
  {
    quote:
      'The Hot Honey Pepperoni is a full personality trait now. Sweet heat, crispy edges, and a cheese pull that refuses to quit.',
    name: 'Arjun V.',
    role: 'Pizza theorist',
    initials: 'AV',
    color: '#ffd9df',
    pizza: 'Hot Honey Pepperoni',
  },
  {
    quote:
      'Built my own with smoked pepperoni, caramelised onion and extra mozzarella. It arrived hot in 24 minutes. The tracker was oddly addictive.',
    name: 'Sneha P.',
    role: 'Custom builder fan',
    initials: 'SP',
    color: '#e8e2d6',
    pizza: 'The Custom One',
  },
];

const features = [
  {
    number: '01',
    icon: Wheat,
    title: 'Dough that takes its time',
    copy: 'A 48-hour cold ferment, hand-stretched and rested. The kind of crust that earns its own fan club.',
  },
  {
    number: '02',
    icon: Leaf,
    title: 'Ingredients with a name',
    copy: 'San Marzano tomatoes, real mozzarella and single-origin olive oil. No fillers, no mystery cheese.',
  },
  {
    number: '03',
    icon: Timer,
    title: '30-minute promise',
    copy: 'Stone-baked and dispatched fast, with live tracking from our oven to your door.',
  },
  {
    number: '04',
    icon: HeartHandshake,
    title: 'Pizza with principles',
    copy: 'Compostable boxes, fair kitchen shifts and a menu that respects the people who make it.',
  },
];

const gallery = [
  {
    src: '/media/pizzas/veggie.webp',
    alt: 'Vegetable pizza with mushrooms, olives and peppers being lifted',
    label: '01 / The lift',
    title: 'Garden toppings, molten mozzarella',
  },
  {
    src: '/media/pizzas/paneer.webp',
    alt: 'Paneer tikka pizza with a long cheese pull',
    label: '02 / The pull',
    title: 'Tikka spice, a very serious stretch',
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 26 },
  visible: (index = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: index * 0.06, duration: 0.72, ease: [0.16, 1, 0.3, 1] },
  }),
};

function ParallaxImage({ src, alt, className = '', distance = 16 }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], [-distance, distance]);

  return (
    <motion.span ref={ref} className={`parallax-media ${className}`.trim()} style={{ y, scale: 1.06 }}>
      <img src={src} alt={alt} loading="lazy" />
    </motion.span>
  );
}

function CouponSection() {
  const [copied, setCopied] = useState(false);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText('INFOBYTE');
    } catch {
      /* clipboard can be blocked; the code is still visible */
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2200);
  };

  return (
    <section className="lux-coupon" id="coupon" aria-label="Coupon offer">
      <div className="container">
        <motion.div
          className="lux-coupon__card"
          initial={{ opacity: 0, y: 34 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="lux-coupon__copy">
            <p className="lux-eyebrow lux-eyebrow--light">
              <span className="lux-eyebrow__line" /> The friend-with-a-code
            </p>
            <h2 className="lux-coupon__title">
              Take <em>40% off.</em><br />
              Tell no one. Or everyone.
            </h2>
            <p className="lux-coupon__lede">
              Use <strong>INFOBYTE</strong> at checkout and the subtotal gets a very generous
              haircut. Works on every pizza, every size, every questionable topping decision.
            </p>
            <div className="lux-coupon__code">
              <span><TicketPercent size={16} /> <strong>INFOBYTE</strong></span>
              <button type="button" onClick={copyCode}>
                {copied ? <><Check size={15} /> Copied</> : <><Copy size={15} /> Copy code</>}
              </button>
            </div>
            <small className="lux-coupon__fine">
              40% off the subtotal. Taxes and delivery remain their own tiny, boring subplot.
            </small>
          </div>
          <div className="lux-coupon__ticket" aria-hidden="true">
            <span className="lux-coupon__ticket-kicker">InfoByte exclusive</span>
            <strong>40<sup>%</sup></strong>
            <span className="lux-coupon__ticket-off">OFF</span>
            <span className="lux-coupon__ticket-code">INFOBYTE</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default function LandingPage() {
  usePageTitle('Pizza, but make it a theory');
  const { pizzas, loading } = usePizzas();
  const labRef = useRef(null);
  const labInView = useInView(labRef, { once: true, margin: '240px' });

  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const rotateX = useSpring(useTransform(pointerY, [-0.5, 0.5], [3.5, -3.5]), {
    stiffness: 140,
    damping: 20,
  });
  const rotateY = useSpring(useTransform(pointerX, [-0.5, 0.5], [-5, 5]), {
    stiffness: 140,
    damping: 20,
  });

  const handleStageMove = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    pointerX.set((event.clientX - rect.left) / rect.width - 0.5);
    pointerY.set((event.clientY - rect.top) / rect.height - 0.5);
  };

  const resetStage = () => {
    pointerX.set(0);
    pointerY.set(0);
  };

  return (
    <div className="cinematic-home">
      <section className="lux-hero" id="top" aria-label="Slice Theory introduction">
        <div className="lux-hero__wash" aria-hidden="true" />
        <div className="container lux-hero__grid">
          <div className="lux-hero__copy">
            <motion.p
              className="lux-eyebrow"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              <span className="lux-eyebrow__line" />
              Pizza, but make it a personality
            </motion.p>

            <motion.h1
              className="lux-title"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.05 }}
            >
              It&apos;s a
              <em>Theory.</em>
            </motion.h1>

            <motion.p
              className="lux-lede"
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.16 }}
            >
              48-hour dough, unserious amounts of cheese and a crust that understood the assignment.
              This isn&apos;t just dinner — it&apos;s the personality trait your group chat didn&apos;t know it needed.
            </motion.p>

            <motion.div
              className="lux-actions"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.24 }}
            >
              <a href="#menu" className="lux-btn lux-btn--red">
                Order now <ArrowRight size={17} />
              </a>
              <Link to="/build" className="lux-btn lux-btn--ghost">
                <WandSparkles size={17} /> Build your slice
              </Link>
            </motion.div>

            <motion.a
              href="#coupon"
              className="lux-hero__code"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
            >
              <TicketPercent size={15} />
              Code <strong>INFOBYTE</strong> · 40% off your first theory
            </motion.a>

            <motion.div
              className="lux-proof"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.32 }}
            >
              <div className="lux-proof__avatars" aria-hidden="true">
                <span style={{ background: '#e7ddff' }}>RS</span>
                <span style={{ background: '#ffd9df' }}>AV</span>
                <span style={{ background: '#fff2c2' }}>SP</span>
                <span style={{ background: '#2b1238', color: '#fff' }}>MN</span>
              </div>
              <div>
                <div className="lux-proof__stars" aria-label="4.9 out of 5 stars">
                  {[0, 1, 2, 3, 4].map((star) => <Star key={star} size={12} fill="currentColor" />)}
                </div>
                <strong>Loved by 12,000+ slice theorists</strong>
                <small>4.9 average · 2,180 verified orders</small>
              </div>
            </motion.div>
          </div>

          <motion.div
            className="lux-hero__stage"
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.05, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
            onPointerMove={handleStageMove}
            onPointerLeave={resetStage}
          >
            <motion.div
              className="lux-hero__disc"
              style={{ rotateX, rotateY, transformPerspective: 1200 }}
            >
              <span className="lux-hero__ring" aria-hidden="true" />
              <span className="lux-hero__ring lux-hero__ring--inner" aria-hidden="true" />
              <img
                src="/media/pizzas/pepperoni.webp"
                alt="Pepperoni pizza with a molten cheese pull"
                fetchPriority="high"
              />
              <span className="lux-hero__rim" aria-hidden="true" />
            </motion.div>

            <motion.div
              className="lux-float lux-float--one"
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7, duration: 0.6 }}
            >
              <Flame size={16} />
              <span>450°C<small>stone-baked</small></span>
            </motion.div>

            <motion.div
              className="lux-float lux-float--two"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.85, duration: 0.6 }}
            >
              <Truck size={16} />
              <span>30 min<small>live tracked</small></span>
            </motion.div>

            <motion.div
              className="lux-seal"
              initial={{ opacity: 0, scale: 0.7, rotate: -16 }}
              animate={{ opacity: 1, scale: 1, rotate: 7 }}
              transition={{ delay: 1, type: 'spring', stiffness: 170, damping: 16 }}
            >
              <span>Theory</span>
              <strong>No. 001</strong>
              <span>Slice Theory</span>
            </motion.div>

            <span className="lux-hero__side" aria-hidden="true">more than pizza / est. 2019</span>
          </motion.div>
        </div>

        <div className="container lux-hero__foot">
          <span><Flame size={13} /> 48-hour cold ferment</span>
          <span><Truck size={13} /> Free delivery over ₹599</span>
          <span><Banknote size={13} /> Cash on delivery</span>
          <span><ShieldCheck size={13} /> Fresh dough, daily</span>
        </div>
      </section>

      <div className="lux-strip" aria-hidden="true">
        <div className="container lux-strip__inner">
          <span>Free delivery over ₹599</span>
          <i />
          <span>Cash on delivery</span>
          <i />
          <span>Stone-baked at 450°C</span>
          <i />
          <span>Code INFOBYTE · 40% off</span>
          <i />
          <span>Real buffalo mozzarella</span>
        </div>
      </div>

      <MenuCarousel pizzas={pizzas} loading={loading} />

      <section className="lux-section lux-promises" id="delivery" aria-label="Delivery, payment and speed promises">
        <div className="container">
          <div className="lux-head lux-head--split">
            <div>
              <p className="lux-eyebrow"><span className="lux-eyebrow__line" /> The happy math</p>
              <h2 className="lux-h2">Big cart, <em>zero delivery fee.</em></h2>
            </div>
            <p className="lux-head__aside">
              Cross ₹599 and shipping is on us. Not feeling online payments? Hand the rider cash instead.
              Exact change is cool. Compliments are cooler.
            </p>
          </div>

          <div className="lux-promise-grid">
            {deliveryPromises.map((promise, index) => {
              const Icon = promise.icon;
              return (
                <motion.article
                  className="lux-promise"
                  key={promise.title}
                  variants={fadeUp}
                  custom={index}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: '-80px' }}
                >
                  <span className="lux-promise__number">{promise.number}</span>
                  <span className="lux-promise__icon"><Icon size={22} /></span>
                  <span className="lux-promise__chip">{promise.chip}</span>
                  <h3>{promise.title}</h3>
                  <p>{promise.copy}</p>
                </motion.article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="lux-section lux-offer" id="offers" aria-label="Current offers">
        <div className="container lux-offer__grid">
          <motion.article
            className="lux-offer__feature"
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
          >
            <div className="lux-offer__copy">
              <span className="lux-tag">This week only</span>
              <h2>Two theories.<br /><em>One box. Zero self-control.</em></h2>
              <p>
                Order any large pizza and the second arrives half price on Wednesdays.
                Use code <strong>HALFTHEORY</strong> at checkout. The maths is suspicious, but real.
              </p>
              <Link to="/menu" className="lux-btn lux-btn--ink">
                Claim the offer <ArrowRight size={16} />
              </Link>
              <span className="lux-fine">Valid on large pizzas, dine-in or delivery. Until stocks last.</span>
            </div>
            <div className="lux-offer__media">
              <ParallaxImage src="/media/pizzas/margherita.webp" alt="Margherita pizza with a cheese pull" distance={10} />
              <span className="lux-offer__badge"><strong>50</strong><span>% off</span></span>
            </div>
          </motion.article>

          <div className="lux-offer__side">
            <motion.article
              className="lux-offer__panel lux-offer__panel--dark"
              variants={fadeUp}
              custom={1}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-80px' }}
            >
              <span className="lux-tag lux-tag--cream">For the overthinkers</span>
              <h3>Build your own theory.</h3>
              <p>Start with a base, pick a sauce and pile on up to eight toppings. Preview every change in 3D. Yes, you can rotate it. No, you cannot eat the preview.</p>
              <Link to="/build" className="lux-textlink">Open the builder <WandSparkles size={15} /></Link>
            </motion.article>

            <motion.article
              className="lux-offer__panel lux-offer__panel--lavender"
              variants={fadeUp}
              custom={2}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-80px' }}
            >
              <span className="lux-tag">New drop</span>
              <h3>Hot Honey Pepperoni</h3>
              <p>Pepperoni cups, chilli honey, smoked mozzarella. Sweet heat, crispy edges, and a personality people will talk about.</p>
              <Link to="/menu" className="lux-textlink">Meet the new slice <ArrowRight size={15} /></Link>
            </motion.article>
          </div>
        </div>
      </section>

      <CouponSection />

      <StorySection />

      <section className="lux-section lux-gallery" id="pull" aria-label="The cheese pull gallery">
        <div className="container">
          <div className="lux-head lux-head--split">
            <div>
              <p className="lux-eyebrow"><span className="lux-eyebrow__line" /> The pull</p>
              <h2 className="lux-h2">Built for the <em>first lift.</em></h2>
            </div>
            <p className="lux-head__aside">
              Every Slice Theory pie is balanced to survive the moment the crust gives,
              the cheese resists and the table goes quiet.
            </p>
          </div>

          <div className="lux-gallery__grid">
            {gallery.map((item, index) => (
              <motion.figure
                className="lux-frame"
                key={item.label}
                variants={fadeUp}
                custom={index}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-80px' }}
              >
                <ParallaxImage src={item.src} alt={item.alt} />
                <figcaption>
                  <span>{item.label}</span>
                  <strong>{item.title}</strong>
                </figcaption>
              </motion.figure>
            ))}
          </div>
        </div>
      </section>

      <section className="lux-lab" id="lab" aria-label="Interactive 3D pizza preview">
        <div className="container lux-lab__grid">
          <div className="lux-lab__copy">
            <p className="lux-eyebrow lux-eyebrow--light"><span className="lux-eyebrow__line" /> Interactive 3D</p>
            <h2 className="lux-h2">Spin the theory <em>before the oven.</em></h2>
            <p>
              Drag the pizza, inspect the crust, and get the exact pre-order ritual from our builder.
              Every experiment starts hot, fresh and rotatable.
            </p>
            <ul className="lux-lab__facts">
              <li><Flame size={15} /> Stone-baked visual preview</li>
              <li><Sparkles size={15} /> Live topping layout</li>
              <li><ShieldCheck size={15} /> No-guess custom builds</li>
            </ul>
            <Link to="/build" className="lux-btn lux-btn--cream">
              Open the 3D builder <ArrowRight size={16} />
            </Link>
          </div>

          <div className="lux-lab__stage" ref={labRef}>
            {labInView ? (
              <Suspense fallback={<img src="/media/pizzas/pepperoni.webp" alt="Pepperoni pizza" />}>
                <Pizza3D
                  className="lux-lab__pizza"
                  showFloating
                  autoRotate
                  fallbackImage="/media/pizzas/pepperoni.webp"
                  toppers={['smoked-pepperoni', 'fresh-basil', 'black-olives', 'cherry-tomato']}
                  cameraPosition={[0, 3.4, 5.2]}
                />
              </Suspense>
            ) : (
              <img src="/media/pizzas/pepperoni.webp" alt="Pepperoni pizza" loading="lazy" />
            )}
            <div className="lux-lab__hint"><span /> Drag to inspect the theory</div>
          </div>
        </div>
      </section>

      <section className="lux-section lux-features" id="why">
        <div className="container">
          <div className="lux-head lux-head--center">
            <p className="lux-eyebrow lux-eyebrow--center"><span className="lux-eyebrow__line" /> The Slice Theory standard</p>
            <h2 className="lux-h2">Obsessive about the <em>details.</em></h2>
            <p>The flour, the ferment, the fire, the timing. We test them all so your first bite isn&apos;t a gamble. Slightly unhinged about the crust, perfectly sane about everything else.</p>
          </div>

          <div className="lux-feature-grid">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.article
                  className="lux-feature"
                  key={feature.title}
                  variants={fadeUp}
                  custom={index}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: '-60px' }}
                >
                  <span className="lux-feature__number">{feature.number}</span>
                  <span className="lux-feature__icon"><Icon size={21} /></span>
                  <h3>{feature.title}</h3>
                  <p>{feature.copy}</p>
                </motion.article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="lux-section lux-about" id="about">
        <div className="container lux-about__grid">
          <motion.div
            className="lux-about__media"
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
          >
            <ParallaxImage
              src="/media/cinematic/woodfired-pepperoni.webp"
              alt="Pepperoni pizza emerging from a hot oven"
              distance={12}
            />
            <div className="lux-about__stamp">
              <span>Est.</span>
              <strong>2019</strong>
              <span>Still testing</span>
            </div>
            <div className="lux-about__note">
              <Flame size={17} />
              <span>Stone-baked<small>Never conveyor-belted</small></span>
            </div>
          </motion.div>

          <motion.div
            className="lux-about__copy"
            variants={fadeUp}
            custom={1}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
          >
            <p className="lux-eyebrow"><span className="lux-eyebrow__line" /> The origin story</p>
            <h2 className="lux-h2">One oven. One notebook.<br /><em>One stubborn question.</em></h2>
            <p>
              Slice Theory began in a tiny kitchen with a sourdough starter and a notebook full of failed experiments.
              We tested hydration levels, cheese blends and bake times until the slice felt right.
            </p>
            <p>
              Years later, the experiment continues. Same curiosity, bigger kitchen, more cheese.
              The notebook is a spreadsheet now. The starter still has a name. Every order is a data point;
              every happy table is proof.
            </p>
            <div className="lux-stats">
              <div><strong>48h</strong><span>Cold-fermented dough</span></div>
              <div><strong>12k+</strong><span>Happy slice theorists</span></div>
              <div><strong>4.9★</strong><span>Average rating</span></div>
            </div>
            <div className="lux-about__actions">
              <Link to="/menu" className="lux-btn lux-btn--red">Taste the theory <ArrowRight size={16} /></Link>
              <Link to="/register" className="lux-textlink">Join the lab <ArrowRight size={15} /></Link>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="lux-section lux-reviews" aria-label="Customer reviews">
        <div className="container">
          <div className="lux-head lux-head--split">
            <div>
              <p className="lux-eyebrow"><span className="lux-eyebrow__line" /> Field notes</p>
              <h2 className="lux-h2">Reviews from the <em>test kitchen.</em></h2>
            </div>
            <div className="lux-rating">
              <div className="lux-proof__stars" aria-label="4.9 stars">
                {[0, 1, 2, 3, 4].map((star) => <Star key={star} size={15} fill="currentColor" />)}
              </div>
              <span><strong>4.9</strong> from 2,180 verified orders</span>
            </div>
          </div>

          <div className="lux-review-grid">
            {reviews.map((review, index) => (
              <motion.article
                className="lux-review"
                key={review.name}
                variants={fadeUp}
                custom={index}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-60px' }}
              >
                <Quote size={22} className="lux-review__quote" />
                <div className="lux-proof__stars lux-proof__stars--small" aria-hidden="true">
                  {[0, 1, 2, 3, 4].map((star) => <Star key={star} size={12} fill="currentColor" />)}
                </div>
                <blockquote>{review.quote}</blockquote>
                <div className="lux-review__foot">
                  <span className="lux-review__avatar" style={{ background: review.color }}>{review.initials}</span>
                  <div>
                    <strong>{review.name}</strong>
                    <small>{review.role}</small>
                  </div>
                  <span className="lux-review__pizza">{review.pizza}</span>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section className="lux-final">
        <div className="container lux-final__inner">
          <div className="lux-final__copy">
            <span className="lux-final__kicker"><Clock3 size={14} /> The oven is already on</span>
            <h2>Your next theory<br />is <em>30 minutes away.</em></h2>
            <p>Free delivery over ₹599, cash or online, fresh dough and a delivery tracker you will refresh more than you should. We are not judging. We are also refreshing it.</p>
            <div className="lux-final__actions">
              <Link to="/menu" className="lux-btn lux-btn--cream lux-btn--lg">Order now <ArrowRight size={17} /></Link>
              <Link to="/build" className="lux-btn lux-btn--outline-light lux-btn--lg">Build your own</Link>
            </div>
          </div>
          <div className="lux-final__art" aria-hidden="true">
            <img src="/media/pizzas/margherita.webp" alt="" loading="lazy" />
            <span className="lux-final__stamp">Hot<br />&amp; ready</span>
          </div>
        </div>
      </section>
    </div>
  );
}
