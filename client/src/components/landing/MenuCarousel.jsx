import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Flame, Plus, ShieldCheck, Star } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { useToast } from '../../contexts/ToastContext';
import { formatINR } from '../../lib/format';

function SkeletonCard() {
  return (
    <article className="carousel-card carousel-card--skeleton">
      <div className="skeleton skeleton--pip" />
      <div className="skeleton skeleton--title" />
      <div className="skeleton skeleton--line" />
      <div className="skeleton skeleton--price" />
    </article>
  );
}

export default function MenuCarousel({ pizzas, loading }) {
  const [active, setActive] = useState(0);
  const dragStart = useRef(null);
  const { addPreset } = useCart();
  const { toast } = useToast();

  const count = pizzas.length;
  const current = count ? pizzas[((active % count) + count) % count] : null;

  const ordered = useMemo(() => {
    if (!count) return [];
    return pizzas
      .map((pizza, index) => {
        let offset = index - active;
        if (offset > count / 2) offset -= count;
        if (offset < -count / 2) offset += count;
        return { pizza, offset };
      })
      .sort((a, b) => Math.abs(a.offset) - Math.abs(b.offset));
  }, [pizzas, active, count]);

  const go = (direction) => {
    if (!count) return;
    setActive((value) => (value + direction + count) % count);
  };

  const handlePointerDown = (event) => {
    dragStart.current = { x: event.clientX, moved: false };
  };

  const handlePointerUp = (event) => {
    if (!dragStart.current) return;
    const delta = event.clientX - dragStart.current.x;
    if (Math.abs(delta) > 52) go(delta > 0 ? -1 : 1);
    dragStart.current = null;
  };

  const add = (pizza) => {
    addPreset(pizza, 'medium');
    toast(`${pizza.name} joined your cart.`, { tone: 'success', title: 'Nice theory.' });
  };

  return (
    <section className="section menu-carousel" id="menu">
      <div className="container">
        <div className="section-heading section-heading--split">
          <div>
            <p className="eyebrow">Fresh from the lab</p>
            <h2>
              Our menu of <em>possibilities.</em>
            </h2>
          </div>
          <div className="section-heading__aside">
            <p>Six signature theories, endless combinations. Swipe through the favourites and pick a side of happiness.</p>
            <Link to="/menu" className="link-arrow">
              Full menu <ArrowRight size={15} />
            </Link>
          </div>
        </div>

        <div
          className="carousel"
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerLeave={() => {
            dragStart.current = null;
          }}
        >
          <button className="carousel-nav carousel-nav--prev" onClick={() => go(-1)} aria-label="Previous pizza" disabled={!count}>
            <ArrowLeft size={19} />
          </button>
          <button className="carousel-nav carousel-nav--next" onClick={() => go(1)} aria-label="Next pizza" disabled={!count}>
            <ArrowRight size={19} />
          </button>

          <div className="carousel-stage">
            {loading
              ? [0, 1, 2].map((key) => <SkeletonCard key={key} />)
              : ordered.map(({ pizza, offset }) => {
                  const isActive = offset === 0;
                  const abs = Math.abs(offset);
                  return (
                    <article
                      key={pizza.id}
                      className={`carousel-card ${isActive ? 'is-active' : ''} ${abs > 2 ? 'is-hidden' : ''}`}
                      style={{
                        '--offset': offset,
                        '--abs': abs,
                        zIndex: 10 - abs,
                      }}
                      onClick={() => setActive(pizzas.findIndex((entry) => entry.id === pizza.id))}
                    >
                      <div className="carousel-card__media">
                        <span className={`pip ${pizza.isVegetarian ? 'pip--veg' : 'pip--nonveg'}`} aria-label={pizza.isVegetarian ? 'Vegetarian' : 'Non-vegetarian'}>
                          <span />
                        </span>
                        <span className="carousel-card__badge">
                          <Flame size={12} /> {pizza.badges?.[0] || 'Signature'}
                        </span>
                        <img src={pizza.image} alt={pizza.name} loading="lazy" />
                        {isActive ? (
                          <button
                            className="carousel-card__add"
                            disabled={!pizza.canOrder}
                            onClick={(event) => {
                              event.stopPropagation();
                              if (pizza.canOrder) add(pizza);
                            }}
                          >
                            <Plus size={18} /> {pizza.canOrder ? 'Add to cart' : 'Sold out'}
                          </button>
                        ) : null}
                      </div>
                      <div className="carousel-card__body">
                        <div className="carousel-card__title-row">
                          <h3>{pizza.name}</h3>
                          <span className="rating">
                            <Star size={12} fill="currentColor" /> {pizza.rating?.toFixed?.(1) || '4.8'}
                          </span>
                        </div>
                        <p className="carousel-card__desc">{pizza.description}</p>
                        <div className="carousel-card__meta">
                          <span>{pizza.calories} kcal</span>
                          <span>·</span>
                          <span>{pizza.prepMinutes} min</span>
                          <span>·</span>
                          <span>Hand stretched</span>
                        </div>
                        <div className="carousel-card__foot">
                          <div className="price">
                            <small>From</small>
                            <strong>{formatINR(pizza.basePrice)}</strong>
                          </div>
                          {pizza.isVegetarian ? (
                            <span className="carousel-card__note"><ShieldCheck size={13} /> 100% veg</span>
                          ) : (
                            <span className="carousel-card__note">Chef&apos;s signature</span>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
          </div>
        </div>

        <div className="carousel-dots">
          {pizzas.map((pizza, index) => (
            <button
              key={pizza.id}
              className={index === active ? 'is-active' : ''}
              onClick={() => setActive(index)}
              aria-label={`Show ${pizza.name}`}
            />
          ))}
        </div>

        {current ? (
          <p className="carousel-caption">
            <strong>{current.name}</strong> — {current.tagline || 'A very good theory.'}
          </p>
        ) : null}
      </div>
    </section>
  );
}

