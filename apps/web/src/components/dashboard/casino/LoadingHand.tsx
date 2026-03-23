import CardSuitDivider from './CardSuitDivider';

interface LoadingHandProps {
  label?: string;
  compact?: boolean;
}

export default function LoadingHand({
  label = 'Loading...',
  compact = false,
}: LoadingHandProps) {
  const cardSize = compact ? 'h-14 w-10' : 'h-16 w-11';

  return (
    <div className={`text-center ${compact ? 'space-y-3' : 'space-y-4'}`}>
      <div className="relative mx-auto flex h-20 w-28 items-center justify-center">
        {[
          { suit: '♠', color: 'text-white/70', rotate: '-rotate-12', offset: '-translate-x-5' },
          { suit: '♦', color: 'text-red/80', rotate: 'rotate-0', offset: 'translate-x-0' },
          { suit: '♣', color: 'text-white/70', rotate: 'rotate-12', offset: 'translate-x-5' },
        ].map((card, index) => (
          <div
            key={`${card.suit}-${index}`}
            className={`absolute top-2 flex ${cardSize} ${card.offset} ${card.rotate} animate-card-shuffle items-center justify-center rounded-md border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] shadow-[0_8px_30px_rgba(0,0,0,0.28)]`}
            style={{ animationDelay: `${index * 0.15}s` }}
          >
            <span className={`font-display text-2xl italic ${card.color}`}>{card.suit}</span>
          </div>
        ))}
      </div>

      <CardSuitDivider size={compact ? 'sm' : 'md'} glow animate />
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/45">{label}</p>
    </div>
  );
}
