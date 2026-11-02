import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

export default function ScrollProgress() {
  const ref = useRef(null);
  const location = useLocation();

  useEffect(() => {
    const element = ref.current;
    if (!element) return undefined;
    let frame = 0;
    const update = () => {
      frame = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const ratio = max > 0 ? Math.min(1, window.scrollY / max) : 0;
      element.style.transform = `scaleX(${ratio})`;
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [location.pathname]);

  return <div className="scroll-progress" ref={ref} aria-hidden="true" />;
}
