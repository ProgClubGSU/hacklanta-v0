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
          <label className="mb-2 block font-mono text-[11px] tracking-[0.18em] uppercase text-white/60">
            Resume (PDF) {!isEditing && <span className="text-red ml-1">*</span>}
          </label>
          <label className="flex w-full cursor-pointer items-center border border-border bg-black transition-colors hover:border-border-light">
            <span className="shrink-0 border-r border-border px-4 py-3.5 font-mono text-sm text-gold/80">
              CHOOSE FILE
            </span>
            <span className={`min-w-0 flex-1 truncate px-4 font-body text-base ${resumeFile ? 'text-white' : 'text-gray-500'}`}>
              {resumeFile ? resumeFile.name : (!resumeFile && form.resume_url ? 'Resume already uploaded ✓' : 'No file selected')}
            </span>
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => setResumeFile(e.target.files?.[0] ?? null)}
              className="sr-only"
            />
          </label>
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
