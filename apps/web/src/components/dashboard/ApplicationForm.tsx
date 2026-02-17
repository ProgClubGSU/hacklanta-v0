import { useAuth } from '@clerk/astro/react';
import { useState } from 'react';
import { apiFetch } from '../../lib/api';
import Turnstile from '../ui/Turnstile';

const TURNSTILE_SITE_KEY = import.meta.env.PUBLIC_TURNSTILE_SITE_KEY ?? '';

export interface ApplicationData {
  id: string;
  status: string;

  // Academic Info
  university: string;
  major: string;
  year_of_study: string;
  graduation_date: string | null;

  // Contact Info
  phone_number: string | null;
  email: string | null;

  // Links
  resume_url: string | null;
  github_url: string | null;
  linkedin_url: string | null;

  // About
  why_attend: string | null;
  experience_level: string | null;

  // Logistics
  dietary_restrictions: string | null;
  tshirt_size: string | null;

  // Legal & Agreements
  age_confirmed: boolean;
  code_of_conduct_accepted: boolean;
  liability_waiver_accepted: boolean;

  // Marketing
  how_did_you_hear: string | null;
  resume_sharing_opt_in: boolean;
  email_opt_in: boolean;
  sms_opt_in: boolean;

  created_at: string;
}

interface Props {
  initialData?: ApplicationData;
  isEditing?: boolean;
  onSubmitted?: (application: ApplicationData) => void;
}

const YEAR_OPTIONS = ['freshman', 'sophomore', 'junior', 'senior', 'grad'];
const EXPERIENCE_OPTIONS = ['beginner', 'intermediate', 'advanced'];
const TSHIRT_OPTIONS = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

export default function ApplicationForm({ initialData, isEditing = false, onSubmitted }: Props) {
  const { getToken } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [uploadingResume, setUploadingResume] = useState(false);

  const [form, setForm] = useState({
    // Academic Info
    university: initialData?.university ?? '',
    major: initialData?.major ?? '',
    year_of_study: initialData?.year_of_study ?? '',
    graduation_date: initialData?.graduation_date ?? '',

    // Contact Info
    phone_number: initialData?.phone_number ?? '',
    email: initialData?.email ?? '',

    // Links
    resume_url: initialData?.resume_url ?? '',
    github_url: initialData?.github_url ?? '',
    linkedin_url: initialData?.linkedin_url ?? '',

    // About
    why_attend: initialData?.why_attend ?? '',
    experience_level: initialData?.experience_level ?? '',

    // Logistics
    dietary_restrictions: initialData?.dietary_restrictions ?? '',
    tshirt_size: initialData?.tshirt_size ?? '',

    // Legal & Agreements
    age_confirmed: initialData?.age_confirmed ?? false,
    code_of_conduct_accepted: initialData?.code_of_conduct_accepted ?? false,
    liability_waiver_accepted: initialData?.liability_waiver_accepted ?? false,

    // Marketing
    how_did_you_hear: initialData?.how_did_you_hear ?? '',
    resume_sharing_opt_in: initialData?.resume_sharing_opt_in ?? false,
    email_opt_in: initialData?.email_opt_in ?? false,
    sms_opt_in: initialData?.sms_opt_in ?? false,
  });

  const updateField = (field: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const token = await getToken();

      // Upload resume to S3 if a file was selected
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

      const result = await apiFetch<ApplicationData>(endpoint, {
        method,
        headers: fetchHeaders,
        body: JSON.stringify(payload),
      }, token);

      onSubmitted?.(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mx-auto mt-8 max-w-2xl">
      {/* Betting slip header */}
      <div className="border border-base-border bg-base-card">
        <div className="border-b border-base-border bg-base-dark px-6 py-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs tracking-widest text-text-muted">
              HACKLANTA // APPLICATION SLIP
            </span>
            <span className="font-mono text-xs text-gold">&#9824; &#9830; &#9827; &#9829;</span>
          </div>
        </div>

        <div className="space-y-6 p-6">
          {/* Section: Academic Info */}
          <fieldset>
            <legend className="mb-4 font-mono text-sm tracking-wider text-neon-green">
              {'>'} ACADEMIC_INFO
            </legend>
            <div className="grid gap-4 md:grid-cols-2">
              <InputField
                label="University"
                value={form.university}
                onChange={(v) => updateField('university', v)}
                required
                placeholder="Georgia State University"
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
          </fieldset>

          {/* Section: Contact Info */}
          <fieldset>
            <legend className="mb-4 font-mono text-sm tracking-wider text-neon-green">
              {'>'} CONTACT_INFO
            </legend>
            <div className="grid gap-4 md:grid-cols-2">
              <InputField
                label="Phone Number"
                value={form.phone_number}
                onChange={(v) => updateField('phone_number', v)}
                required
                placeholder="+1 (555) 123-4567"
                type="tel"
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
          </fieldset>

          {/* Section: Links */}
          <fieldset>
            <legend className="mb-4 font-mono text-sm tracking-wider text-neon-green">
              {'>'} LINKS
            </legend>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block font-mono text-xs tracking-wider text-text-secondary">
                  Resume (PDF) <span className="text-suit-red">*</span>
                </label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setResumeFile(e.target.files?.[0] ?? null)}
                  required={!form.resume_url}
                  className="w-full border border-base-border bg-base-dark px-3 py-2 font-mono text-sm text-text-primary outline-none file:mr-3 file:border-0 file:bg-neon-green/10 file:px-3 file:py-1 file:font-mono file:text-xs file:text-neon-green"
                />
                {resumeFile && (
                  <p className="mt-1 font-mono text-xs text-neon-green">
                    {resumeFile.name}
                  </p>
                )}
              </div>
              <InputField
                label="GitHub URL"
                value={form.github_url}
                onChange={(v) => updateField('github_url', v)}
                placeholder="https://github.com/username"
                type="url"
              />
              <InputField
                label="LinkedIn URL"
                value={form.linkedin_url}
                onChange={(v) => updateField('linkedin_url', v)}
                placeholder="https://linkedin.com/in/username"
                type="url"
              />
            </div>
          </fieldset>

          {/* Section: About You */}
          <fieldset>
            <legend className="mb-4 font-mono text-sm tracking-wider text-neon-green">
              {'>'} ABOUT_YOU
            </legend>
            <div className="space-y-4">
              <SelectField
                label="Experience Level"
                value={form.experience_level}
                onChange={(v) => updateField('experience_level', v)}
                options={EXPERIENCE_OPTIONS.map((val) => ({
                  value: val,
                  label: val.charAt(0).toUpperCase() + val.slice(1),
                }))}
                required
              />
              <div>
                <label className="mb-1 block font-mono text-xs tracking-wider text-text-secondary">
                  Why do you want to attend? <span className="text-suit-red">*</span>
                </label>
                <textarea
                  value={form.why_attend}
                  onChange={(e) => updateField('why_attend', e.target.value)}
                  rows={4}
                  required
                  minLength={50}
                  maxLength={1000}
                  className="w-full border border-base-border bg-base-dark px-3 py-2 font-mono text-sm text-text-primary outline-none transition-colors placeholder:text-text-muted focus:border-neon-green"
                  placeholder="Tell us what you're hoping to build, learn, or break... (50-1000 characters)"
                />
                <p className="mt-1 font-mono text-xs text-text-muted">
                  {form.why_attend.length}/1000 characters {form.why_attend.length < 50 && `(minimum 50)`}
                </p>
              </div>
            </div>
          </fieldset>

          {/* Section: Logistics */}
          <fieldset>
            <legend className="mb-4 font-mono text-sm tracking-wider text-neon-green">
              {'>'} LOGISTICS
            </legend>
            <div className="grid gap-4 md:grid-cols-2">
              <InputField
                label="Dietary Restrictions"
                value={form.dietary_restrictions}
                onChange={(v) => updateField('dietary_restrictions', v)}
                placeholder="Vegetarian, vegan, halal..."
              />
              <SelectField
                label="T-Shirt Size"
                value={form.tshirt_size}
                onChange={(v) => updateField('tshirt_size', v)}
                options={TSHIRT_OPTIONS.map((val) => ({ value: val, label: val }))}
                required
              />
            </div>
          </fieldset>

          {/* Section: Legal & Agreements */}
          <fieldset>
            <legend className="mb-4 font-mono text-sm tracking-wider text-neon-green">
              {'>'} LEGAL_&_AGREEMENTS
            </legend>
            <div className="space-y-3">
              <CheckboxField
                label="I confirm that I am 18 years of age or older"
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
          </fieldset>

          {/* Section: Marketing */}
          <fieldset>
            <legend className="mb-4 font-mono text-sm tracking-wider text-neon-green">
              {'>'} MARKETING_&_COMMUNICATIONS
            </legend>
            <div className="space-y-4">
              <InputField
                label="How did you hear about Hacklanta?"
                value={form.how_did_you_hear}
                onChange={(v) => updateField('how_did_you_hear', v)}
                placeholder="Instagram, friend, flyer, etc."
              />
              <div className="space-y-3">
                <CheckboxField
                  label="I consent to share my resume with event sponsors"
                  checked={form.resume_sharing_opt_in}
                  onChange={(checked) => updateField('resume_sharing_opt_in', checked)}
                />
                <CheckboxField
                  label="I would like to receive emails about future events"
                  checked={form.email_opt_in}
                  onChange={(checked) => updateField('email_opt_in', checked)}
                />
                <CheckboxField
                  label="I would like to receive SMS messages about future events. Message and data rates may apply. You can opt out at any time by replying STOP."
                  checked={form.sms_opt_in}
                  onChange={(checked) => updateField('sms_opt_in', checked)}
                />
              </div>
            </div>
          </fieldset>
        </div>

        {/* Error display */}
        {error && (
          <div className="mx-6 mb-4 border border-suit-red/30 bg-suit-red/10 px-4 py-3 font-mono text-sm text-suit-red">
            {error}
          </div>
        )}

        {/* Turnstile + Submit */}
        <div className="border-t border-base-border bg-base-dark px-6 py-4">
          {!isEditing && TURNSTILE_SITE_KEY && (
            <div className="mb-4">
              <Turnstile
                siteKey={TURNSTILE_SITE_KEY}
                onVerify={setTurnstileToken}
                onExpire={() => setTurnstileToken(null)}
              />
            </div>
          )}
          <button
            type="submit"
            disabled={submitting || (!isEditing && TURNSTILE_SITE_KEY !== '' && !turnstileToken)}
            className="w-full border-2 border-neon-green bg-neon-green/10 px-6 py-3 font-mono text-sm font-bold tracking-wider text-neon-green transition-all hover:bg-neon-green/20 hover:shadow-[0_0_20px_rgba(0,255,136,0.2)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {uploadingResume ? '// UPLOADING RESUME...' : submitting ? '// SUBMITTING...' : '$ DEAL_ME_IN'}
          </button>
        </div>
      </div>
    </form>
  );
}

function InputField({
  label,
  value,
  onChange,
  required = false,
  placeholder = '',
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-1 block font-mono text-xs tracking-wider text-text-secondary">
        {label}
        {required && <span className="text-suit-red"> *</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        className="w-full border border-base-border bg-base-dark px-3 py-2 font-mono text-sm text-text-primary outline-none transition-colors placeholder:text-text-muted focus:border-neon-green"
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[] | { value: string; label: string }[];
  required?: boolean;
}) {
  const normalizedOptions = options.map((opt) =>
    typeof opt === 'string' ? { value: opt, label: opt } : opt
  );

  return (
    <div>
      <label className="mb-1 block font-mono text-xs tracking-wider text-text-secondary">
        {label}
        {required && <span className="text-suit-red"> *</span>}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="w-full border border-base-border bg-base-dark px-3 py-2 font-mono text-sm text-text-primary outline-none transition-colors focus:border-neon-green"
      >
        <option value="">Select...</option>
        {normalizedOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function CheckboxField({
  label,
  checked,
  onChange,
  required = false,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  required?: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        required={required}
        className="mt-1 h-4 w-4 cursor-pointer border border-base-border bg-base-dark accent-neon-green outline-none transition-colors focus:ring-2 focus:ring-neon-green focus:ring-offset-2 focus:ring-offset-base-card"
      />
      <label className="flex-1 cursor-pointer font-mono text-xs leading-relaxed text-text-secondary">
        {label}
        {required && <span className="text-suit-red"> *</span>}
      </label>
    </div>
  );
}
