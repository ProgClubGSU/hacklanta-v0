import type { FormState } from './types';

interface Props {
  form: FormState;
  goToStep: (step: number) => void;
}

export default function ReviewSummary({ form, goToStep }: Props) {
  return (
    <div className="space-y-4">
      <p className="font-mono text-base text-text-muted">
        // confirm your details before submitting
      </p>

      <div className="grid grid-cols-2 gap-x-8 gap-y-3 border-b border-base-border pb-5">
        <Cell label="University" value={form.university} onEdit={() => goToStep(0)} />
        <Cell label="Major" value={form.major} />
        <Cell label="Year" value={form.year_of_study} />
        <Cell label="Experience" value={form.experience_level} />
        <Cell label="Email" value={form.email} onEdit={() => goToStep(1)} />
        <Cell label="T-Shirt" value={form.tshirt_size} />
      </div>

      {form.why_attend && (
        <div className="border-b border-base-border pb-5">
          <div className="flex items-start justify-between gap-6">
            <p className="line-clamp-2 font-mono text-sm leading-relaxed text-text-secondary">
              "{form.why_attend.length > 120 ? form.why_attend.slice(0, 120) + '...' : form.why_attend}"
            </p>
            <button
              type="button"
              onClick={() => goToStep(3)}
              className="shrink-0 font-mono text-sm text-text-muted transition-colors hover:text-neon-green"
            >
              edit
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Cell({
  label,
  value,
  onEdit,
}: {
  label: string;
  value: string;
  onEdit?: () => void;
}) {
  return (
    <div className="flex items-baseline gap-3 font-mono text-sm">
      <span className="text-text-muted">{label}</span>
      <span className="flex-1 truncate text-right text-text-primary">{value || '\u2014'}</span>
      {onEdit && (
        <button
          type="button"
          onClick={onEdit}
          className="text-text-muted transition-colors hover:text-neon-green"
        >
          edit
        </button>
      )}
    </div>
  );
}
