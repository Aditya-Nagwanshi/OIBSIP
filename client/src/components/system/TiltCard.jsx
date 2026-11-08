import { useRef } from 'react';
import { motion, useMotionTemplate, useMotionValue, useSpring, useTransform } from 'framer-motion';

export default function TiltCard({
  children,
  className = '',
  max = 7,
  roll = 0,
  lift = 1.015,
  glare = true,
  as = 'div',
  ...rest
}) {
  const ref = useRef(null);
  const MotionTag = motion[as] || motion.div;
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
  const rotateZ = useSpring(useTransform(pointerX, [-0.5, 0.5], [-roll, roll]), {
    stiffness: 210,
    damping: 20,
    mass: 0.35,
  });
  const glareX = useTransform(pointerX, [-0.5, 0.5], [0, 100]);
  const glareY = useTransform(pointerY, [-0.5, 0.5], [0, 100]);
  const glareBackground = useMotionTemplate`radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255, 255, 255, 0.45), transparent 60%)`;

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
    <MotionTag
      ref={ref}
      className={`tilt-card ${className}`.trim()}
      style={{ rotateX, rotateY, rotateZ, transformPerspective: 1050 }}
      whileHover={{ scale: lift }}
      transition={{ scale: { type: 'spring', stiffness: 260, damping: 22 } }}
      onPointerMove={handleMove}
      onPointerLeave={reset}
      onPointerCancel={reset}
      {...rest}
    >
      {children}
      {glare ? <motion.span className="tilt-card__glare" style={{ background: glareBackground }} aria-hidden="true" /> : null}
    </MotionTag>
  );
}
