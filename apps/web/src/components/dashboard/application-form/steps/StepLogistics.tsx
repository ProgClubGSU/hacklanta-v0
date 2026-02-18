import { TSHIRT_OPTIONS, type StepProps } from '../types';
import { CheckboxField, InputField, SelectField, StepErrors } from '../fields';

export default function StepLogistics({ form, updateField, errors }: StepProps) {
  return (
    <fieldset>
      <p className="mb-8 font-mono text-base text-text-muted">
        Almost there. Quick picks and preferences.
      </p>

      <div className="grid gap-6 md:grid-cols-2">
        <SelectField
          label="T-Shirt Size"
          value={form.tshirt_size}
          onChange={(v) => updateField('tshirt_size', v)}
          options={TSHIRT_OPTIONS.map((val) => ({ value: val, label: val }))}
          required
        />
        <InputField
          label="Dietary Restrictions"
          value={form.dietary_restrictions}
          onChange={(v) => updateField('dietary_restrictions', v)}
          placeholder="Vegetarian, vegan, halal..."
        />
      </div>

      <div className="mt-8 border-t border-base-border pt-8">
        <InputField
          label="How did you hear about Hacklanta?"
          value={form.how_did_you_hear}
          onChange={(v) => updateField('how_did_you_hear', v)}
          placeholder="Instagram, friend, flyer, etc."
        />
      </div>

      <div className="mt-8 space-y-5 border-t border-base-border pt-8">
        <p className="font-mono text-sm text-text-muted">
          // stay in the loop
        </p>

        <div>
          <CheckboxField
            label="Get on sponsors' radar — they're hiring"
            checked={form.resume_sharing_opt_in}
            onChange={(checked) => updateField('resume_sharing_opt_in', checked)}
          />
          <p className="ml-10 mt-1.5 font-mono text-xs text-text-muted">
            Top sponsors actively recruit from hackathon applicants
          </p>
        </div>

        <div>
          <CheckboxField
            label="First dibs on future hackathons & exclusive events"
            checked={form.email_opt_in}
            onChange={(checked) => updateField('email_opt_in', checked)}
          />
          <p className="ml-10 mt-1.5 font-mono text-xs text-text-muted">
            Low volume, high signal — we only email when it matters
          </p>
        </div>

        <div>
          <CheckboxField
            label="Day-of texts so you never miss a round"
            checked={form.sms_opt_in}
            onChange={(checked) => updateField('sms_opt_in', checked)}
          />
          <p className="ml-10 mt-1.5 font-mono text-xs text-text-muted">
            Schedule changes, food drops, surprise challenges. Msg & data rates may apply.
          </p>
        </div>
      </div>

      <StepErrors errors={errors} />
    </fieldset>
  );
}
