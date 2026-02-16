import { useAuth } from '@clerk/astro/react';
import { useState } from 'react';
import { apiFetch } from '../../lib/api';

export interface ApplicationData {
  id: string;
  status: string;
  university: string;
  major: string;
  year_of_study: string;
  graduation_date: string | null;
  resume_url: string | null;
  github_url: string | null;
  linkedin_url: string | null;
  why_attend: string | null;
  experience_level: string | null;
  dietary_restrictions: string | null;
  tshirt_size: string | null;
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

  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [uploadingResume, setUploadingResume] = useState(false);

  const [form, setForm] = useState({
    university: initialData?.university ?? '',
    major: initialData?.major ?? '',
    year_of_study: initialData?.year_of_study ?? '',
    graduation_date: initialData?.graduation_date ?? '',
    resume_url: initialData?.resume_url ?? '',
    github_url: initialData?.github_url ?? '',
    linkedin_url: initialData?.linkedin_url ?? '',
    why_attend: initialData?.why_attend ?? '',
    experience_level: initialData?.experience_level ?? '',
    dietary_restrictions: initialData?.dietary_restrictions ?? '',
    tshirt_size: initialData?.tshirt_size ?? '',
  });

  const updateField = (field: string, value: string) => {
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
        resume_url: resumeKey,
        github_url: form.github_url || null,
        linkedin_url: form.linkedin_url || null,
        why_attend: form.why_attend || null,
        experience_level: form.experience_level || null,
        dietary_restrictions: form.dietary_restrictions || null,
        tshirt_size: form.tshirt_size || null,
      };

      const endpoint = isEditing ? '/api/v1/applications/me' : '/api/v1/applications';
      const method = isEditing ? 'PATCH' : 'POST';

      const result = await apiFetch<ApplicationData>(endpoint, {
        method,
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
        </div>

        {/* Error display */}
        {error && (
          <div className="mx-6 mb-4 border border-suit-red/30 bg-suit-red/10 px-4 py-3 font-mono text-sm text-suit-red">
            {error}
          </div>
        )}

        {/* Submit */}
        <div className="border-t border-base-border bg-base-dark px-6 py-4">
          <button
            type="submit"
            disabled={submitting}
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
