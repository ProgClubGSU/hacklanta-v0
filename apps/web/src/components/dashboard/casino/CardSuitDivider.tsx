interface CardSuitDividerProps {
  size?: 'sm' | 'md' | 'lg';
  glow?: boolean;
  animate?: boolean;
  className?: string;
}

export default function CardSuitDivider({
  size = 'md',
  glow = false,
  animate = false,
  className = '',
}: CardSuitDividerProps) {
  const sizeClasses = {
    sm: 'text-base gap-2',
    md: 'text-xl gap-3',
    lg: 'text-2xl gap-4',
  };

  const glowClass = glow
    ? 'drop-shadow-[0_0_8px_currentColor]'
    : '';

  const animateClass = animate ? 'animate-glow-pulse' : '';

  return (
    <div className={`flex items-center justify-center ${sizeClasses[size]} ${className}`}>
      <span className={`text-white/20 ${glowClass} ${animateClass}`}>♠</span>
      <span className={`text-[#C41E3A]/40 ${glowClass} ${animateClass}`}>♦</span>
      <span className={`text-white/20 ${glowClass} ${animateClass}`}>♣</span>
      <span className={`text-[#C41E3A]/40 ${glowClass} ${animateClass}`}>♥</span>
    </div>
  );
}
