import { useAuth } from '@clerk/astro/react';
import { useState } from 'react';
import { apiFetch } from '../../lib/api';

import { STEPS, getInitialFormState } from './application-form/types';
import { useFormWizard, clearDraft } from './application-form/useFormWizard';
import ProgressBar from './application-form/ProgressBar';
import StepWrapper from './application-form/StepWrapper';
import StepNavigation from './application-form/StepNavigation';

import StepBasics from './application-form/steps/StepBasics';
import StepContact from './application-form/steps/StepContact';
import StepProfile from './application-form/steps/StepProfile';
import StepMotivation from './application-form/steps/StepMotivation';
import StepLogistics from './application-form/steps/StepLogistics';
import StepReview from './application-form/steps/StepReview';

// Re-export for backward compatibility (ApplicationStatus.tsx, ApplicationPage.tsx)
export type { ApplicationData } from './application-form/types';
import type { ApplicationData } from './application-form/types';

const TURNSTILE_SITE_KEY = import.meta.env.PUBLIC_TURNSTILE_SITE_KEY ?? '';

interface Props {
  initialData?: ApplicationData;
  isEditing?: boolean;
  onSubmitted?: (application: ApplicationData) => void;
}

export default function ApplicationForm({ initialData, isEditing = false, onSubmitted }: Props) {
  const { getToken } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const handleResumeFile = (file: File | null) => {
    setResumeFile(file);
    wizard.clearErrors();
  };
  const [uploadingResume, setUploadingResume] = useState(false);

  const [form, setForm] = useState(() => getInitialFormState(initialData));

  const wizard = useFormWizard(form, resumeFile, isEditing, setForm);

  const updateField = (field: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    wizard.clearErrors();
  };

  const handleSubmit = async () => {
    const failingStep = wizard.validateAllSteps();
    if (failingStep !== null) return;

    setError(null);
    setSubmitting(true);

    try {
      const token = await getToken();

      let resumeKey: string | null = form.resume_url || null;
      if (resumeFile) {
        setUploadingResume(true);
        const { upload_url, key } = await apiFetch<{ upload_url: string; key: string }>(
          '/api/v1/applications/upload-url',
          { method: 'POST' },
          token,
        );
        await fetch(upload_url, {
          method: 'PUT',
          body: resumeFile,
          headers: { 'Content-Type': 'application/pdf' },
        });
        resumeKey = key;
        setUploadingResume(false);
      }

      const payload = {
        ...form,
        graduation_date: form.graduation_date || null,
        phone_number: form.phone_number || null,
        email: form.email || null,
        resume_url: resumeKey,
        github_url: form.github_url || null,
        linkedin_url: form.linkedin_url || null,
        why_attend: form.why_attend || null,
        experience_level: form.experience_level || null,
        dietary_restrictions: form.dietary_restrictions || null,
        tshirt_size: form.tshirt_size || null,
        how_did_you_hear: form.how_did_you_hear || null,
      };

      const endpoint = isEditing ? '/api/v1/applications/me' : '/api/v1/applications';
      const method = isEditing ? 'PATCH' : 'POST';

      const fetchHeaders: Record<string, string> = {};
      if (!isEditing && turnstileToken) {
        fetchHeaders['X-Turnstile-Token'] = turnstileToken;
      }

      const result = await apiFetch<ApplicationData>(
        endpoint,
        { method, headers: fetchHeaders, body: JSON.stringify(payload) },
        token,
      );

      clearDraft();
      onSubmitted?.(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStep = () => {
    const stepProps = { form, updateField, errors: wizard.stepErrors };

    switch (wizard.currentStep) {
      case 0:
        return <StepBasics {...stepProps} />;
      case 1:
        return <StepContact {...stepProps} />;
      case 2:
        return (
          <StepProfile
            {...stepProps}
            resumeFile={resumeFile}
            setResumeFile={handleResumeFile}
            isEditing={isEditing}
          />
        );
      case 3:
        return <StepMotivation {...stepProps} />;
      case 4:
        return <StepLogistics {...stepProps} />;
      case 5:
        return (
          <StepReview
            form={form}
            updateField={updateField}
            errors={wizard.stepErrors}
            goToStep={wizard.goToStep}
            isEditing={isEditing}
            setTurnstileToken={setTurnstileToken}
            turnstileSiteKey={TURNSTILE_SITE_KEY}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="mt-4 flex min-h-[calc(100vh-12rem)] flex-col">
      <div className="flex flex-1 flex-col border border-border bg-black">
        {/* Betting slip header */}
        <div className="border-b border-border bg-black px-4 py-3.5 sm:px-6 md:px-10">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] tracking-[0.3em] text-gray-500 uppercase">
              HACKLANTA — APPLICATION
            </span>
            <span className="font-mono text-xs text-gold/60">♠ ♦ ♣ ♥</span>
          </div>
        </div>

        <ProgressBar currentStep={wizard.currentStep} />

        {/* Step content — centered with readable max-width */}
        <div className="flex flex-1 flex-col justify-center px-4 py-10 sm:px-6 md:px-10 lg:px-16">
          <div className="mx-auto w-full max-w-2xl">
            <div className="mb-8">
              <h2 className="font-display text-3xl tracking-widest text-white md:text-4xl">
                {STEPS[wizard.currentStep].title}
              </h2>
              <div className="mt-1 h-px w-10 bg-red/50" />
            </div>

            <StepWrapper stepIndex={wizard.currentStep} direction={wizard.direction}>
              {renderStep()}
            </StepWrapper>
          </div>
        </div>

        {/* Error display */}
        {error && (
          <div className="mx-6 mb-4 border border-red/40 bg-red/10 px-5 py-4 font-mono text-sm text-red-bright md:mx-10">
            {error}
          </div>
        )}

        {/* Navigation footer — pinned to bottom */}
        <div className="border-t border-border-light bg-black px-4 py-5 sm:px-6 md:px-10">
          <div className="mx-auto max-w-2xl">
            <StepNavigation
              isFirstStep={wizard.isFirstStep}
              isLastStep={wizard.isLastStep}
              onBack={wizard.goBack}
              onNext={wizard.goNext}
              onSubmit={handleSubmit}
              submitting={submitting}
              uploadingResume={uploadingResume}
              submitDisabled={
                submitting || (!isEditing && TURNSTILE_SITE_KEY !== '' && !turnstileToken)
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}
