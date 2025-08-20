import React, { useEffect, useRef } from 'react';

type MotionProps = {
  initial?: { opacity?: number; y?: number };
  animate?: { opacity?: number; y?: number };
  transition?: { duration?: number; delay?: number };
} & React.HTMLAttributes<HTMLDivElement>;

function MotionDiv({ initial, animate, transition, ...rest }: MotionProps) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || !initial || !animate) return;
    el.style.opacity = String(initial.opacity ?? 1);
    el.style.transform = `translateY(${initial.y || 0}px)`;
    requestAnimationFrame(() => {
      const { duration = 0.3, delay = 0 } = transition || {};
      el.style.transition = `opacity ${duration}s ease ${delay}s, transform ${duration}s ease ${delay}s`;
      el.style.opacity = String(animate.opacity ?? 1);
      el.style.transform = `translateY(${animate.y || 0}px)`;
    });
  }, [initial, animate, transition]);
  return <div ref={ref} {...rest} />;
}

export const motion = { div: MotionDiv };
