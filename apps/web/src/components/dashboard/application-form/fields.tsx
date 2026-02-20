import { AnimatePresence, motion } from 'framer-motion';
import type { CSSProperties } from 'react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

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
      <label className="mb-2 block font-mono text-xs tracking-[0.15em] uppercase text-white/75">
        {label}
        {required && <span className="ml-1 text-red">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="w-full border border-border bg-black px-4 py-3.5 font-body text-base text-white outline-none transition-colors placeholder:text-gray-dark focus:border-red/70 focus:shadow-[0_0_0_1px_rgba(196,30,58,0.15)]"
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
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const normalizedOptions = options.map((opt) =>
    typeof opt === 'string' ? { value: opt, label: opt } : opt,
  );
  const selected = normalizedOptions.find((o) => o.value === value);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node) &&
        !(e.target as Element)?.closest('[data-select-portal="true"]')
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Close on scroll/resize
  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => {
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [open]);

  const handleOpen = () => {
    if (!open && buttonRef.current) {
      setRect(buttonRef.current.getBoundingClientRect());
    }
    setOpen((prev) => !prev);
  };

  // Compute portal position
  const menuHeight = Math.min(normalizedOptions.length * 44, 240) + 2;
  const openUpward = rect ? rect.bottom + menuHeight + 8 > window.innerHeight && rect.top > menuHeight : false;

  const portalStyle: CSSProperties = rect
    ? {
        position: 'fixed',
        left: rect.left,
        width: rect.width,
        zIndex: 9999,
        ...(openUpward
          ? { bottom: window.innerHeight - rect.top + 4 }
          : { top: rect.bottom + 4 }),
      }
    : {};

  const menu = open && rect
    ? createPortal(
        <AnimatePresence>
          <motion.div
            data-select-portal="true"
            key="dropdown"
            initial={{ opacity: 0, y: openUpward ? 6 : -6, scaleY: 0.96 }}
            animate={{ opacity: 1, y: 0, scaleY: 1 }}
            exit={{ opacity: 0, y: openUpward ? 4 : -4, scaleY: 0.97 }}
            transition={{ duration: 0.14, ease: [0.25, 0.1, 0.25, 1] }}
            style={{
              ...portalStyle,
              transformOrigin: openUpward ? 'bottom' : 'top',
            }}
            className="overflow-hidden border border-border-light bg-black-card shadow-[0_16px_48px_rgba(0,0,0,0.8),0_0_0_1px_rgba(255,255,255,0.03)]"
          >
            <div className="max-h-60 overflow-y-auto">
              {normalizedOptions.map((opt) => {
                const isSelected = value === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onChange(opt.value);
                      setOpen(false);
                    }}
                    className={`flex w-full items-center gap-3 px-4 py-3 text-left font-body text-base transition-colors duration-100 ${
                      isSelected
                        ? 'bg-red/10 text-white'
                        : 'text-white/70 hover:bg-white/[0.04] hover:text-white'
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 shrink-0 rounded-full transition-all ${
                        isSelected
                          ? 'bg-red shadow-[0_0_6px_rgba(196,30,58,0.7)]'
                          : 'bg-border'
                      }`}
                    />
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>,
        document.body,
      )
    : null;

  return (
    <div ref={wrapperRef} className="relative">
      <label className="mb-2 block font-mono text-xs tracking-[0.15em] uppercase text-white/75">
        {label}
        {required && <span className="ml-1 text-red">*</span>}
      </label>

      <button
        ref={buttonRef}
        type="button"
        onClick={handleOpen}
        className={`flex w-full items-center justify-between border px-4 py-3.5 text-left transition-all duration-150 bg-black ${
          open
            ? 'border-red/60 shadow-[0_0_0_1px_rgba(196,30,58,0.12)]'
            : 'border-border hover:border-border-light'
        }`}
      >
        <span className={`font-body text-base ${selected ? 'text-white' : 'text-gray-dark'}`}>
          {selected?.label ?? 'Select an option'}
        </span>
        <motion.svg
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
          viewBox="0 0 10 6"
          fill="none"
          className="ml-2 h-2.5 w-2.5 shrink-0 text-gray"
          aria-hidden="true"
        >
          <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </motion.svg>
      </button>

      {menu}
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
            ? 'border-gold bg-gold/20 shadow-[0_0_10px_rgba(201,168,76,0.3)]'
            : 'border-border bg-black hover:border-border-light'
        }`}
        role="checkbox"
        aria-checked={checked}
        aria-labelledby={id}
        tabIndex={0}
      >
        {checked && (
          <svg
            viewBox="0 0 10 10"
            fill="none"
            className="h-3 w-3 text-gold"
            aria-hidden="true"
          >
            <path
              d="M1.5 5l2.5 2.5 4.5-5"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>
      <label
        id={id}
        className={`flex-1 cursor-pointer font-body text-base leading-relaxed transition-colors ${
          checked ? 'text-white' : 'text-white/65'
        }`}
      >
        {label}
        {required && <span className="ml-1 text-red">*</span>}
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
      className="mt-6 border-l-2 border-red bg-red/5 px-5 py-4 font-body text-base text-red-bright"
    >
      {errors.map((err) => (
        <p key={err} className="flex items-center gap-2">
          <span className="shrink-0 text-red/60" aria-hidden>◆</span>
          {err}
        </p>
      ))}
    </div>
  );
}
