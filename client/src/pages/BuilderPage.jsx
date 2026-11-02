import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, Minus, Plus, RotateCcw, ShoppingBag, Sparkles, WandSparkles } from 'lucide-react';
import Pizza3D from '../components/three/Pizza3D';
import PageLoader from '../components/ui/PageLoader';
import api from '../lib/api';
import { formatINR } from '../lib/format';
import { useCart } from '../contexts/CartContext';
import { useConfig } from '../contexts/ConfigContext';
import { useToast } from '../contexts/ToastContext';
import usePageTitle from '../hooks/usePageTitle';

const steps = [
  { id: 'base', label: 'Base', number: '01', copy: 'The foundation of every good theory.' },
  { id: 'sauce', label: 'Sauce', number: '02', copy: 'The personality underneath it all.' },
  { id: 'cheese', label: 'Cheese', number: '03', copy: 'Choose your molten situation.' },
  { id: 'vegetable', label: 'Toppings', number: '04', copy: 'Up to eight. Choose wisely, or wildly.' },
];

const MEAT = new Set(['smoked-pepperoni', 'herb-chicken']);
const MAX_TOPPINGS = 8;

export default function BuilderPage() {
  usePageTitle('Build your own');
  const { config } = useConfig();
  const { addCustom } = useCart();
  const { toast } = useToast();
  const [groups, setGroups] = useState(null);
  const [error, setError] = useState('');
  const [step, setStep] = useState(0);
  const [base, setBase] = useState(null);
  const [sauce, setSauce] = useState(null);
  const [cheese, setCheese] = useState(null);
  const [vegetables, setVegetables] = useState([]);
  const [size, setSize] = useState('medium');
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    let cancelled = false;
    api('/catalog/builder-options')
      .then((data) => {
        if (cancelled) return;
        setGroups(data.groups);
        const pick = (group, slug) => data.groups[group]?.find((item) => item.slug === slug && item.isAvailable)
          || data.groups[group]?.find((item) => item.isAvailable)
          || null;
        setBase(pick('base', 'classic-hand-tossed'));
        setSauce(pick('sauce', 'classic-tomato'));
        setCheese(pick('cheese', 'mozzarella'));
      })
      .catch((caught) => {
        if (!cancelled) setError(caught.message || 'Could not load the builder.');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedSize = (config?.sizes || []).find((entry) => entry.id === size) || { multiplier: 1, label: 'Medium 11"' };
  const chosen = [base, sauce, cheese, ...vegetables].filter(Boolean);
  const rawTotal = chosen.reduce((sum, item) => sum + item.price, 0);
  const unitPrice = Math.round(rawTotal * selectedSize.multiplier * 100) / 100;
  const total = Math.round(unitPrice * quantity * 100) / 100;

  const current = steps[step];
  const currentItems = groups?.[current.id] || [];
  const selectionFor = (id) => (id === 'vegetable' ? null : { base, sauce, cheese }[id]);

  const toggleVegetable = (item) => {
    if (vegetables.some((entry) => entry.id === item.id)) {
      setVegetables((list) => list.filter((entry) => entry.id !== item.id));
      return;
    }
    if (vegetables.length >= MAX_TOPPINGS) {
      toast('Eight toppings is already a lot of theory. Remove one first.', { tone: 'error' });
      return;
    }
    setVegetables((list) => [...list, item]);
  };

  const canContinue = step === 0 ? Boolean(base) : step === 1 ? Boolean(sauce) : step === 2 ? Boolean(cheese) : true;
  const complete = base && sauce && cheese;

  const addToCart = () => {
    if (!complete) {
      toast('Pick a base, sauce and cheese first.', { tone: 'error' });
      return;
    }
    addCustom({ base, sauce, cheese, vegetables, size, quantity });
    toast('Your custom theory is in the cart. The oven awaits.', { tone: 'success', title: 'Built from scratch.' });
  };

  const reset = () => {
    setBase(null);
    setSauce(null);
    setCheese(null);
    setVegetables([]);
    setSize('medium');
    setQuantity(1);
    setStep(0);
  };

  if (error) {
    return (
      <section className="section">
        <div className="container empty-state">
          <h2>The builder is taking a nap.</h2>
          <p>{error}</p>
          <button className="btn" onClick={() => window.location.reload()}>Reload the page</button>
        </div>
      </section>
    );
  }

  if (!groups) return <PageLoader label="Laying out the ingredients" />;

  return (
    <section className="builder">
      <div className="container builder__head">
        <div>
          <p className="eyebrow">The custom lab</p>
          <h1>Build your <em>own theory.</em></h1>
          <p>Four steps, one 3D preview and absolutely no wrong answers. Except pineapple. (We still allow it.)</p>
        </div>
        <button className="builder__reset" onClick={reset}>
          <RotateCcw size={15} /> Start over
        </button>
      </div>

      <div className="container builder__grid">
        <aside className="builder__preview">
          <div className="builder__canvas">
            <Pizza3D
              baseSlug={base?.slug || undefined}
              sauceSlug={sauce?.slug || undefined}
              cheeseSlug={cheese?.slug || undefined}
              toppers={vegetables.map((item) => item.slug)}
              autoRotate
              cameraPosition={[0, 4, 5.4]}
            />
            <span className="builder__preview-tag"><Sparkles size={13} /> Live 3D preview</span>
          </div>
          <div className="builder__summary">
            <h3>Your theory, so far</h3>
            <ul className="builder__layers">
              <li><span>Base</span><strong>{base?.name || '—'}</strong></li>
              <li><span>Sauce</span><strong>{sauce?.name || '—'}</strong></li>
              <li><span>Cheese</span><strong>{cheese?.name || '—'}</strong></li>
              <li>
                <span>Toppings</span>
                <strong>{vegetables.length ? vegetables.map((item) => item.name).join(', ') : 'Just the essentials'}</strong>
              </li>
            </ul>
            <div className="builder__sizes">
              {(config?.sizes || []).map((entry) => (
                <button key={entry.id} className={size === entry.id ? 'is-active' : ''} onClick={() => setSize(entry.id)}>
                  {entry.label.split(' ')[0]}
                  <small>{entry.label.split(' ').slice(1).join(' ')}</small>
                </button>
              ))}
            </div>
            <div className="builder__price-row">
              <div className="price">
                <small>{quantity} × {selectedSize.label}</small>
                <strong>{formatINR(total)}</strong>
              </div>
              <div className="qty-control">
                <button onClick={() => setQuantity((value) => Math.max(1, value - 1))} aria-label="Decrease quantity"><Minus size={14} /></button>
                <span>{quantity}</span>
                <button onClick={() => setQuantity((value) => Math.min(10, value + 1))} aria-label="Increase quantity"><Plus size={14} /></button>
              </div>
            </div>
            <button className="btn btn--block builder__add" onClick={addToCart} disabled={!complete}>
              <ShoppingBag size={17} /> Add to cart · {formatINR(total)}
            </button>
            <p className="builder__fine">Ingredients are reserved the moment you pay, so stocks always stay honest.</p>
          </div>
        </aside>

        <div className="builder__panel">
          <div className="builder__steps" role="tablist" aria-label="Pizza builder steps">
            {steps.map((entry, index) => (
              <button
                key={entry.id}
                role="tab"
                aria-selected={step === index}
                className={`${step === index ? 'is-active' : ''} ${index < step ? 'is-done' : ''}`}
                onClick={() => setStep(index)}
              >
                <span>{index < step ? <Check size={13} /> : entry.number}</span>
                {entry.label}
              </button>
            ))}
          </div>

          <motion.div
            key={current.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="builder__step-body"
          >
            <div className="builder__step-head">
              <div>
                <p className="eyebrow">Step {current.number}</p>
                <h2>{steps[step].label === 'Toppings' ? 'Pile on the toppings' : `Choose your ${current.label.toLowerCase()}`}</h2>
                <p>{current.copy}</p>
              </div>
              {current.id === 'vegetable' ? (
                <span className={`builder__counter ${vegetables.length >= MAX_TOPPINGS ? 'is-full' : ''}`}>
                  {vegetables.length} / {MAX_TOPPINGS}
                </span>
              ) : null}
            </div>

            <div className={`builder-options ${current.id === 'vegetable' ? 'builder-options--veg' : ''}`}>
              {currentItems.map((item) => {
                const selected = current.id === 'vegetable'
                  ? vegetables.some((entry) => entry.id === item.id)
                  : selectionFor(current.id)?.id === item.id;
                const disabled = !item.isAvailable || (current.id === 'vegetable' && !selected && vegetables.length >= MAX_TOPPINGS);
                const meat = MEAT.has(item.slug);
                return (
                  <button
                    key={item.id}
                    className={`builder-option ${selected ? 'is-selected' : ''}`}
                    onClick={() => {
                      if (disabled) return;
                      if (current.id === 'base') setBase(item);
                      if (current.id === 'sauce') setSauce(item);
                      if (current.id === 'cheese') setCheese(item);
                      if (current.id === 'vegetable') toggleVegetable(item);
                    }}
                    disabled={disabled}
                  >
                    <span className="builder-option__emoji" style={{ background: `${item.color}22` }}>{item.emoji}</span>
                    <span className="builder-option__copy">
                      <strong>{item.name}</strong>
                      <small>{item.description}</small>
                      <span className="builder-option__tags">
                        {current.id === 'vegetable' ? (
                          <em className={meat ? 'tag tag--nonveg' : 'tag tag--veg'}>{meat ? 'Non-veg' : 'Veg'}</em>
                        ) : null}
                        {item.isLowStock ? <em className="tag tag--low">Only {item.stock} left</em> : null}
                      </span>
                    </span>
                    <span className="builder-option__price">{formatINR(item.price)}</span>
                    <span className={`builder-option__check ${selected ? 'is-on' : ''}`}><Check size={13} /></span>
                  </button>
                );
              })}
            </div>
          </motion.div>

          <div className="builder__nav">
            <button className="btn btn--ghost" onClick={() => setStep((value) => Math.max(0, value - 1))} disabled={step === 0}>
              <ArrowLeft size={16} /> Back
            </button>
            {step < steps.length - 1 ? (
              <button className="btn" onClick={() => setStep((value) => Math.min(steps.length - 1, value + 1))} disabled={!canContinue}>
                Next: {steps[step + 1].label} <ArrowRight size={16} />
              </button>
            ) : (
              <button className="btn" onClick={addToCart} disabled={!complete}>
                <WandSparkles size={16} /> Add my theory
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
