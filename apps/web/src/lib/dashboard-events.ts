export const PROFILE_CHANGED_EVENT = 'hacklanta:profile-changed';
export const TEAM_CHANGED_EVENT = 'hacklanta:team-changed';

function dispatchDashboardEvent(eventName: string) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(eventName));
}

export function notifyProfileChanged() {
  dispatchDashboardEvent(PROFILE_CHANGED_EVENT);
}

export function notifyTeamChanged() {
  dispatchDashboardEvent(TEAM_CHANGED_EVENT);
}
