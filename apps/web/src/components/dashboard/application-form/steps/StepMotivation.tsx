import type { StepProps } from '../types';
import { StepErrors } from '../fields';

export default function StepMotivation({ form, updateField, errors }: StepProps) {
  return (
    <fieldset>
      <p className="mb-8 font-mono text-base text-text-muted">
        One question. Take your time.
      </p>
      <div>
        <label className="mb-2 block font-mono text-sm tracking-wider text-text-secondary">
          Why do you want to attend? <span className="text-suit-red">*</span>
        </label>
        <textarea
          value={form.why_attend}
          onChange={(e) => updateField('why_attend', e.target.value)}
          rows={8}
          required
          minLength={50}
          maxLength={1000}
          autoFocus
          className="w-full border border-base-border bg-base-dark px-5 py-4 font-mono text-base leading-relaxed text-text-primary outline-none transition-colors placeholder:text-text-muted focus:border-neon-green"
          placeholder="What are you hoping to build, learn, or break? No wrong answers."
        />
        <p className="mt-2 font-mono text-sm text-text-muted">
          {form.why_attend.length}/1000 characters
          {form.why_attend.length > 0 && form.why_attend.length < 50 && (
            <span className="text-gold"> (minimum 50)</span>
          )}
          {form.why_attend.length >= 50 && (
            <span className="text-neon-green"> &#10003;</span>
          )}
        </p>
      </div>
      {errors.length > 0 && <StepErrors errors={errors} />}
    </fieldset>
  );
}
