export const PROFILE_CHANGED_EVENT = 'hacklanta:profile-changed';
export const TEAM_CHANGED_EVENT = 'hacklanta:team-changed';
export const OPEN_EDITOR_FOR_CONFIRM_EVENT = 'hacklanta:open-editor-for-confirm';
export const PROFILE_SAVED_FOR_CONFIRM_EVENT = 'hacklanta:profile-saved-for-confirm';

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
