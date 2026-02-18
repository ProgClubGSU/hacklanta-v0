import { YEAR_OPTIONS, type StepProps } from '../types';
import { InputField, SelectField, StepErrors } from '../fields';

export default function StepBasics({ form, updateField, errors }: StepProps) {
  return (
    <fieldset>
      <p className="mb-8 font-mono text-base text-text-muted">
        Let's start with the essentials.
      </p>
      <div className="grid gap-6 md:grid-cols-2">
        <InputField
          label="University"
          value={form.university}
          onChange={(v) => updateField('university', v)}
          required
          placeholder="Georgia State University"
          autoFocus
        />
        <InputField
          label="Major"
          value={form.major}
          onChange={(v) => updateField('major', v)}
          required
          placeholder="Computer Science"
        />
        <SelectField
          label="Year of Study"
          value={form.year_of_study}
          onChange={(v) => updateField('year_of_study', v)}
          options={YEAR_OPTIONS.map((val) => ({
            value: val,
            label: val.charAt(0).toUpperCase() + val.slice(1),
          }))}
          required
        />
        <InputField
          label="Graduation Date"
          value={form.graduation_date}
          onChange={(v) => updateField('graduation_date', v)}
          type="date"
        />
      </div>
      <StepErrors errors={errors} />
    </fieldset>
  );
}
