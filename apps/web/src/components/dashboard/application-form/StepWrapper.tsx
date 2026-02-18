import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useCallback, useRef } from 'react';

interface Props {
  stepIndex: number;
  direction: 1 | -1;
  children: React.ReactNode;
}

export default function StepWrapper({ stepIndex, direction, children }: Props) {
  const prefersReducedMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);

  const handleAnimationComplete = useCallback(() => {
    // Focus the first focusable input in the new step
    const el = containerRef.current;
    if (!el) return;
    const focusable = el.querySelector<HTMLElement>(
      'input:not([type="hidden"]), select, textarea',
    );
    focusable?.focus();
  }, []);

  const variants = prefersReducedMotion
    ? {
        enter: { opacity: 0 },
        center: { opacity: 1 },
        exit: { opacity: 0 },
      }
    : {
        enter: (dir: number) => ({ x: dir > 0 ? 80 : -80, opacity: 0 }),
        center: { x: 0, opacity: 1 },
        exit: (dir: number) => ({ x: dir > 0 ? -80 : 80, opacity: 0 }),
      };

  const duration = prefersReducedMotion ? 0.1 : 0.25;

  return (
    <div ref={containerRef} className="overflow-hidden">
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={stepIndex}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration, ease: [0.25, 0.1, 0.25, 1] }}
          onAnimationComplete={handleAnimationComplete}
          role="region"
          aria-label={`Step ${stepIndex + 1}`}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
