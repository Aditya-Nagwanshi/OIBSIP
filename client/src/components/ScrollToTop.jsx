import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    const lenis = window.__sliceLenis;

    if (hash) {
      const timer = setTimeout(() => {
        const target = document.getElementById(hash.slice(1));
        if (target) {
          if (lenis) lenis.scrollTo(target, { offset: -90 });
          else target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else if (lenis) {
          lenis.scrollTo(0, { immediate: true });
        } else {
          window.scrollTo({ top: 0 });
        }
      }, 80);
      return () => clearTimeout(timer);
    }

    if (lenis) lenis.scrollTo(0, { immediate: true });
    else window.scrollTo({ top: 0, left: 0 });

    return undefined;
  }, [pathname, hash]);

  return null;
}
