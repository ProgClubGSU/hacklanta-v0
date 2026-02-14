export default function Badge({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full border border-base-border px-2 py-0.5 font-mono text-xs">{children}</span>;
}
