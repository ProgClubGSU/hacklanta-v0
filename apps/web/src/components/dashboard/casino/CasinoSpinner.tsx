interface CasinoSpinnerProps {
  variant?: 'chip-flip' | 'card-shuffle';
  size?: number;
  color?: 'red' | 'gold' | 'green';
  className?: string;
}

export default function CasinoSpinner({
  variant = 'chip-flip',
  size = 32,
  color = 'red',
  className = '',
}: CasinoSpinnerProps) {
  const colors = {
    red: '#C41E3A',
    gold: '#C9A84C',
    green: '#00ff88',
  };

  const themeColor = colors[color];

  if (variant === 'chip-flip') {
    return (
      <div
        className={`relative flex items-center justify-center ${className}`}
        style={{ width: `${size}px`, height: `${size}px` }}
      >
        <div
          className="h-full w-full animate-chip-flip rounded-full border-4"
          style={{
            borderColor: themeColor,
            boxShadow: `0 0 15px ${themeColor}40`,
          }}
        >
          <div
            className="h-full w-full rounded-full"
            style={{
              background: `radial-gradient(circle at 30% 30%, ${themeColor}33, ${themeColor}11)`,
            }}
          />
        </div>
      </div>
    );
  }

  // card-shuffle variant
  return (
    <div
      className={`relative ${className}`}
      style={{ width: `${size}px`, height: `${size * 1.4}px` }}
    >
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="absolute left-1/2 top-1/2 h-full w-2/3 -translate-x-1/2 -translate-y-1/2 animate-card-shuffle rounded"
          style={{
            backgroundColor: themeColor,
            opacity: 0.3 + i * 0.2,
            animationDelay: `${i * 0.15}s`,
            boxShadow: `0 0 10px ${themeColor}40`,
          }}
        />
      ))}
    </div>
  );
}
