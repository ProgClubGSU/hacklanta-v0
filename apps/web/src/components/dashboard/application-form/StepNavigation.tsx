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
    <div className="flex items-center gap-4">
      {!isFirstStep && (
        <button
          type="button"
          onClick={onBack}
          aria-label="Go to previous step"
          className="border border-base-border bg-base-dark px-6 py-3.5 font-mono text-base text-text-muted transition-all hover:border-text-muted hover:text-text-primary"
        >
          &lt;&lt; FOLD_BACK
        </button>
      )}

      <div className="flex-1" />

      {isLastStep ? (
        <button
          type="button"
          onClick={onSubmit}
          disabled={submitDisabled}
          className="border-2 border-neon-green bg-neon-green/10 px-8 py-3.5 font-mono text-base font-bold tracking-wider text-neon-green transition-all hover:bg-neon-green/20 hover:shadow-[0_0_20px_rgba(0,255,136,0.2)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {uploadingResume
            ? '// UPLOADING...'
            : submitting
              ? '// SUBMITTING...'
              : '$ DEAL_ME_IN'}
        </button>
      ) : (
        <button
          type="button"
          onClick={onNext}
          aria-label="Go to next step"
          className="border-2 border-neon-green bg-neon-green/10 px-8 py-3.5 font-mono text-base font-bold tracking-wider text-neon-green transition-all hover:bg-neon-green/20 hover:shadow-[0_0_20px_rgba(0,255,136,0.2)]"
        >
          $ NEXT_HAND &gt;&gt;
        </button>
      )}
    </div>
  );
}
