// Stub module for Clerk window global — api.ts uses window.Clerk directly

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Clerk: any;
  }
}

export const clerk = {};
