import type { FormState } from './types';

interface Props {
  form: FormState;
  goToStep: (step: number) => void;
}

function capitalize(s: string) {
  if (!s) return '—';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default function ReviewSummary({ form, goToStep }: Props) {
  return (
    <div>
     

      <Section title="ACADEMIC" onEdit={() => goToStep(0)}>
        <Row label="University" value={form.university} />
        <Row label="Major" value={form.major} />
        <Row label="Year" value={capitalize(form.year_of_study)} />
        {form.graduation_date && (
          <Row label="Graduation" value={form.graduation_date} />
        )}
      </Section>

      <Section title="CONTACT" onEdit={() => goToStep(1)}>
        <Row label="Email" value={form.email} />
        <Row label="Phone" value={form.phone_number} />
      </Section>

      <Section title="PROFILE" onEdit={() => goToStep(2)}>
        <Row label="Experience" value={capitalize(form.experience_level)} />
        <Row label="Resume" value={form.resume_url ? 'Uploaded ✓' : '—'} accent={!!form.resume_url} />
        {form.github_url && <Row label="GitHub" value={form.github_url} link />}
        {form.linkedin_url && <Row label="LinkedIn" value={form.linkedin_url} link />}
      </Section>

      {form.why_attend && (
        <Section title="MOTIVATION" onEdit={() => goToStep(3)}>
          <p className="pt-1 font-body text-base leading-relaxed text-white/85">
            {form.why_attend}
          </p>
        </Section>
      )}

      <Section title="LOGISTICS" onEdit={() => goToStep(4)} last>
        <Row label="T-Shirt" value={form.tshirt_size || '—'} />
        <Row label="Dietary" value={form.dietary_restrictions || 'None'} />
        {form.how_did_you_hear && (
          <Row label="Heard via" value={form.how_did_you_hear} />
        )}
      </Section>
    </div>
  );
}

function Section({
  title,
  onEdit,
  children,
  last = false,
}: {
  title: string;
  onEdit: () => void;
  children: React.ReactNode;
  last?: boolean;
}) {
  return (
    <div className={`py-6 ${last ? '' : 'border-b border-border/50'}`}>
      <div className="mb-4 flex items-center justify-between">
        <span className="font-mono text-sm tracking-[0.2em] text-red">
          {title}
        </span>
        <button
          type="button"
          onClick={onEdit}
          className="font-mono text-sm tracking-[0.12em] text-white/60 transition-colors hover:text-red"
        >
          EDIT
        </button>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Row({
  label,
  value,
  accent = false,
  link = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
  link?: boolean;
}) {
  const valueClass = accent
    ? 'text-gold'
    : link
      ? 'text-white/60 truncate'
      : 'text-white';

  return (
    <div className="flex items-baseline gap-4">
      <span className="w-32 shrink-0 font-mono text-base uppercase text-white/70">
        {label}
      </span>
      <span className={`font-body text-lg leading-snug ${valueClass}`}>
        {value || '—'}
      </span>
    </div>
  );
}
