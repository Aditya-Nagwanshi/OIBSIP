import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Plus, Star } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { useToast } from '../../contexts/ToastContext';
import { formatINR } from '../../lib/format';
import TiltCard from '../system/TiltCard';

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
        return { pizza, offset, index };
      })
      .sort((a, b) => Math.abs(a.offset) - Math.abs(b.offset));
  }, [pizzas, active, count]);

  const go = (direction) => {
    if (!count) return;
    setActive((value) => (value + direction + count) % count);
  };

  const handlePointerDown = (event) => {
    dragStart.current = { x: event.clientX };
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
    <section className="lux-section menu-carousel" id="menu">
      <div className="container">
        <div className="lux-head lux-head--split">
          <div>
            <p className="lux-eyebrow"><span className="lux-eyebrow__line" /> Fresh from the lab</p>
            <h2 className="lux-h2">The usual <em>suspects.</em></h2>
          </div>
          <div className="lux-head__aside">
            <p>Five signature theories, endless combinations. Swipe through the favourites. One of them will start a group chat.</p>
            <Link to="/menu" className="lux-textlink">
              Explore the full menu <ArrowRight size={15} />
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
            <ArrowLeft size={18} />
          </button>
          <button className="carousel-nav carousel-nav--next" onClick={() => go(1)} aria-label="Next pizza" disabled={!count}>
            <ArrowRight size={18} />
          </button>

          <div className="carousel-stage">
            {loading
              ? [0, 1, 2].map((key) => <SkeletonCard key={key} />)
              : ordered.map(({ pizza, offset, index }) => {
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
                      <TiltCard className="carousel-card__tilt" max={10} roll={2.5} lift={1.015}>
                        <div className="carousel-card__media">
                        <span className={`diet-tag ${pizza.isVegetarian ? 'diet-tag--veg' : 'diet-tag--nonveg'}`}>
                          <span className="diet-tag__mark" aria-hidden="true" />
                          {pizza.isVegetarian ? 'Veg' : 'Non-veg'}
                        </span>
                        <span className="carousel-card__index">{String(index + 1).padStart(2, '0')}</span>
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
                            <Plus size={17} /> {pizza.canOrder ? 'Add to cart' : 'Sold out'}
                          </button>
                        ) : null}
                      </div>

                      <div className="carousel-card__body">
                        <div className="carousel-card__title-row">
                          <h3>{pizza.name}</h3>
                          <span className="carousel-card__rating">
                            <Star size={11} fill="currentColor" /> {pizza.rating?.toFixed?.(1) || '4.8'}
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
                          <div className="carousel-card__price">
                            <small>From</small>
                            <strong>{formatINR(pizza.basePrice)}</strong>
                          </div>
                          <span className={`carousel-card__note ${pizza.isVegetarian ? 'is-veg' : 'is-nonveg'}`}>
                            {pizza.isVegetarian ? 'Garden pick' : "Chef's signature"}
                          </span>
                        </div>
                      </div>
                      </TiltCard>
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
            <strong>{current.name}</strong>
            <span>{current.tagline || 'Scientifically, a good idea.'}</span>
          </p>
        ) : null}
      </div>
    </section>
  );
}
