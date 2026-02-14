export const EVENT_TYPES = ['workshop', 'minigame', 'ceremony', 'meal', 'general'] as const;
export type EventType = (typeof EVENT_TYPES)[number];
