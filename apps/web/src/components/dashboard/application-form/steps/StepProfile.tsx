import { EXPERIENCE_OPTIONS, type StepProps } from '../types';
import { InputField, SelectField, StepErrors } from '../fields';

interface Props extends StepProps {
  resumeFile: File | null;
  setResumeFile: (file: File | null) => void;
  isEditing: boolean;
}

export default function StepProfile({
  form,
  updateField,
  errors,
  resumeFile,
  setResumeFile,
  isEditing,
}: Props) {
  return (
    <fieldset>
      <p className="mb-8 font-mono text-base text-text-muted">
        Show us what you're working with.
      </p>
      <div className="space-y-6">
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
          <label className="mb-2 block font-mono text-sm tracking-wider text-text-secondary">
            Resume (PDF) {!isEditing && <span className="text-suit-red">*</span>}
          </label>
          <input
            type="file"
            accept=".pdf"
            onChange={(e) => setResumeFile(e.target.files?.[0] ?? null)}
            required={!isEditing && !form.resume_url}
            className="w-full border border-base-border bg-base-dark px-4 py-3 font-mono text-base text-text-primary outline-none file:mr-4 file:border-0 file:bg-neon-green/10 file:px-4 file:py-1.5 file:font-mono file:text-sm file:text-neon-green"
          />
          {resumeFile && (
            <p className="mt-2 font-mono text-sm text-neon-green">{resumeFile.name}</p>
          )}
          {!resumeFile && form.resume_url && (
            <p className="mt-2 font-mono text-sm text-text-muted">// resume already uploaded</p>
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
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
      </div>
      {errors.length > 0 && <StepErrors errors={errors} />}
    </fieldset>
  );
}
