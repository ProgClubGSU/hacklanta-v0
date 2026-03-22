const sizeClasses: Record<string, string> = {
  xs: 'text-[1.1rem] sm:text-[1.25rem]',
  sm: 'text-[1.25rem] sm:text-[1.5rem]',
  md: 'text-[1.5rem] sm:text-[1.75rem]',
  lg: 'text-[clamp(2.5rem,8vw,4.5rem)]',
};

export function TextLogo({ size = 'sm', className = '' }: { size?: 'xs' | 'sm' | 'md' | 'lg'; className?: string }) {
  return (
    <>
      <span
        className={`text-logo-react inline-block select-none font-serif italic leading-none tracking-tight text-white ${sizeClasses[size]} ${className}`}
        aria-label="Hacklanta"
      >
        Hacklanta
      </span>
      <style>{`
        .text-logo-react {
          -webkit-text-stroke: 1px transparent;
          transition: color 0.35s ease, -webkit-text-stroke-color 0.35s ease, filter 0.35s ease;
        }
        .text-logo-react:hover {
          color: transparent;
          -webkit-text-stroke-color: rgba(255, 255, 255, 0.8);
          filter: drop-shadow(0 0 12px rgba(230, 57, 70, 0.25));
        }
      `}</style>
    </>
  );
}
