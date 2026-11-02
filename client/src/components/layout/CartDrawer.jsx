import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { formatINR } from '../../lib/format';

export default function CartDrawer() {
  const { items, isOpen, closeCart, totals, count, updateQuantity, removeItem } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKey = (event) => {
      if (event.key === 'Escape') closeCart();
    };
    document.addEventListener('keydown', handleKey);
    document.body.classList.add('no-scroll');
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.classList.remove('no-scroll');
    };
  }, [isOpen, closeCart]);

  const goCheckout = () => {
    closeCart();
    if (!isAuthenticated) {
      navigate('/login?next=/checkout');
      return;
    }
    navigate('/checkout');
  };

  return (
    <AnimatePresence>
      {isOpen ? (
        <>
          <motion.div
            className="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
          />
          <motion.aside
            className="drawer"
            aria-label="Shopping cart"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 34 }}
          >
            <div className="drawer__head">
              <div>
                <h3>Your bag</h3>
                <p>{count === 0 ? 'Nothing inside yet' : `${count} item${count === 1 ? '' : 's'} ready for the oven`}</p>
              </div>
              <button className="icon-btn" onClick={closeCart} aria-label="Close cart">
                <X size={19} />
              </button>
            </div>
            <div className="drawer__body">
              {items.length === 0 ? (
                <div className="cart-empty">
                  <div className="cart-empty__emoji">🍕</div>
                  <h4>An empty pizza box</h4>
                  <p>That is a tragedy. Add a slice or build your own dream pie.</p>
                  <button
                    className="btn"
                    onClick={() => {
                      closeCart();
                      navigate('/menu');
                    }}
                  >
                    Browse the menu
                    <ArrowRight size={16} />
                  </button>
                </div>
              ) : (
                <div>
                  {items.map((item) => (
                    <div className="cart-item" key={item.id}>
                      <div className="cart-item__img">
                        <img src={item.image} alt={item.name} loading="lazy" />
                      </div>
                      <div className="cart-item__body">
                        <div className="cart-item__top">
                          <div>
                            <h4>{item.name}</h4>
                            <p className="cart-item__meta">
                              {item.sizeLabel} · {item.description}
                            </p>
                          </div>
                          <span className="cart-item__price">{formatINR(item.unitPrice * item.quantity)}</span>
                        </div>
                        <div className="cart-item__bottom">
                          <div className="qty-control">
                            <button onClick={() => updateQuantity(item.id, -1)} aria-label={`Reduce ${item.name} quantity`}>
                              <Minus size={13} />
                            </button>
                            <span>{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.id, 1)} aria-label={`Increase ${item.name} quantity`}>
                              <Plus size={13} />
                            </button>
                          </div>
                          <button className="cart-remove" onClick={() => removeItem(item.id)}>
                            <Trash2 size={12} />
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {items.length > 0 ? (
              <div className="drawer__foot">
                {totals.amountToFreeDelivery > 0 ? (
                  <p className="cart-free-note">
                    Add {formatINR(totals.amountToFreeDelivery)} more for free delivery.
                  </p>
                ) : (
                  <p className="cart-free-note">
                    Free delivery unlocked. Good theory.
                  </p>
                )}
                <div className="cart-summary">
                  <div className="cart-summary__row">
                    <span>Subtotal</span>
                    <span>{formatINR(totals.subtotal)}</span>
                  </div>
                  <div className="cart-summary__row">
                    <span>Taxes</span>
                    <span>{formatINR(totals.tax)}</span>
                  </div>
                  <div className="cart-summary__row">
                    <span>Delivery</span>
                    <span>{totals.delivery === 0 ? 'Free' : formatINR(totals.delivery)}</span>
                  </div>
                  <div className="cart-summary__row cart-summary__row--total">
                    <span>Total</span>
                    <span>{formatINR(totals.total)}</span>
                  </div>
                </div>
                <button className="btn btn--block btn--lg" onClick={goCheckout}>
                  <ShoppingBag size={18} />
                  Checkout · {formatINR(totals.total)}
                </button>
              </div>
            ) : null}
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
