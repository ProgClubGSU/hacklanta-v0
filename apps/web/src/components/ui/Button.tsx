import type { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
}

export default function Button({ variant: _variant = 'primary', children, className = '', ...props }: ButtonProps) {
  return (
    <button className={`font-mono ${className}`} {...props}>
      {children}
    </button>
  );
}
