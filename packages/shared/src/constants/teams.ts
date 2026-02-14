export const TEAM_ROLES = ['leader', 'member'] as const;
export type TeamRole = (typeof TEAM_ROLES)[number];
