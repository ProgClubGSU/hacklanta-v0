export const TRACKS = [
  { id: 'cox', name: 'House Pick: Cox Track', color: '#C41E3A', bgClass: 'bg-red/15 text-red border-red/20' },
  { id: 'nexlayer', name: 'All-In: Nexlayer Track', color: '#00ff88', bgClass: 'bg-[#00ff88]/10 text-[#00ff88] border-[#00ff88]/20' },
  { id: 'finance', name: 'Jackpot: Finance Track', color: '#C9A84C', bgClass: 'bg-gold/15 text-gold border-gold/20' },
  { id: 'creative', name: 'Jack of All Trades: Most Creative', color: '#ffffff', bgClass: 'bg-white/8 text-white/60 border-white/15' },
] as const;

export type TrackId = typeof TRACKS[number]['id'];
