interface Props {
  href?: string;
  label?: string;
}

export default function BackButton({ href = '/admin', label = 'Back to Dashboard' }: Props) {
  return (
    <a
      href={href}
      className="inline-flex items-center gap-2 font-mono text-sm text-text-muted transition-colors hover:text-neon-green group mb-6"
    >
      <span className="transition-transform group-hover:-translate-x-1">←</span>
      <span>{label}</span>
    </a>
  );
}
