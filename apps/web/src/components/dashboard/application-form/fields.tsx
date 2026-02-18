import { useState } from 'react';

// ── Shared form field components for the wizard steps ──

export function InputField({
  label,
  value,
  onChange,
  required = false,
  placeholder = '',
  type = 'text',
  autoFocus = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  placeholder?: string;
  type?: string;
  autoFocus?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block font-mono text-sm tracking-wider text-text-secondary">
        {label}
        {required && <span className="text-suit-red"> *</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="w-full border border-base-border bg-base-dark px-4 py-3 font-mono text-base text-text-primary outline-none transition-colors placeholder:text-text-muted focus:border-neon-green"
      />
    </div>
  );
}

export function SelectField({
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
    typeof opt === 'string' ? { value: opt, label: opt } : opt,
  );

  return (
    <div>
      <label className="mb-2 block font-mono text-sm tracking-wider text-text-secondary">
        {label}
        {required && <span className="text-suit-red"> *</span>}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="w-full border border-base-border bg-base-dark px-4 py-3 font-mono text-base text-text-primary outline-none transition-colors focus:border-neon-green"
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

let checkboxCounter = 0;

export function CheckboxField({
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
  const [id] = useState(() => `cb-${++checkboxCounter}`);

  return (
    <div
      className="flex cursor-pointer items-start gap-4"
      onClick={() => onChange(!checked)}
      onKeyDown={(e) => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          onChange(!checked);
        }
      }}
    >
      <div
        className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center border transition-all ${
          checked
            ? 'border-neon-green bg-neon-green/20 shadow-[0_0_8px_rgba(0,255,136,0.3)]'
            : 'border-base-border bg-base-dark hover:border-text-muted'
        }`}
        role="checkbox"
        aria-checked={checked}
        aria-labelledby={id}
        tabIndex={0}
      >
        {checked && (
          <svg
            viewBox="0 0 12 12"
            fill="none"
            className="h-3.5 w-3.5 text-neon-green"
            aria-hidden="true"
          >
            <path
              d="M2 6l3 3 5-6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>
      <label
        id={id}
        className={`flex-1 cursor-pointer font-mono text-sm leading-relaxed transition-colors ${
          checked ? 'text-text-primary' : 'text-text-secondary'
        }`}
      >
        {label}
        {required && <span className="text-suit-red"> *</span>}
      </label>
    </div>
  );
}

export function StepErrors({ errors }: { errors: string[] }) {
  if (errors.length === 0) return null;
  return (
    <div
      role="alert"
      aria-live="polite"
      className="mt-6 border border-suit-red/30 bg-suit-red/10 px-5 py-4 font-mono text-sm text-suit-red"
    >
      {errors.map((err) => (
        <p key={err}>{err}</p>
      ))}
    </div>
  );
}
