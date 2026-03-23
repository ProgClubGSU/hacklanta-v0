interface PokerChipGraphicProps {
  size?: number;
  color?: 'red' | 'gold' | 'green';
  stacked?: boolean;
  className?: string;
}

export default function PokerChipGraphic({
  size = 80,
  color = 'red',
  stacked = false,
  className = '',
}: PokerChipGraphicProps) {
  const colors = {
    red: {
      border: '#C41E3A',
      inner: '#7A1024',
      glow: 'rgba(196, 30, 58, 0.3)',
    },
    gold: {
      border: '#C9A84C',
      inner: '#8B7332',
      glow: 'rgba(201, 168, 76, 0.3)',
    },
    green: {
      border: '#00ff88',
      inner: '#00994d',
      glow: 'rgba(0, 255, 136, 0.3)',
    },
  };

  const theme = colors[color];

  return (
    <div className={`relative ${className}`}>
      {/* Main chip */}
      <div
        className="relative flex items-center justify-center rounded-full border-4"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          borderColor: theme.border,
          background: `radial-gradient(circle at 30% 30%, ${theme.inner}dd, ${theme.inner}44)`,
          boxShadow: `0 0 20px ${theme.glow}`,
        }}
      >
        {/* Center dot */}
        <div
          className="rounded-full"
          style={{
            width: `${size * 0.2}px`,
            height: `${size * 0.2}px`,
            backgroundColor: theme.border,
            boxShadow: `0 0 10px ${theme.glow}`,
          }}
        />
      </div>

      {/* Stacked chips behind */}
      {stacked && (
        <>
          <div
            className="absolute left-1 top-1 -z-10 rounded-full border-4 opacity-50"
            style={{
              width: `${size}px`,
              height: `${size}px`,
              borderColor: theme.border,
              background: `radial-gradient(circle at 30% 30%, ${theme.inner}dd, ${theme.inner}44)`,
            }}
          />
          <div
            className="absolute left-2 top-2 -z-20 rounded-full border-4 opacity-30"
            style={{
              width: `${size}px`,
              height: `${size}px`,
              borderColor: theme.border,
              background: `radial-gradient(circle at 30% 30%, ${theme.inner}dd, ${theme.inner}44)`,
            }}
          />
        </>
      )}
    </div>
  );
}
