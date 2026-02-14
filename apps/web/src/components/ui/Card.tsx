import type { HTMLAttributes } from 'react';

export default function Card({ children, className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`rounded border border-base-border bg-base-card p-4 ${className}`} {...props}>
      {children}
    </div>
  );
}
