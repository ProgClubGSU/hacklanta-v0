import type { StepProps } from '../types';
import { StepErrors } from '../fields';

export default function StepMotivation({ form, updateField, errors }: StepProps) {
  return (
    <fieldset>
   
      <div>
        <label className="mb-2 block font-mono text-xs tracking-[0.18em] uppercase text-white/60">
          Why do you want to attend? <span className="text-red">*</span>
        </label>
        <textarea
          value={form.why_attend}
          onChange={(e) => updateField('why_attend', e.target.value)}
          rows={8}
          required
          minLength={50}
          maxLength={1000}
          autoFocus
          className="w-full border border-border bg-black px-5 py-4 font-body text-base leading-relaxed text-white outline-none transition-colors placeholder:text-gray-500 focus:border-red/70 focus:shadow-[0_0_0_1px_rgba(196,30,58,0.15)] resize-none"
          placeholder="What are you hoping to build, learn, or break? No wrong answers."
        />
        <div className="mt-2 flex items-center gap-2">
          <span className="font-mono text-xs text-gray-500">
            {form.why_attend.length}/1000
          </span>
          {form.why_attend.length > 0 && form.why_attend.length < 50 && (
            <span className="font-mono text-xs text-gold">— need {50 - form.why_attend.length} more</span>
          )}
          {form.why_attend.length >= 50 && (
            <span className="font-mono text-xs text-red/70">✓ good to go</span>
          )}
        </div>
      </div>
      {errors.length > 0 && <StepErrors errors={errors} />}
    </fieldset>
  );
}
