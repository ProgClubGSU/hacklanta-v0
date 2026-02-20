import { motion } from 'framer-motion';
import { STEPS } from './types';

interface Props {
  currentStep: number;
}

export default function ProgressBar({ currentStep }: Props) {
  const totalSteps = STEPS.length;
  const progress = ((currentStep + 1) / totalSteps) * 100;

  return (
    <div className="bg-black px-6 pt-4">
      <div
        className="h-1 w-full overflow-hidden bg-border"
        role="progressbar"
        aria-valuenow={currentStep + 1}
        aria-valuemin={1}
        aria-valuemax={totalSteps}
        aria-label={`Application progress: step ${currentStep + 1} of ${totalSteps}`}
      >
        <motion.div
          className="h-full bg-red"
          initial={false}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.35, ease: 'easeInOut' }}
          style={{ boxShadow: '0 0 10px rgba(196, 30, 58, 0.45)' }}
        />
      </div>
    </div>
  );
}
