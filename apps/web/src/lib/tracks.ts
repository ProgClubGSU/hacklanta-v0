export const TRACKS = [
  { id: 'cox', name: 'House Pick: Cox Track', color: '#C41E3A', bgClass: 'border-transparent bg-transparent text-white' },
  { id: 'nexlayer', name: 'All-In: Nexlayer Track', color: '#00ff88', bgClass: 'border-transparent bg-transparent text-white' },
  { id: 'finance', name: 'Jackpot: Finance Track', color: '#C9A84C', bgClass: 'border-transparent bg-transparent text-white' },
  { id: 'creative', name: 'Jack of All Trades: Most Creative', color: '#ffffff', bgClass: 'border-transparent bg-transparent text-white' },
] as const;

export type TrackId = typeof TRACKS[number]['id'];
