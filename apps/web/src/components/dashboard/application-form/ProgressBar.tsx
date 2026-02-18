import { motion } from 'framer-motion';
import { STEPS } from './types';

interface Props {
  currentStep: number;
}

export default function ProgressBar({ currentStep }: Props) {
  const totalSteps = STEPS.length;
  const progress = ((currentStep + 1) / totalSteps) * 100;

  return (
    <div className="px-6 pt-4">
      <div className="mb-2 flex items-center justify-between font-mono text-xs text-text-muted">
        <span>
          {STEPS[currentStep].suitIcon} {STEPS[currentStep].title}
        </span>
        <span>
          {currentStep + 1}/{totalSteps}
        </span>
      </div>
      <div
        className="h-1 w-full overflow-hidden bg-base-border"
        role="progressbar"
        aria-valuenow={currentStep + 1}
        aria-valuemin={1}
        aria-valuemax={totalSteps}
        aria-label={`Application progress: step ${currentStep + 1} of ${totalSteps}`}
      >
        <motion.div
          className="h-full bg-neon-green"
          initial={false}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.35, ease: 'easeInOut' }}
          style={{ boxShadow: '0 0 8px rgba(0, 255, 136, 0.4)' }}
        />
      </div>
    </div>
  );
}
