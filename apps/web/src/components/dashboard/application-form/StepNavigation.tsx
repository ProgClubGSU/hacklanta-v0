interface Props {
  isFirstStep: boolean;
  isLastStep: boolean;
  onBack: () => void;
  onNext: () => void;
  onSubmit: () => void;
  submitting: boolean;
  uploadingResume: boolean;
  submitDisabled: boolean;
}

export default function StepNavigation({
  isFirstStep,
  isLastStep,
  onBack,
  onNext,
  onSubmit,
  submitting,
  uploadingResume,
  submitDisabled,
}: Props) {
  return (
    <div className="flex items-center justify-between">
      {isFirstStep ? (
        <a
          href="/"
          className="border border-border bg-black px-8 py-3.5 font-display text-base tracking-widest text-gray transition-all hover:border-border-light hover:text-white"
        >
          BACK TO HOME
        </a>
      ) : (
        <button
          type="button"
          onClick={onBack}
          aria-label="Go to previous step"
          className="border border-border bg-black px-8 py-3.5 font-display text-base tracking-widest text-gray transition-all hover:border-border-light hover:text-white"
        >
          BACK
        </button>
      )}

      {isLastStep ? (
        <button
          type="button"
          onClick={onSubmit}
          disabled={submitDisabled}
          className="border-2 border-gold bg-gold/10 px-8 py-3.5 font-display text-base tracking-widest text-gold transition-all hover:bg-gold/20 hover:shadow-[0_0_20px_rgba(201,168,76,0.22)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {uploadingResume
            ? 'UPLOADING...'
            : submitting
              ? 'SUBMITTING...'
              : 'DEAL ME IN'}
        </button>
      ) : (
        <button
          type="button"
          onClick={onNext}
          aria-label="Go to next step"
          className="border-2 border-red bg-red/10 px-8 py-3.5 font-display text-base tracking-widest text-red transition-all hover:bg-red/20 hover:shadow-[0_0_20px_rgba(196,30,58,0.22)]"
        >
          NEXT HAND
        </button>
      )}
    </div>
  );
}
