import type { StepProps } from '../types';
import { InputField, StepErrors } from '../fields';

export default function StepContact({ form, updateField, errors }: StepProps) {
  return (
    <fieldset>
  
      <div className="grid gap-6 md:grid-cols-2">
        <InputField
          label="Phone Number"
          value={form.phone_number}
          onChange={(v) => updateField('phone_number', v)}
          required
          placeholder="+1 (555) 123-4567"
          type="tel"
          autoFocus
        />
        <InputField
          label="Email Address"
          value={form.email}
          onChange={(v) => updateField('email', v)}
          required
          placeholder="you@example.com"
          type="email"
        />
      </div>
      {errors.length > 0 && <StepErrors errors={errors} />}
    </fieldset>
  );
}
