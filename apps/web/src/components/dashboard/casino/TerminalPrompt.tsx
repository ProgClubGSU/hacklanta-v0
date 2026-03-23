interface TerminalPromptProps {
  prefix?: '$' | '//';
  text: string;
  blinking?: boolean;
  color?: 'red' | 'gold' | 'white';
  className?: string;
}

export default function TerminalPrompt({
  prefix = '$',
  text,
  blinking = false,
  color = 'white',
  className = '',
}: TerminalPromptProps) {
  const colorClasses = {
    red: 'text-[#C41E3A]/60',
    gold: 'text-[#C9A84C]/60',
    white: 'text-white/40',
  };

  return (
    <div
      className={`font-mono text-xs tracking-wide ${colorClasses[color]} ${className}`}
    >
      <span className="opacity-70">{prefix}</span>{' '}
      <span>{text}</span>
      {blinking && (
        <span className="ml-1 inline-block h-3 w-1.5 animate-blink bg-current align-middle" />
      )}
    </div>
  );
}
