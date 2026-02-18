import type { FormState } from '../types';
import { CheckboxField, StepErrors } from '../fields';
import ReviewSummary from '../ReviewSummary';
import Turnstile from '../../../ui/Turnstile';

interface Props {
  form: FormState;
  updateField: (field: string, value: string | boolean) => void;
  errors: string[];
  goToStep: (step: number) => void;
  isEditing: boolean;
  turnstileToken: string | null;
  setTurnstileToken: (token: string | null) => void;
  turnstileSiteKey: string;
}

export default function StepReview({
  form,
  updateField,
  errors,
  goToStep,
  isEditing,
  turnstileToken,
  setTurnstileToken,
  turnstileSiteKey,
}: Props) {
  return (
    <div className="space-y-6">
      <ReviewSummary form={form} goToStep={goToStep} />

      <div className="space-y-4 border-t border-base-border pt-6">
        <CheckboxField
          label="I confirm I am 18 years of age or older"
          checked={form.age_confirmed}
          onChange={(checked) => updateField('age_confirmed', checked)}
          required
        />
        <CheckboxField
          label="I accept the Code of Conduct"
          checked={form.code_of_conduct_accepted}
          onChange={(checked) => updateField('code_of_conduct_accepted', checked)}
          required
        />
        <CheckboxField
          label="I accept the Liability Waiver"
          checked={form.liability_waiver_accepted}
          onChange={(checked) => updateField('liability_waiver_accepted', checked)}
          required
        />
      </div>

      {!isEditing && turnstileSiteKey && (
        <Turnstile
          siteKey={turnstileSiteKey}
          onVerify={setTurnstileToken}
          onExpire={() => setTurnstileToken(null)}
        />
      )}

      <StepErrors errors={errors} />
    </div>
  );
}
