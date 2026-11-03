import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Flame, Plus, Search, SlidersHorizontal, Sparkles, Star, WandSparkles } from 'lucide-react';
import usePizzas from '../hooks/usePizzas';
import usePageTitle from '../hooks/usePageTitle';
import { useCart } from '../contexts/CartContext';
import { useToast } from '../contexts/ToastContext';
import { useConfig } from '../contexts/ConfigContext';
import { formatINR } from '../lib/format';
import TiltCard from '../components/system/TiltCard';

const filters = [
  { id: 'all', label: 'Everything' },
  { id: 'veg', label: 'Vegetarian' },
  { id: 'nonveg', label: 'Non-veg' },
  { id: 'spicy', label: 'A little heat' },
];

function PizzaCard({ pizza, config }) {
  const [size, setSize] = useState('medium');
  const { addPreset } = useCart();
  const { toast } = useToast();
  const sizes = config?.sizes || [];
  const selected = sizes.find((entry) => entry.id === size) || { id: 'medium', multiplier: 1, label: 'Medium 11"' };
  const price = Math.round((pizza.basePrice * selected.multiplier + Number.EPSILON) * 100) / 100;

  const add = () => {
    if (!pizza.canOrder) return;
    addPreset(pizza, size);
    toast(`${pizza.name} (${selected.label}) is in your cart.`, { tone: 'success' });
  };

  return (
    <article className="menu-card">
      <TiltCard className="menu-card__tilt" max={6}>
        <div className="menu-card__media">
        <span className={`diet-tag ${pizza.isVegetarian ? 'diet-tag--veg' : 'diet-tag--nonveg'}`}>
          <span className="diet-tag__mark" aria-hidden="true" />
          {pizza.isVegetarian ? 'Veg' : 'Non-veg'}
        </span>
        {pizza.badges?.[0] ? <span className="menu-card__badge">{pizza.badges[0]}</span> : null}
        <img src={pizza.image} alt={pizza.name} loading="lazy" />
        <span className="menu-card__rating"><Star size={11} fill="currentColor" /> {pizza.rating.toFixed(1)}</span>
      </div>
      <div className="menu-card__body">
        <div>
          <h3>{pizza.name}</h3>
          <p className="menu-card__tagline">{pizza.tagline}</p>
        </div>
        <p className="menu-card__desc">{pizza.description}</p>
        <div className="menu-card__meta">
          <span>{pizza.calories} kcal</span>
          <span>·</span>
          <span>{pizza.prepMinutes} min bake</span>
          {pizza.spiceLevel > 0 ? (
            <>
              <span>·</span>
              <span className="menu-card__spice"><Flame size={12} /> {pizza.spiceLevel === 1 ? 'Mild' : pizza.spiceLevel === 2 ? 'Medium' : 'Hot'}</span>
            </>
          ) : null}
        </div>
        <div className="menu-card__sizes" role="group" aria-label={`Choose a size for ${pizza.name}`}>
          {sizes.map((entry) => (
            <button
              key={entry.id}
              className={entry.id === size ? 'is-active' : ''}
              onClick={() => setSize(entry.id)}
            >
              {entry.label.split(' ')[0]}
              <small>{formatINR(pizza.basePrice * entry.multiplier)}</small>
            </button>
          ))}
        </div>
        <div className="menu-card__foot">
          <div className="price">
            <strong>{formatINR(price)}</strong>
            <small>{selected.label}</small>
          </div>
          <button className="btn btn--sm" onClick={add} disabled={!pizza.canOrder}>
            {pizza.canOrder ? <><Plus size={15} /> Add</> : 'Sold out'}
          </button>
        </div>
      </div>
      </TiltCard>
    </article>
  );
}

export default function MenuPage() {
  usePageTitle('The menu');
  const { pizzas, loading, error, reload } = usePizzas();
  const { config } = useConfig();
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('recommended');
  const [search, setSearch] = useState('');

  const visible = useMemo(() => {
    let list = pizzas.filter((pizza) => {
      if (filter === 'veg' && !pizza.isVegetarian) return false;
      if (filter === 'nonveg' && pizza.isVegetarian) return false;
      if (filter === 'spicy' && pizza.spiceLevel < 2) return false;
      if (search.trim()) {
        const haystack = `${pizza.name} ${pizza.description} ${pizza.tagline}`.toLowerCase();
        if (!haystack.includes(search.trim().toLowerCase())) return false;
      }
      return true;
    });
    if (sort === 'price-low') list = [...list].sort((a, b) => a.basePrice - b.basePrice);
    if (sort === 'price-high') list = [...list].sort((a, b) => b.basePrice - a.basePrice);
    if (sort === 'rating') list = [...list].sort((a, b) => b.rating - a.rating);
    return list;
  }, [pizzas, filter, sort, search]);

  return (
    <>
      <section className="page-hero menu-hero">
        <div className="container menu-hero__inner">
          <div className="menu-hero__copy">
            <p className="eyebrow">Fresh from the lab</p>
            <h1>
              The full<br />
              <em>theory.</em>
            </h1>
            <p>Five signature experiments, hand-stretched daily. Pick a favourite or start from scratch in the builder. The oven has opinions.</p>
          </div>
          <div className="menu-hero__aside">
            <div className="menu-hero__stamp">
              <Sparkles size={17} />
              <span>Baked to order</span>
              <strong>Every single time.</strong>
            </div>
            <Link to="/build" className="btn btn--ghost">
              <WandSparkles size={17} /> Build your own
            </Link>
          </div>
        </div>
      </section>

      <section className="section section--menu">
        <div className="container">
          <div className="menu-toolbar">
            <div className="menu-filters">
              {filters.map((entry) => (
                <button
                  key={entry.id}
                  className={filter === entry.id ? 'is-active' : ''}
                  onClick={() => setFilter(entry.id)}
                >
                  {entry.label}
                </button>
              ))}
            </div>
            <div className="menu-toolbar__right">
              <label className="menu-search">
                <Search size={16} />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search the menu"
                  aria-label="Search the menu"
                />
              </label>
              <label className="menu-sort">
                <SlidersHorizontal size={15} />
                <select value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Sort pizzas">
                  <option value="recommended">Recommended</option>
                  <option value="rating">Top rated</option>
                  <option value="price-low">Price: low to high</option>
                  <option value="price-high">Price: high to low</option>
                </select>
              </label>
            </div>
          </div>

          {error ? (
            <div className="empty-state">
              <h3>The oven is being shy.</h3>
              <p>{error}</p>
              <button className="btn" onClick={reload}>Try again</button>
            </div>
          ) : loading ? (
            <div className="menu-grid">
              {[0, 1, 2, 3, 4, 5].map((key) => <div className="menu-card menu-card--skeleton" key={key} />)}
            </div>
          ) : visible.length === 0 ? (
            <div className="empty-state">
              <h3>No theories match that search.</h3>
              <p>Try a different word, or clear the filters and let the menu surprise you.</p>
              <button className="btn" onClick={() => { setSearch(''); setFilter('all'); }}>Clear filters</button>
            </div>
          ) : (
            <div className="menu-grid">
              {visible.map((pizza) => <PizzaCard pizza={pizza} config={config} key={pizza.id} />)}
            </div>
          )}

          <div className="menu-builder-cta">
            <div>
              <p className="eyebrow eyebrow--yellow">The variable is you</p>
              <h2>No theory fits? <em>Write your own.</em></h2>
              <p>Pick a base, sauce, cheese and up to eight toppings. Watch it come together in 3D, then let the oven settle the argument.</p>
            </div>
            <Link to="/build" className="btn btn--cream btn--lg">
              Start building <ArrowRight size={17} />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
