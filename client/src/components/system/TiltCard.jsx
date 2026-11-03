import { useRef } from 'react';
import { motion, useMotionTemplate, useMotionValue, useSpring, useTransform } from 'framer-motion';

export default function TiltCard({ children, className = '', max = 7, glare = true, ...rest }) {
  const ref = useRef(null);
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const rotateX = useSpring(useTransform(pointerY, [-0.5, 0.5], [max, -max]), {
    stiffness: 190,
    damping: 22,
    mass: 0.4,
  });
  const rotateY = useSpring(useTransform(pointerX, [-0.5, 0.5], [-max, max]), {
    stiffness: 190,
    damping: 22,
    mass: 0.4,
  });
  const glareX = useTransform(pointerX, [-0.5, 0.5], [0, 100]);
  const glareY = useTransform(pointerY, [-0.5, 0.5], [0, 100]);
  const glareBackground = useMotionTemplate`radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255, 255, 255, 0.34), transparent 58%)`;

  const handleMove = (event) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    pointerX.set((event.clientX - rect.left) / rect.width - 0.5);
    pointerY.set((event.clientY - rect.top) / rect.height - 0.5);
  };

  const reset = () => {
    pointerX.set(0);
    pointerY.set(0);
  };

  return (
    <motion.div
      ref={ref}
      className={`tilt-card ${className}`.trim()}
      style={{ rotateX, rotateY, transformPerspective: 950 }}
      onPointerMove={handleMove}
      onPointerLeave={reset}
      onPointerCancel={reset}
      {...rest}
    >
      {children}
      {glare ? <motion.span className="tilt-card__glare" style={{ background: glareBackground }} aria-hidden="true" /> : null}
    </motion.div>
  );
}
