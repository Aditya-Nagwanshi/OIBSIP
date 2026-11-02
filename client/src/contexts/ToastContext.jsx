import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

const icons = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
    const timer = timers.current.get(id);
    if (timer) clearTimeout(timer);
    timers.current.delete(id);
  }, []);

  const toast = useCallback(
    (input, options = {}) => {
      let title = '';
      let message = '';
      let type = 'success';
      let duration = 4200;

      if (typeof input === 'string') {
        if (options.title) {
          title = options.title;
          message = input;
        } else {
          title = input;
          message = options.message || '';
        }
        type = options.tone || options.type || 'success';
        duration = options.duration || duration;
      } else if (input && typeof input === 'object') {
        title = input.title || '';
        message = input.message || '';
        type = input.type || input.tone || 'success';
        duration = input.duration || duration;
      }

      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      setToasts((current) => [...current.slice(-3), { id, title, message, type }]);
      const timer = setTimeout(() => dismiss(id), duration);
      timers.current.set(id, timer);
      return id;
    },
    [dismiss]
  );

  const value = useMemo(() => ({ toast, dismiss }), [toast, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-stack" role="status" aria-live="polite">
        <AnimatePresence initial={false}>
          {toasts.map((item) => {
            const Icon = icons[item.type] || Info;
            return (
              <motion.div
                key={item.id}
                className={`toast toast--${item.type}`}
                initial={{ opacity: 0, y: 18, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: 30, scale: 0.96 }}
                transition={{ duration: 0.25 }}
              >
                <Icon className="toast__icon" size={18} />
                <div className="toast__copy">
                  <strong>{item.title}</strong>
                  {item.message ? <p>{item.message}</p> : null}
                </div>
                <button className="toast__close" onClick={() => dismiss(item.id)} aria-label="Dismiss notification">
                  <X size={15} />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used inside ToastProvider');
  return context;
}
