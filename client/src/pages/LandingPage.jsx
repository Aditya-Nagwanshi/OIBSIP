import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ChefHat,
  Clock3,
  Flame,
  HeartHandshake,
  Leaf,
  Quote,
  Sparkles,
  Star,
  Timer,
  WandSparkles,
  Wheat,
} from 'lucide-react';
import Hero from '../components/landing/Hero';
import MenuCarousel from '../components/landing/MenuCarousel';
import ScrollStory from '../components/landing/ScrollStory';
import usePizzas from '../hooks/usePizzas';
import usePageTitle from '../hooks/usePageTitle';
import scrollToId from '../hooks/scrollToId';

const reviews = [
  {
    quote:
      'The crust has no right being this good. I ordered the Margherita with extra basil and genuinely thought about it for two days afterwards.',
    name: 'Riya S.',
    role: 'Ordered 14 times',
    initials: 'RS',
    color: '#ffd9a8',
    pizza: 'Margherita',
  },
  {
    quote:
      'The Hot Honey Pepperoni is a full personality trait now. Sweet, spicy, crispy edges. My group chat has been permanently changed.',
    name: 'Arjun V.',
    role: 'Pizza theorist',
    initials: 'AV',
    color: '#ffc2cf',
    pizza: 'Hot Honey Pepperoni',
  },
  {
    quote:
      'Built my own with smoked pepperoni, caramelised onion and extra mozzarella. It arrived hot in 24 minutes. The tracker was oddly addictive.',
    name: 'Sneha P.',
    role: 'Custom builder fan',
    initials: 'SP',
    color: '#c8e6b9',
    pizza: 'The Custom One',
  },
];

const features = [
  {
    icon: Wheat,
    title: 'Dough that takes its time',
    copy: 'A 48-hour cold ferment. Hand-stretched, never rolled. The kind of crust that earns its own fan club.',
    tone: 'yellow',
  },
  {
    icon: Leaf,
    title: 'Ingredients with a name',
    copy: 'San Marzano tomatoes, real mozzarella, single-origin olive oil. No fillers, no mystery cheese.',
    tone: 'green',
  },
  {
    icon: Timer,
    title: '30-minute promise',
    copy: 'Stone-baked and dispatched fast, with live tracking from our oven to your door.',
    tone: 'pink',
  },
  {
    icon: HeartHandshake,
    title: 'Pizza with principles',
    copy: 'Compostable boxes, fair kitchen shifts and a menu that respects the people who make it.',
    tone: 'purple',
  },
];

export default function LandingPage() {
  usePageTitle('Pizza, with a theory');
  const { pizzas, loading } = usePizzas();

  return (
    <>
      <Hero />

      <div className="marquee-strip" aria-hidden="true">
        <div className="marquee-strip__track">
          {[0, 1].map((copy) => (
            <div className="marquee-strip__group" key={copy}>
              <span>Hand-stretched</span><Sparkles size={14} />
              <span>Stone-baked at 450°C</span><Sparkles size={14} />
              <span>Real mozzarella</span><Sparkles size={14} />
              <span>30-min delivery</span><Sparkles size={14} />
              <span>Made with a theory</span><Sparkles size={14} />
              <span>No shortcuts</span><Sparkles size={14} />
            </div>
          ))}
        </div>
      </div>

      <MenuCarousel pizzas={pizzas} loading={loading} />

      <section className="section section--tight offers" id="offers">
        <div className="container offers__grid">
          <article className="offer-card offer-card--big">
            <div className="offer-card__copy">
              <span className="offer-card__tag">This week only</span>
              <h2>
                Half &amp; Half<br />
                <em>Wednesdays.</em>
              </h2>
              <p>Order any large pizza and get the second one half price. Two theories, one box. Use code <strong>HALFTHEORY</strong> at checkout.</p>
              <Link to="/menu" className="btn">
                Claim the offer <ArrowRight size={16} />
              </Link>
              <span className="offer-card__fine">Valid on large pizzas, dine-in or delivery. Until stocks last.</span>
            </div>
            <div className="offer-card__art">
              <div className="offer-card__art-ring" />
              <img src="/media/margherita.webp" alt="A fresh margherita pizza" loading="lazy" />
              <span className="offer-card__badge">50%<small>off</small></span>
            </div>
          </article>

          <div className="offers__side">
            <article className="offer-card offer-card--lilac">
              <span className="offer-card__tag">For the indecisive</span>
              <h3>Build your own theory.</h3>
              <p>Start with a base, pick a sauce and pile on up to eight toppings. Preview every change in 3D before it hits the oven.</p>
              <Link to="/build" className="link-arrow">
                Open the builder <WandSparkles size={15} />
              </Link>
              <div className="offer-card__toppings" aria-hidden="true">
                <span>🍅</span><span>🧀</span><span>🌿</span><span>🫒</span>
              </div>
            </article>
            <article className="offer-card offer-card--ink">
              <span className="offer-card__tag offer-card__tag--yellow">New drop</span>
              <h3>Hot Honey Pepperoni</h3>
              <p>Pepperoni cups, chilli honey, smoked mozzarella. Sweet heat, crispy edges, zero regrets.</p>
              <Link to="/menu" className="link-arrow link-arrow--light">
                Meet the new slice <ArrowRight size={15} />
              </Link>
            </article>
          </div>
        </div>
      </section>

      <ScrollStory onFinish={() => scrollToId('menu')} />

      <section className="section features" id="why">
        <div className="container">
          <div className="section-heading section-heading--center">
            <p className="eyebrow">The Slice Theory standard</p>
            <h2>
              Obsessive about the <em>details.</em>
            </h2>
            <p>Every variable matters. The flour, the ferment, the fire, the timing. We test them all so your first bite isn&apos;t a gamble.</p>
          </div>
          <div className="features__grid">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <article className={`feature-card feature-card--${feature.tone}`} key={feature.title}>
                  <span className="feature-card__icon"><Icon size={24} /></span>
                  <h3>{feature.title}</h3>
                  <p>{feature.copy}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section section--cream about" id="about">
        <div className="container about__grid">
          <div className="about__collage">
            <div className="about__photo about__photo--main">
              <img src="/media/oven.webp" alt="Pizza baking in a stone oven" loading="lazy" />
            </div>
            <div className="about__photo about__photo--small">
              <img src="/media/pepperoni.webp" alt="Hot honey pepperoni pizza" loading="lazy" />
            </div>
            <div className="about__badge">
              <span>Est.</span>
              <strong>2019</strong>
              <span>Still testing.</span>
            </div>
            <div className="about__note">
              <Flame size={18} />
              <span>
                Stone-baked
                <small>Never conveyor-belted</small>
              </span>
            </div>
          </div>

          <div className="about__copy">
            <p className="eyebrow">The origin story</p>
            <h2>
              We started with a question. <em>Can pizza make people happier?</em>
            </h2>
            <p>
              Slice Theory began in a tiny kitchen with one oven, a stubborn sourdough starter and a notebook full of
              experiments. We tested hydration levels, cheese blends and bake times until the slice felt right.
            </p>
            <p>
              Years later, the experiment continues. Same curiosity, bigger kitchen, more cheese. Every order is a data
              point. Every happy table is proof.
            </p>
            <div className="about__stats">
              <div><strong>48h</strong><span>Cold-fermented dough</span></div>
              <div><strong>12k+</strong><span>Happy slice theorists</span></div>
              <div><strong>4.9★</strong><span>Average rating</span></div>
            </div>
            <div className="about__actions">
              <Link to="/menu" className="btn">Taste the theory <ArrowRight size={16} /></Link>
              <Link to="/register" className="link-arrow">Join the lab <ChefHat size={15} /></Link>
            </div>
          </div>
        </div>
      </section>

      <section className="section reviews">
        <div className="container">
          <div className="section-heading section-heading--split">
            <div>
              <p className="eyebrow">Field notes</p>
              <h2>
                Reviews from the <em>test kitchen.</em>
              </h2>
            </div>
            <div className="reviews__rating">
              <div className="review-stars">
                {[0, 1, 2, 3, 4].map((star) => <Star key={star} size={16} fill="currentColor" />)}
              </div>
              <span><strong>4.9</strong> from 2,180 verified orders</span>
            </div>
          </div>
          <div className="reviews__grid">
            {reviews.map((review) => (
              <article className="review-card" key={review.name}>
                <Quote size={26} className="review-card__quote" />
                <div className="review-stars">
                  {[0, 1, 2, 3, 4].map((star) => <Star key={star} size={13} fill="currentColor" />)}
                </div>
                <blockquote>{review.quote}</blockquote>
                <div className="review-card__foot">
                  <span className="review-card__avatar" style={{ background: review.color }}>{review.initials}</span>
                  <div>
                    <strong>{review.name}</strong>
                    <small>{review.role}</small>
                  </div>
                  <span className="review-card__pizza">{review.pizza}</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="final-cta">
        <div className="container final-cta__inner">
          <div className="final-cta__copy">
            <span className="final-cta__kicker"><Clock3 size={14} /> The oven is already on</span>
            <h2>
              Your next theory<br />
              is <em>30 minutes away.</em>
            </h2>
            <p>Fresh dough, real cheese and a delivery tracker you will refresh more than you should.</p>
            <div className="final-cta__actions">
              <Link to="/menu" className="btn btn--dark btn--lg">Order now <ArrowRight size={17} /></Link>
              <Link to="/build" className="btn btn--outline btn--lg">Build your own</Link>
            </div>
          </div>
          <div className="final-cta__art" aria-hidden="true">
            <img className="final-cta__pizza final-cta__pizza--one" src="/media/margherita.webp" alt="" loading="lazy" />
            <img className="final-cta__pizza final-cta__pizza--two" src="/media/pepperoni.webp" alt="" loading="lazy" />
            <span className="final-cta__spark final-cta__spark--one">✦</span>
            <span className="final-cta__spark final-cta__spark--two">✦</span>
            <span className="final-cta__stamp">Hot<br />&amp; ready</span>
          </div>
        </div>
      </section>
    </>
  );
}
