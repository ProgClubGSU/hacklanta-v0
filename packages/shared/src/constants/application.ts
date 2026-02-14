export const APPLICATION_STATUSES = ['pending', 'accepted', 'rejected', 'waitlisted'] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];
