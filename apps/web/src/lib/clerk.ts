// We need a simple stub to ensure TypeScript is happy with standard imported window.Clerk
// This should match how Astro/Clerk is set up in this project.
// You might already have a different way of getting the token in React, but we'll use window.Clerk directly

declare global {
  interface Window {
    Clerk: any;
  }
}

// Just an empty export to keep it a module if needed, 
// though the api.ts uses window.Clerk directly now.
export const clerk = {};
